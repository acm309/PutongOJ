import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  ignores: [
    'dist/**',
    '**/dist/**',
  ],
}, {
  rules: {
    'ts/consistent-type-definitions': ['error', 'type'],
    'ts/no-redeclare': 'off',
  },
})
