import { describe, expect, it } from "vitest";
import {
  buildBrandingPayload,
  canSaveBranding,
  TEAL_ACCENT,
  TEAL_ACCENT_DARK,
  type BannerForm,
} from "./portalBranding";

const banner: BannerForm = { enabled: true, image: "", headline: "", highlights: [], tagline: "" };
const colours = { accent: "#111111", accentDark: "#222222" };

describe("buildBrandingPayload", () => {
  it("coke uses the form colours", () => {
    const p = buildBrandingPayload(
      "cokeworld",
      colours,
      { accent: "#abc", accentDark: "#def" },
      banner,
    );
    expect(p.accent).toBe("#111111");
    expect(p.accentDark).toBe("#222222");
  });
  it("platform keeps stored colours", () => {
    const p = buildBrandingPayload(
      "platform",
      colours,
      { accent: "#abc", accentDark: "#def" },
      banner,
    );
    expect([p.accent, p.accentDark]).toEqual(["#abc", "#def"]);
  });
  it("experience falls back to teal defaults", () => {
    const p = buildBrandingPayload("experience", colours, null, banner);
    expect([p.accent, p.accentDark]).toEqual([TEAL_ACCENT, TEAL_ACCENT_DARK]);
    expect([TEAL_ACCENT, TEAL_ACCENT_DARK]).toEqual(["#0D9488", "#0F766E"]);
  });
  it("omits empty optional banner fields and carries enabled", () => {
    const p = buildBrandingPayload("platform", colours, null, {
      ...banner,
      enabled: false,
      headline: "  ",
      highlights: ["", " "],
      tagline: "",
    });
    expect(p.banner).toEqual({ enabled: false });
  });
  it("trims and keeps filled banner fields", () => {
    const p = buildBrandingPayload("platform", colours, null, {
      enabled: true,
      image: "u.png",
      headline: " H ",
      highlights: [" a ", "", "b"],
      tagline: " t ",
    });
    expect(p.banner).toEqual({
      enabled: true,
      image: "u.png",
      headline: "H",
      highlights: ["a", "b"],
      tagline: "t",
    });
  });
});

describe("canSaveBranding", () => {
  const ok = { loading: false, loadError: false, loadedPortal: "platform", selectedPortal: "platform" } as const;
  it("allows save after a successful load of the selected portal", () => {
    expect(canSaveBranding(ok)).toBe(true);
  });
  it("blocks while loading", () => {
    expect(canSaveBranding({ ...ok, loading: true })).toBe(false);
  });
  it("blocks when the load failed", () => {
    expect(canSaveBranding({ ...ok, loadError: true })).toBe(false);
  });
  it("blocks when the loaded portal is not the selected one", () => {
    expect(canSaveBranding({ ...ok, loadedPortal: "cokeworld" })).toBe(false);
    expect(canSaveBranding({ ...ok, loadedPortal: null })).toBe(false);
  });
});
