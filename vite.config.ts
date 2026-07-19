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
  // Disable Cloudflare Workers adapter — deployed as a static site (S3 + CloudFront)
  cloudflare: false,
  // SPA mode: no SSR server. Build prerenders a client-only shell to dist/client/index.html
  // so it can be hosted statically on S3 + CloudFront. All data is client-fetched from
  // VITE_BACKEND_URL, so SSR buys nothing here.
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        // Emit the shell as index.html (default is /_shell.html) so CloudFront's
        // Default Root Object = index.html works with no renaming.
        outputPath: "/index.html",
      },
    },
  },
  vite: {
    server: {
      // dev-auth.salescode.ai CORS-allowlists ONLY localhost:3000 and localhost:5173
      // (not :8080, the lovable default). 3000 is usually taken by another local app, so
      // pin to 5173. strictPort makes dev fail loudly if 5173 is busy rather than silently
      // falling back to a non-allowlisted port that 403s the SSO call.
      // (Overrides the default outside sandbox; sandbox mode still forces 8080.)
      port: 5173,
      strictPort: true,
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
