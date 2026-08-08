'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const { evaluateCoverage, findEligibleFiles, normalizeCoverageKey, readJson, run } = require('../check-coverage');

const PACKAGE_NAME = '@fleetbase/fleetops-data';

let workspace;

/**
 * Build a throwaway project root that mirrors the real addon layout closely
 * enough for the gate to run end to end.
 *
 * @param {String[]} sourceFiles project-relative paths to create
 * @return {String} project root
 */
function makeProject(sourceFiles) {
    const root = fs.mkdtempSync(path.join(workspace, 'project-'));

    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: PACKAGE_NAME }));

    for (const file of sourceFiles) {
        const absolute = path.join(root, file);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, '// source\n');
    }

    return root;
}

/**
 * @param {Number} covered
 * @param {Number} total
 * @return {Object}
 */
function metric(covered, total) {
    return { total, covered, skipped: 0, pct: total === 0 ? 100 : (covered / total) * 100 };
}

/**
 * @param {Object} overrides
 * @return {Object} an Istanbul-shaped metrics bundle
 */
function fullMetrics({ statements = [4, 4], branches = [2, 2], functions = [1, 1], lines = [4, 4] } = {}) {
    return {
        statements: metric(...statements),
        branches: metric(...branches),
        functions: metric(...functions),
        lines: metric(...lines),
    };
}

/**
 * Write a coverage report into `root/coverage`.
 *
 * @param {String} root
 * @param {Object|String} summary object to serialize, or raw file contents
 * @param {Object} [final]
 */
function writeReport(root, summary, final) {
    const dir = path.join(root, 'coverage');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'coverage-summary.json'), typeof summary === 'string' ? summary : JSON.stringify(summary));

    if (final) {
        fs.writeFileSync(path.join(dir, 'coverage-final.json'), JSON.stringify(final));
    }
}

/**
 * Run the gate while capturing its output.
 *
 * @param {String} root
 * @return {{ code: Number, output: String }}
 */
function runGate(root, unreachable = {}) {
    const lines = [];
    const code = run({ projectRoot: root, unreachable, log: (line) => lines.push(line) });
    return { code, output: lines.join('\n') };
}

before(function () {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'fleetops-coverage-gate-'));
});

after(function () {
    fs.rmSync(workspace, { recursive: true, force: true });
});

describe('findEligibleFiles', function () {
    it('collects every addon JavaScript file and ignores everything else', function () {
        const root = makeProject(['addon/models/order.js', 'addon/utils/geojson/point.js', 'app/models/order.js', 'tests/unit/models/order-test.js', 'addon/styles/addon.css']);

        assert.deepEqual(findEligibleFiles({ projectRoot: root }), ['addon/models/order.js', 'addon/utils/geojson/point.js']);
    });

    it('returns an empty list when the source root does not exist', function () {
        const root = makeProject([]);

        assert.deepEqual(findEligibleFiles({ projectRoot: root }), []);
    });
});

describe('normalizeCoverageKey', function () {
    const options = { projectRoot: '/repo/fleetops-data', packageName: PACKAGE_NAME };

    it('turns an absolute path into a project-relative one', function () {
        assert.equal(normalizeCoverageKey('/repo/fleetops-data/addon/models/order.js', options), 'addon/models/order.js');
    });

    it('leaves an already relative path alone', function () {
        assert.equal(normalizeCoverageKey('addon/models/order.js', options), 'addon/models/order.js');
    });

    it('strips a leading ./', function () {
        assert.equal(normalizeCoverageKey('./addon/models/order.js', options), 'addon/models/order.js');
    });

    it('maps an addon module name onto the addon tree', function () {
        assert.equal(normalizeCoverageKey(`${PACKAGE_NAME}/models/order.js`, options), 'addon/models/order.js');
    });

    it('maps a dummy-app module name back onto the addon tree', function () {
        assert.equal(normalizeCoverageKey('dummy/serializers/order.js', options), 'addon/serializers/order.js');
    });

    it('appends a missing .js extension', function () {
        assert.equal(normalizeCoverageKey(`${PACKAGE_NAME}/models/order`, options), 'addon/models/order.js');
    });

    it('leaves a key alone when no project root prefix matches', function () {
        assert.equal(normalizeCoverageKey('/elsewhere/addon/models/order.js', options), '/elsewhere/addon/models/order.js');
    });

    it('tolerates a project root with a trailing separator', function () {
        assert.equal(normalizeCoverageKey('/repo/fleetops-data/addon/models/order.js', { projectRoot: '/repo/fleetops-data/', packageName: PACKAGE_NAME }), 'addon/models/order.js');
    });

    it('does not rewrite package-prefixed keys when the package name is unknown', function () {
        assert.equal(normalizeCoverageKey(`${PACKAGE_NAME}/models/order.js`, { projectRoot: '/repo' }), `${PACKAGE_NAME}/models/order.js`);
    });
});

