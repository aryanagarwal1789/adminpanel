// Shared OTP-gated write flow for the site-config editors (products, blogs,
// sections, landing content, learning-portal courses). Mirrors the OTP flow
// already used by the page/blog/bucket builder (see PageBuilder.tsx) but talks
// to the generic backend dispatcher at /site/content-otp/{request,verify}
// (siteContentOtpController.ts) instead of a per-entity endpoint — every
// direct PUT/POST/DELETE on those editors' old endpoints now returns 410.
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { getAuth, authJsonHeaders } from "./auth";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

// Domain that the publish OTP may be emailed to. Enforced again server-side.
export const OTP_EMAIL_DOMAIN = "salescode.ai";

// The email to send the publish OTP to WITHOUT prompting — only for a real SSO
// session. The credential fallback ("local-dev") is treated as "not SSO", so
// the user is asked to enter/confirm an address.
export function ssoEmail(): string | null {
  const a = getAuth();
  return a?.email && a.token && a.token !== "local-dev" ? a.email : null;
}

export function isValidOtpEmail(email: string): boolean {
  return new RegExp(`^[^@\\s]+@${OTP_EMAIL_DOMAIN.replace(".", "\\.")}$`).test(email.trim().toLowerCase());
}

interface StagedWrite {
  /** Matches an ACTIONS key in siteContentOtpController.ts, e.g. "products.update". */
  action: string;
  /** Route params the action needs, e.g. { productId } / { courseId } / { blogId }. */
  params?: Record<string, string>;
  /** The same body the old direct write route accepted. */
  payload: unknown;
}

export interface PublishOtpState extends StagedWrite {
  step: "email" | "otp";
  email: string;
  sessionId?: string;
  sentTo?: string;
  submitting: boolean;
  error?: string;
}

/**
 * Drives the two-step OTP publish flow. `onSuccess` receives the parsed JSON
 * body from a successful /verify call (the same shape the old direct write
 * route used to return, e.g. { product } / { blog } / { course }).
 */
export function usePublishOtp(onSuccess: (body: any, action: string) => void) {
  const [state, setState] = useState<PublishOtpState | null>(null);
  const [otpInput, setOtpInput] = useState("");

  const requestOtp = useCallback(async (staged: StagedWrite, email: string) => {
    setState((s) => (s ? { ...s, submitting: true, error: undefined } : s));
    try {
      const res = await fetch(`${BACKEND}/site/content-otp/request`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ action: staged.action, params: staged.params ?? {}, payload: staged.payload, email }),
      });
      const d = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setState((s) => (s ? { ...s, submitting: false, error: d.error || `Couldn't send OTP (${res.status})` } : s));
        return;
      }
      setOtpInput("");
      setState((s) =>
        s ? { ...s, step: "otp", email, sessionId: d.sessionId, sentTo: d.sentTo, submitting: false, error: undefined } : s,
      );
      toast.success(`OTP sent to ${d.sentTo || email}`);
    } catch {
      setState((s) => (s ? { ...s, submitting: false, error: "Couldn't send OTP — is the backend running?" } : s));
    }
  }, []);

  /** Entry point — call from a Save/Publish/Delete button instead of writing directly. */
  const open = useCallback(
    (action: string, payload: unknown, params?: Record<string, string>) => {
      const staged: StagedWrite = { action, params, payload };
      const sso = ssoEmail();
      if (sso) {
        setState({ ...staged, step: "otp", email: sso, submitting: true });
        void requestOtp(staged, sso);
      } else {
        setState({ ...staged, step: "email", email: getAuth()?.email ?? "", submitting: false });
      }
    },
    [requestOtp],
  );

  const submitEmail = useCallback(() => {
    setState((cur) => {
      if (!cur) return cur;
      const email = cur.email.trim().toLowerCase();
      if (!isValidOtpEmail(email)) return { ...cur, error: `Enter a valid @${OTP_EMAIL_DOMAIN} email` };
      void requestOtp({ action: cur.action, params: cur.params, payload: cur.payload }, email);
      return { ...cur, email, submitting: true, error: undefined };
    });
  }, [requestOtp]);

  const resend = useCallback(() => {
    setState((cur) => {
      if (!cur) return cur;
      void requestOtp({ action: cur.action, params: cur.params, payload: cur.payload }, cur.email);
      return cur;
    });
  }, [requestOtp]);

  const verify = useCallback(() => {
    setState((cur) => {
      if (!cur?.sessionId) return cur;
      const code = otpInput.trim();
      if (!/^\d{6}$/.test(code)) return { ...cur, error: "Enter the 6-digit code" };
      void (async () => {
        try {
          const res = await fetch(`${BACKEND}/site/content-otp/verify`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify({ sessionId: cur.sessionId, otp: code }),
          });
          const d = await res.json().catch(() => ({} as any));
          if (res.ok) {
            onSuccess(d, cur.action);
            setState(null);
            setOtpInput("");
            return;
          }
          if (res.status === 400 && typeof d.attemptsRemaining === "number") {
            setState((s) => (s ? { ...s, submitting: false, error: `Invalid OTP — ${d.attemptsRemaining} attempt(s) left` } : s));
            return;
          }
          if (res.status === 410) {
            setState((s) => (s ? { ...s, submitting: false, sessionId: undefined, error: "OTP expired — request a new one" } : s));
            return;
          }
          if (res.status === 423) {
            setState(null);
            setOtpInput("");
            toast.error(d.error || "Too many attempts — request a new OTP.");
            return;
          }
          setState((s) => (s ? { ...s, submitting: false, error: d.error || `Verify failed (${res.status})` } : s));
        } catch {
          setState((s) => (s ? { ...s, submitting: false, error: "Verify failed — is the backend running?" } : s));
        }
      })();
      return { ...cur, submitting: true, error: undefined };
    });
  }, [otpInput, onSuccess]);

  const cancel = useCallback(() => {
    setState(null);
    setOtpInput("");
  }, []);

  const setEmail = useCallback((email: string) => {
    setState((s) => (s ? { ...s, email, error: undefined } : s));
  }, []);

  return { state, otpInput, setOtpInput, open, submitEmail, resend, verify, cancel, setEmail };
}

