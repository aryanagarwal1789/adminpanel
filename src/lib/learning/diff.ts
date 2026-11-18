import type { Learning, LearningCourse, LearningLesson, LearningModule, Locator } from "./types";

export interface ChangeItem {
  kind: "added" | "edited" | "removed" | "reordered";
  entity: "course" | "module" | "lesson";
  label: string;
  locator: Locator;
}

const COURSE_SKIP = new Set(["modules", "order", "lastUpdatedBy", "lastUpdatedAt"]);
const MODULE_SKIP = new Set(["lessons"]);
const LESSON_SKIP = new Set(["order"]);

function changedFields(a: object, b: object, skip: Set<string>): string[] {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(y), ...Object.keys(x)])].filter((k) => !skip.has(k));
  return keys.filter((k) => JSON.stringify(x[k] ?? null) !== JSON.stringify(y[k] ?? null));
}

// Ids present in both lists, in each list's order: differ => reordered.
function reordered(before: string[], after: string[]): boolean {
  const inAfter = new Set(after);
  const inBefore = new Set(before);
  const a = before.filter((id) => inAfter.has(id));
  const b = after.filter((id) => inBefore.has(id));
  return a.some((id, i) => id !== b[i]);
}

const byId = <T>(list: T[], key: (t: T) => string) => new Map(list.map((t) => [key(t), t]));
const name = (title: string, id: string) => `"${title || id}"`;

export function summarize(base: Learning, draft: Learning): ChangeItem[] {
  const out: ChangeItem[] = [];
  const baseCourses = byId(base.courses, (c) => c.courseId);
  const draftCourses = byId(draft.courses, (c) => c.courseId);

  for (const c of draft.courses) {
    if (!baseCourses.has(c.courseId))
      out.push({
        kind: "added",
        entity: "course",
        label: `Added course ${name(c.title, c.courseId)}`,
        locator: { courseId: c.courseId },
      });
  }
  for (const c of base.courses) {
    if (!draftCourses.has(c.courseId))
      out.push({
        kind: "removed",
        entity: "course",
        label: `Removed course ${name(c.title, c.courseId)}`,
        locator: { courseId: c.courseId },
      });
  }
  if (
    reordered(
      base.courses.map((c) => c.courseId),
      draft.courses.map((c) => c.courseId),
    )
  )
    out.push({
      kind: "reordered",
      entity: "course",
      label: "Reordered courses",
      locator: {
        courseId: firstMoved(
          base.courses.map((c) => c.courseId),
          draft.courses.map((c) => c.courseId),
        ),
      },
    });

  for (const c of draft.courses) {
    const b = baseCourses.get(c.courseId);
    if (b) diffCourse(b, c, out);
  }
  return out;
}

function firstMoved(before: string[], after: string[]): string {
  const inAfter = new Set(after);
  const inBefore = new Set(before);
  const a = before.filter((id) => inAfter.has(id));
  const b = after.filter((id) => inBefore.has(id));
  return a.find((id, i) => id !== b[i]) ?? a[0];
}

function diffCourse(b: LearningCourse, c: LearningCourse, out: ChangeItem[]) {
  const cid = c.courseId;
  const cf = changedFields(b, c, COURSE_SKIP);
  if (cf.length)
    out.push({
      kind: "edited",
      entity: "course",
      label: `Edited course ${name(c.title, cid)} (${cf.join(", ")})`,
      locator: { courseId: cid },
    });

  const bm = byId(b.modules, (m) => m.moduleId);
  const dm = byId(c.modules, (m) => m.moduleId);
  for (const m of c.modules)
    if (!bm.has(m.moduleId))
      out.push({
        kind: "added",
        entity: "module",
        label: `Added module ${name(m.title, m.moduleId)} in ${name(c.title, cid)}`,
        locator: { courseId: cid, moduleId: m.moduleId },
      });
  for (const m of b.modules)
    if (!dm.has(m.moduleId))
      out.push({
        kind: "removed",
        entity: "module",
        label: `Removed module ${name(m.title, m.moduleId)} from ${name(c.title, cid)}`,
        locator: { courseId: cid, moduleId: m.moduleId },
      });
  const bIds = b.modules.map((m) => m.moduleId);
  const dIds = c.modules.map((m) => m.moduleId);
  if (reordered(bIds, dIds))
    out.push({
      kind: "reordered",
      entity: "module",
      label: `Reordered modules in ${name(c.title, cid)}`,
      locator: { courseId: cid },
    });

  for (const m of c.modules) {
    const bmod = bm.get(m.moduleId);
    if (bmod) diffModule(cid, c, bmod, m, out);
  }
}

function diffModule(
  cid: string,
  c: LearningCourse,
  b: LearningModule,
  m: LearningModule,
  out: ChangeItem[],
) {
  const mid = m.moduleId;
  const mf = changedFields(b, m, MODULE_SKIP);
  if (mf.length)
    out.push({
      kind: "edited",
      entity: "module",
      label: `Edited module ${name(m.title, mid)} in ${name(c.title, cid)} (${mf.join(", ")})`,
      locator: { courseId: cid, moduleId: mid },
    });

  const bl = byId(b.lessons, (l) => l.id);
  const dl = byId(m.lessons, (l) => l.id);
  for (const l of m.lessons)
    if (!bl.has(l.id))
      out.push({
        kind: "added",
        entity: "lesson",
        label: `Added lesson ${name(l.title, l.id)} in ${name(m.title, mid)}`,
        locator: { courseId: cid, moduleId: mid, lessonId: l.id },
      });
  for (const l of b.lessons)
    if (!dl.has(l.id))
      out.push({
        kind: "removed",
        entity: "lesson",
        label: `Removed lesson ${name(l.title, l.id)} from ${name(m.title, mid)}`,
        locator: { courseId: cid, moduleId: mid, lessonId: l.id },
      });
  if (
    reordered(
      b.lessons.map((l) => l.id),
      m.lessons.map((l) => l.id),
    )
  )
    out.push({
      kind: "reordered",
      entity: "lesson",
      label: `Reordered lessons in ${name(m.title, mid)}`,
      locator: { courseId: cid, moduleId: mid },
    });

  for (const l of m.lessons) {
    const bless: LearningLesson | undefined = bl.get(l.id);
    if (!bless) continue;
    const lf = changedFields(bless, l, LESSON_SKIP);
    if (lf.length)
      out.push({
        kind: "edited",
        entity: "lesson",
        label: `Edited lesson ${name(l.title, l.id)} in ${name(m.title, mid)} (${lf.join(", ")})`,
        locator: { courseId: cid, moduleId: mid, lessonId: l.id },
      });
  }
}
