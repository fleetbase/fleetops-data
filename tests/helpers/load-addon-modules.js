/* global requirejs, require */

/**
 * Eagerly evaluate every first-party addon module.
 *
 * Istanbul only reports a file once its module has been evaluated. Without this,
 * any addon module that no test happens to import simply disappears from the
 * coverage denominator, which would make a partial suite look complete. Loading
 * the whole addon tree up front keeps untested files in the report at 0% so the
 * coverage gate can fail on them.
 *
 * This runs unconditionally — not only under `COVERAGE=true` — so the module
 * graph, and therefore the set of side effects a test can observe, is identical
 * in both modes.
 *
 * @return {String[]} the module names that were evaluated
 */

const ADDON_PREFIX = '@fleetbase/fleetops-data/';

/**
 * Module names that must not be eagerly evaluated: the addon's own test tree and
 * template/style artefacts, none of which are first-party executable source.
 *
 * @param {String} name
 * @return {Boolean}
 */
function isEligibleModule(name) {
    if (!name.startsWith(ADDON_PREFIX)) {
        return false;
    }

    return !/(^|\/)(tests?|templates)\//.test(name.slice(ADDON_PREFIX.length)) && !name.endsWith('.css');
}

export default function loadAddonModules() {
    if (typeof requirejs === 'undefined' || !requirejs.entries) {
        throw new Error('loadAddonModules() requires the AMD loader; the coverage denominator cannot be guaranteed without it.');
    }

    const names = Object.keys(requirejs.entries).filter(isEligibleModule).sort();
    const failures = [];

    for (const name of names) {
        try {
            require(name);
        } catch (error) {
            // Swallowing this would silently shrink the coverage denominator, so
            // collect every failure and rethrow as one actionable error.
            failures.push(`${name}: ${error && error.message ? error.message : error}`);
        }
    }

    if (failures.length > 0) {
        throw new Error(`loadAddonModules() failed to evaluate ${failures.length} addon module(s):\n  ${failures.join('\n  ')}`);
    }

    return names;
}

export { ADDON_PREFIX, isEligibleModule };
