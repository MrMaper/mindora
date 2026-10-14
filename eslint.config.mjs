import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import areaBaseline from "./eslint.area-baseline.mjs";

/**
 * docs/AREAS.md §13: area identity must go through `@/lib/areas`.
 * The `PHD | WORK | LIFE | LANG` literals (as strings, object keys or
 * `AREA_VISUAL.PHD`-style members) are only allowed in `src/lib/areas/**`,
 * tests, scripts and the shrinking baseline in `eslint.area-baseline.mjs`.
 */
const AREA_NAMES = "^(PHD|WORK|LIFE|LANG)$";
const AREA_MESSAGE =
  "Don't hardcode life-area literals. Use `@/lib/areas` (RESEARCH_AREA, LANGUAGE_AREA, DEFAULT_AREA, LIFE_AREAS, isHubArea, …). See docs/AREAS.md §13.";

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
  // Legacy call sites not migrated yet (P5 replaces them). Only ever shrink this list.
  {
    files: areaBaseline,
    rules: { "no-restricted-syntax": "off" },
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
