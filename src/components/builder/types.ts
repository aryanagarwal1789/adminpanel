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
  | 'slick-footer-complex'
  | 'slick-app-download'
  | 'slick-promo-banner'
  | 'slick-app-showcase'
  | 'slick-dv-hero'
  | 'slick-dv-carousel'
  | 'slick-dv-split'
  | 'slick-dv-register'
  | 'slick-dv-vision'
  | 'slick-dv-video-split'
  | 'slick-dv-agent'
  | 'slick-dv-who'
  | 'slick-dv-download'
  | 'slick-scai-hero'
  | 'slick-scai-pilot'
  | 'slick-scai-revenue'
  | 'slick-scai-quick-guide'
  | 'slick-scai-industry'
  | 'slick-scai-human-test'
  | 'slick-scai-global-showcase'
  | 'slick-scai-whatsapp-agent'
  | 'slick-sc-video-showcase'
  | 'slick-sc-brand-strip'
  | 'slick-sc-customer-stories'
  | 'slick-sc-trust-metrics'
  | 'slick-sc-integrations'
  | 'slick-sc-product-showcase'
  | 'slick-sc-ai-commerce'
  | 'slick-sc-blog-insights'
  | 'slick-sfa-hero'
  | 'slick-sfa-ai-engine'
  | 'slick-sfa-guarantee'
  | 'slick-sfa-insights'
  | 'slick-dms-hero'
  | 'slick-dms-comparison'
  | 'slick-dms-features'
  | 'slick-dms-agents'
  | 'slick-dms-integrations'
  | 'slick-dms-guarantee'
  | 'slick-dms-deploy-metrics'
  | 'slick-dms-faq'
  | 'slick-eb2b-hero'
  | 'slick-eb2b-scale'
  | 'slick-eb2b-why'
  | 'slick-eb2b-features'
  | 'slick-eb2b-integrations'
  | 'slick-eb2b-impact'
  | 'slick-eb2b-deployments'
  | 'slick-ab-hero'
  | 'slick-ab-founder-banner'
  | 'slick-ab-stats'
  | 'slick-ab-story'
  | 'slick-ab-video'
  | 'slick-ab-awards'
  | 'slick-ab-founders'
  | 'slick-ab-investors'
  | 'slick-ab-cta'
  | 'slick-contact'
  | 'slick-lets-talk'
  | 'slick-offices'
  | 'slick-sc-footer'
  | 'slick-sc-navbar';

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
  // Phase 1 — gradient, min-height, vertical align
  bgGradientEnabled?: boolean;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientAngle?: number;
  minHeight?: number;
  contentVerticalAlign?: 'top' | 'center' | 'bottom';
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
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
  'slick-app-download': 'App Download',
  'slick-promo-banner': 'Promo Banner',
  'slick-app-showcase': 'App Showcase (Marquee)',
  'slick-dv-hero': 'DigiVyapar — Hero',
  'slick-dv-carousel': 'DigiVyapar — Platform Carousel',
  'slick-dv-split': 'DigiVyapar — Split Section',
  'slick-dv-register': 'DigiVyapar — Register Form',
  'slick-dv-vision': 'DigiVyapar — Vision & Stats',
  'slick-dv-video-split': 'DigiVyapar — Video + Copy Split',
  'slick-dv-agent': 'DigiVyapar — AI Agent Split',
  'slick-dv-who': 'DigiVyapar — Who Can Onboard',
  'slick-dv-download': 'DigiVyapar — Download App',
  'slick-scai-hero': 'SCAI — Hero',
  'slick-scai-pilot': 'SCAI — Pilot Results',
  'slick-scai-revenue': 'SCAI — Revenue Loss',
  'slick-scai-quick-guide': 'SCAI — Quick Guide',
  'slick-scai-industry': 'SCAI — Industry Categories',
  'slick-scai-human-test': 'SCAI — Human Test',
  'slick-scai-global-showcase': 'SCAI — Global Showcase',
  'slick-scai-whatsapp-agent': 'SCAI — WhatsApp Agent',
  'slick-sc-video-showcase': 'SC — Video Showcase',
  'slick-sc-brand-strip': 'SC — Brand Strip',
  'slick-sc-customer-stories': 'SC — Customer Stories',
  'slick-sc-trust-metrics': 'SC — Trust Metrics',
  'slick-sc-integrations': 'SC — Integrations',
  'slick-sc-product-showcase': 'SC — Product Showcase',
  'slick-sc-ai-commerce': 'SC — AI Commerce Stack',
  'slick-sc-blog-insights': 'SC — Blog Insights',
  'slick-sfa-hero': 'SFA — Hero',
  'slick-sfa-ai-engine': 'SFA — AI Engine',
  'slick-sfa-guarantee': 'SFA — Guarantee',
  'slick-sfa-insights': 'SFA — CPG Insights',
  'slick-dms-hero': 'DMS — Hero',
  'slick-dms-comparison': 'DMS — Comparison Slider',
  'slick-dms-features': 'DMS — Feature Tabs',
  'slick-dms-agents': 'DMS — AI Agents',
  'slick-dms-integrations': 'DMS — Accounting Integrations',
  'slick-dms-guarantee': 'DMS — 110% Guarantee',
  'slick-dms-deploy-metrics': 'DMS — Deployment Metrics',
  'slick-dms-faq': 'DMS — FAQ',
  'slick-eb2b-hero': 'eB2B — Hero',
  'slick-eb2b-scale': 'eB2B — Platform Scale',
  'slick-eb2b-why': 'eB2B — Why SalesCode',
  'slick-eb2b-features': 'eB2B — Feature Cards',
  'slick-eb2b-integrations': 'eB2B — Integrations',
  'slick-eb2b-impact': 'eB2B — Proven Impact',
  'slick-eb2b-deployments': 'eB2B — Our Deployments',
  'slick-ab-hero': 'About Us — Hero',
  'slick-ab-founder-banner': 'About Us — Founder Banner',
  'slick-ab-stats': 'About Us — Stats',
  'slick-ab-story': 'About Us — Our Story',
  'slick-ab-video': 'About Us — Video',
  'slick-ab-awards': 'About Us — Awards',
  'slick-ab-founders': 'About Us — Founders',
  'slick-ab-investors': 'About Us — Investors',
  'slick-ab-cta': 'About Us — CTA',
  'slick-contact': 'Contact — Form & Schedule',
  'slick-lets-talk': 'Contact — Let\'s Talk Journey',
  'slick-offices': 'Contact — Our Offices',
  'slick-sc-footer': 'SC — Footer (Teal)',
  'slick-sc-navbar': 'SC — Navbar',
  layout: "Layout",
};
