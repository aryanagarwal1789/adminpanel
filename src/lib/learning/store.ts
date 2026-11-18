import { fromServer, type Draft } from "./draft";
import { toId, uniqueId } from "./ids";
import type { Learning, LearningCourse } from "./types";

const STORAGE_KEY = "learning-draft:v2";

/** What is persisted: the draft and the server revision it was started from. */
export interface StoredDraft {
  baseRevision: number;
  draft: Draft;
}

export interface DraftState {
  draft: Draft;
  /** Server revision the draft was started from; sent as baseRevision on publish. */
  draftBase: number;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadStoredDraft(
  storage: StorageLike | null = defaultStorage(),
): StoredDraft | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (
      typeof parsed.baseRevision !== "number" ||
      !parsed.draft ||
      !Array.isArray(parsed.draft.courses)
    )
      return null;
    return { baseRevision: parsed.baseRevision, draft: parsed.draft };
  } catch {
    return null;
  }
}

export function saveStoredDraft(
  state: DraftState,
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    const value: StoredDraft = { baseRevision: state.draftBase, draft: state.draft };
    storage?.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage full or blocked: the draft still lives in memory
  }
}

export function clearStoredDraft(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Initial draft for a freshly loaded base. A stored draft is restored whatever
 * its revision: when it differs from the base's, the draft is "stale" (see
 * isStale) and the user must rebase it before publishing.
 */
export function resolveDraft(base: Learning, stored: StoredDraft | null): DraftState {
  if (stored) return { draft: stored.draft, draftBase: stored.baseRevision };
  return { draft: fromServer(base), draftBase: base.revision };
}

export const isStale = (base: Learning, state: DraftState): boolean =>
  state.draftBase !== base.revision;

/** Keep the user's edits, adopt the server's current revision as their base. */
export const rebaseDraft = (base: Learning, state: DraftState): DraftState => ({
  draft: state.draft,
  draftBase: base.revision,
});

/** Body of the `learning.publish` OTP action. Heading/subheading are not part of it. */
export function buildPublishPayload(state: DraftState): {
  baseRevision: number;
  courses: LearningCourse[];
} {
  return {
    baseRevision: state.draftBase,
    courses: JSON.parse(JSON.stringify(state.draft.courses)) as LearningCourse[],
  };
}

/** Every course id and module id in the tree (they share one URL namespace). */
export function allIds(d: Learning): string[] {
  return d.courses.flatMap((c) => [c.courseId, ...c.modules.map((m) => m.moduleId)]);
}

export const newCourseId = (d: Learning, title: string): string =>
  uniqueId(toId(title) || "course", allIds(d));

export const newModuleId = (d: Learning, title: string): string =>
  uniqueId(toId(title) || "module", allIds(d));

/** Why `id` cannot be a new course's id, or null. Course and module ids share one namespace. */
export function courseIdProblem(d: Learning, id: string): string | null {
  const n = toId(id);
  if (!n) return "Course ID is required.";
  if (allIds(d).includes(n)) return `"${n}" is already used by a course or module.`;
  return null;
}

/**
 * True when a GET /site/learning?v=2 body carries a numeric revision. An
 * un-upgraded backend ignores ?v=2 and returns the legacy shape without one.
 */
export function hasServerRevision(body: unknown): boolean {
  const l = (body as { learning?: { revision?: unknown } } | null)?.learning;
  return typeof l?.revision === "number";
}

export function blankCourse(
  d: Learning,
  fields: {
    /** Admin-chosen id; defaults to one derived from the title. */
    courseId?: string;
    title: string;
    category: string;
    description: string;
    enabled: boolean;
    productId?: string;
  },
): LearningCourse {
  const title = fields.title.trim();
  const course: LearningCourse = {
    courseId: (fields.courseId && toId(fields.courseId)) || newCourseId(d, title),
    eyebrow: "AI Native",
    title,
    description: fields.description,
    category: fields.category,
    accent: "rgba(0,163,146,1)",
    icon: "",
    image: "",
    order: d.courses.length,
    enabled: fields.enabled,
    modules: [],
  };
  if (fields.productId) course.productId = fields.productId;
  return course;
}