describe('readJson', function () {
    it('reports a missing file distinctly', function () {
        const root = makeProject([]);
        const result = readJson(path.join(root, 'coverage', 'coverage-summary.json'));

        assert.equal(result.ok, false);
        assert.match(result.error, /not found/);
    });

    it('reports an empty file distinctly', function () {
        const root = makeProject([]);
        writeReport(root, '   ');
        const result = readJson(path.join(root, 'coverage', 'coverage-summary.json'));

        assert.equal(result.ok, false);
        assert.match(result.error, /is empty/);
    });

    it('reports malformed JSON distinctly', function () {
        const root = makeProject([]);
        writeReport(root, '{ "total": ');
        const result = readJson(path.join(root, 'coverage', 'coverage-summary.json'));

        assert.equal(result.ok, false);
        assert.match(result.error, /not valid JSON/);
    });
});

describe('evaluateCoverage', function () {
    const base = { projectRoot: '/repo', packageName: PACKAGE_NAME };

    it('passes when every eligible file is present and fully covered', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/models/order.js'],
            summary: {
                total: fullMetrics(),
                '/repo/addon/models/order.js': fullMetrics(),
            },
        });

        assert.deepEqual(result.failures, []);
        assert.equal(result.ok, true);
    });

    it('fails when an eligible file never appears in the report', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/models/order.js', 'addon/models/payload.js'],
            summary: {
                total: fullMetrics(),
                '/repo/addon/models/order.js': fullMetrics(),
            },
        });

        assert.equal(result.ok, false);
        assert.equal(result.failures.length, 1);
        assert.match(result.failures[0], /addon\/models\/payload\.js is missing from the coverage report/);
    });

    it('fails on a global threshold shortfall', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: [],
            summary: { total: fullMetrics({ branches: [3, 4] }) },
        });

        assert.equal(result.ok, false);
        assert.match(result.failures.join('\n'), /Global branches coverage 75\.00% \(3\/4\) is below the required 100%/);
    });

    it('fails on a per-file threshold shortfall even when the global total rounds to 100', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/models/order.js', 'addon/models/payload.js'],
            summary: {
                total: fullMetrics({ statements: [1999, 2000] }),
                'addon/models/order.js': fullMetrics(),
                'addon/models/payload.js': fullMetrics({ statements: [1, 2] }),
            },
        });

        assert.equal(result.ok, false);
        const joined = result.failures.join('\n');
        assert.match(joined, /addon\/models\/payload\.js statements 50\.00% \(1\/2\)/);
    });

    it('surfaces uncovered locations for a failing file', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/models/order.js'],
            summary: {
                total: fullMetrics({ functions: [0, 1] }),
                'addon/models/order.js': fullMetrics({ functions: [0, 1] }),
            },
            uncovered: new Map([['addon/models/order.js', ['function `pickupName` at line 12']]]),
        });

        assert.equal(result.ok, false);
        assert.match(result.failures.join('\n'), /uncovered: function `pickupName` at line 12/);
    });

    it('fails when the report has zero totals rather than treating it as vacuously covered', function () {
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: [],
            summary: { total: fullMetrics({ statements: [0, 0], branches: [0, 0], functions: [0, 0], lines: [0, 0] }) },
        });

        assert.equal(result.ok, false);
        assert.equal(result.failures.length, 4);
        assert.match(result.failures[0], /Global statements total is 0/);
    });

    it('accepts a file that legitimately has no branches, such as a re-export shim', function () {
        const reExport = fullMetrics({ statements: [1, 1], branches: [0, 0], functions: [0, 0], lines: [1, 1] });
        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/utils/geojson.js'],
            summary: {
                total: fullMetrics(),
                'addon/utils/geojson.js': reExport,
            },
        });

        assert.deepEqual(result.failures, []);
        assert.equal(result.ok, true);
    });

    it('rejects a summary with no total section', function () {
        const result = evaluateCoverage({ ...base, eligibleFiles: [], summary: { 'addon/models/order.js': fullMetrics() } });

        assert.equal(result.ok, false);
        assert.match(result.failures[0], /no `total` section/);
    });

    it('rejects a non-object summary', function () {
        const result = evaluateCoverage({ ...base, eligibleFiles: [], summary: null });

        assert.equal(result.ok, false);
        assert.match(result.failures[0], /not an object/);
    });

    it('reports a file entry that is missing a metric bundle', function () {
        const partial = fullMetrics();
        delete partial.branches;

        const result = evaluateCoverage({
            ...base,
            eligibleFiles: ['addon/models/order.js'],
            summary: { total: fullMetrics(), 'addon/models/order.js': partial },
        });

        assert.equal(result.ok, false);
        assert.match(result.failures.join('\n'), /addon\/models\/order\.js is missing `branches` totals/);
    });

    it('reports missing global metric totals', function () {
        const total = fullMetrics();
        delete total.lines;

        const result = evaluateCoverage({ ...base, eligibleFiles: [], summary: { total } });

        assert.equal(result.ok, false);
        assert.match(result.failures.join('\n'), /missing global `lines` totals/);
    });
});

