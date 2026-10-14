import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * docs/AREAS.md §13: area identity must go through `@/lib/areas`.
 * The `PHD | WORK | LIFE | LANG` literals (as strings, object keys or
 * `AREA_VISUAL.PHD`-style members) are only allowed in `src/lib/areas/**`,
 * tests and scripts. (The P5/P7 baseline file was emptied and removed in P7.)
 */
const AREA_NAMES = "^(PHD|WORK|LIFE|LANG)$";
const AREA_MESSAGE =
  "Don't hardcode life-area literals. Resolve areas through `@/lib/areas` (areaId, getMemberContext, hubFor / templateKey helpers). See docs/AREAS.md §13.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Common Next/RSC patterns; keep visible as warnings, don't fail CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/areas/**", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${AREA_NAMES}/]`, message: AREA_MESSAGE },
        {
          selector: `TemplateElement[value.cooked=/${AREA_NAMES}/]`,
          message: AREA_MESSAGE,
        },
        {
          selector: `Property[key.name=/${AREA_NAMES}/]`,
          message: AREA_MESSAGE,
        },
        {
          selector: `MemberExpression[computed=false][property.name=/${AREA_NAMES}/]`,
          message: AREA_MESSAGE,
        },
      ],
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
