import { describe, expect, it } from "vitest";
import { formatIsoDuration, youTubeIdFrom } from "./youtube";

describe("youtube", () => {
  it("extracts ids from common url shapes", () => {
    expect(youTubeIdFrom("https://youtu.be/abc123")).toBe("abc123");
    expect(youTubeIdFrom("https://www.youtube.com/watch?v=abc123")).toBe("abc123");
    expect(youTubeIdFrom("https://www.youtube.com/shorts/abc123")).toBe("abc123");
    expect(youTubeIdFrom("https://www.youtube.com/embed/abc123?x=1")).toBe("abc123");
    expect(youTubeIdFrom("https://example.com/v.mp4")).toBeNull();
    expect(youTubeIdFrom("not a url")).toBeNull();
  });

  it("formats ISO durations", () => {
    expect(formatIsoDuration("PT21M52S")).toBe("21:52");
    expect(formatIsoDuration("PT1H5M3S")).toBe("1:05:03");
    expect(formatIsoDuration("PT45S")).toBe("0:45");
    expect(formatIsoDuration("bad")).toBeNull();
  });
});
