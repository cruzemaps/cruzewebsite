import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Supabase Edge Functions run on Deno, not in the browser/Vite app, so the
    // block above (browser globals, app rules) is the wrong linter for them.
    // Give them Deno globals and relax the two rules that fight the Deno
    // context: each file legitimately carries `@ts-nocheck` because the app
    // tsconfig can't resolve its `npm:`/`Deno` imports (so `ban-ts-comment`
    // is a false positive), and with the file already `@ts-nocheck`'d the
    // `no-explicit-any` findings on dynamic request/webhook payloads check
    // nothing. These are a separate deployable with their own runtime.
    files: ["supabase/functions/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        Deno: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
