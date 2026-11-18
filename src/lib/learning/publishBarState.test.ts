import { describe, expect, it } from "vitest";
import { publishBarState } from "./publishBarState";

const base = { hasDraft: true, changeCount: 0, stale: false, staleNotice: false };

describe("publishBarState", () => {
  it("hides the bar and notice after a publish even if a late 409 set staleNotice", () => {
    const s = publishBarState({ ...base, staleNotice: true });
    expect(s).toEqual({ showBar: false, showNotice: false, clearNotice: true });
  });
  it("shows the notice after a 409 while the draft still has changes", () => {
    const s = publishBarState({ ...base, changeCount: 2, staleNotice: true });
    expect(s).toEqual({ showBar: true, showNotice: true, clearNotice: false });
  });
  it("keeps showing a stale draft with no changes until it is rebased", () => {
    const s = publishBarState({ ...base, stale: true });
    expect(s).toEqual({ showBar: true, showNotice: true, clearNotice: false });
  });
  it("hides everything without a draft", () => {
    expect(publishBarState({ ...base, hasDraft: false, changeCount: 3 }).showBar).toBe(false);
  });
});
