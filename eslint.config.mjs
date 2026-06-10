import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Surfaced as warnings: legit debt to clean up incrementally, but they
      // shouldn't block `npm run check`. Avoid introducing new ones.
      "@typescript-eslint/no-explicit-any": "warn",
      // The React Compiler purity rule flags Date.now()/Math.random() inside
      // event handlers defined in component bodies (false positives).
      "react-hooks/purity": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
