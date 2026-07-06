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
  | 'slick-dv-hero-v2'
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
  | 'slick-scai-vision-hero'
  | 'slick-scai-vision-insights'
  | 'slick-scai-vision-actions'
  | 'slick-scai-vision-revenue-loss'
  | 'slick-scai-vision-performance'
  | 'slick-scai-vision-channels'
  | 'slick-scai-vision-showcase'
  | 'slick-sc-video-showcase'
  | 'slick-sc-brand-strip'
  | 'slick-sc-impact-stats'
  | 'slick-sc-product-suite'
  | 'slick-sc-ai-product-grid'
  | 'slick-sc-data-safety'
  | 'slick-sc-think-tank'
  | 'slick-sc-customer-stories'
  | 'slick-sc-trust-metrics'
  | 'slick-sc-integrations'
  | 'slick-sc-product-showcase'
  | 'slick-sc-ai-commerce'
  | 'slick-sc-blog-insights'
  | 'slick-sfa-hero'
  | 'slick-sfa-hero-v2'
  | 'slick-sfa-ai-engine'
  | 'slick-sfa-guarantee'
  | 'slick-sfa-insights'
  | 'slick-sfa-revenue-loss'
  | 'slick-sfa-typical'
  | 'slick-sfa-showcase'
  | 'slick-sfa-ai-engine-v2'
  | 'slick-sfa-guarantee-v2'
  | 'slick-dms-hero'
  | 'slick-dms-hero-v2'
  | 'slick-dms-comparison'
  | 'slick-dms-features'
  | 'slick-dms-features-v2'
  | 'slick-dms-agents'
  | 'slick-dms-integrations'
  | 'slick-dms-integrations-v2'
  | 'slick-dms-guarantee'
  | 'slick-dms-cta'
  | 'slick-dms-deploy-metrics'
  | 'slick-dms-faq'
  | 'slick-eb2b-hero'
  | 'slick-eb2b-hero-v2'
  | 'slick-eb2b-scale'
  | 'slick-eb2b-why'
  | 'slick-eb2b-features'
  | 'slick-eb2b-integrations'
  | 'slick-eb2b-impact'
  | 'slick-eb2b-deployments'
  | 'slick-eb2b-faq'
  | 'slick-ab-hero'
  | 'slick-ab-hero-v2'
  | 'slick-careers-hero'
  | 'slick-clients-hero'
  | 'slick-blogs-hero'
  | 'slick-contact-hero'
  | 'slick-experience-hero'
  | 'slick-exp-two-ways'
  | 'slick-exp-ai-stack'
  | 'slick-scai-hero-v2'
  | 'slick-scai-how-it-works'
  | 'slick-scai-capabilities'
  | 'slick-scai-why'
  | 'slick-scai-video-showcase'
  | 'slick-scai-agents'
  | 'slick-ab-intro'
  | 'slick-ab-mission-vision'
  | 'slick-ab-founder-banner'
  | 'slick-ab-stats'
  | 'slick-ab-story'
  | 'slick-ab-video'
  | 'slick-ab-awards'
  | 'slick-ab-founders'
  | 'slick-ab-founders-v2'
  | 'slick-ab-investors'
  | 'slick-ab-investors-v2'
  | 'slick-ab-team-section'
  | 'slick-ab-journey'
  | 'slick-ab-cta'
  | 'slick-contact'
  | 'slick-lets-talk'
  | 'slick-offices'
  | 'slick-sc-footer'
  | 'slick-sc-footer-v2'
  | 'slick-sc-navbar'
  | 'slick-sc-hero-v2'
  | 'slick-sc-hero-v3';

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
  'slick-dv-hero-v2': 'DigiVyapar — Hero V2',
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
  'slick-scai-vision-hero': 'SCAI Vision — Hero',
  'slick-scai-vision-insights': 'SCAI Vision — Insights',
  'slick-scai-vision-actions':       'SCAI Vision — Actions Grid',
  'slick-scai-vision-revenue-loss':  'SCAI Vision — Revenue Loss',
  'slick-scai-vision-performance':   'SCAI Vision — Performance',
  'slick-scai-vision-channels':      'SCAI Vision — Every Channel',
  'slick-scai-vision-showcase':      'SCAI Vision — GT Showcase',
  'slick-sc-video-showcase': 'SC — Video Showcase',
  'slick-sc-brand-strip': 'SC — Brand Strip',
  'slick-sc-impact-stats': 'SC — Impact Stats',
  'slick-sc-product-suite': 'SC — Product Suite',
  'slick-sc-ai-product-grid': 'SC — AI Product Grid',
  'slick-sc-data-safety': 'SC — Data Safety',
  'slick-sc-think-tank': 'SC — Think Tank',
  'slick-sc-customer-stories': 'SC — Customer Stories',
  'slick-sc-trust-metrics': 'SC — Trust Metrics',
  'slick-sc-integrations': 'SC — Integrations',
  'slick-sc-product-showcase': 'SC — Product Showcase',
  'slick-sc-ai-commerce': 'SC — AI Commerce Stack',
  'slick-sc-blog-insights': 'SC — Blog Insights',
  'slick-sfa-hero': 'SFA — Hero',
  'slick-sfa-hero-v2': 'SFA — Hero V2',
  'slick-sfa-ai-engine': 'SFA — AI Engine',
  'slick-sfa-guarantee': 'SFA — Guarantee',
  'slick-sfa-insights': 'SFA — CPG Insights',
  'slick-sfa-revenue-loss': 'SFA — Revenue Loss',
  'slick-sfa-typical': 'SFA — Typical SFA',
  'slick-sfa-showcase': 'SFA — AI Native Showcase',
  'slick-sfa-ai-engine-v2': 'SFA — AI Engine V2',
  'slick-sfa-guarantee-v2': 'SFA — Guarantee V2',
  'slick-dms-hero': 'DMS — Hero',
  'slick-dms-hero-v2': 'DMS — Hero V2',
  'slick-dms-comparison': 'DMS — Comparison Slider',
  'slick-dms-features': 'DMS — Feature Tabs',
  'slick-dms-features-v2': 'DMS — Feature Tabs V2',
  'slick-dms-agents': 'DMS — AI Agents',
  'slick-dms-integrations': 'DMS — Accounting Integrations',
  'slick-dms-integrations-v2': 'DMS — Integrations V2 (Centered)',
  'slick-dms-guarantee': 'DMS — 110% Guarantee',
  'slick-dms-cta': 'DMS — CTA (Dark Hero)',
  'slick-dms-deploy-metrics': 'DMS — Deployment Metrics',
  'slick-dms-faq': 'DMS — FAQ',
  'slick-eb2b-hero': 'eB2B — Hero',
  'slick-eb2b-hero-v2': 'eB2B — Hero V2',
  'slick-eb2b-scale': 'eB2B — Platform Scale',
  'slick-eb2b-why': 'eB2B — Why SalesCode',
  'slick-eb2b-features': 'eB2B — Feature Cards',
  'slick-eb2b-integrations': 'eB2B — Integrations',
  'slick-eb2b-impact': 'eB2B — Proven Impact',
  'slick-eb2b-deployments': 'eB2B — Our Deployments',
  'slick-eb2b-faq': 'eB2B — FAQ',
  'slick-ab-hero': 'About Us — Hero',
  'slick-ab-hero-v2': 'About Us — Hero V2',
  'slick-careers-hero': 'Careers — Hero',
  'slick-clients-hero': 'Clients — Hero',
  'slick-blogs-hero': 'Blogs — Hero',
  'slick-contact-hero': 'Contact — Hero',
  'slick-experience-hero': 'Experience — Hero',
  'slick-exp-two-ways': 'Experience — Two Ways (Sessions + Workshops)',
  'slick-exp-ai-stack': 'Experience — AI Stack (6-card grid)',
  'slick-scai-hero-v2': 'SCAI — Hero V2',
  'slick-scai-how-it-works': 'SCAI — How It Works (Video)',
  'slick-scai-capabilities': 'SCAI — Capabilities Hub',
  'slick-scai-why': 'SCAI — Why SCAI',
  'slick-scai-video-showcase': 'SCAI — Video Showcase',
  'slick-scai-agents': 'SCAI — Agent Ecosystem',
  'slick-ab-intro': 'About Us — Intro & Video',
  'slick-ab-mission-vision': 'About Us — Mission & Vision',
  'slick-ab-founder-banner': 'About Us — Founder Banner',
  'slick-ab-stats': 'About Us — Stats',
  'slick-ab-story': 'About Us — Our Story',
  'slick-ab-video': 'About Us — Video',
  'slick-ab-awards': 'About Us — Awards',
  'slick-ab-founders': 'About Us — Founders',
  'slick-ab-founders-v2': 'About Us — Founders V2 (Photo)',
  'slick-ab-investors': 'About Us — Investors',
  'slick-ab-investors-v2': 'About Us — Investors V2 (Carousel)',
  'slick-ab-team-section': 'About Us — The Team (Tech + Biz)',
  'slick-ab-journey': 'About Us — Our Journey (Timeline)',
  'slick-ab-cta': 'About Us — CTA',
  'slick-contact': 'Contact — Form & Schedule',
  'slick-lets-talk': 'Contact — Let\'s Talk Journey',
  'slick-offices': 'Contact — Our Offices',
  'slick-sc-footer': 'SC — Footer (Teal)',
  'slick-sc-footer-v2': 'SC — Footer V2 (White)',
  'slick-sc-navbar': 'SC — Navbar',
  'slick-sc-hero-v2': 'SC — Hero V2 (Person + Floating Cards)',
  'slick-sc-hero-v3': 'SC — Hero V3 (Center Image)',
  layout: "Layout",
};
