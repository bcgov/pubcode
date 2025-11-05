import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]

