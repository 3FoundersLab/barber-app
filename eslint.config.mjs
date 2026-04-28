import js from '@eslint/js'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
  js.configs.recommended,
]
