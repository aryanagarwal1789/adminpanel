import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublishOtpModal, usePublishOtp } from "@/lib/otpPublish";
import { useLearning } from "@/lib/learning/LearningProvider";
import { classifyPublishFailure, NOT_MIGRATED_MESSAGE } from "@/lib/learning/publishFailure";
import { buildPublishPayload } from "@/lib/learning/store";
import { publishBarState } from "@/lib/learning/publishBarState";
import type { Locator } from "@/lib/learning/types";
import { dangerBtn, secBtn } from "./styles";

/** Sticky bar shown while the draft differs from the server. */
export function PublishBar() {
  const L = useLearning();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [serverProblems, setServerProblems] = useState<string[]>([]);
  const [staleNotice, setStaleNotice] = useState(false);

  const otp = usePublishOtp(
    () => {
      setServerProblems([]);
      setStaleNotice(false);
      toast.success("Learning content published");
      void L.publishDone();
    },
    (status, body) => {
      const f = classifyPublishFailure(status, body);
      if (f.kind === "stale") {
        // Someone else published first. Reload the server copy; the draft is
        // kept, now based on the old revision, so the bar blocks publishing
        // until the user rebases it onto the new one.
        setStaleNotice(true);
        void L.reload();
        return true;
      }
      if (f.kind === "not-migrated") {
        // Nothing was written and the draft is untouched; not a stale draft.
        toast.error(NOT_MIGRATED_MESSAGE);
        return true;
      }
      if (f.kind === "problems") {
        setServerProblems(f.problems);
        setOpen(true);
        return true;
      }
      return false;
    },
  );

  const vis = publishBarState({
    hasDraft: !!L.draft,
    changeCount: L.changes.length,
    stale: L.stale,
    staleNotice,
  });
  const { clearNotice } = vis;
  useEffect(() => {
    if (clearNotice) setStaleNotice(false);
  }, [clearNotice]);

  if (!vis.showBar) return null;

  const goTo = (loc: Locator) => {
    L.requestFocus(loc);
    void navigate({ to: "/admin/courses/$courseId", params: { courseId: loc.courseId } });
  };

  const blocked = L.problems.length > 0 || L.stale;
  const n = L.changes.length;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 50,
        marginTop: 24,
        background: "#111827",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {vis.showNotice && (
        <div
          style={{
            background: "#422006",
            border: "1px solid #b45309",
            color: "#fde68a",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          Someone else published learning content after you started this draft
          {L.stale && L.base && L.draftState
            ? ` (your draft is based on revision ${L.draftState.draftBase}, the live copy is now ${L.base.revision})`
            : ""}
          . Your changes are kept. The list below is compared with the latest live copy; review it,
          then keep your changes on top of it. Publishing replaces any course, module or lesson that
          differs.{" "}
          {L.stale && (
            <button
              style={{ ...secBtn, color: "#fde68a", borderColor: "#b45309", padding: "2px 10px" }}
              onClick={() => {
                L.rebase();
                setStaleNotice(false);
              }}
            >
              Keep my changes on the latest version
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          style={{ ...secBtn, border: "none", color: "#f1f5f9", fontWeight: 600, padding: 0 }}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "▼" : "▲"} {n} change{n === 1 ? "" : "s"}
        </button>
        {L.problems.length > 0 && (
          <span style={{ color: "#f87171", fontSize: 13 }}>
            {L.problems.length} problem{L.problems.length === 1 ? "" : "s"} to fix before publishing
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button
          style={dangerBtn}
          onClick={() => {
            if (window.confirm("Discard all unpublished changes?")) {
              L.discard();
              setServerProblems([]);
              setStaleNotice(false);
            }
          }}
        >
          Discard
        </button>
        <button
          disabled={blocked || !L.draftState}
          title={
            L.stale
              ? "Keep your changes on the latest version first"
              : L.problems.length
                ? "Fix the problems first"
                : undefined
          }
          style={{
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 13,
            cursor: blocked ? "not-allowed" : "pointer",
            opacity: blocked ? 0.4 : 1,
          }}
          onClick={() => {
            if (!L.draftState) return;
            setServerProblems([]);
            otp.open("learning.publish", buildPublishPayload(L.draftState));
          }}
        >
          Publish
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, maxHeight: 240, overflowY: "auto", fontSize: 13 }}>
          {serverProblems.length > 0 && (
            <div style={{ color: "#f87171", marginBottom: 8 }}>
              The server refused the publish:
              {serverProblems.map((m, i) => (
                <div key={i}>• {m}</div>
              ))}
            </div>
          )}
          {L.problems.map((p, i) => (
            <div key={`p${i}`} style={{ marginBottom: 4 }}>
              <button
                onClick={() => goTo(p.locator)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                ⚠ {p.message}
              </button>
            </div>
          ))}
          {L.changes.map((c, i) => (
            <div key={`c${i}`} style={{ color: "#cbd5e1", marginBottom: 2 }}>
              <span style={{ color: "#64748b" }}>{c.kind}</span> {c.label}
            </div>
          ))}
        </div>
      )}

      <PublishOtpModal otp={otp} title="Verify to publish learning content" />
    </div>
  );
}
