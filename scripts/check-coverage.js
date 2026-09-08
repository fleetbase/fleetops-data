'use strict';

/**
 * Coverage gate for @fleetbase/fleetops-data.
 *
 * Verifies that an Istanbul `json-summary` report proves 100% coverage of every
 * eligible first-party source file under `addon/`. The gate deliberately derives
 * the eligible file list from disk rather than from the report, so a file that
 * never gets instrumented (because nothing imported it, or because its module
 * failed to load) is reported as a failure instead of silently vanishing from
 * the denominator. A file the report shows with no statements at all is only
 * accepted once its source has been parsed and confirmed to have none, so an
 * empty entry cannot stand in for a module that was never instrumented.
 *
 * Exit codes:
 *   0 - every eligible file is present and every metric is at the threshold
 *   1 - the report proves a coverage shortfall, or is missing/malformed
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const UNREACHABLE = require('./unreachable-code');

const METRICS = ['statements', 'branches', 'functions', 'lines'];

const DEFAULT_THRESHOLDS = {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
};

/** Directories under `addon/` whose executable JavaScript must be covered. */
const DEFAULT_SOURCE_ROOTS = ['addon'];

/**
 * Recursively collect every `.js` file below `dir`, returned as paths relative
 * to `projectRoot` with POSIX separators.
 *
 * @param {String} dir
 * @param {String} projectRoot
 * @return {String[]}
 */
function collectJsFiles(dir, projectRoot) {
    let entries;

    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }

    const files = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const absolute = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...collectJsFiles(absolute, projectRoot));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(toPosix(path.relative(projectRoot, absolute)));
        }
    }

    return files;
}

/**
 * @param {String} filePath
 * @return {String}
 */
function toPosix(filePath) {
    return filePath.split(path.sep).join('/');
}

/**
 * Parser options matching the addon's own Babel configuration, so the source
 * check below understands every construct the coverage instrumenter did.
 */
const PARSER_OPTIONS = {
    sourceType: 'module',
    plugins: [['decorators', { decoratorsBeforeExport: true }]],
};

