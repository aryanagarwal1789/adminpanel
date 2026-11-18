import { describe, expect, it } from "vitest";
import { validate } from "./validate";
import { course, learning, lesson, mod } from "./fixtures";

const base = () => learning([course("a", [mod("m1", [lesson("l1")])]), course("empty", [])]);

describe("validate", () => {
  it("passes the base itself (existing empty course may stay empty)", () => {
    expect(validate(base(), base())).toEqual([]);
  });
  it("duplicate courseIds", () => {
    const d = learning([...base().courses, course("a", [mod("mx", [lesson("lx")])])]);
    const p = validate(base(), d);
    expect(
      p.some(
        (x) =>
          x.locator.courseId === "a" && x.locator.field === "courseId" && /unique/i.test(x.message),
      ),
    ).toBe(true);
  });
  it("duplicate moduleIds across courses", () => {
    const d = learning([...base().courses, course("n", [mod("m1", [lesson("lx")])])]);
    const p = validate(base(), d);
    expect(
      p.find((x) => x.locator.moduleId === "m1" && x.locator.courseId === "n")?.locator.field,
    ).toBe("moduleId");
  });
  it("duplicate lesson ids across modules of one course", () => {
    const d = learning([
      course("a", [mod("m1", [lesson("l1")]), mod("m2", [lesson("l1")])]),
      course("empty", []),
    ]);
    const p = validate(base(), d);
    const hit = p.find(
      (x) =>
        x.locator.courseId === "a" &&
        x.locator.moduleId === "m2" &&
        x.locator.lessonId === "l1" &&
        x.locator.field === "id",
    );
    expect(hit && /course/i.test(hit.message)).toBe(true);
  });
  it("same lesson id in different courses is fine", () => {
    const d = learning([
      course("a", [mod("m1", [lesson("l1")])]),
      course("b", [mod("m2", [lesson("l1")])]),
      course("empty", []),
    ]);
    expect(validate(base(), d)).toEqual([]);
  });
  it("blank moduleId", () => {
    const d = learning([course("a", [mod("  ", [lesson("l1")])]), course("empty", [])]);
    const p = validate(base(), d);
    expect(
      p.some(
        (x) =>
          x.locator.courseId === "a" &&
          x.locator.field === "moduleId" &&
          /required/i.test(x.message),
      ),
    ).toBe(true);
  });
  it("blank lesson id", () => {
    const d = learning([course("a", [mod("m1", [lesson("")])]), course("empty", [])]);
    const p = validate(base(), d);
    expect(
      p.some(
        (x) =>
          x.locator.moduleId === "m1" && x.locator.field === "id" && /required/i.test(x.message),
      ),
    ).toBe(true);
  });
  it("moduleId equal to any courseId", () => {
    const d = learning([
      course("a", [mod("empty", [lesson("l1")])]),
      course("empty", [mod("m9", [lesson("l2")])]),
    ]);
    const p = validate(base(), d);
    expect(
      p.some(
        (x) =>
          x.locator.courseId === "a" &&
          x.locator.moduleId === "empty" &&
          x.locator.field === "moduleId" &&
          /course id/i.test(x.message),
      ),
    ).toBe(true);
  });
  it("duplicate lesson ids within a module and across modules are both flagged", () => {
    const d = learning([
      course("a", [mod("m1", [lesson("l1"), lesson("l1")]), mod("m2", [lesson("l1")])]),
    ]);
    const p = validate(d, d);
    expect(p).toHaveLength(2);
    expect(p[0].locator).toMatchObject({
      courseId: "a",
      moduleId: "m1",
      lessonId: "l1",
      field: "id",
    });
    expect(p[1].locator).toMatchObject({ courseId: "a", moduleId: "m2", lessonId: "l1" });
  });
  it("new module with no lessons needs one", () => {
    const d = learning([
      course("a", [mod("m1", [lesson("l1")]), mod("m2", [])]),
      course("empty", []),
    ]);
    const p = validate(base(), d);
    expect(p).toHaveLength(1);
    expect(p[0].locator).toMatchObject({ courseId: "a", moduleId: "m2" });
  });
  it("existing module with 0 lessons may stay at 0", () => {
    const b = learning([course("a", [mod("m1", [])])]);
    expect(validate(b, b)).toEqual([]);
  });
  it("existing empty module matched across courses by moduleId", () => {
    const b = learning([course("a", [mod("m1", [])]), course("b", [mod("m2", [lesson("l")])])]);
    const d = learning([course("a", []), course("b", [mod("m2", [lesson("l")]), mod("m1", [])])]);
    expect(validate(b, d).filter((x) => x.locator.moduleId === "m1")).toEqual([]);
  });
  it("module that had lessons cannot drop to 0", () => {
    const d = learning([course("a", [mod("m1", [])]), course("empty", [])]);
    const p = validate(base(), d);
    expect(p).toHaveLength(1);
    expect(p[0].locator).toMatchObject({ courseId: "a", moduleId: "m1" });
  });
  it("videoUrl is not required", () => {
    const b = learning([course("a", [mod("m1", [lesson("l1", { videoUrl: "" })])])]);
    expect(validate(b, b)).toEqual([]);
  });
  it("new course needs a module", () => {
    const d = learning([...base().courses, course("fresh", [])]);
    const p = validate(base(), d);
    expect(p).toHaveLength(1);
    expect(p[0].locator.courseId).toBe("fresh");
  });
  it("existing course that had modules cannot drop to zero", () => {
    const d = learning([course("a", []), course("empty", [])]);
    const p = validate(base(), d);
    expect(p).toHaveLength(1);
    expect(p[0].locator.courseId).toBe("a");
  });
  it("required fields", () => {
    const d = learning([
      course("", [mod("m1", [lesson("l1", { title: " ", videoUrl: "" })], { title: "" })], {
        title: "",
      }),
    ]);
    const fields = validate(base(), d)
      .map((x) => x.locator.field)
      .sort();
    expect(fields).toEqual(["courseId", "title", "title", "title"]);
  });
  it("messages are non-empty strings", () => {
    const d = learning([course("a", [mod("m1", [])])]);
    expect(validate(base(), d)[0].message.length).toBeGreaterThan(5);
  });
});