describe('run', function () {
    it('exits 0 and reports the file count on a clean 100% report', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(root, {
            total: fullMetrics(),
            [`${PACKAGE_NAME}/models/order.js`]: fullMetrics(),
        });

        const { code, output } = runGate(root);

        assert.equal(code, 0);
        assert.match(output, /Coverage gate passed: 1 files at 100%/);
    });

    it('exits 1 when the report is absent', function () {
        const root = makeProject(['addon/models/order.js']);

        const { code, output } = runGate(root);

        assert.equal(code, 1);
        assert.match(output, /Coverage report not found/);
    });

    it('exits 1 when the report is malformed', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(root, '{ oops');

        const { code, output } = runGate(root);

        assert.equal(code, 1);
        assert.match(output, /not valid JSON/);
    });

    it('exits 1 when there are no eligible source files at all', function () {
        const root = makeProject([]);
        writeReport(root, { total: fullMetrics() });

        const { code, output } = runGate(root);

        assert.equal(code, 1);
        assert.match(output, /No eligible source files/);
    });

    it('exits 1 and names the uncovered branch when a file falls short', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(
            root,
            {
                total: fullMetrics({ branches: [1, 2] }),
                [path.join(root, 'addon/models/order.js')]: fullMetrics({ branches: [1, 2] }),
            },
            {
                [path.join(root, 'addon/models/order.js')]: {
                    statementMap: {},
                    fnMap: {},
                    branchMap: { 0: { type: 'if', loc: { start: { line: 42 } } } },
                    s: {},
                    f: {},
                    b: { 0: [1, 0] },
                },
            }
        );

        const { code, output } = runGate(root);

        assert.equal(code, 1);
        assert.match(output, /branch #1 of if at line 42/);
    });

    it('is deterministic — the same inputs produce the same exit code twice', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(root, { total: fullMetrics({ lines: [0, 4] }), 'addon/models/order.js': fullMetrics({ lines: [0, 4] }) });

        assert.equal(runGate(root).code, 1);
        assert.equal(runGate(root).code, 1);
    });
});

