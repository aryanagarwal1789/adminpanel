import { useCallback, useEffect, useState } from "react";
import type { Page } from "./types";
import { getAuth } from "@/lib/auth";

// Bucket-centric URL manager: buckets are folders, pages live inside them.
// You organise from the bucket side (create folders, drop pages in, edit slugs)
// rather than visiting each page. A page's bucket/slug is saved when that page
// is published.
//
// Bucket create/rename/delete are OTP-gated (same posture as publishing): the
// mutation is staged server-side and only applied after a 6-digit code emailed
// to an @salescode.ai address is verified. Moving a page into a bucket / editing
// its slug is NOT a bucket write — those still save when the page is published.

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const OTP_EMAIL_DOMAIN = "salescode.ai";

function isValidOtpEmail(email: string): boolean {
  return new RegExp(`^[^@\\s]+@${OTP_EMAIL_DOMAIN.replace(".", "\\.")}$`).test(email.trim().toLowerCase());
}

// Email to send the OTP to without prompting — only for a real SSO session.
function ssoEmail(): string | null {
  const a = getAuth();
  return a?.email && a.token && a.token !== "local-dev" ? a.email : null;
}

interface BucketDTO {
  bucketId: string;
  segment: string;
  label?: string;
  parentId: string | null;
  order: number;
  path: string;
}

// A staged bucket mutation replayed to the backend once the OTP is verified.
type BucketOp =
  | { op: "create"; segment: string; parentId: string | null }
  | { op: "update"; bucketId: string; segment: string }
  | { op: "delete"; bucketId: string };

interface OtpFlow {
  op: BucketOp;
  label: string;                 // human description shown in the modal
  step: "email" | "otp";
  email: string;
  sessionId?: string;
  sentTo?: string;
  submitting: boolean;
  error?: string;
}

