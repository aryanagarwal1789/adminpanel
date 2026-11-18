import type { Learning, Locator } from "./types";

export interface Problem {
  locator: Locator;
  message: string;
}

const blank = (s: string | undefined | null) => !s || !s.trim();

export function validate(base: Learning, draft: Learning): Problem[] {
  const problems: Problem[] = [];
  const add = (locator: Locator, message: string) => problems.push({ locator, message });

  const baseCourses = new Map(base.courses.map((c) => [c.courseId, c]));
  // moduleIds are globally unique, so a module's base lesson count is looked up
  // across all courses.
  const baseModules = new Map(
    base.courses.flatMap((c) => c.modules.map((m) => [m.moduleId, m] as const)),
  );
  const courseIds = new Set(draft.courses.map((c) => c.courseId));
  const seenCourses = new Set<string>();
  const seenModules = new Set<string>();

  for (const c of draft.courses) {
    const cid = c.courseId;
    if (blank(cid)) add({ courseId: cid, field: "courseId" }, "Course id is required.");
    else if (seenCourses.has(cid))
      add({ courseId: cid, field: "courseId" }, `Course id "${cid}" must be unique.`);
    seenCourses.add(cid);
    if (blank(c.title)) add({ courseId: cid, field: "title" }, `Course "${cid}" needs a title.`);

    if (c.modules.length === 0) {
      const existing = baseCourses.get(cid);
      if (!existing)
        add({ courseId: cid }, `New course "${c.title || cid}" needs at least one module.`);
      else if (existing.modules.length > 0)
        add({ courseId: cid }, `Course "${c.title || cid}" needs at least one module.`);
    }

    for (const m of c.modules) {
      const mid = m.moduleId;
      if (seenModules.has(mid))
        add(
          { courseId: cid, moduleId: mid, field: "moduleId" },
          `Module id "${mid}" must be unique across all courses.`,
        );
      seenModules.add(mid);
      if (courseIds.has(mid))
        add(
          { courseId: cid, moduleId: mid, field: "moduleId" },
          `Module id "${mid}" must not equal a course id.`,
        );
      if (blank(m.title))
        add({ courseId: cid, moduleId: mid, field: "title" }, `Module "${mid}" needs a title.`);
      const existed = baseModules.get(mid);
      const mayBeEmpty = existed !== undefined && existed.lessons.length === 0;
      if (m.lessons.length === 0 && !mayBeEmpty)
        add(
          { courseId: cid, moduleId: mid },
          `Module "${m.title || mid}" needs at least one lesson.`,
        );

      const seenLessons = new Set<string>();
      for (const l of m.lessons) {
        if (seenLessons.has(l.id))
          add(
            { courseId: cid, moduleId: mid, lessonId: l.id, field: "id" },
            `Lesson id "${l.id}" must be unique within its module.`,
          );
        seenLessons.add(l.id);
        if (blank(l.title))
          add(
            { courseId: cid, moduleId: mid, lessonId: l.id, field: "title" },
            `Lesson "${l.id}" needs a title.`,
          );
      }
    }
  }
  return problems;
}
