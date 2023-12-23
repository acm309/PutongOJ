const antfu = require('@antfu/eslint-config').default
const stylistic = require('@stylistic/eslint-plugin')

module.exports = antfu({
    ignores: [
        '/build/',
        '/dist/',
        '/*.js',
        '/test/unit/coverage/'
    ]
}, {
    rules: {
        'style/max-statements-per-line': ['error', { max: 3 }],
    }
}, {
    rules: {
        'unused-imports/no-unused-vars': ['warn']
    }
}, {
    rules: {
        'style/brace-style': ["error", "1tbs", { "allowSingleLine": true }]
    }
}, {
    rules: {
        'style/space-before-function-paren': ['error', 'always']
    }
}, {
    rules: {
        'style/array-bracket-spacing': ['error', 'always'],
    }
}, {
    rules: {
        'antfu/if-newline': ['off']
    }
})
