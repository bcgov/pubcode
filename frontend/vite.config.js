import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // https://vitejs.dev/config/shared-options.html#resolve-alias
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./node_modules", import.meta.url))
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"]
  },
  build: {
    // Build Target
    // https://vitejs.dev/config/build-options.html#build-target
    target: "esnext",
    // Minify option
    // https://vitejs.dev/config/build-options.html#build-minify
    minify: "esbuild",
    // Rollup Options
    // https://vitejs.dev/config/build-options.html#build-rollupoptions
    rollupOptions: {
      // @ts-ignore
      output: {
        manualChunks: {
          // Split external library from transpiled code.
          react: ["react", "react-dom", "react-router-dom", "react-router", "@emotion/react", "@emotion/styled"],
          rjsf: ["@rjsf/core","@rjsf/material-ui","@rjsf/utils","@rjsf/validator-ajv8"],
          mui: ["@mui/material", "@mui/icons-material"],
          materialUI: ["@material-ui/core", "@material-ui/icons"],
          lodash: ["lodash"],
          jsyaml: ["js-yaml"],
          prop_types: ["prop-types"],
          react_copy_to_clipboard: ["react-copy-to-clipboard"],
          react_toastify: ["react-toastify"],
          react_syntax_highlighter: ["react-syntax-highlighter"],
          file_saver: ["file-saver"]

        }
      }
    }
  }
});
