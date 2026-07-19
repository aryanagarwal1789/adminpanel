import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import productShowcase from "@/assets/product_showcase.png";
import { initiateGoogleSSO } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSSO = async () => {
    setError(null);
    setSsoLoading(true);
    try {
      const url = await initiateGoogleSSO();
      if (!url) {
        setError("Could not start Google sign-in. Please try again.");
        setSsoLoading(false);
        return;
      }
      // Redirect to Google; the auth service returns to /login with a query
      // string that the root AuthGate exchanges for a session.
      window.location.href = url;
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setSsoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#05070a] p-4 sm:p-8">
      <div className="grid min-h-[620px] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f16] shadow-2xl lg:grid-cols-2">
        {/* Left — sign-in */}
        <div className="flex flex-col justify-center px-8 py-10 sm:px-12">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400 text-sm font-bold text-slate-900">
              PC
            </div>
            <span className="text-sm font-semibold text-slate-200">PageCraft Studio</span>
          </div>

          <h1 className="mt-10 text-4xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your Salescode Google account to continue</p>

          {/* Google SSO — the only sign-in method */}
          <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={ssoLoading}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/40 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            {ssoLoading ? "Redirecting…" : "Sign in with Google"}
          </button>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <p className="mt-8 text-xs text-slate-600">Authorized Salescode accounts only.</p>
        </div>

        {/* Right — showcase */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0f151d] to-[#080b10] p-12 lg:block">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative max-w-sm">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Built for
              <br />
              <span className="text-teal-400">Page Building</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Design, edit and publish landing pages, sections and blogs — with live
              preview, version history and multi-editor locking, all from one studio.
            </p>
          </div>

          {/* Product screenshot — large, angled into the bottom-right corner */}
          <img
            src={productShowcase}
            alt="PageCraft Studio preview"
            className="absolute bottom-0 left-20 w-[130%] max-w-none rounded-tl-2xl border-l border-t border-slate-700/60 shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
