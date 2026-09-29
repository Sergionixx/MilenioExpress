import tsParser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";

// Shared by the command line and scripts/quality-report.mjs. The report runner
// supplies an isolated TypeScript project for the exact snapshot being checked.
export default [
  { ignores: ["node_modules/**", "dist/**", "reportes/**", "output/**"] },
  {
    ...sonarjs.configs.recommended,
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
