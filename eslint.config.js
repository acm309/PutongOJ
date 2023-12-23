const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  ignores: [
    'coverage/**',
    'dist/**',
    'public/**',
    '.vscode/**',
    'node_modules/**',
  ],
}, {
  rules: {
    'style/max-statements-per-line': [ 'error', { max: 3 } ],
  },
}, {
  rules: {
    'unused-imports/no-unused-vars': [ 'warn' ],
  },
}, {
  rules: {
    'style/brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
  },
}, {
  rules: {
    'style/space-before-function-paren': [ 'error', 'always' ],
  },
}, {
  rules: {
    'style/array-bracket-spacing': [ 'error', 'always' ],
  },
}, {
  rules: {
    'antfu/if-newline': [ 'off' ],
  },
}, {
  rules: {
    'antfu/top-level-function': [ 'off' ],
  },
}, {
  rules: {
    'antfu/consistent-list-newline': [ 'off' ],
  },
}, {
  rules: {
    curly: [ 'error', 'all' ],
  },
}, {
  rules: {
    'no-console': 'off',
  },
})