/** AST properties that never hold child nodes. */
const NON_NODE_KEYS = new Set(['loc', 'start', 'end', 'range', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments']);

/**
 * Whether Istanbul would record a statement for this node.
 *
 * Mirrors istanbul-lib-instrument: every statement-typed node except blocks and
 * empties, a variable declarator with an initializer, a class field with a
 * value, and an arrow function whose body is an expression (which the
 * instrumenter rewrites into a return statement).
 *
 * @param {Object} node
 * @return {Boolean}
 */
function isCountedStatement(node) {
    const { type } = node;

    if (type.endsWith('Statement')) {
        return type !== 'BlockStatement' && type !== 'EmptyStatement';
    }

    if (type === 'VariableDeclarator') {
        return Boolean(node.init);
    }

    if (type === 'ClassProperty' || type === 'ClassPrivateProperty') {
        return Boolean(node.value);
    }

    if (type === 'ArrowFunctionExpression') {
        return node.body.type !== 'BlockStatement';
    }

    return false;
}

/**
 * Depth-first search for a node matching `predicate`.
 *
 * @param {Object} node
 * @param {Function} predicate
 * @return {Boolean}
 */
function containsNode(node, predicate) {
    if (predicate(node)) {
        return true;
    }

    for (const [key, value] of Object.entries(node)) {
        if (NON_NODE_KEYS.has(key)) {
            continue;
        }

        const children = Array.isArray(value) ? value : [value];

        for (const child of children) {
            if (child && typeof child === 'object' && typeof child.type === 'string' && containsNode(child, predicate)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Confirm that a source file the report shows with zero statements genuinely
 * has none to cover.
 *
 * Declaration-only modules — a bare subclass, a class holding nothing but
 * decorated fields, a re-export barrel — legitimately instrument to zero
 * statements. A file with executable code and zero statements was never
 * instrumented, and must not pass on the strength of an empty report.
 *
 * @param {String} filePath absolute path to the source file
 * @return {{ ok: Boolean, error?: String }}
 */
function confirmNoStatements(filePath) {
    let source;

    try {
        source = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return { ok: false, error: `could not be read to confirm it has no statements: ${error.message}` };
    }

    let ast;

    try {
        ast = babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: PARSER_OPTIONS });
    } catch (error) {
        return { ok: false, error: `could not be parsed to confirm it has no statements: ${error.message}` };
    }

    if (containsNode(ast.program, isCountedStatement)) {
        return { ok: false, error: 'has executable code but the coverage report records no statements for it — the file was never instrumented.' };
    }

    return { ok: true };
}

/**
 * Enumerate every eligible first-party source file.
 *
 * @param {Object} options
 * @param {String} options.projectRoot
 * @param {String[]} [options.sourceRoots]
 * @return {String[]}
 */
function findEligibleFiles({ projectRoot, sourceRoots = DEFAULT_SOURCE_ROOTS }) {
    const files = [];

    for (const sourceRoot of sourceRoots) {
        files.push(...collectJsFiles(path.join(projectRoot, sourceRoot), projectRoot));
    }

    return files.sort();
}

/**
 * Normalize an Istanbul summary key onto a project-relative `addon/...` path.
 *
 * Istanbul keys vary by build pipeline: absolute paths in classic builds, module
 * names such as `@fleetbase/fleetops-data/models/order.js` under Embroider, and
 * occasionally `./addon/...`. All of those must collapse onto the same identity
 * so the gate compares like with like.
 *
 * @param {String} key
 * @param {Object} options
 * @param {String} options.projectRoot
 * @param {String} [options.packageName]
 * @return {String}
 */
function normalizeCoverageKey(key, { projectRoot, packageName }) {
    let normalized = toPosix(String(key));

    const posixRoot = toPosix(projectRoot).replace(/\/$/, '');
    if (posixRoot && normalized.startsWith(`${posixRoot}/`)) {
        normalized = normalized.slice(posixRoot.length + 1);
    }

    normalized = normalized.replace(/^\.\//, '');

    // Embroider/classic addon module names resolve to the addon tree.
    if (packageName && normalized.startsWith(`${packageName}/`)) {
        normalized = `addon/${normalized.slice(packageName.length + 1)}`;
    }

    // `dummy/` is the test application namespace; addon modules re-exported
    // through the app tree land there and refer back to the addon source.
    normalized = normalized.replace(/^dummy\/(models|serializers|adapters|transforms|utils)\//, 'addon/$1/');

    if (!normalized.endsWith('.js')) {
        normalized = `${normalized}.js`;
    }

    return normalized;
}

/**
 * Read and parse a JSON file, returning a structured error rather than throwing
 * so the caller can report a missing versus malformed report distinctly.
 *
 * @param {String} filePath
 * @return {{ ok: Boolean, value?: Object, error?: String }}
 */
function readJson(filePath) {
    let raw;

    try {
        raw = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { ok: false, error: `Coverage report not found at ${filePath}. Run \`pnpm run coverage\` first.` };
        }
        return { ok: false, error: `Unable to read ${filePath}: ${error.message}` };
    }

    if (raw.trim() === '') {
        return { ok: false, error: `Coverage report at ${filePath} is empty.` };
    }

    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (error) {
        return { ok: false, error: `Coverage report at ${filePath} is not valid JSON: ${error.message}` };
    }
}

/**
 * Enumerate every uncovered location in an Istanbul file entry, in the identity
 * format `scripts/unreachable-code.js` uses.
 *
 * @param {Object} entry a `coverage-final.json` file entry
 * @return {{ statements: String[], branches: String[], functions: String[] }}
 */
function uncoveredLocations(entry) {
    const statementMap = entry.statementMap || {};
    const fnMap = entry.fnMap || {};
    const branchMap = entry.branchMap || {};

    const statements = [];
    for (const [id, hits] of Object.entries(entry.s || {})) {
        if (hits === 0 && statementMap[id]) {
            statements.push(statementMap[id].start.line);
        }
    }

    const functions = [];
    for (const [id, hits] of Object.entries(entry.f || {})) {
        if (hits === 0 && fnMap[id]) {
            functions.push(fnMap[id].name);
        }
    }

    const branches = [];
    for (const [id, hits] of Object.entries(entry.b || {})) {
        if (!Array.isArray(hits) || !branchMap[id]) {
            continue;
        }
        hits.forEach((count, position) => {
            if (count === 0) {
                branches.push(`${branchMap[id].type}@${branchMap[id].loc.start.line}#${position}`);
            }
        });
    }

    return { statements, branches, functions };
}

/**
 * Reconcile a file's uncovered locations against the documented unreachable
 * list.
 *
 * @param {String} file project-relative path
 * @param {Object} entry a `coverage-final.json` file entry
 * @return {{ allowed: Object, problems: String[] }} `allowed` counts per metric
 */
function reconcileUnreachable(file, entry, unreachable = UNREACHABLE) {
    const documented = unreachable[file];
    const problems = [];
    const allowed = { statements: 0, branches: 0, functions: 0, lines: 0 };

    if (!documented) {
        return { allowed, problems };
    }

    const actual = uncoveredLocations(entry);

    for (const metric of ['statements', 'branches', 'functions']) {
        const expected = documented[metric] || [];
        const seen = new Set(actual[metric].map(String));

        for (const location of expected) {
            if (!seen.has(String(location))) {
                problems.push(`${file} lists ${metric} \`${location}\` in scripts/unreachable-code.js, but it is now covered — remove the stale exemption.`);
            }
        }

        allowed[metric] = expected.filter((location) => seen.has(String(location))).length;
    }

    // Istanbul counts a line as uncovered when every statement on it is, so an
    // unreachable statement takes its line with it.
    allowed.lines = allowed.statements;

    return { allowed, problems };
}

/**
 * Build a `file -> [uncovered locations]` index from an Istanbul
 * `coverage-final.json`, used purely for diagnostics.
 *
 * @param {Object|null} finalReport
 * @param {Object} options
 * @return {Map<String, String[]>}
 */
function buildUncoveredIndex(finalReport, options) {
    const index = new Map();

    if (!finalReport || typeof finalReport !== 'object') {
        return index;
    }

    for (const [key, entry] of Object.entries(finalReport)) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }

        const details = [];
        const statementMap = entry.statementMap || {};
        const fnMap = entry.fnMap || {};
        const branchMap = entry.branchMap || {};

        for (const [id, hits] of Object.entries(entry.s || {})) {
            if (hits === 0 && statementMap[id]) {
                details.push(`statement at line ${statementMap[id].start.line}`);
            }
        }

        for (const [id, hits] of Object.entries(entry.f || {})) {
            if (hits === 0 && fnMap[id]) {
                details.push(`function \`${fnMap[id].name}\` at line ${fnMap[id].decl.start.line}`);
            }
        }

        for (const [id, hits] of Object.entries(entry.b || {})) {
            if (!Array.isArray(hits) || !branchMap[id]) {
                continue;
            }
            hits.forEach((count, position) => {
                if (count === 0) {
                    details.push(`branch #${position} of ${branchMap[id].type} at line ${branchMap[id].loc.start.line}`);
                }
            });
        }

        if (details.length > 0) {
            index.set(normalizeCoverageKey(key, options), details);
        }
    }

    return index;
}

/**
 * Evaluate a coverage summary against the eligible file list and thresholds.
 *
 * @param {Object} options
 * @param {Object} options.summary parsed `coverage-summary.json`
 * @param {String[]} options.eligibleFiles project-relative source paths
 * @param {Object} [options.thresholds]
 * @param {String} options.projectRoot
 * @param {String} [options.packageName]
 * @param {Map<String, String[]>} [options.uncovered]
 * @return {{ ok: Boolean, failures: String[], totals: Object, checkedFiles: String[], declarationOnly: String[] }}
 */
function evaluateCoverage({ summary, eligibleFiles, thresholds = DEFAULT_THRESHOLDS, projectRoot, packageName, uncovered = new Map(), allowances = new Map() }) {
    const failures = [];

    /**
     * @param {String} metric
     * @return {Number} documented-unreachable items across every eligible file
     */
    const globalAllowance = (metric) => eligibleFiles.reduce((total, file) => total + ((allowances.get(file) || {})[metric] || 0), 0);

    if (!summary || typeof summary !== 'object') {
        return { ok: false, failures: ['Coverage summary is not an object.'], totals: null, checkedFiles: [], declarationOnly: [] };
    }

    if (!summary.total || typeof summary.total !== 'object') {
        return { ok: false, failures: ['Coverage summary has no `total` section; the report is incomplete.'], totals: null, checkedFiles: [], declarationOnly: [] };
    }

    const normalizeOptions = { projectRoot, packageName };
    const byFile = new Map();
    const reportKeys = new Map();

    for (const [key, entry] of Object.entries(summary)) {
        if (key === 'total') {
            continue;
        }

        const file = normalizeCoverageKey(key, normalizeOptions);

        // Two report entries collapsing onto one file means a dummy-app fixture
        // is shadowing an addon module. Keep the first and fail loudly rather
        // than let either one silently stand in for the other.
        if (byFile.has(file)) {
            failures.push(
                `${file} appears twice in the coverage report, as \`${reportKeys.get(file)}\` and \`${key}\` — a dummy-app fixture is shadowing an addon module; rename one of them.`
            );
            continue;
        }

        byFile.set(file, entry);
        reportKeys.set(file, key);
    }

    // 1. Every eligible file must appear in the report.
    const missing = eligibleFiles.filter((file) => !byFile.has(file));
    for (const file of missing) {
        failures.push(`${file} is missing from the coverage report (never instrumented — is the module imported by the force-load helper?)`);
    }

    // 2. Global thresholds.
    for (const metric of METRICS) {
        const totals = summary.total[metric];

        if (!totals || typeof totals.total !== 'number' || typeof totals.covered !== 'number') {
            failures.push(`Coverage summary is missing global \`${metric}\` totals.`);
            continue;
        }

        if (totals.total === 0) {
            failures.push(`Global ${metric} total is 0 — the report covers nothing and cannot prove coverage.`);
            continue;
        }

        const allowed = globalAllowance(metric);
        const pct = ((totals.covered + allowed) / totals.total) * 100;

        if (pct + Number.EPSILON < thresholds[metric]) {
            const shortfall = totals.total - totals.covered - allowed;
            failures.push(
                `Global ${metric} coverage ${formatPct(pct)}% (${totals.covered + allowed}/${totals.total}) is below the required ${thresholds[metric]}% — ${shortfall} reachable item(s) uncovered.`
            );
        }
    }

    // 3. Per-file thresholds.
    const declarationOnly = [];

    for (const file of eligibleFiles) {
        const entry = byFile.get(file);

        if (!entry) {
            continue; // already reported as missing
        }

        // A file the report shows with no statements at all is only acceptable
        // when its source genuinely has none; otherwise it was never
        // instrumented and an empty entry is standing in for real code.
        if (entry.statements && entry.statements.total === 0) {
            const confirmation = confirmNoStatements(path.join(projectRoot, file));

            if (confirmation.ok) {
                declarationOnly.push(file);
            } else {
                failures.push(`${file} ${confirmation.error}`);
            }
        }

        for (const metric of METRICS) {
            const totals = entry[metric];

            if (!totals || typeof totals.total !== 'number' || typeof totals.covered !== 'number') {
                failures.push(`${file} is missing \`${metric}\` totals in the coverage report.`);
                continue;
            }

            if (totals.total === 0) {
                // Nothing to cover: a file can legitimately declare no branches or
                // functions, and a zero-statement file was checked against its
                // source above.
                continue;
            }

            const allowed = (allowances.get(file) || {})[metric] || 0;
            const pct = ((totals.covered + allowed) / totals.total) * 100;

            if (pct + Number.EPSILON < thresholds[metric]) {
                const detail = (uncovered.get(file) || []).slice(0, 8);
                const suffix = detail.length > 0 ? `\n      uncovered: ${detail.join('; ')}` : '';
                failures.push(`${file} ${metric} ${formatPct(pct)}% (${totals.covered + allowed}/${totals.total}) is below the required ${thresholds[metric]}%.${suffix}`);
            }
        }
    }

    return {
        ok: failures.length === 0,
        failures,
        totals: summary.total,
        checkedFiles: eligibleFiles,
        declarationOnly,
    };
}

/**
 * @param {Number} pct
 * @return {String}
 */
function formatPct(pct) {
    return (Math.floor(pct * 100) / 100).toFixed(2);
}

/**
 * Run the gate end to end.
 *
 * @param {Object} [options]
 * @param {String} [options.projectRoot]
 * @param {String} [options.coverageDir]
 * @param {String[]} [options.sourceRoots]
 * @param {Object} [options.thresholds]
 * @param {Function} [options.log]
 * @return {Number} process exit code
 */
function run({
    projectRoot = path.resolve(__dirname, '..'),
    coverageDir,
    sourceRoots = DEFAULT_SOURCE_ROOTS,
    thresholds = DEFAULT_THRESHOLDS,
    unreachable = UNREACHABLE,
    log = console.log,
} = {}) {
    const resolvedCoverageDir = coverageDir || path.join(projectRoot, 'coverage');
    const summaryPath = path.join(resolvedCoverageDir, 'coverage-summary.json');
    const finalPath = path.join(resolvedCoverageDir, 'coverage-final.json');

    let packageName;
    try {
        packageName = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).name;
    } catch {
        packageName = undefined;
    }

    const summaryResult = readJson(summaryPath);

    if (!summaryResult.ok) {
        log(`✗ ${summaryResult.error}`);
        return 1;
    }

    const finalResult = readJson(finalPath);
    const uncovered = buildUncoveredIndex(finalResult.ok ? finalResult.value : null, { projectRoot, packageName });

    const eligibleFiles = findEligibleFiles({ projectRoot, sourceRoots });

    // Reconcile the documented-unreachable list against what the report actually
    // shows, so an exemption that is no longer needed fails the gate.
    const allowances = new Map();
    const staleExemptions = [];

    if (finalResult.ok) {
        for (const [key, entry] of Object.entries(finalResult.value)) {
            if (!entry || typeof entry !== 'object') {
                continue;
            }

            const file = normalizeCoverageKey(key, { projectRoot, packageName });
            const { allowed, problems } = reconcileUnreachable(file, entry, unreachable);

            allowances.set(file, allowed);
            staleExemptions.push(...problems);
        }
    }

    for (const file of Object.keys(unreachable)) {
        if (!allowances.has(file)) {
            staleExemptions.push(`${file} is listed in scripts/unreachable-code.js but is not in the coverage report.`);
        }
    }

    if (eligibleFiles.length === 0) {
        log(`✗ No eligible source files found under ${sourceRoots.join(', ')}.`);
        return 1;
    }

    const result = evaluateCoverage({
        summary: summaryResult.value,
        eligibleFiles,
        thresholds,
        projectRoot,
        packageName,
        uncovered,
        allowances,
    });

    result.failures.unshift(...staleExemptions);
    result.ok = result.ok && staleExemptions.length === 0;

    if (result.totals) {
        log('Coverage totals:');
        for (const metric of METRICS) {
            const totals = result.totals[metric];
            if (totals && typeof totals.total === 'number' && typeof totals.covered === 'number') {
                const pct = totals.total === 0 ? 100 : (totals.covered / totals.total) * 100;
                log(`  ${metric.padEnd(11)} ${formatPct(pct).padStart(6)}%  (${totals.covered}/${totals.total})`);
            }
        }
    }

    log(`Eligible source files: ${eligibleFiles.length}`);

    if (result.declarationOnly.length > 0) {
        log(`Declaration-only files (no statements to cover, confirmed against their source): ${result.declarationOnly.length}`);
        for (const file of result.declarationOnly) {
            log(`  ${file}`);
        }
    }

    const exempted = Object.entries(unreachable);
    if (exempted.length > 0) {
        log('');
        log('Documented unreachable code (counted as covered, see DEFECTS.md):');
        for (const [file, entry] of exempted) {
            const counts = ['statements', 'branches', 'functions']
                .filter((metric) => (entry[metric] || []).length > 0)
                .map((metric) => `${(entry[metric] || []).length} ${metric}`)
                .join(', ');
            log(`  ${file} — ${counts}`);
            log(`    ${entry.reason}`);
        }
    }

    if (!result.ok) {
        log('');
        log(`✗ Coverage gate failed with ${result.failures.length} problem(s):`);
        for (const failure of result.failures) {
            log(`  - ${failure}`);
        }
        return 1;
    }

    log('');
    log(`✓ Coverage gate passed: ${eligibleFiles.length} files at 100% statements, branches, functions and lines.`);
    return 0;
}

module.exports = {
    METRICS,
    DEFAULT_THRESHOLDS,
    DEFAULT_SOURCE_ROOTS,
    UNREACHABLE,
    buildUncoveredIndex,
    confirmNoStatements,
    evaluateCoverage,
    reconcileUnreachable,
    uncoveredLocations,
    findEligibleFiles,
    normalizeCoverageKey,
    readJson,
    run,
};

if (require.main === module) {
    // `exitCode` rather than `exit()` so buffered stdout is flushed before the
    // process ends; nothing here schedules further work.
    process.exitCode = run();
}
