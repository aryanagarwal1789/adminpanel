import { describe, expect, it } from "vitest";
import { newLessonId, toId, uniqueId } from "./ids";

describe("toId", () => {
  it("lowercases and dashes runs of other chars", () => {
    expect(toId("Hello  World_2!")).toBe("hello-world-2");
  });
  it("trims dashes", () => {
    expect(toId("  --Foo/Bar--  ")).toBe("foo-bar");
  });
  it("returns empty for no alphanumerics", () => {
    expect(toId("***")).toBe("");
  });
});

describe("newLessonId", () => {
  it("has lesson-<ts>-<rand> shape and differs between calls", () => {
    const a = newLessonId();
    expect(a).toMatch(/^lesson-\d+-[a-z0-9]+$/);
    expect(newLessonId()).not.toBe(a);
  });
});

describe("uniqueId", () => {
  it("returns base when free", () => {
    expect(uniqueId("a", ["b"])).toBe("a");
  });
  it("appends -2, -3 until free", () => {
    expect(uniqueId("a", ["a"])).toBe("a-2");
    expect(uniqueId("a", ["a", "a-2"])).toBe("a-3");
  });
});
