import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    // Um único banco PGlite de teste — sem paralelismo entre arquivos.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "test/empty.ts"),
      "@": path.resolve(__dirname),
    },
  },
});
