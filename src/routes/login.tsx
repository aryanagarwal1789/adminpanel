import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithCredentials, popRedirectPath } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!username.trim()) nextErrors.username = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const ok = loginWithCredentials(username.trim(), password);
    if (!ok) {
      setErrors({ form: "Invalid username or password" });
      setSubmitting(false);
      return;
    }

    // Full navigation so the root auth guard re-runs and picks up the session.
    const redirect = popRedirectPath();
    window.location.replace(redirect && redirect !== "/login" ? redirect : "/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-muted/40 to-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            PageCraft Studio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to the admin panel
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
              disabled={submitting}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                disabled={submitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-center text-sm text-destructive">{errors.form}</p>
          )}

          <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Authorized access only.
        </p>
      </div>
    </div>
  );
}
