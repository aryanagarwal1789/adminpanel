import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import productShowcase from "@/assets/product_showcase.png";
import { initiateGoogleSSO, loginWithCredentials, popRedirectPath } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleGoogleSSO = async () => {
    setErrors({});
    setSsoLoading(true);
    try {
      const url = await initiateGoogleSSO();
      if (!url) {
        setErrors({ form: "Could not start Google sign-in. Please try again." });
        setSsoLoading(false);
        return;
      }
      // Redirect to Google; the auth service returns to /login with a query
      // string that the root AuthGate exchanges for a session.
      window.location.href = url;
    } catch {
      setErrors({ form: "Could not start Google sign-in. Please try again." });
      setSsoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!username.trim()) nextErrors.username = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const ok = await loginWithCredentials(username.trim(), password);
    if (!ok) {
      setErrors({ form: "Invalid username or password" });
      setSubmitting(false);
      return;
    }

    // Store the editor's display name — used to show "X is editing this page"
    // in the builder's page edit-lock.
    localStorage.setItem("pb_editor_name", name.trim());

    // Full navigation so the root auth guard re-runs and picks up the session.
    const redirect = popRedirectPath();
    window.location.replace(redirect && redirect !== "/login" ? redirect : "/");
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/40 disabled:opacity-60";
  const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#05070a] p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f16] shadow-2xl lg:grid-cols-2">
        {/* Left — sign-in */}
        <div className="flex flex-col justify-center px-7 py-10 sm:px-10">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400 text-sm font-bold text-slate-900">
              PC
            </div>
            <span className="text-sm font-semibold text-slate-200">PageCraft Studio</span>
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to continue to the admin panel</p>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={ssoLoading || submitting}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            {ssoLoading ? "Redirecting…" : "Sign in with Google"}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] uppercase tracking-widest text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="name" className={labelClass}>Your name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Aryan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className={labelClass}>Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
              {errors.username && <p className="text-xs text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className={labelClass}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {errors.form && <p className="text-center text-sm text-red-400">{errors.form}</p>}

            <button
              type="submit"
              disabled={submitting || ssoLoading}
              className="h-11 w-full rounded-lg bg-teal-400 text-base font-semibold text-slate-900 transition hover:bg-teal-300 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600">Authorized access only.</p>
        </div>

        {/* Right — showcase */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0d1219] to-[#070a0f] lg:flex lg:flex-col">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative px-10 pt-12">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Built for
              <br />
              <span className="text-teal-400">Page Building</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Design, edit and publish landing pages, sections and blogs — with live
              preview, version history and multi-editor locking, all from one studio.
            </p>
          </div>

          {/* Product screenshot anchored to the bottom */}
          <div className="relative mt-8 flex-1">
            <img
              src={productShowcase}
              alt="PageCraft Studio preview"
              className="absolute bottom-0 left-10 right-0 rounded-tl-xl border-l border-t border-slate-700/60 shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
