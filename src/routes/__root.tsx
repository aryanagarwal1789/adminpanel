import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ClientOnly,
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import {
  exchangeSso,
  fetchSsoToken,
  isAuthenticated,
  popRedirectPath,
  setRedirectPath,
} from "@/lib/auth";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);
  return null;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

/**
 * Client-side auth guard. Auth state lives in localStorage (unavailable during
 * SSR), so the guard runs only on the client, AFTER hydration completes. It also
 * handles the Google SSO callback: when the auth service redirects back with a
 * query string, we exchange it for an SSO token, then for an app JWT.
 *
 * NOTE: the check MUST run in useEffect (post-hydration), not useLayoutEffect.
 * Swapping the loader for the real route mid-hydration makes React try to hydrate
 * the protected component against the server-rendered loader markup, which tears
 * the streaming/Suspense boundary and crashes route components (e.g. PageBuilder).
 * Because both the server and the client's first render show the loader, there is
 * no flash of protected content anyway.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState<"loading" | "authed" | "unauthed">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    const resolve = () => {
      if (cancelled) return;
      if (isAuthenticated()) {
        setStatus("authed");
        const redirect = popRedirectPath();
        if (pathname === "/login") {
          navigate({ to: (redirect && redirect !== "/login" ? redirect : "/") as string, replace: true });
        } else if (redirect && redirect !== "/login" && redirect !== pathname) {
          navigate({ to: redirect as string, replace: true });
        }
      } else {
        setStatus("unauthed");
        if (pathname !== "/login") {
          navigate({ to: "/login", replace: true });
        }
      }
    };

    // Remember where the user was headed so we can restore it post-login.
    if (pathname !== "/login" && !isAuthenticated()) {
      setRedirectPath(pathname);
    }

    // Only the SSO callback (query string, not yet authenticated) needs async work.
    const queryString = window.location.search;
    if (queryString && !isAuthenticated()) {
      (async () => {
        try {
          const ssoToken = await fetchSsoToken(queryString);
          if (ssoToken) await exchangeSso(ssoToken);
        } catch (err) {
          console.error("SSO login failed", err);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        resolve();
      })();
    } else {
      resolve();
    }

    return () => {
      cancelled = true;
    };
    // Run once on mount; client navigations between protected routes are fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") return <FullScreenLoader />;
  // On the login page, always render it (authed users are redirected away above).
  if (pathname === "/login") return <>{children}</>;
  if (status === "authed") return <>{children}</>;
  // Unauthed on a protected route: navigation to /login is in flight.
  return <FullScreenLoader />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        Render the entire app client-only. This is an auth-gated admin tool whose
        content lives behind a localStorage session the server can't see, so SSR
        adds no value and actively harms us: the SSR stream reconciles late and
        resets route state (e.g. wiping PageBuilder's freshly-loaded pages back to
        defaults). ClientOnly makes the server emit just the loader fallback and
        lets the client own all rendering — no hydration mismatch, no state reset.
      */}
      <ClientOnly fallback={<FullScreenLoader />}>
        <AuthGate>
          <Outlet />
        </AuthGate>
      </ClientOnly>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
