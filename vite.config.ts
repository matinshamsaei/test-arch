import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@application": path.resolve(root, "src/application"),
      "@composition": path.resolve(root, "src/composition"),
      "@domain": path.resolve(root, "src/domain"),
      "@infrastructure": path.resolve(root, "src/infrastructure"),
      "@presentation": path.resolve(root, "src/presentation"),
    },
  },
  test: {
    environment: "node",
    silent: false,
  },
});
