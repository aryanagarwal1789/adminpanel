import { describe, expect, it } from "vitest";
import {
  allIds,
  blankCourse,
  buildPublishPayload,
  clearStoredDraft,
  isStale,
  loadStoredDraft,
  newModuleId,
  rebaseDraft,
  resolveDraft,
  saveStoredDraft,
} from "./store";
import { updateCourse } from "./draft";
import { course, learning, lesson, mod } from "./fixtures";

function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const base = () => learning([course("a", [mod("m1", [lesson("l1")])])]);

describe("stored draft", () => {
  it("round-trips the draft with its base revision", () => {
    const s = memoryStorage();
    const state = { draft: updateCourse(base(), "a", { title: "X" }), draftBase: 3 };
    saveStoredDraft(state, s);
    expect(loadStoredDraft(s)).toEqual({ baseRevision: 3, draft: state.draft });
    clearStoredDraft(s);
    expect(loadStoredDraft(s)).toBeNull();
  });

  it("ignores corrupt storage and survives throwing storage", () => {
    expect(loadStoredDraft(memoryStorage({ "learning-draft:v2": "{nope" }))).toBeNull();
    expect(
      loadStoredDraft(memoryStorage({ "learning-draft:v2": '{"baseRevision":"x"}' })),
    ).toBeNull();
    const boom = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadStoredDraft(boom)).toBeNull();
    expect(() => saveStoredDraft({ draft: base(), draftBase: 3 }, boom)).not.toThrow();
    expect(() => clearStoredDraft(boom)).not.toThrow();
    expect(loadStoredDraft(null)).toBeNull();
  });
});

describe("resolveDraft", () => {
  it("restores a stored draft whose revision matches the base", () => {
    const b = base();
    const edited = updateCourse(b, "a", { title: "Edited" });
    const state = resolveDraft(b, { baseRevision: 3, draft: edited });
    expect(state.draft.courses[0].title).toBe("Edited");
    expect(isStale(b, state)).toBe(false);
  });

  it("restores a draft from an older revision as stale, until rebased", () => {
    const b = base();
    const state = resolveDraft(b, { baseRevision: 2, draft: updateCourse(b, "a", { title: "E" }) });
    expect(isStale(b, state)).toBe(true);
    const rebased = rebaseDraft(b, state);
    expect(rebased.draftBase).toBe(3);
    expect(rebased.draft.courses[0].title).toBe("E");
    expect(isStale(b, rebased)).toBe(false);
  });

  it("starts from a clone of the base when nothing is stored", () => {
    const b = base();
    const state = resolveDraft(b, null);
    expect(state.draftBase).toBe(3);
    expect(state.draft).toEqual(b);
    expect(state.draft).not.toBe(b);
  });
});

describe("buildPublishPayload", () => {
  it("sends only baseRevision and a copy of the courses", () => {
    const state = { draft: base(), draftBase: 2 };
    const payload = buildPublishPayload(state);
    expect(Object.keys(payload).sort()).toEqual(["baseRevision", "courses"]);
    expect(payload.baseRevision).toBe(2);
    expect(payload.courses).toEqual(state.draft.courses);
    expect(payload.courses).not.toBe(state.draft.courses);
  });
});

describe("ids", () => {
  it("module and course ids are unique across every course and module", () => {
    const b = learning([course("a", [mod("intro", [])]), course("b", [mod("intro-2", [])])]);
    expect(allIds(b).sort()).toEqual(["a", "b", "intro", "intro-2"]);
    expect(newModuleId(b, "Intro")).toBe("intro-3");
    expect(newModuleId(b, "A")).toBe("a-2");
    expect(newModuleId(b, "!!!")).toBe("module");
  });

  it("blankCourse derives a unique id and starts with no modules", () => {
    const b = learning([course("sfa", [mod("sfa-2", [])])]);
    const c = blankCourse(b, {
      title: " SFA ",
      category: "sales",
      description: "d",
      enabled: true,
      productId: "",
    });
    expect(c.courseId).toBe("sfa-3");
    expect(c.title).toBe("SFA");
    expect(c.modules).toEqual([]);
    expect(c.order).toBe(1);
    expect("productId" in c).toBe(false);
    expect(
      blankCourse(b, {
        title: "x",
        category: "ir",
        description: "",
        enabled: false,
        productId: "p",
      }).productId,
    ).toBe("p");
  });
});
