import eslintReact from '@eslint-react/eslint-plugin';
import eslintJs from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(globalIgnores(['.wxt/**', '.output/**']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    eslintJs.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    eslintReact.configs['recommended-type-checked'],
  ],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-import-type-side-effects': 'error',
  },
});
