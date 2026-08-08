'use strict';

/**
 * Istanbul instrumentation for the addon's own trees.
 *
 * `ember-cli-code-coverage` is a devDependency of this repository and is not
 * installed in consuming applications, so it is only required when a coverage
 * run has explicitly asked for it. Every other build — including every consumer
 * build — gets an empty plugin list and is unaffected.
 *
 * @return {Array} babel plugins
 */
function coverageBabelPlugins() {
    if (process.env.COVERAGE !== 'true') {
        return [];
    }

    return require('ember-cli-code-coverage').buildBabelPlugin();
}

module.exports = {
    name: require('./package').name,

    options: {
        babel: {
            plugins: [...coverageBabelPlugins()],
        },
    },

    isDevelopingAddon() {
        return true;
    },
};
