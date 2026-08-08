'use strict';

module.exports = {
    root: true,
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
            plugins: [['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }]],
        },
    },
    plugins: ['ember'],
    extends: ['eslint:recommended', 'plugin:ember/recommended', 'plugin:prettier/recommended'],
    env: {
        browser: true,
    },
    rules: {
        'ember/no-get': 'off',
        'ember/no-computed-properties-in-native-classes': 'off',
        'ember/classic-decorator-no-classic-methods': 'off',
        'ember/no-array-prototype-extensions': 'off',
    },
    overrides: [
        // node files
        {
            files: [
                './.eslintrc.js',
                './.prettierrc.js',
                './.stylelintrc.js',
                './.template-lintrc.js',
                './ember-cli-build.js',
                './index.js',
                './testem.js',
                './blueprints/*/index.js',
                './config/**/*.js',
                './scripts/**/*.js',
                './tests/dummy/config/**/*.js',
            ],
            parserOptions: {
                sourceType: 'script',
            },
            env: {
                browser: false,
                node: true,
            },
            extends: ['plugin:n/recommended'],
            rules: {
                // `ember-cli-code-coverage` is a devDependency that is only
                // required when COVERAGE=true, which never happens in a consumer
                // build. The coverage gate under `scripts/` is likewise a
                // development-only tool that ships with the repository, not with
                // the published package.
                'n/no-unpublished-require': 'off',
            },
        },
    ],
};
