import { describe, expect, it } from "vitest";
import { classifyPublishFailure } from "./publishFailure";

describe("classifyPublishFailure", () => {
  it("409 LEARNING_STALE is stale", () => {
    expect(classifyPublishFailure(409, { code: "LEARNING_STALE", revision: 3 })).toEqual({
      kind: "stale",
    });
  });
  it("409 LEARNING_NOT_MIGRATED is not-migrated, never stale", () => {
    expect(classifyPublishFailure(409, { code: "LEARNING_NOT_MIGRATED" })).toEqual({
      kind: "not-migrated",
    });
  });
  it("400 with problems lists them", () => {
    expect(classifyPublishFailure(400, { problems: ["a", { message: "b" }] })).toEqual({
      kind: "problems",
      problems: ["a", "b"],
    });
  });
  it("409 with unknown code is other", () => {
    expect(classifyPublishFailure(409, { code: "X" })).toEqual({ kind: "other" });
    expect(classifyPublishFailure(409, undefined)).toEqual({ kind: "other" });
  });
  it("other statuses are other", () => {
    expect(classifyPublishFailure(500, { code: "LEARNING_STALE" })).toEqual({ kind: "other" });
  });
});
