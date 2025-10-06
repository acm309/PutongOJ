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
      // Stylistic rules
      'style/max-statements-per-line': [ 'error', { max: 3 } ],
      'style/brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
      'style/space-before-function-paren': [ 'error', 'always' ],
      'style/array-bracket-spacing': [ 'error', 'always' ],

      // Other rules
      'unused-imports/no-unused-vars': [ 'warn' ],
      'antfu/if-newline': [ 'off' ],
      'vue/static-class-names-order': [ 'warn' ],
    },
  },
)
