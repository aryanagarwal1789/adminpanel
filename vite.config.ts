// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  // Disable Cloudflare Workers adapter — deployed as a static site on Render
  cloudflare: false,
  vite: {
    server: {
      proxy: {
        // Proxies /renderer-proxy/* → demo-experience.salescode.ai/* in local dev,
        // bypassing CORS. Production uses the real URL directly.
        '/renderer-proxy': {
          target: 'https://demo-experience.salescode.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/renderer-proxy/, '') || '/',
        },
      },
    },
  },
});
