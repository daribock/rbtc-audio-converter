import globals from "globals"
import pluginJs from "@eslint/js"
import pluginNode from "eslint-plugin-node"
import pluginImport from "eslint-plugin-import"
import pluginPrettier from "eslint-plugin-prettier"

export default [
  {
    ignores: ["node_modules/", "dist/", "uploads/", "processed/"],
    files: ["api/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    plugins: {
      pluginImport,
      pluginPrettier,
      pluginNode,
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "pluginImport/no-unresolved": "error",
      "pluginPrettier/prettier": "error",
    },
  },
  pluginJs.configs.recommended,
]