describe('reconcileUnreachable', function () {
    const { reconcileUnreachable, uncoveredLocations, UNREACHABLE } = require('../check-coverage');

    /**
     * @param {Object} overrides
     * @return {Object} an Istanbul file entry with one uncovered statement,
     *                  branch and function
     */
    function entryWithGaps({ statementHits = 0, branchHits = [1, 0], fnHits = 0 } = {}) {
        return {
            statementMap: { 0: { start: { line: 42 } } },
            fnMap: { 0: { name: 'rankFee', decl: { start: { line: 40 } } } },
            branchMap: { 0: { type: 'if', loc: { start: { line: 44 } } } },
            s: { 0: statementHits },
            f: { 0: fnHits },
            b: { 0: branchHits },
        };
    }

    it('enumerates uncovered locations in the documented identity format', function () {
        assert.deepEqual(uncoveredLocations(entryWithGaps()), {
            statements: [42],
            branches: ['if@44#1'],
            functions: ['rankFee'],
        });
    });

    it('reports nothing covered and nothing wrong for a file with no exemptions', function () {
        const { allowed, problems } = reconcileUnreachable('addon/models/unlisted.js', entryWithGaps());

        assert.deepEqual(problems, []);
        assert.deepEqual(allowed, { statements: 0, branches: 0, functions: 0, lines: 0 });
    });

    it('the shipped exemption list is empty or fully documented', function () {
        for (const [file, entry] of Object.entries(UNREACHABLE)) {
            assert.equal(typeof entry.reason, 'string', `${file} has a written reason`);
            assert.ok(entry.reason.length > 20, `${file}'s reason is substantive`);
        }
    });
});

describe('the documented-unreachable allowlist', function () {
    /**
     * @param {Object} [overrides]
     * @return {Object} an Istanbul file entry with one uncovered branch
     */
    function entryWithUncoveredBranch() {
        return {
            statementMap: { 0: { start: { line: 42 } } },
            fnMap: {},
            branchMap: { 0: { type: 'if', loc: { start: { line: 44 } } } },
            s: { 0: 1 },
            f: {},
            b: { 0: [1, 0] },
        };
    }

    it('a documented branch is counted as covered and the gate passes', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(
            root,
            {
                total: fullMetrics({ branches: [1, 2] }),
                'addon/models/order.js': fullMetrics({ branches: [1, 2] }),
            },
            { 'addon/models/order.js': entryWithUncoveredBranch() }
        );

        const { code, output } = runGate(root, {
            'addon/models/order.js': { reason: 'A documented, provably unreachable defensive branch.', branches: ['if@44#1'] },
        });

        assert.equal(code, 0);
        assert.match(output, /Documented unreachable code/);
        assert.match(output, /A documented, provably unreachable defensive branch/);
    });

    it('an undocumented branch in the same file still fails', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(
            root,
            {
                total: fullMetrics({ branches: [1, 3] }),
                'addon/models/order.js': fullMetrics({ branches: [1, 3] }),
            },
            { 'addon/models/order.js': entryWithUncoveredBranch() }
        );

        const { code } = runGate(root, {
            'addon/models/order.js': { reason: 'A documented, provably unreachable defensive branch.', branches: ['if@44#1'] },
        });

        assert.equal(code, 1, 'the exemption covers one branch, not the file');
    });

    it('an exemption that has become covered fails as stale', function () {
        const root = makeProject(['addon/models/order.js']);
        const covered = entryWithUncoveredBranch();
        covered.b[0] = [1, 1];

        writeReport(root, { total: fullMetrics(), 'addon/models/order.js': fullMetrics() }, { 'addon/models/order.js': covered });

        const { code, output } = runGate(root, {
            'addon/models/order.js': { reason: 'A documented, provably unreachable defensive branch.', branches: ['if@44#1'] },
        });

        assert.equal(code, 1);
        assert.match(output, /is now covered — remove the stale exemption/);
    });

    it('an exemption for a file that is not in the report fails', function () {
        const root = makeProject(['addon/models/order.js']);
        writeReport(root, { total: fullMetrics(), 'addon/models/order.js': fullMetrics() }, { 'addon/models/order.js': { statementMap: {}, fnMap: {}, branchMap: {}, s: {}, f: {}, b: {} } });

        const { code, output } = runGate(root, { 'addon/models/gone.js': { reason: 'Refers to a file that no longer exists in the report.' } });

        assert.equal(code, 1);
        assert.match(output, /is not in the coverage report/);
    });
});
