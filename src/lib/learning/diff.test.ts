import { describe, expect, it } from "vitest";
import { summarize } from "./diff";
import {
  addCourse,
  addLesson,
  addModule,
  removeCourse,
  removeLesson,
  removeModule,
  reorderCourses,
  reorderLessons,
  reorderModules,
  setHideFeatureInfo,
  updateCourse,
  updateLesson,
  updateModule,
} from "./draft";
import { course, learning, lesson, mod } from "./fixtures";

const base = () =>
  learning([
    course("a", [mod("m1", [lesson("l1"), lesson("l2")]), mod("m2", [lesson("l3")])]),
    course("b", []),
  ]);

describe("summarize", () => {
  it("is empty for identical trees", () => {
    expect(summarize(base(), base())).toEqual([]);
  });
  it("added course", () => {
    const r = summarize(base(), addCourse(base(), course("z", [], { title: "Zed" })));
    expect(r).toEqual([
      { kind: "added", entity: "course", label: 'Added course "Zed"', locator: { courseId: "z" } },
    ]);
  });
  it("removed course", () => {
    const r = summarize(base(), removeCourse(base(), "b"));
    expect(r).toEqual([
      {
        kind: "removed",
        entity: "course",
        label: 'Removed course "Course b"',
        locator: { courseId: "b" },
      },
    ]);
  });
  it("edited course lists changed fields", () => {
    const r = summarize(base(), updateCourse(base(), "b", { title: "N", description: "d" }));
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kind: "edited", entity: "course", locator: { courseId: "b" } });
    expect(r[0].label).toBe('Edited course "N" (title, description)');
  });
  it("visibility change is an edit of enabled", () => {
    const r = summarize(base(), updateCourse(base(), "b", { enabled: false }));
    expect(r[0].label).toContain("enabled");
  });
  it("module added/removed/edited", () => {
    expect(summarize(base(), addModule(base(), "b", mod("m9", [], { title: "Nine" })))).toEqual([
      {
        kind: "added",
        entity: "module",
        label: 'Added module "Nine" in "Course b"',
        locator: { courseId: "b", moduleId: "m9" },
      },
    ]);
    expect(summarize(base(), removeModule(base(), "a", "m2"))).toEqual([
      {
        kind: "removed",
        entity: "module",
        label: 'Removed module "Module m2" from "Course a"',
        locator: { courseId: "a", moduleId: "m2" },
      },
    ]);
    const e = summarize(base(), updateModule(base(), "a", "m1", { title: "Renamed" }));
    expect(e).toEqual([
      {
        kind: "edited",
        entity: "module",
        label: 'Edited module "Renamed" in "Course a" (title)',
        locator: { courseId: "a", moduleId: "m1" },
      },
    ]);
  });
  it("lesson added/removed/edited", () => {
    expect(
      summarize(base(), addLesson(base(), "a", "m2", lesson("l9", { title: "Nine" }))),
    ).toEqual([
      {
        kind: "added",
        entity: "lesson",
        label: 'Added lesson "Nine" in "Module m2"',
        locator: { courseId: "a", moduleId: "m2", lessonId: "l9" },
      },
    ]);
    expect(summarize(base(), removeLesson(base(), "a", "m1", "l1"))).toEqual([
      {
        kind: "removed",
        entity: "lesson",
        label: 'Removed lesson "Lesson l1" from "Module m1"',
        locator: { courseId: "a", moduleId: "m1", lessonId: "l1" },
      },
    ]);
    expect(
      summarize(
        base(),
        updateLesson(base(), "a", "m1", "l1", { videoUrl: "u", builtForCoke: true }),
      ),
    ).toEqual([
      {
        kind: "edited",
        entity: "lesson",
        label: 'Edited lesson "Lesson l1" in "Module m1" (videoUrl, builtForCoke)',
        locator: { courseId: "a", moduleId: "m1", lessonId: "l1" },
      },
    ]);
  });
  it("counts workflowImage and hideInfo lesson edits", () => {
    const r = summarize(
      base(),
      updateLesson(base(), "a", "m1", "l1", { workflowImage: "u", hideInfo: true }),
    );
    expect(r).toHaveLength(1);
    expect(r[0].label).toContain("workflowImage, hideInfo");
  });
  it("counts the global hideFeatureInfo switch", () => {
    expect(summarize(base(), setHideFeatureInfo(base(), true))).toEqual([
      {
        kind: "edited",
        entity: "settings",
        label: "Hide feature info (ⓘ) buttons in all courses: on",
        locator: { courseId: "" },
      },
    ]);
    const on = setHideFeatureInfo(base(), true);
    expect(summarize(on, setHideFeatureInfo(on, false))[0].label).toContain(": off");
    expect(summarize(base(), setHideFeatureInfo(base(), false))).toEqual([]);
  });
  it("reorders", () => {
    expect(summarize(base(), reorderCourses(base(), 0, 1))).toEqual([
      {
        kind: "reordered",
        entity: "course",
        label: "Reordered courses",
        locator: { courseId: "a" },
      },
    ]);
    expect(summarize(base(), reorderModules(base(), "a", 0, 1))).toEqual([
      {
        kind: "reordered",
        entity: "module",
        label: 'Reordered modules in "Course a"',
        locator: { courseId: "a" },
      },
    ]);
    expect(summarize(base(), reorderLessons(base(), "a", "m1", 0, 1))).toEqual([
      {
        kind: "reordered",
        entity: "lesson",
        label: 'Reordered lessons in "Module m1"',
        locator: { courseId: "a", moduleId: "m1" },
      },
    ]);
  });
  it("removing a course does not count as reorder of the rest", () => {
    const b = learning([course("a", []), course("b", []), course("c", [])]);
    expect(summarize(b, removeCourse(b, "a")).map((i) => i.kind)).toEqual(["removed"]);
  });
  it("ignores order and lastUpdated noise", () => {
    const d = base();
    d.courses[0].lastUpdatedAt = "x";
    d.courses[0].order = 9;
    expect(summarize(base(), d)).toEqual([]);
  });
});
