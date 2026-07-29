const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  {
    ignores: [
      'dist',
      'node_modules',
      'public/static',
      'stats.html',
    ],
  },
  {
    rules: {
      'antfu/if-newline': [ 'off' ],
      'e18e/prefer-static-regex': ['off'],
      'style/array-bracket-spacing': [ 'error', 'always' ],
      'style/brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
      'style/max-statements-per-line': [ 'error', { max: 3 } ],
      'style/space-before-function-paren': [ 'error', 'always' ],
      'unused-imports/no-unused-vars': [ 'warn' ],
      'vue/static-class-names-order': [ 'warn' ],
    },
  },
)
