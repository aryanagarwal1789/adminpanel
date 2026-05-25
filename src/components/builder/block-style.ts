import type { BlockStyle, ShadowSize } from "./types";

const SHADOWS: Record<ShadowSize, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)",
  lg: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)",
};

export function blockOuterStyle(s: BlockStyle): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (s.bgTransparent) {
    css.background = "transparent";
  } else if (s.bgImage) {
    css.backgroundImage = `url(${s.bgImage})`;
    css.backgroundSize = "cover";
    css.backgroundPosition = "center";
    if (s.bgColor) css.backgroundColor = s.bgColor;
  } else if (s.bgColor) {
    css.background = s.bgColor;
  }

  const hasPad =
    s.paddingTop != null || s.paddingRight != null || s.paddingBottom != null || s.paddingLeft != null;
  if (hasPad) {
    css.paddingTop = s.paddingTop ?? 0;
    css.paddingRight = s.paddingRight ?? 0;
    css.paddingBottom = s.paddingBottom ?? 0;
    css.paddingLeft = s.paddingLeft ?? 0;
  }

  if (s.marginTop != null) css.marginTop = s.marginTop;
  if (s.marginBottom != null) css.marginBottom = s.marginBottom;

  if (s.borderStyle && s.borderStyle !== "none") {
    css.borderStyle = s.borderStyle;
    css.borderColor = s.borderColor ?? "#e2e8f0";
    css.borderWidth = s.borderWidth ?? 1;
  }
  if (s.borderRadius != null && s.borderRadius > 0) css.borderRadius = s.borderRadius;
  if (s.shadow && s.shadow !== "none") css.boxShadow = SHADOWS[s.shadow];
  if (s.borderRadius || (s.shadow && s.shadow !== "none")) css.overflow = "hidden";

  if (s.fontSize) css.fontSize = s.fontSize;
  if (s.fontWeight) css.fontWeight = s.fontWeight;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.letterSpacing != null) css.letterSpacing = s.letterSpacing;

  return css;
}
