import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/Components_Tests/setup.js",
    transformMode :{Web: [/\.jsx?$/]},
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      exclude: ["node_modules/", "src/main.jsx"],
    },
  },
});
