export type TemplateBlockType =
  | "nav-simple"
  | "nav-centered"
  | "footer-simple"
  | "footer-columns"
  | "hero-centered"
  | "hero-split"
  | "features-3col"
  | "features-4col"
  | "text-image"
  | "stats-bar"
  | "testimonials"
  | "logo-grid"
  | "cta-banner"
  | "faq";

export type LayoutVariant = "1" | "2" | "3" | "1-2" | "2-1" | "4";

export type BlockType = TemplateBlockType | "layout";

export type ShadowSize = "none" | "sm" | "md" | "lg";
export type BorderStyle = "none" | "solid" | "dashed" | "dotted";

export interface BlockStyle {
  background: string;
  padding: string;
  // Phase 5 additions
  bgColor?: string;
  bgImage?: string;
  bgTransparent?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginBottom?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: ShadowSize;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  order: number;
  hidden?: boolean;
  fields: Record<string, unknown>;
  style: BlockStyle;
  layout?: LayoutVariant;
  columns?: unknown[];
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
}

export interface Theme {
  accent: string;
  pageBg: string;
  bodyFont: string;
  headingFont: string;
  baseFontSize: number;
  radius: number;
  buttonStyle: "filled" | "outline" | "ghost";
}

export const DEFAULT_THEME: Theme = {
  accent: "#3b82f6",
  pageBg: "#ffffff",
  bodyFont: "Inter",
  headingFont: "Inter",
  baseFontSize: 16,
  radius: 8,
  buttonStyle: "filled",
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  "nav-simple": "Nav Simple",
  "nav-centered": "Nav Centered",
  "footer-simple": "Footer Simple",
  "footer-columns": "Footer Columns",
  "hero-centered": "Hero Centered",
  "hero-split": "Hero Split",
  "features-3col": "Features 3 Column",
  "features-4col": "Features 4 Column",
  "text-image": "Text + Image",
  "stats-bar": "Stats Bar",
  testimonials: "Testimonials",
  "logo-grid": "Logo Grid",
  "cta-banner": "CTA Banner",
  faq: "FAQ",
  layout: "Layout",
};
