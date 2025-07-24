const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  {
    ignores: [
      '.nyc_output',
      'coverage',
      'data',
      'dist',
      'node_modules',
      'public',
    ],
  },
  {
    rules: {
      'style/max-statements-per-line': [ 'error', { max: 3 } ],
      'unused-imports/no-unused-vars': [ 'warn' ],
      'style/brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
      'style/space-before-function-paren': [ 'error', 'always' ],
      'style/array-bracket-spacing': [ 'error', 'always' ],
      'antfu/if-newline': [ 'off' ],
      'antfu/top-level-function': [ 'off' ],
      'antfu/consistent-list-newline': [ 'off' ],
      'curly': [ 'error', 'all' ],
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
)
