import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    vue: true,
    ignores: [
      '**/coverage/**',
      '**/data/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/public/static/**',
      '**/.vitepress/cache/**',
      '**/.vitepress/dist/**',
      'apps/server/public/uploads/**',
      'apps/web/stats.html',
    ],
  },
  {
    rules: {
      'antfu/consistent-list-newline': ['off'],
      'antfu/if-newline': ['off'],
      'antfu/top-level-function': ['off'],
      'e18e/prefer-static-regex': ['off'],
      'no-console': 'off',
      'no-unused-vars': 'off',
      'style/array-bracket-spacing': ['error', 'always'],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'style/max-statements-per-line': ['error', { max: 3 }],
      'style/space-before-function-paren': ['error', 'always'],
      'ts/consistent-type-definitions': ['off'],
      'unused-imports/no-unused-vars': ['warn'],
      'vue/static-class-names-order': ['warn'],
    },
  },
)
