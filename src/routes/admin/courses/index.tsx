import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePublishOtp, PublishOtpModal } from "@/lib/otpPublish";
import { LastUpdatedBy } from "@/lib/lastUpdated";
import { BACKEND_OUTDATED_MESSAGE, useLearning } from "@/lib/learning/LearningProvider";
import {
  addCourse,
  removeCourse,
  reorderCourses,
  setHideFeatureInfo,
  updateCourse,
} from "@/lib/learning/draft";
import { toId } from "@/lib/learning/ids";
import { CATEGORIES } from "@/lib/learning/categories";
import { blankCourse, courseIdProblem, newCourseId } from "@/lib/learning/store";
import { PublishBar } from "@/components/learning/PublishBar";
import { useDragReorder } from "@/components/learning/useDragReorder";
import {
  dangerBtn,
  inp,
  lbl,
  saveBtn,
  secBtn,
  selectStyle,
  textareaStyle,
} from "@/components/learning/styles";

export const Route = createFileRoute("/admin/courses/")({ component: CoursesPage });

type Toast = { type: "success" | "error"; message: string } | null;

const BLANK_NEW = {
  title: "",
  courseId: "",
  /** Admin typed in the ID field: stop following the title. */
  idEdited: false,
  category: "sales",
  productId: "",
  description: "",
  enabled: true,
};

