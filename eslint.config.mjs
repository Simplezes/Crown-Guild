import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const deepFeatureImport = {
  group: ["@/features/*/*", "!@/features/*/server", "!@/features/*/skeleton"],
  message: "Import a feature through its index.ts (or server.ts for server-only code).",
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
  ]),
  {
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-restricted-imports": ["error", { patterns: [deepFeatureImport] }],
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepFeatureImport,
            { group: ["@/features/*"], message: "Shared code must not depend on features." },
            { group: ["@/app/*"], message: "Shared code must not depend on the app layer." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepFeatureImport,
            { group: ["@/app/*"], message: "Features must not depend on the app layer." },
          ],
        },
      ],
    },
  },
]);
