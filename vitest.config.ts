import { defineConfig } from "vitest/config";

// Standalone: vite.config.ts loads the TanStack Start plugin, which breaks under vitest.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
