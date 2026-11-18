import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadInput } from "./upload-input";
import { LastUpdatedBy } from "@/lib/lastUpdated";
import { BACKEND_OUTDATED_MESSAGE, useLearning } from "@/lib/learning/LearningProvider";
import { addModule, reorderModules, updateCourse } from "@/lib/learning/draft";
import { CATEGORIES } from "@/lib/learning/categories";
import { newModuleId } from "@/lib/learning/store";
import type { LearningCourse } from "@/lib/learning/types";
import { PublishBar } from "@/components/learning/PublishBar";
import { ModuleRow } from "@/components/learning/ModuleEditor";
import { lessonDomId, lessonKey, moduleDomId, moduleKey } from "@/components/learning/keys";
import { useDragReorder } from "@/components/learning/useDragReorder";
import {
  card,
  cardTitle,
  inp,
  lbl,
  saveBtn,
  selectStyle,
  textareaStyle,
} from "@/components/learning/styles";

export const Route = createFileRoute("/admin/courses/$courseId")({ component: CourseDetailPage });

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const L = useLearning();
  const course = L.draft?.courses.find((c) => c.courseId === courseId);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const toggle = (key: string, force?: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      const want = force ?? !next.has(key);
      if (want) next.add(key);
      else next.delete(key);
      return next;
    });

  const { dragOver, dragProps } = useDragReorder((from, to) =>
    L.edit((d) => reorderModules(d, courseId, from, to)),
  );

  // Publish-bar problem links: open the module/lesson and scroll to it.
  const focus = L.focus;
  const hasCourse = !!course;
  useEffect(() => {
    if (!focus || focus.locator.courseId !== courseId || !hasCourse) return;
    const { moduleId, lessonId } = focus.locator;
    if (moduleId) toggle(moduleKey(moduleId), true);
    if (moduleId && lessonId) toggle(lessonKey(moduleId, lessonId), true);
    const domId = moduleId
      ? lessonId
        ? lessonDomId(moduleId, lessonId)
        : moduleDomId(moduleId)
      : focus.locator.field
        ? "lp-details"
        : "lp-modules";
    const t = setTimeout(
      () => document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only on a new focus request (nonce) or course change; `toggle` is recreated each render
  }, [focus?.nonce, courseId, hasCourse]);

  if (L.loading)
    return <div style={{ color: "#94a3b8", padding: 40, textAlign: "center" }}>Loading…</div>;
  if (L.backendOutdated)
    return (
      <div style={{ color: "#fbbf24", padding: 40, textAlign: "center" }}>
        {BACKEND_OUTDATED_MESSAGE}
      </div>
    );
  if (!L.draft || !course)
    return (
      <div style={{ color: "#94a3b8", padding: 40, textAlign: "center" }}>
        Course not found.{" "}
        <Link to="/admin/courses" style={{ color: "#3b82f6" }}>
          Back to all courses
        </Link>
        <PublishBar />
      </div>
    );

  const ud = (patch: Partial<LearningCourse>) => L.edit((d) => updateCourse(d, courseId, patch));

  const addNewModule = () => {
    const title = newModuleTitle.trim();
    if (!title || !L.draft) return;
    const moduleId = newModuleId(L.draft, title);
    L.edit((d) => addModule(d, courseId, { moduleId, title, lessons: [] }));
    toggle(moduleKey(moduleId), true);
    setNewModuleTitle("");
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 4 }}>
          <Link
            to="/admin/courses"
            style={{ color: "#94a3b8", fontSize: 13, textDecoration: "none" }}
          >
            ← All Courses
          </Link>
        </div>
        <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0 }}>
          {course.title || course.courseId}
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>
          Edit course details, its modules and their lessons. Nothing is saved until you Publish.
        </p>
        <div style={{ marginTop: 4 }}>
          <LastUpdatedBy by={course.lastUpdatedBy} at={course.lastUpdatedAt} />
        </div>
      </div>

      {/* Course details */}
      <div id="lp-details" style={card}>
        <div style={cardTitle}>Course Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={lbl}>Eyebrow</label>
            <input
              style={inp}
              value={course.eyebrow}
              onChange={(e) => ud({ eyebrow: e.target.value })}
              placeholder="e.g. AI Native"
            />
          </div>
          <div>
            <label style={lbl}>Title</label>
            <input
              style={inp}
              value={course.title}
              onChange={(e) => ud({ title: e.target.value })}
              placeholder="e.g. SFA"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <label style={lbl}>Category</label>
            <select
              style={selectStyle}
              value={course.category}
              onChange={(e) => ud({ category: e.target.value })}
            >
              {!CATEGORIES.some((c) => c.id === course.category) && (
                <option value={course.category}>{course.category || "(none)"}</option>
              )}
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
              The card accent color is derived from the category automatically.
            </span>
          </div>
          <div>
            <label style={lbl}>Product (optional)</label>
            <select
              style={selectStyle}
              value={course.productId ?? ""}
              onChange={(e) => ud({ productId: e.target.value })}
            >
              <option value="">None</option>
              {L.products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Description</label>
          <textarea
            style={textareaStyle}
            value={course.description}
            onChange={(e) => ud({ description: e.target.value })}
            placeholder="Shown on the course detail banner"
            rows={2}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <label style={lbl}>Icon image (optional)</label>
            <UploadInput value={course.icon} onChange={(icon) => ud({ icon })} accept="image/*" />
          </div>
          <div>
            <label style={lbl}>Card thumbnail (optional)</label>
            <UploadInput
              value={course.image}
              onChange={(image) => ud({ image })}
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Modules */}
      <div id="lp-modules" style={card}>
        <div style={cardTitle}>Modules</div>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 12px" }}>
          {course.modules.length} module{course.modules.length === 1 ? "" : "s"}. Each module holds
          the lessons shown under this course. Drag to reorder.
        </p>
        {course.modules.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13, padding: "0 0 12px" }}>
            No modules yet. Add one below, then add its lessons.
          </div>
        )}
        {course.modules.map((m, i) => (
          <ModuleRow
            key={m.moduleId}
            courseId={courseId}
            module={m}
            index={i}
            open={open.has(moduleKey(m.moduleId))}
            openKeys={open}
            toggle={toggle}
            dragProps={dragProps(i)}
            dragOver={dragOver === i}
          />
        ))}
        <form
          style={{ display: "flex", gap: 8, marginTop: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            addNewModule();
          }}
        >
          <input
            style={{ ...inp, flex: 1 }}
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title"
          />
          <button type="submit" style={saveBtn} disabled={!newModuleTitle.trim()}>
            + Add module
          </button>
        </form>
      </div>

      <PublishBar />
    </div>
  );
}
