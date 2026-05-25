import type { Theme } from "./types";

export function themeStyle(theme: Theme): React.CSSProperties {
  return {
    // CSS variables consumed by the canvas
    ["--pb-accent" as string]: theme.accent,
    ["--pb-page-bg" as string]: theme.pageBg,
    ["--pb-body-font" as string]: `'${theme.bodyFont}', system-ui, sans-serif`,
    ["--pb-heading-font" as string]: `'${theme.headingFont}', system-ui, sans-serif`,
    ["--pb-base-size" as string]: `${theme.baseFontSize}px`,
    ["--pb-radius" as string]: `${theme.radius}px`,
    fontFamily: `'${theme.bodyFont}', system-ui, sans-serif`,
    fontSize: `${theme.baseFontSize}px`,
    background: theme.pageBg,
  } as React.CSSProperties;
}

export function themeCssText(): string {
  // Scoped within .pb-canvas-scope
  return `
.pb-canvas-scope { font-family: var(--pb-body-font); font-size: var(--pb-base-size); }
.pb-canvas-scope h1, .pb-canvas-scope h2, .pb-canvas-scope h3, .pb-canvas-scope h4, .pb-canvas-scope h5, .pb-canvas-scope h6 { font-family: var(--pb-heading-font); }
.pb-canvas-scope [data-pb-btn="primary"] { background: var(--pb-accent) !important; border-radius: var(--pb-radius) !important; }
.pb-canvas-scope [data-pb-btn="secondary"] { border-radius: var(--pb-radius) !important; }
.pb-canvas-scope [data-pb-btn="outline"] { border-radius: var(--pb-radius) !important; border-color: var(--pb-accent) !important; color: var(--pb-accent) !important; }
.pb-canvas-scope [data-pb-btn="ghost"] { border-radius: var(--pb-radius) !important; color: var(--pb-accent) !important; }
.pb-canvas-scope [data-pb-card] { border-radius: var(--pb-radius) !important; }
`;
}
