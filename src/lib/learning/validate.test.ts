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
  it("duplicate lesson ids within a module, same id across modules ok", () => {
    const d = learning([
      course("a", [mod("m1", [lesson("l1"), lesson("l1")]), mod("m2", [lesson("l1")])]),
    ]);
    const p = validate(d, d);
    expect(p).toHaveLength(1);
    expect(p[0].locator).toMatchObject({
      courseId: "a",
      moduleId: "m1",
      lessonId: "l1",
      field: "id",
    });
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
