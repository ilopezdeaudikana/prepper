import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/', '.mastra/', 'node_modules/', '.agents/', '.claude/', '.vercel/'],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-undef': 'error', 
      'no-unassigned-vars': 'off', 
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'semi': ['error', 'never'],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
)