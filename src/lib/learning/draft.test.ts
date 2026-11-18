import { describe, expect, it } from "vitest";
import {
  addCourse,
  addLesson,
  addModule,
  fromServer,
  removeCourse,
  removeLesson,
  removeModule,
  reorderCourses,
  reorderLessons,
  reorderModules,
  updateCourse,
  updateLesson,
  updateModule,
} from "./draft";
import { course, learning, lesson, mod } from "./fixtures";

const base = () =>
  learning([
    course("a", [mod("m1", [lesson("l1"), lesson("l2")]), mod("m2", [lesson("l3")])]),
    course("b", []),
    course("c", []),
  ]);

describe("fromServer", () => {
  it("deep-clones, defaults modules and sets order from index", () => {
    const src = base();
    (src.courses[1] as { modules?: unknown }).modules = undefined;
    const d = fromServer(src);
    expect(d).not.toBe(src);
    expect(d.courses[1].modules).toEqual([]);
    expect(d.courses.map((c) => c.order)).toEqual([0, 1, 2]);
    expect(d.courses[0].modules[0].lessons.map((l) => l.order)).toEqual([0, 1]);
    expect(d.courses[0].modules[0]).not.toBe(src.courses[0].modules[0]);
    expect(d.revision).toBe(3);
  });
});

describe("fromServer lesson order", () => {
  it("sorts lessons by order (stable) before renumbering to index", () => {
    const src = learning([
      course("a", [
        mod("m1", [
          lesson("x", { order: 2 }),
          lesson("y", { order: 0 }),
          lesson("z", { order: 1 }),
          lesson("t1", { order: 5 }),
          lesson("t2", { order: 5 }),
        ]),
      ]),
    ]);
    const lessons = fromServer(src).courses[0].modules[0].lessons;
    expect(lessons.map((l) => l.id)).toEqual(["y", "z", "x", "t1", "t2"]);
    expect(lessons.map((l) => l.order)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("course ops", () => {
  it("addCourse appends with order, immutably", () => {
    const d = base();
    const n = addCourse(d, course("z", []));
    expect(n.courses.map((c) => c.courseId)).toEqual(["a", "b", "c", "z"]);
    expect(n.courses[3].order).toBe(3);
    expect(d.courses).toHaveLength(3);
  });
  it("updateCourse patches only that course", () => {
    const d = base();
    const n = updateCourse(d, "b", { title: "New" });
    expect(n.courses[1].title).toBe("New");
    expect(n.courses[0]).toBe(d.courses[0]);
    expect(d.courses[1].title).toBe("Course b");
  });
  it("removeCourse drops and renumbers", () => {
    const n = removeCourse(base(), "a");
    expect(n.courses.map((c) => [c.courseId, c.order])).toEqual([
      ["b", 0],
      ["c", 1],
    ]);
  });
  it("reorderCourses moves from->to and renumbers", () => {
    const n = reorderCourses(base(), 0, 2);
    expect(n.courses.map((c) => c.courseId)).toEqual(["b", "c", "a"]);
    expect(n.courses.map((c) => c.order)).toEqual([0, 1, 2]);
  });
  it("unknown id is a no-op", () => {
    const d = base();
    expect(updateCourse(d, "nope", { title: "x" }).courses).toEqual(d.courses);
  });
});

describe("module ops", () => {
  it("addModule appends", () => {
    const n = addModule(base(), "b", mod("m9", []));
    expect(n.courses[1].modules.map((m) => m.moduleId)).toEqual(["m9"]);
  });
  it("updateModule patches", () => {
    const n = updateModule(base(), "a", "m2", { title: "T" });
    expect(n.courses[0].modules[1].title).toBe("T");
    expect(n.courses[0].modules[0].title).toBe("Module m1");
  });
  it("removeModule drops", () => {
    const n = removeModule(base(), "a", "m1");
    expect(n.courses[0].modules.map((m) => m.moduleId)).toEqual(["m2"]);
  });
  it("reorderModules moves", () => {
    const n = reorderModules(base(), "a", 0, 1);
    expect(n.courses[0].modules.map((m) => m.moduleId)).toEqual(["m2", "m1"]);
  });
});

describe("lesson ops", () => {
  it("addLesson appends with order", () => {
    const n = addLesson(base(), "a", "m2", lesson("l9"));
    const ls = n.courses[0].modules[1].lessons;
    expect(ls.map((l) => [l.id, l.order])).toEqual([
      ["l3", 0],
      ["l9", 1],
    ]);
  });
  it("updateLesson patches", () => {
    const n = updateLesson(base(), "a", "m1", "l2", { title: "X", builtForCoke: true });
    expect(n.courses[0].modules[0].lessons[1]).toMatchObject({ title: "X", builtForCoke: true });
  });
  it("removeLesson drops and renumbers", () => {
    const n = removeLesson(base(), "a", "m1", "l1");
    expect(n.courses[0].modules[0].lessons.map((l) => [l.id, l.order])).toEqual([["l2", 0]]);
  });
  it("reorderLessons moves and renumbers", () => {
    const n = reorderLessons(base(), "a", "m1", 1, 0);
    expect(n.courses[0].modules[0].lessons.map((l) => [l.id, l.order])).toEqual([
      ["l2", 0],
      ["l1", 1],
    ]);
  });
  it("does not mutate input", () => {
    const d = base();
    const snap = JSON.stringify(d);
    removeLesson(d, "a", "m1", "l1");
    reorderLessons(d, "a", "m1", 1, 0);
    expect(JSON.stringify(d)).toBe(snap);
  });
});
