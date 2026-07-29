import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  ignores: [
    'dist/**',
  ],
}, {
  rules: {
    'antfu/consistent-list-newline': [ 'off' ],
    'antfu/if-newline': [ 'off' ],
    'antfu/top-level-function': [ 'off' ],
    'curly': [ 'error', 'all' ],
    'e18e/prefer-static-regex': [ 'off' ],
    'no-console': 'off',
    'style/array-bracket-spacing': [ 'error', 'always' ],
    'style/brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
    'style/max-statements-per-line': [ 'error', { max: 3 } ],
    'style/space-before-function-paren': [ 'error', 'always' ],
  },
})
