'use strict';

/**
 * Coverage configuration for `ember-cli-code-coverage`.
 *
 * Only the addon's own trees are instrumented (see `index.js`), so the report
 * contains first-party Fleet-Ops source and nothing else. The dummy application
 * and the test tree are deliberately left uninstrumented: including them would
 * dilute the global percentages that `scripts/check-coverage.js` enforces.
 *
 * `json-summary` powers the coverage gate, `lcov` is what Codecov consumes,
 * `json` preserves per-branch detail for diagnosing gaps, and `text-summary`
 * prints the result in CI logs.
 */
module.exports = {
    coverageEnvVar: 'COVERAGE',
    coverageFolder: 'coverage',
    reporters: ['text-summary', 'lcov', 'json-summary', 'json'],
    excludes: ['*/mirage/**/*', '*/node_modules/**/*', '*/tests/**/*'],
    parallel: false,
};
