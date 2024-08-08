import globals from "globals"
import pluginJs from "@eslint/js"

export default [
  { files: ["server/**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    env: {
      node: true,
    },
  },
]