function CoursesPage() {
  const L = useLearning();
  const navigate = useNavigate();
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ ...BLANK_NEW });

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  // Heading/subheading are not part of the course draft: they keep their own
  // OTP-gated save.
  const otp = usePublishOtp((_body: unknown, action: string) => {
    if (action === "learning.settings") {
      L.applySettings(heading, subheading);
      showToast({ type: "success", message: "Portal copy saved" });
    }
  });

  const baseHeading = L.base?.heading;
  const baseSubheading = L.base?.subheading;
  useEffect(() => {
    if (baseHeading === undefined) return;
    setHeading(baseHeading);
    setSubheading(baseSubheading ?? "");
  }, [baseHeading, baseSubheading]);

  const courses = L.draft?.courses ?? [];
  const { dragOver, dragProps } = useDragReorder((from, to) =>
    L.edit((d) => reorderCourses(d, from, to)),
  );

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!L.draft || !newCourse.title.trim()) return;
    if (courseIdProblem(L.draft, newCourse.courseId)) return;
    const course = blankCourse(L.draft, newCourse);
    L.edit((d) => addCourse(d, course));
    setShowAddModal(false);
    setNewCourse({ ...BLANK_NEW });
    void navigate({ to: "/admin/courses/$courseId", params: { courseId: course.courseId } });
  };

  const handleDelete = (courseId: string, title: string) => {
    if (!window.confirm(`Delete course "${title || courseId}" and everything in it?`)) return;
    L.edit((d) => removeCourse(d, courseId));
  };

  const idProblem =
    L.draft && newCourse.courseId ? courseIdProblem(L.draft, newCourse.courseId) : null;
  const onTitleChange = (title: string) =>
    setNewCourse((p) => ({
      ...p,
      title,
      courseId: p.idEdited
        ? p.courseId
        : L.draft && title.trim()
          ? newCourseId(L.draft, title)
          : "",
    }));

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 999,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toast.message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0 }}>
            Learning Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>
            Courses shown in the SFA app's Learning section. Changes are kept as a draft until you
            Publish. Drag to reorder; click Edit to manage modules and lessons.
          </p>
        </div>
        <button
          style={saveBtn}
          disabled={!L.draft}
          onClick={() => {
            setNewCourse({ ...BLANK_NEW });
            setShowAddModal(true);
          }}
        >
          + Add Course
        </button>
      </div>

      {/* Portal copy */}
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Hero heading</label>
          <input
            style={inp}
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="What would you like to explore?"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Hero subheading</label>
          <textarea
            style={textareaStyle}
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            rows={2}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={!!L.draft?.hideFeatureInfo}
              disabled={!L.draft}
              onChange={(e) => L.edit((d) => setHideFeatureInfo(d, e.target.checked))}
            />
            Hide feature info (ⓘ) buttons in all courses (saved with Publish)
          </label>
        </div>
        <button
          style={saveBtn}
          disabled={!L.base}
          onClick={() => otp.open("learning.settings", { heading, subheading })}
        >
          Save copy
        </button>
      </div>

      <PublishOtpModal otp={otp} title="Verify to save learning portal changes" />

      {L.loading ? (
        <div style={{ color: "#94a3b8", padding: 40, textAlign: "center" }}>Loading…</div>
      ) : L.backendOutdated ? (
        <div style={{ color: "#fbbf24", padding: 40, textAlign: "center" }}>
          {BACKEND_OUTDATED_MESSAGE}
        </div>
      ) : L.loadError ? (
        <div style={{ color: "#f87171", padding: 40, textAlign: "center" }}>
          Failed to load learning portal
        </div>
      ) : courses.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 14, padding: 32, textAlign: "center" }}>
          No courses yet. Click <strong style={{ color: "#f1f5f9" }}>+ Add Course</strong> to create
          one.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {courses.map((c, idx) => {
            const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
            return (
              <div
                key={c.courseId}
                {...dragProps(idx)}
                style={{
                  background: "#1e293b",
                  borderRadius: 8,
                  padding: 14,
                  border: `1px solid ${dragOver === idx ? "#3b82f6" : "#334155"}`,
                  opacity: c.enabled ? 1 : 0.55,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  cursor: "grab",
                  transition: "border-color 150ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: c.accent || "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {c.icon ? (
                      <img
                        src={c.icon}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                        {(c.title || c.courseId).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {c.eyebrow}
                    </div>
                    <div
                      style={{
                        color: "#f1f5f9",
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title || c.courseId}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#64748b" }}>
                  {c.category && (
                    <span
                      style={{ padding: "2px 8px", borderRadius: 12, border: "1px solid #334155" }}
                    >
                      {c.category}
                    </span>
                  )}
                  <span
                    style={{ padding: "2px 8px", borderRadius: 12, border: "1px solid #334155" }}
                  >
                    {c.modules.length} module{c.modules.length === 1 ? "" : "s"} · {lessonCount}{" "}
                    lesson{lessonCount === 1 ? "" : "s"}
                  </span>
                </div>
                <LastUpdatedBy by={c.lastUpdatedBy} at={c.lastUpdatedAt} />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      color: "#94a3b8",
                      fontSize: 12,
                      flex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={c.enabled}
                      onChange={() =>
                        L.edit((d) => updateCourse(d, c.courseId, { enabled: !c.enabled }))
                      }
                    />
                    Visible
                  </label>
                  <Link
                    to="/admin/courses/$courseId"
                    params={{ courseId: c.courseId }}
                    style={{ ...secBtn, textDecoration: "none", display: "inline-block" }}
                  >
                    Edit
                  </Link>
                  <button style={dangerBtn} onClick={() => handleDelete(c.courseId, c.title)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PublishBar />

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: 12,
              padding: "28px 32px",
              width: 480,
              maxWidth: "95vw",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
              Add New Course
            </h3>
            <form onSubmit={handleAddCourse}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  style={inp}
                  value={newCourse.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="e.g. SFA"
                  required
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Course ID <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  style={inp}
                  value={newCourse.courseId}
                  onChange={(e) =>
                    setNewCourse((p) => ({ ...p, courseId: toId(e.target.value), idEdited: true }))
                  }
                  placeholder="made from the title"
                  required
                />
                <span
                  style={{
                    fontSize: 11,
                    color: idProblem ? "#f87171" : "#64748b",
                    marginTop: 3,
                    display: "block",
                  }}
                >
                  {idProblem ?? "Used in the course URL; cannot be changed later."}
                </span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Category</label>
                <select
                  style={selectStyle}
                  value={newCourse.category}
                  onChange={(e) => setNewCourse((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Product (optional)</label>
                <select
                  style={selectStyle}
                  value={newCourse.productId}
                  onChange={(e) => setNewCourse((p) => ({ ...p, productId: e.target.value }))}
                >
                  <option value="">None</option>
                  {L.products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Description</label>
                <textarea
                  style={textareaStyle}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ ...lbl, margin: 0 }}>Visible</label>
                <input
                  type="checkbox"
                  checked={newCourse.enabled}
                  onChange={(e) => setNewCourse((p) => ({ ...p, enabled: e.target.checked }))}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={!!idProblem || !newCourse.courseId}
                  style={{ ...saveBtn, flex: 1 }}
                >
                  Create Course
                </button>
                <button type="button" style={secBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
