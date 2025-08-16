import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow unused vars in test files and with underscore prefix
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      // Allow any type in test files
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow require imports in test files
      '@typescript-eslint/no-require-imports': 'warn',
      // Allow missing display names in test components
      'react/display-name': 'warn',
      // Allow triple slash references in declaration files
      '@typescript-eslint/triple-slash-reference': 'warn',
    }
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/display-name': 'off',
    }
  }
]

export default eslintConfig