/** Presentational modal — pass through the object returned by usePublishOtp(). */
export function PublishOtpModal({
  otp,
  title = "Verify to publish",
  description = "we'll send a 6-digit code to confirm this change.",
}: {
  otp: ReturnType<typeof usePublishOtp>;
  title?: string;
  description?: string;
}) {
  const { state, otpInput, setOtpInput, submitEmail, resend, verify, cancel, setEmail } = otp;
  if (!state) return null;

  return (
    // z-index must beat every "Add X" modal it can open on top of (those use
    // inline zIndex: 1000, e.g. courses/products "Add" modals) — otherwise the
    // OTP dialog renders visually behind the still-open modal that triggered it.
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 2000 }} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={cancel} />
      <div className="relative w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <span className="text-sm font-semibold">{title}</span>
          <button onClick={cancel} className="p-1.5 rounded hover:bg-slate-800 transition-colors" title="Cancel">
            <X size={16} />
          </button>
        </div>

        {state.step === "email" ? (
          <div className="space-y-3 px-4 py-4">
            <p className="text-xs text-slate-400">
              Enter your <span className="font-medium text-slate-200">@{OTP_EMAIL_DOMAIN}</span> email — {description}
            </p>
            <input
              autoFocus
              type="email"
              value={state.email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitEmail(); }}
              placeholder={`you@${OTP_EMAIL_DOMAIN}`}
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-slate-400"
            />
            {state.error && <p className="text-xs text-red-400">{state.error}</p>}
            <button
              onClick={submitEmail}
              disabled={state.submitting || !isValidOtpEmail(state.email)}
              className="w-full rounded-md px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "#22c55e" }}
            >
              {state.submitting ? "Sending…" : "Send code"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-4 py-4">
            <p className="text-xs text-slate-400">
              {state.sentTo ? (
                <>Enter the 6-digit code sent to <span className="font-medium text-slate-200">{state.sentTo}</span>.</>
              ) : (
                "Sending code…"
              )}
            </p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
              placeholder="••••••"
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-slate-400"
            />
            {state.error && <p className="text-xs text-red-400">{state.error}</p>}
            <button
              onClick={verify}
              disabled={state.submitting || otpInput.length !== 6 || !state.sessionId}
              className="w-full rounded-md px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "#22c55e" }}
            >
              {state.submitting ? "Verifying…" : "Verify & publish"}
            </button>
            <button
              onClick={resend}
              disabled={state.submitting}
              className="w-full rounded-md border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              Resend code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
