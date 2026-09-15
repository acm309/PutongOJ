const antfu = require('@antfu/eslint-config').default
const stylistic = require('@stylistic/eslint-plugin')

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
    plugins: {
      '@stylistic': stylistic,
    },
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
