import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...nextCoreWebVitals, ...nextTypescript],
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-empty-object-type': 'warn',
        'react-hooks/set-state-in-effect': 'warn',
        'react-hooks/incompatible-library': 'warn',
        'react-hooks/refs': 'warn',
        'react/no-unescaped-entities': 'warn',
        'prefer-const': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-require-imports': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
    },
}]);