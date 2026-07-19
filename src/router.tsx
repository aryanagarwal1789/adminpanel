import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Hash routing (URLs become /#/admin, /#/login …) so every request resolves to `/` on
    // S3 + CloudFront — client-side deep links work with NO CloudFront error-response config.
    // Construct only on the client: createHashHistory() reads `window`, which is undefined
    // during the prerender/SSR build step and would crash it. On the server we leave history
    // undefined so the framework uses its own request/memory history for the shell.
    history: typeof document !== "undefined" ? createHashHistory() : undefined,
  });

  return router;
};
