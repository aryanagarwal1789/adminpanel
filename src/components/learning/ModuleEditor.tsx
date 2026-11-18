import { useEffect, useRef, useState } from "react";
import { UploadInput } from "@/routes/admin/upload-input";
import { useLearning } from "@/lib/learning/LearningProvider";
import {
  addLesson,
  removeLesson,
  removeModule,
  reorderLessons,
  updateLesson,
  updateModule,
} from "@/lib/learning/draft";
import { newLessonId } from "@/lib/learning/ids";
import { fetchYouTubeDuration, youTubeIdFrom } from "@/lib/learning/youtube";
import type { LearningLesson, LearningModule } from "@/lib/learning/types";
import { useDragReorder } from "./useDragReorder";
import { lessonDomId, lessonKey, moduleDomId, moduleKey } from "./keys";
import { dangerBtn, inp, lbl, secBtn, textareaStyle } from "./styles";

const Grip = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="8" cy="2" r="1.5" fill="currentColor" />
    <circle cx="2" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="2" cy="14" r="1.5" fill="currentColor" />
    <circle cx="8" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

/** Fills a blank Duration 500 ms after a YouTube link is typed or pasted. */
function useAutoDuration(
  videoUrl: string,
  duration: string,
  onDetected: (duration: string) => void,
) {
  const cb = useRef(onDetected);
  cb.current = onDetected;
  const hasDuration = !!duration.trim();
  useEffect(() => {
    if (hasDuration) return;
    const id = youTubeIdFrom(videoUrl);
    if (!id) return;
    let live = true;
    const t = setTimeout(async () => {
      const d = await fetchYouTubeDuration(id);
      if (live && d) cb.current(d);
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [videoUrl, hasDuration]);
}

function LessonFields({
  courseId,
  moduleId,
  lesson: l,
}: {
  courseId: string;
  moduleId: string;
  lesson: LearningLesson;
}) {
  const { edit } = useLearning();
  const patch = (p: Partial<LearningLesson>) =>
    edit((d) => updateLesson(d, courseId, moduleId, l.id, p));
  const [detecting, setDetecting] = useState(false);
  useAutoDuration(l.videoUrl, l.duration, (duration) => patch({ duration }));

  const detectNow = async () => {
    const id = youTubeIdFrom(l.videoUrl);
    if (!id) return;
    setDetecting(true);
    const duration = await fetchYouTubeDuration(id);
    setDetecting(false);
    if (duration) patch({ duration });
  };

  return (
    <div style={{ padding: "0 12px 12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
        <div>
          <label style={lbl}>Title</label>
          <input
            style={inp}
            value={l.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="e.g. Getting started with SFA"
          />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <label style={lbl}>Duration</label>
            {youTubeIdFrom(l.videoUrl) && (
              <button
                type="button"
                onClick={detectNow}
                disabled={detecting}
                style={{
                  background: "none",
                  border: "none",
                  color: detecting ? "#475569" : "#3b82f6",
                  cursor: detecting ? "default" : "pointer",
                  fontSize: 11,
                  padding: 0,
                  marginBottom: 6,
                }}
                title="Fetch duration from YouTube"
              >
                {detecting ? "Detecting…" : "↻ Detect"}
              </button>
            )}
          </div>
          <input
            style={inp}
            value={l.duration}
            onChange={(e) => patch({ duration: e.target.value })}
            placeholder="21:52"
          />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={lbl}>Description</label>
        <textarea
          style={textareaStyle}
          value={l.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={lbl}>
          Video URL (paste a YouTube link, or upload a direct .mp4 / HLS file; YouTube links
          auto-fill Duration)
        </label>
        <UploadInput
          value={l.videoUrl}
          onChange={(videoUrl) => patch({ videoUrl })}
          accept="video/*"
          preview={false}
          allowPaste
          placeholder="youtube.com/watch?v=… or youtu.be/… — or upload a file"
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={lbl}>
          Thumbnail (optional — shown in the playlist and as the video poster)
        </label>
        <UploadInput
          value={l.thumbnail}
          onChange={(thumbnail) => patch({ thumbnail })}
          accept="image/*"
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={lbl}>Screenshots (optional)</label>
        {(l.screenshots ?? []).map((src, si) => (
          <div
            key={si}
            style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}
          >
            <div style={{ flex: 1 }}>
              <UploadInput
                value={src}
                onChange={(url) =>
                  patch({ screenshots: (l.screenshots ?? []).map((s, k) => (k === si ? url : s)) })
                }
                accept="image/*"
              />
            </div>
            <button
              style={dangerBtn}
              onClick={() =>
                patch({ screenshots: (l.screenshots ?? []).filter((_, k) => k !== si) })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          style={secBtn}
          onClick={() => patch({ screenshots: [...(l.screenshots ?? []), ""] })}
        >
          + Add screenshot
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={lbl}>Workflow steps (role + text)</label>
        {(l.workflow ?? []).map((step, wi) => (
          <div
            key={wi}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr auto",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <input
              style={inp}
              value={step.role}
              placeholder="Role"
              onChange={(e) =>
                patch({
                  workflow: (l.workflow ?? []).map((w, k) =>
                    k === wi ? { ...w, role: e.target.value } : w,
                  ),
                })
              }
            />
            <input
              style={inp}
              value={step.text}
              placeholder="Step"
              onChange={(e) =>
                patch({
                  workflow: (l.workflow ?? []).map((w, k) =>
                    k === wi ? { ...w, text: e.target.value } : w,
                  ),
                })
              }
            />
            <button
              style={dangerBtn}
              onClick={() => patch({ workflow: (l.workflow ?? []).filter((_, k) => k !== wi) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          style={secBtn}
          onClick={() => patch({ workflow: [...(l.workflow ?? []), { role: "", text: "" }] })}
        >
          + Add step
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!l.builtForCoke}
            onChange={(e) => patch({ builtForCoke: e.target.checked })}
          />
          Built for Coke (shown only on the Coke platform portal)
        </label>
      </div>
    </div>
  );
}

/** One module: header row (drag, expand, title, delete) and, when open, its fields and lessons. */
export function ModuleRow({
  courseId,
  module: m,
  index,
  open,
  openKeys,
  toggle,
  dragProps,
  dragOver,
}: {
  courseId: string;
  module: LearningModule;
  index: number;
  open: boolean;
  openKeys: Set<string>;
  toggle: (key: string, force?: boolean) => void;
  dragProps: ReturnType<ReturnType<typeof useDragReorder>["dragProps"]>;
  dragOver: boolean;
}) {
  const { edit } = useLearning();
  const lessonDrag = useDragReorder((from, to) =>
    edit((d) => reorderLessons(d, courseId, m.moduleId, from, to)),
  );

  const add = () => {
    const lesson: LearningLesson = {
      id: newLessonId(),
      title: "",
      description: "",
      duration: "",
      videoUrl: "",
      thumbnail: "",
      order: m.lessons.length,
    };
    edit((d) => addLesson(d, courseId, m.moduleId, lesson));
    toggle(lessonKey(m.moduleId, lesson.id), true);
  };

  return (
    <div
      id={moduleDomId(m.moduleId)}
      style={{
        background: "#0f172a",
        borderRadius: 6,
        marginBottom: 10,
        border: `1px solid ${dragOver ? "#3b82f6" : "#334155"}`,
        boxShadow: dragOver ? "0 0 0 2px rgba(59,130,246,0.3)" : "none",
      }}
    >
      <div
        {...dragProps}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}
      >
        <span style={{ cursor: "grab", color: "#64748b", display: "flex" }} title="Drag to reorder">
          <Grip />
        </span>
        <button
          onClick={() => toggle(moduleKey(m.moduleId))}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 12,
            padding: 0,
          }}
        >
          {open ? "▼" : "▶"}
        </button>
        <span style={{ color: "#475569", fontSize: 12, width: 20 }}>{index + 1}</span>
        <input
          style={{ ...inp, flex: 1 }}
          value={m.title}
          placeholder="Module title"
          draggable={false}
          onChange={(e) =>
            edit((d) => updateModule(d, courseId, m.moduleId, { title: e.target.value }))
          }
        />
        <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
          {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}
        </span>
        <button
          style={dangerBtn}
          onClick={() => {
            if (
              m.lessons.length === 0 ||
              window.confirm(
                `Delete module "${m.title || m.moduleId}" and its ${m.lessons.length} lesson(s)?`,
              )
            )
              edit((d) => removeModule(d, courseId, m.moduleId));
          }}
        >
          Delete
        </button>
      </div>

      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <label style={lbl}>Module description (optional)</label>
          <textarea
            style={textareaStyle}
            value={m.description ?? ""}
            rows={2}
            onChange={(e) =>
              edit((d) => updateModule(d, courseId, m.moduleId, { description: e.target.value }))
            }
          />
          <div style={{ color: "#64748b", fontSize: 11, margin: "4px 0 12px" }}>
            Module id: {m.moduleId}
          </div>

          {m.lessons.length === 0 && (
            <div style={{ color: "#64748b", fontSize: 13, padding: "4px 0 10px" }}>
              No lessons yet. A module needs at least one to publish.
            </div>
          )}

          {m.lessons.map((l, li) => {
            const isOpen = openKeys.has(lessonKey(m.moduleId, l.id));
            return (
              <div
                key={l.id}
                id={lessonDomId(m.moduleId, l.id)}
                {...lessonDrag.dragProps(li)}
                style={{
                  background: "#111c33",
                  borderRadius: 6,
                  marginBottom: 8,
                  border: `1px solid ${lessonDrag.dragOver === li ? "#3b82f6" : "#334155"}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}
                >
                  <span
                    style={{ cursor: "grab", color: "#64748b", display: "flex" }}
                    title="Drag to reorder"
                  >
                    <Grip />
                  </span>
                  <button
                    onClick={() => toggle(lessonKey(m.moduleId, l.id))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: 0,
                    }}
                  >
                    {isOpen ? "▼" : "▶"}
                  </button>
                  <span style={{ color: "#475569", fontSize: 12, width: 20 }}>{li + 1}</span>
                  <span style={{ flex: 1, color: "#f1f5f9", fontSize: 13 }}>
                    {l.title || <span style={{ color: "#475569" }}>Untitled lesson</span>}
                  </span>
                  {l.builtForCoke && <span style={{ color: "#f87171", fontSize: 11 }}>Coke</span>}
                  {l.duration && (
                    <span style={{ color: "#64748b", fontSize: 12 }}>{l.duration}</span>
                  )}
                  <button
                    style={dangerBtn}
                    onClick={() => edit((d) => removeLesson(d, courseId, m.moduleId, l.id))}
                  >
                    Remove
                  </button>
                </div>
                {isOpen && <LessonFields courseId={courseId} moduleId={m.moduleId} lesson={l} />}
              </div>
            );
          })}
          <button style={secBtn} onClick={add}>
            + Add lesson
          </button>
        </div>
      )}
    </div>
  );
}
