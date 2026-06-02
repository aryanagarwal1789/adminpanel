export type TemplateBlockType =
  | "nav-simple"
  | "nav-centered"
  | "footer-simple"
  | "footer-columns"
  | "hero-centered"
  | "hero-split"
  | "hero-gradient"
  | "hero-centered-image"
  | "features-3col"
  | "features-4col"
  | "features-alternating"
  | "features-icon-cards"
  | "text-image"
  | "stats-bar"
  | "testimonials"
  | "logo-grid"
  | "cta-banner"
  | "faq"
  | "blog-preview"
  | "pricing-modern"
  | "testimonials-wall"
  | "team-grid"
  | "stats-bold"
  | "steps-process"
  | "cta-banner-gradient"
  | "hero-salescode"
  | "impact-salescode"
  | "clients-salescode"
  | "security-salescode"
  | "experience-video-salescode"
  | "cta-salescode"
  | "navbar-salescode-slot"
  | "product-selection-slot"
  | "platform-features-slot"
  | "integrations-slot"
  | "blogs-section-slot"
  | "footer-salescode-slot"
  | "about-page-slot"
  | "clients-page-slot"
  | "contact-page-slot"
  | "blog-page-slot"
  | 'slick-hero-split'
  | 'slick-hero-video'
  | 'slick-features-bento'
  | 'slick-features-alternating'
  | 'slick-pricing'
  | 'slick-testimonials-carousel'
  | 'slick-testimonials-logos'
  | 'slick-stats'
  | 'slick-faq'
  | 'slick-cta-glass'
  | 'slick-team'
  | 'slick-integrations'
  | 'slick-blog-grid'
  | 'slick-timeline'
  | 'slick-footer-complex';

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
  headingColor?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
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
  "hero-gradient": "Hero Gradient",
  "hero-centered-image": "Hero Centered Image",
  "features-3col": "Features 3 Column",
  "features-4col": "Features 4 Column",
  "features-alternating": "Features Alternating",
  "features-icon-cards": "Features Icon Cards",
  "text-image": "Text + Image",
  "stats-bar": "Stats Bar",
  testimonials: "Testimonials",
  "logo-grid": "Logo Grid",
  "cta-banner": "CTA Banner",
  faq: "FAQ",
  "blog-preview": "Blog Preview",
  "pricing-modern": "Pricing Modern",
  "testimonials-wall": "Testimonials Wall",
  "team-grid": "Team Grid",
  "stats-bold": "Stats Bold",
  "steps-process": "Steps Process",
  "cta-banner-gradient": "CTA Banner Gradient",
  "hero-salescode": "Hero — Salescode",
  "impact-salescode": "Impact Stats",
  "clients-salescode": "Client Logos",
  "security-salescode": "Security Banner",
  "experience-video-salescode": "Experience Video",
  "cta-salescode": "CTA — Salescode",
  "navbar-salescode-slot": "Navbar",
  "product-selection-slot": "Product Selection",
  "platform-features-slot": "Platform Features",
  "integrations-slot": "Integrations Grid",
  "blogs-section-slot": "Featured Blogs",
  "footer-salescode-slot": "Footer",
  "about-page-slot": "About Page",
  "clients-page-slot": "Clients Page",
  "contact-page-slot": "Contact Us Page",
  "blog-page-slot": "Blog Page",
  'slick-hero-split': 'Hero — Split Gradient',
  'slick-hero-video': 'Hero — Centered Video',
  'slick-features-bento': 'Features — Bento Grid',
  'slick-features-alternating': 'Features — Alternating Rows',
  'slick-pricing': 'Pricing Cards',
  'slick-testimonials-carousel': 'Testimonials — Carousel',
  'slick-testimonials-logos': 'Testimonials — Logos',
  'slick-stats': 'Stats Counter',
  'slick-faq': 'FAQ Accordion',
  'slick-cta-glass': 'CTA — Glass Banner',
  'slick-team': 'Team Grid',
  'slick-integrations': 'Integrations Cloud',
  'slick-blog-grid': 'Blog Post Grid',
  'slick-timeline': 'Timeline Steps',
  'slick-footer-complex': 'Footer — Complex',
  layout: "Layout",
};