interface Props {
  pages: Page[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onPageChange: (pageKey: string, patch: { bucketId?: string | null; urlSlug?: string }) => void;
}

export function SiteUrlManager({ pages, activePageId, onSelectPage, onPageChange }: Props) {
  const [buckets, setBuckets] = useState<BucketDTO[]>([]);
  const [err, setErr] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [newParent, setNewParent] = useState("");

  const [otp, setOtpFlow] = useState<OtpFlow | null>(null);
  const [otpInput, setOtpInput] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/site/builder/buckets`);
      if (!res.ok) return;
      const { buckets: b } = (await res.json()) as { buckets: BucketDTO[] };
      setBuckets((b ?? []).sort((x, y) => x.path.localeCompare(y.path)));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Step 0 — begin an OTP-gated mutation: open the modal (SSO users skip straight
  // to the code step with the OTP already on its way).
  const beginOp = useCallback((op: BucketOp, label: string) => {
    setErr("");
    const sso = ssoEmail();
    if (sso && isValidOtpEmail(sso)) {
      setOtpFlow({ op, label, step: "otp", email: sso, submitting: true });
      void requestOtp(op, sso);
    } else {
      setOtpFlow({ op, label, step: "email", email: getAuth()?.email ?? "", submitting: false });
    }
    setOtpInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1 — stage the mutation and email a 6-digit OTP.
  const requestOtp = useCallback(async (op: BucketOp, email: string) => {
    try {
      const res = await fetch(`${BACKEND}/site/builder/bucket-otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...op, email }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpFlow((s) => (s ? { ...s, submitting: false, error: (d as { error?: string }).error ?? `Failed (${res.status})` } : s));
        return;
      }
      setOtpInput("");
      setOtpFlow((s) => (s ? { ...s, step: "otp", email, sessionId: d.sessionId, sentTo: d.sentTo, submitting: false, error: undefined } : s));
    } catch {
      setOtpFlow((s) => (s ? { ...s, submitting: false, error: "Network error" } : s));
    }
  }, []);

  // Step 2 — verify the code; the backend applies the mutation on success.
  // Reads sessionId from the current flow (not inside a state updater) so a
  // StrictMode double-render can't fire the request — and burn an attempt — twice.
  const verifyOtp = async (sessionId: string, code: string) => {
    setOtpFlow((s) => (s ? { ...s, submitting: true, error: undefined } : s));
    try {
      const res = await fetch(`${BACKEND}/site/builder/bucket-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (d as { error?: string }).error ?? `Failed (${res.status})`;
        const rem = (d as { attemptsRemaining?: number }).attemptsRemaining;
        // 410 expired / 423 locked / 404 gone → re-stage from the email step.
        const expired = res.status === 410 || res.status === 423 || res.status === 404;
        setOtpInput("");
        setOtpFlow((cur) => (cur ? {
          ...cur,
          submitting: false,
          sessionId: expired ? undefined : cur.sessionId,
          step: expired ? "email" : "otp",
          error: rem != null ? `${msg} (${rem} left)` : msg,
        } : cur));
        return;
      }
      setOtpFlow(null);
      setOtpInput("");
      await load();
    } catch {
      setOtpFlow((cur) => (cur ? { ...cur, submitting: false, error: "Network error" } : cur));
    }
  };

  const submitEmail = useCallback(() => {
    setOtpFlow((cur) => {
      if (!cur) return cur;
      const email = cur.email.trim().toLowerCase();
      if (!isValidOtpEmail(email)) return { ...cur, error: `Enter a valid @${OTP_EMAIL_DOMAIN} email` };
      void requestOtp(cur.op, email);
      return { ...cur, email, submitting: true, error: undefined };
    });
  }, [requestOtp]);

  const closeOtp = () => { setOtpFlow(null); setOtpInput(""); };

  const bucketOptions = [{ bucketId: "", path: "(root)" }, ...buckets.map((b) => ({ bucketId: b.bucketId, path: b.path }))];
  const pagesIn = (bucketId: string | null) => pages.filter((p) => (p.bucketId ?? null) === (bucketId || null));

  const finalUrl = (p: Page) => {
    const bp = p.bucketId ? buckets.find((b) => b.bucketId === p.bucketId)?.path ?? "" : "";
    return "/" + [bp, (p.urlSlug ?? "").replace(/^\/+|\/+$/g, "")].filter(Boolean).join("/");
  };

  const busy = otp?.submitting ?? false;

  const PageRow = ({ p }: { p: Page }) => (
    <div className={`flex flex-col gap-1 px-2 py-1.5 rounded ${activePageId === p.id ? "bg-slate-800" : "hover:bg-slate-800/50"}`}>
      <button onClick={() => onSelectPage(p.id)} className="text-left text-xs text-slate-200 truncate">{p.name}</button>
      <div className="flex gap-1">
        <select
          value={p.bucketId ?? ""}
          onChange={(e) => onPageChange(p.id, { bucketId: e.target.value || null })}
          className="bg-slate-900 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-700 outline-none min-w-0 flex-1"
          title="Move to bucket"
        >
          {bucketOptions.map((o) => <option key={o.bucketId} value={o.bucketId}>/{o.path === "(root)" ? "" : o.path}</option>)}
        </select>
        <input
          value={p.urlSlug ?? ""}
          onChange={(e) => onPageChange(p.id, { urlSlug: e.target.value.trim() })}
          placeholder="slug"
          className="bg-slate-900 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-700 outline-none w-24"
        />
      </div>
      <span className="text-[10px] text-emerald-400 truncate">{finalUrl(p)}</span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-2 gap-3">
      {err && <div className="text-[11px] text-red-400 px-1">{err}</div>}

      {/* Add bucket */}
      <div className="flex gap-1 items-center">
        <select value={newParent} onChange={(e) => setNewParent(e.target.value)}
          className="bg-slate-800 text-white text-[11px] px-1.5 py-1 rounded border border-slate-700 outline-none min-w-0 flex-1">
          <option value="">(top-level)</option>
          {buckets.map((b) => <option key={b.bucketId} value={b.bucketId}>/{b.path}</option>)}
        </select>
        <input value={newSegment} onChange={(e) => setNewSegment(e.target.value)} placeholder="new-bucket"
          className="bg-slate-800 text-white text-[11px] px-2 py-1 rounded border border-slate-700 outline-none w-24" />
        <button disabled={busy || !newSegment.trim()}
          onClick={() => beginOp(
            { op: "create", segment: newSegment.trim(), parentId: newParent || null },
            `Create bucket /${newSegment.trim()}`,
          )}
          className="text-[11px] px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">Add</button>
      </div>

      {/* Root (unbucketed) pages */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1">Root · /</div>
        <div className="flex flex-col gap-1">
          {pagesIn(null).map((p) => <PageRow key={p.id} p={p} />)}
          {pagesIn(null).length === 0 && <div className="text-[11px] text-slate-600 px-1">No pages</div>}
        </div>
      </div>

      {/* Each bucket + its pages */}
      {buckets.map((b) => (
        <div key={b.bucketId}>
          <div className="flex items-center gap-1 px-1 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 flex-1 truncate">/{b.path}</span>
            <button disabled={busy} onClick={() => {
              const s = prompt("Rename segment for /" + b.path, b.segment);
              if (s && s.trim() && s.trim() !== b.segment) beginOp({ op: "update", bucketId: b.bucketId, segment: s.trim() }, `Rename /${b.path} → ${s.trim()}`);
            }}
              className="text-[10px] text-slate-400 hover:text-slate-200 disabled:opacity-40">rename</button>
            <button disabled={busy} onClick={() => {
              if (confirm(`Delete /${b.path}? (must be empty)`)) beginOp({ op: "delete", bucketId: b.bucketId }, `Delete /${b.path}`);
            }}
              className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-40">del</button>
          </div>
          <div className="flex flex-col gap-1">
            {pagesIn(b.bucketId).map((p) => <PageRow key={p.id} p={p} />)}
            {pagesIn(b.bucketId).length === 0 && <div className="text-[11px] text-slate-600 px-1">Empty — move a page here</div>}
          </div>
        </div>
      ))}

      <div className="text-[10px] text-slate-500 px-1 pt-1 border-t border-slate-800">
        Bucket changes need an emailed OTP. Page moves & slugs save when you <b>publish</b> the page.
      </div>

      {/* OTP modal */}
      {otp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeOtp} />
          <div className="relative w-80 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-semibold text-slate-100">Confirm URL change</div>
              <button onClick={closeOtp} className="text-slate-400 hover:text-slate-200 text-sm leading-none">✕</button>
            </div>
            <div className="text-[11px] text-slate-400 mb-3">{otp.label}</div>

            {otp.step === "email" ? (
              <>
                <p className="text-[11px] text-slate-400 mb-2">
                  Enter your <span className="text-slate-200 font-medium">@{OTP_EMAIL_DOMAIN}</span> email — we'll send a 6-digit code.
                </p>
                <input
                  type="email"
                  autoFocus
                  value={otp.email}
                  onChange={(e) => setOtpFlow((s) => (s ? { ...s, email: e.target.value, error: undefined } : s))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitEmail(); }}
                  placeholder={`you@${OTP_EMAIL_DOMAIN}`}
                  className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded border border-slate-700 outline-none mb-3"
                />
                <button disabled={otp.submitting} onClick={submitEmail}
                  className="w-full text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                  {otp.submitting ? "Sending…" : "Send code"}
                </button>
              </>
            ) : (
              <>
                <p className="text-[11px] text-slate-400 mb-2">
                  Enter the code sent to <span className="text-slate-200 font-medium">{otp.sentTo ?? otp.email}</span>.
                </p>
                <input
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter" && otpInput.length === 6 && otp.sessionId) verifyOtp(otp.sessionId, otpInput); }}
                  placeholder="123456"
                  className="w-full bg-slate-800 text-white text-lg tracking-[0.4em] text-center px-3 py-2 rounded border border-slate-700 outline-none mb-3"
                />
                <button disabled={otp.submitting || otpInput.length !== 6 || !otp.sessionId} onClick={() => otp.sessionId && verifyOtp(otp.sessionId, otpInput)}
                  className="w-full text-sm px-3 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">
                  {otp.submitting ? "Verifying…" : "Confirm change"}
                </button>
                <button disabled={otp.submitting} onClick={() => requestOtp(otp.op, otp.email)}
                  className="w-full text-[11px] text-slate-400 hover:text-slate-200 mt-2 disabled:opacity-50">
                  Resend code
                </button>
              </>
            )}

            {otp.error && <div className="text-[11px] text-red-400 mt-2">{otp.error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
