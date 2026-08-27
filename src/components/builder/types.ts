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
  | 'slick-dv-video-pointers'
  | 'slick-dv-agent'
  | 'slick-dv-who'
  | 'slick-dv-download'
  | 'slick-scai-hero'
  | 'slick-scai-pilot'
  | 'slick-scai-revenue'
  | 'slick-scai-quick-guide'
  | 'slick-scai-multilingual'
  | 'slick-scai-final-cta'
  | 'slick-dare-to-compare'
  | 'slick-scai-industry'
  | 'slick-scai-human-test'
  | 'slick-scai-global-showcase'
  | 'slick-scai-whatsapp-agent'
  | 'slick-scai-best-agent'
  | 'slick-scai-hoardings'
  | 'slick-scai-vision-hero'
  | 'slick-scai-vision-insights'
  | 'slick-scai-vision-actions'
  | 'slick-scai-vision-revenue-loss'
  | 'slick-scai-vision-performance'
  | 'slick-scai-vision-channels'
  | 'slick-scai-vision-showcase'
  | 'slick-scai-vision-stat-bar'
  | 'slick-scai-vision-measures'
  | 'slick-sc-video-showcase'
  | 'slick-sc-platform-grid'
  | 'slick-sc-privacy-policy'
  | 'slick-sc-brand-strip'
  | 'slick-sc-testimonials'
  | 'slick-sc-founder-reels'
  | 'slick-sc-platform-branded'
  | 'slick-sc-impact-stats'
  | 'slick-sc-product-suite'
  | 'slick-sc-ai-product-grid'
  | 'slick-sc-data-safety'
  | 'slick-sc-think-tank'
  | 'slick-sc-customer-stories'
  | 'slick-sc-trust-metrics'
  | 'slick-sc-integrations'
  | 'slick-sc-product-showcase'
  | 'slick-sc-product-cards'
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
  | 'slick-sfa-sales-team-cost'
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
  | 'slick-dms-voice-agents'
  | 'slick-eb2b-hero'
  | 'slick-eb2b-hero-v2'
  | 'slick-eb2b-scale'
  | 'slick-eb2b-why'
  | 'slick-eb2b-features'
  | 'slick-eb2b-integrations'
  | 'slick-eb2b-impact'
  | 'slick-eb2b-deployments'
  | 'slick-eb2b-faq'
  | 'slick-sc-faq-explorer'
  | 'slick-ab-hero'
  | 'slick-ab-hero-v2'
  | 'slick-careers-hero'
  | 'slick-careers-jobs'
  | 'slick-help-hero'
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
  | 'slick-ab-founders-voice'
  | 'slick-ab-investors'
  | 'slick-ab-investors-v2'
  | 'slick-ab-team-section'
  | 'slick-ab-journey'
  | 'slick-ab-cta'
  | 'slick-contact'
  | 'slick-sc-contact-hs'
  | 'slick-lets-talk'
  | 'slick-offices'
  | 'slick-sc-footer'
  | 'slick-sc-footer-v2'
  | 'slick-sc-navbar'
  | 'slick-sc-hero-v2'
  | 'slick-sc-hero-v3'
  | 'slick-conclave-hero'
  | 'slick-conclave-trailer'
  | 'slick-conclave-guest-scroller'
  | 'slick-conclave-themes'
  | 'slick-conclave-awards'
  | 'slick-conclave-reels'
  | 'slick-conclave-leaders'
  | 'slick-conclave-gallery'
  | 'slick-conclave-speakers'
  | 'slick-conclave-agenda'
  | 'slick-conclave-stats'
  | 'slick-conclave-register'
  | 'slick-conclave-guests'
  | 'slick-sc-saudi-hero'
  | 'slick-sc-saudi-leadership'
  | 'slick-sc-saudi-presence'
  | 'slick-sc-saudi-platform'
  | 'slick-sc-saudi-products'
  | 'slick-sc-saudi-video'
  | 'slick-sc-upi-hero'
  | 'slick-sc-upi-challenge'
  | 'slick-sc-upi-dark'
  | 'slick-sc-upi-how'
  | 'slick-sc-upi-suite'
  | 'slick-sc-upi-split'
  | 'slick-sc-upi-proof'
  | 'slick-sc-upi-related'
  | 'slick-si-impact'
  | 'slick-si-capabilities'
  | 'slick-si-darkpanel'
  | 'slick-si-split'
  | 'slick-si-proof'
  | 'slick-ate-darkpanel'
  | 'slick-ate-proof'
  | 'slick-atk-capabilities'
  | 'slick-atk-darkpanel'
  | 'slick-atk-proof'
  | 'slick-aa-split'
  | 'slick-aa-capabilities'
  | 'slick-ma-hero'
  | 'slick-ma-problem'
  | 'slick-ma-signals'
  | 'slick-ma-decision'
  | 'slick-ma-enterprise'
  | 'slick-ma-signals-grid'
  | 'slick-rd-barriers'
  | 'slick-rd-showcase'
  | 'slick-rd-features'
  | 'slick-ac-hero'
  | 'slick-ac-how-it-works'
  | 'slick-ac-problem'
  | 'slick-ac-capabilities'
  | 'slick-ac-stats'
  | 'slick-ac-execution'
  | 'slick-ac-pitch'
  | 'slick-ac-scenario'
  | 'slick-ac-launch'
  | 'slick-ac-objections'
  | 'slick-ac-backend'
  | 'slick-ac-cta'
  | 'slick-ac-brand-strip'
  | 'slick-da-hero'
  | 'slick-da-brand-strip'
  | 'slick-da-problem'
  | 'slick-da-darkpanel'
  | 'slick-da-workflow'
  | 'slick-da-capabilities'
  | 'slick-da-split'
  | 'slick-da-impact'
  | 'slick-da-proof'
  | 'slick-da-cta'
  | 'slick-pe-hero'
  | 'slick-pe-statbar'
  | 'slick-pe-problem'
  | 'slick-pe-darkpanel'
  | 'slick-pe-stages'
  | 'slick-pe-capabilities'
  | 'slick-pe-split'
  | 'slick-pe-impact'
  | 'slick-pe-proof'
  | 'slick-pe-outcome-flow'
  | 'slick-rs-hero'
  | 'slick-rs-brand-strip'
  | 'slick-rs-problem'
  | 'slick-rs-compare'
  | 'slick-rs-darkpanel'
  | 'slick-rs-problemgrid'
  | 'slick-rs-capabilities'
  | 'slick-rs-split'
  | 'slick-rs-impact'
  | 'slick-sv-hero'
  | 'slick-sv-scale'
  | 'slick-sv-problem'
  | 'slick-sv-darkpanel'
  | 'slick-sv-stages'
  | 'slick-sv-accuracy'
  | 'slick-sv-features'
  | 'slick-sv-split'
  | 'slick-sv-proof'
  | 'slick-sv-humantest'
  | 'slick-su-hero'
  | 'slick-su-scale'
  | 'slick-su-problem'
  | 'slick-su-lossrail'
  | 'slick-su-timeline'
  | 'slick-su-engine'
  | 'slick-su-guarantee'
  | 'slick-mt-hero'
  | 'slick-mt-statbar'
  | 'slick-mt-problem'
  | 'slick-mt-split'
  | 'slick-mt-icards'
  | 'slick-mt-darktabs'
  | 'slick-mt-darkpanel'
  | 'slick-mt-features'
  | 'slick-mt-proof'
  | 'slick-mt-trust'
  | 'slick-ud-problem'
  | 'slick-ud-timeline'
  | 'slick-ud-impact'
  | 'slick-sn-hero'
  | 'slick-sn-scale'
  | 'slick-sn-problem'
  | 'slick-sn-howitworks'
  | 'slick-sn-features'
  | 'slick-sn-spotlight'
  | 'slick-sn-darkcard'
  | 'slick-sn-recovery'
  | 'slick-sn-proof'
  | "html-embed";

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
  /** Per-locale overrides for bgImage, keyed by non-English locale code. */
  bgImageI18n?: Partial<Record<string, string>>;
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
  // Global-component reference → a block id in the reserved "_globals" page.
  globalId?: string;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  hostnames: string[];
  // CMS-editable public URL: bucket (nested route folder) + slug within it.
  // Published with the page; drives routing + navbar/footer links.
  bucketId?: string | null;
  urlSlug?: string;
  /** Computed canonical path (bucket chain + urlSlug), for display/preview. */
  path?: string;
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
  "html-embed": "Custom HTML / Embed",
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
  'slick-dv-video-pointers': 'DigiVyapar — Video + Pointers Split',
  'slick-dv-agent': 'DigiVyapar — AI Agent Split',
  'slick-dv-who': 'DigiVyapar — Who Can Onboard',
  'slick-dv-download': 'DigiVyapar — Download App',
  'slick-scai-hero': 'SCAI — Hero',
  'slick-scai-pilot': 'SCAI — Pilot Results',
  'slick-scai-revenue': 'SCAI — Revenue Loss',
  'slick-scai-quick-guide': 'SCAI — Quick Guide',
  'slick-scai-multilingual': 'SCAI — Multilingual Voice Agent',
  'slick-scai-final-cta': 'SCAI — Final CTA Banner',
  'slick-dare-to-compare': 'Dare to Compare',
  'slick-scai-industry': 'SCAI — Industry Categories',
  'slick-scai-human-test': 'SCAI — Human Test',
  'slick-scai-global-showcase': 'SCAI — Global Showcase',
  'slick-scai-whatsapp-agent': 'SCAI — WhatsApp Agent',
  'slick-scai-best-agent': "SCAI — World's Best AI Sales Agent",
  'slick-scai-hoardings': 'SCAI — Sells Better than Humans',
  'slick-scai-vision-hero': 'SCAI Vision — Hero',
  'slick-scai-vision-insights': 'SCAI Vision — Insights',
  'slick-scai-vision-actions':       'SCAI Vision — Actions Grid',
  'slick-scai-vision-revenue-loss':  'SCAI Vision — Revenue Loss',
  'slick-scai-vision-performance':   'SCAI Vision — Performance',
  'slick-scai-vision-channels':      'SCAI Vision — Every Channel',
  'slick-scai-vision-showcase':      'SCAI Vision — GT Showcase',
  'slick-scai-vision-stat-bar':      'SCAI Vision — Stat Bar',
  'slick-scai-vision-measures':      'SCAI Vision — Measures Tabs',
  'slick-sc-video-showcase': 'SC — Video Showcase',
  'slick-sc-platform-grid':   'SC — Platform Grid',
  'slick-sc-privacy-policy':  'SC — Privacy Policy',
  'slick-sc-brand-strip': 'SC — Brand Strip',
  'slick-sc-testimonials': 'SC — Testimonials (Reviews + Video)',
  'slick-sc-founder-reels': 'SC — Founder Reels',
  'slick-sc-platform-branded': 'Platform — Sign-in Split',
  'slick-sc-impact-stats': 'SC — Impact Stats',
  'slick-sc-product-suite': 'SC — Product Suite',
  'slick-sc-ai-product-grid': 'SC — AI Product Grid',
  'slick-sc-data-safety': 'SC — Data Safety',
  'slick-sc-think-tank': 'SC — Think Tank',
  'slick-sc-customer-stories': 'SC — Customer Stories',
  'slick-sc-trust-metrics': 'SC — Trust Metrics',
  'slick-sc-integrations': 'SC — Integrations',
  'slick-sc-product-showcase': 'SC — Product Showcase',
  'slick-sc-product-cards': 'SC — Product Cards',
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
  'slick-sfa-sales-team-cost': 'SFA — Cost of a Legacy Sales Team',
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
  'slick-dms-voice-agents': 'DMS — Voice AI Agents',
  'slick-eb2b-hero': 'eB2B — Hero',
  'slick-eb2b-hero-v2': 'eB2B — Hero V2',
  'slick-eb2b-scale': 'eB2B — Platform Scale',
  'slick-eb2b-why': 'eB2B — Why SalesCode',
  'slick-eb2b-features': 'eB2B — Feature Cards',
  'slick-eb2b-integrations': 'eB2B — Integrations',
  'slick-eb2b-impact': 'eB2B — Proven Impact',
  'slick-eb2b-deployments': 'eB2B — Our Deployments',
  'slick-eb2b-faq': 'eB2B — FAQ',
  'slick-sc-faq-explorer': 'FAQ Explorer (382 Q&A)',
  'slick-ab-hero': 'About Us — Hero',
  'slick-ab-hero-v2': 'About Us — Hero V2',
  'slick-careers-hero': 'Careers — Hero',
  'slick-careers-jobs': 'Careers — Open Positions',
  'slick-help-hero': 'Help Center — Hero',
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
  'slick-ab-founders-voice': "About Us — Founder's Voice (Videos)",
  'slick-ab-investors': 'About Us — Investors',
  'slick-ab-investors-v2': 'About Us — Investors V2 (Carousel)',
  'slick-ab-team-section': 'About Us — The Team (Tech + Biz)',
  'slick-ab-journey': 'About Us — Our Journey (Timeline)',
  'slick-ab-cta': 'About Us — CTA',
  'slick-contact': 'Contact — Form & Schedule',
  'slick-sc-contact-hs': 'Contact — HubSpot Embed (native captcha)',
  'slick-lets-talk': 'Contact — Let\'s Talk Journey',
  'slick-offices': 'Contact — Our Offices',
  'slick-sc-footer': 'SC — Footer (Teal)',
  'slick-sc-footer-v2': 'SC — Footer V2 (White)',
  'slick-sc-navbar': 'SC — Navbar',
  'slick-sc-hero-v2': 'SC — Hero V2 (Person + Floating Cards)',
  'slick-sc-hero-v3': 'SC — Hero V3 (Center Image)',
  'slick-conclave-hero': 'Conclave — Hero',
  'slick-conclave-trailer': 'Conclave — Trailer Video',
  'slick-conclave-guest-scroller': 'Conclave — Guest Scroller',
  'slick-conclave-themes': 'Conclave — Key Themes',
  'slick-conclave-awards': 'Conclave — Awards Grid',
  'slick-conclave-reels': 'Conclave — Highlight Reels',
  'slick-conclave-leaders': 'Conclave — CPG Leaders Carousel',
  'slick-conclave-gallery': 'Conclave — Photo Gallery',
  'slick-conclave-speakers': 'Conclave — Speakers Grid',
  'slick-conclave-agenda': 'Conclave — Agenda',
  'slick-conclave-stats': 'Conclave — Stats',
  'slick-conclave-register': 'Conclave — Register Form',
  'slick-conclave-guests': 'Conclave — Guests Grid',
  'slick-sc-saudi-hero': 'SC — Saudi Presence Hero',
  'slick-sc-saudi-leadership': 'SC — Saudi Leadership Team',
  'slick-sc-saudi-presence': 'SC — Saudi Presence Photos',
  'slick-sc-saudi-platform': 'SC — Saudi Platform Image',
  'slick-sc-saudi-products': 'SC — Saudi Products',
  'slick-sc-saudi-video': 'SC — Saudi Video',
  'slick-sc-upi-hero': 'UPI — Hero',
  'slick-sc-upi-challenge': 'UPI — Business Challenge',
  'slick-sc-upi-dark': 'UPI — Dark Explainer',
  'slick-sc-upi-how': 'UPI — How It Works',
  'slick-sc-upi-suite': 'UPI — Suite Fit',
  'slick-sc-upi-split': 'UPI — Features Split',
  'slick-sc-upi-proof': 'UPI — Proof',
  'slick-sc-upi-related': 'UPI — Related Capabilities',
  'slick-si-impact': 'Sales Incentive — Impact',
  'slick-si-capabilities': 'Sales Incentive — Capabilities',
  'slick-si-darkpanel': 'Sales Incentive — Dark Panel',
  'slick-si-split': 'Sales Incentive — Split',
  'slick-si-proof': 'Sales Incentive — Proof',
  'slick-ate-darkpanel': 'AI Target Engine — Dark Panel',
  'slick-ate-proof': 'AI Target Engine — Proof',
  'slick-atk-capabilities': 'AI Task Engine — Capabilities',
  'slick-atk-darkpanel': 'AI Task Engine — Dark Panel',
  'slick-atk-proof': 'AI Task Engine — Proof',
  'slick-aa-split': 'AI Analyst — Existing Stack Split',
  'slick-aa-capabilities': 'AI Analyst — Capabilities',
  'slick-ma-hero': 'Manager App — Hero',
  'slick-ma-problem': 'Manager App — Market Problem',
  'slick-ma-signals': 'Manager App — Signal Layers',
  'slick-ma-decision': 'Manager App — Decision Intelligence',
  'slick-ma-enterprise': 'Manager App — Enterprise Ready',
  'slick-ma-signals-grid': 'Manager App — Signal Grid',
  'slick-rd-barriers': 'DMS Rural — Adoption Barriers',
  'slick-rd-showcase': 'DMS Rural — Month Showcase',
  'slick-rd-features': 'DMS Rural — Features',
  'slick-ac-hero': 'AI Coach — Hero',
  'slick-ac-how-it-works': 'AI Coach — How It Works',
  'slick-ac-problem': 'AI Coach — Problem (Broken Coaching)',
  'slick-ac-capabilities': 'AI Coach — Capabilities',
  'slick-ac-stats': 'AI Coach — Impact Stats',
  'slick-ac-execution': 'AI Coach — Built Into Execution',
  'slick-ac-pitch': 'AI Coach — Perfect Every Pitch (Tabs)',
  'slick-ac-scenario': 'AI Coach — Coach in Any Scenario (Tabs)',
  'slick-ac-launch': 'AI Coach — 2-Minute Launch',
  'slick-ac-objections': 'AI Coach — Handle Objections',
  'slick-ac-backend': 'AI Coach — Backend to Frontend (Tabs)',
  'slick-ac-cta': 'AI Coach — Final CTA',
  'slick-ac-brand-strip': 'AI Coach — Brand Strip (marquee)',
  'slick-da-hero': 'Delivery App — Hero',
  'slick-da-brand-strip': 'Delivery App — Brand Strip',
  'slick-da-problem': 'Delivery App — Market Problem (Cited)',
  'slick-da-darkpanel': 'Delivery App — Dark Panel',
  'slick-da-workflow': 'Delivery App — How It Works',
  'slick-da-capabilities': 'Delivery App — Capabilities',
  'slick-da-split': 'Delivery App — In-App Split',
  'slick-da-impact': 'Delivery App — Impact Cards',
  'slick-da-proof': 'Delivery App — Proof',
  'slick-da-cta': 'Delivery App — CTA Banner',
  'slick-pe-hero': 'Promo Engine — Hero',
  'slick-pe-statbar': 'Promo Engine — Stat Bar',
  'slick-pe-problem': 'Promo Engine — Market Problem (Cited)',
  'slick-pe-darkpanel': 'Promo Engine — Dark Panel',
  'slick-pe-stages': 'Promo Engine — How It Works',
  'slick-pe-capabilities': 'Promo Engine — Capabilities',
  'slick-pe-split': 'Promo Engine — Lifecycle Split',
  'slick-pe-impact': 'Promo Engine — Impact Cards',
  'slick-pe-proof': 'Promo Engine — Reported Impact',
  'slick-pe-outcome-flow': 'Promo Engine — Outcome Flow',
  'slick-rs-hero': 'Rural SFA — Hero',
  'slick-rs-brand-strip': 'Rural SFA — Brand Strip',
  'slick-rs-problem': 'Rural SFA — Market Problem (Cited)',
  'slick-rs-compare': 'Rural SFA — Compare Grid',
  'slick-rs-darkpanel': 'Rural SFA — Dark Panel',
  'slick-rs-problemgrid': 'Rural SFA — How It Works Grid',
  'slick-rs-capabilities': 'Rural SFA — Capabilities',
  'slick-rs-split': 'Rural SFA — In-App Split',
  'slick-rs-impact': 'Rural SFA — Impact Cards',
  'slick-sv-hero': 'SCAI Vision — Hero',
  'slick-sv-scale': 'SCAI Vision — Scale / Trust',
  'slick-sv-problem': 'SCAI Vision — Market Problem (Cited)',
  'slick-sv-darkpanel': 'SCAI Vision — Dark Panel',
  'slick-sv-stages': 'SCAI Vision — How It Works',
  'slick-sv-accuracy': 'SCAI Vision — Accuracy Bar',
  'slick-sv-features': 'SCAI Vision — Six Checks Grid',
  'slick-sv-split': 'SCAI Vision — Split (reversible)',
  'slick-sv-proof': 'SCAI Vision — Proof Cards',
  'slick-sv-humantest': 'SCAI Vision — Human Test',
  'slick-su-hero': 'Urban SFA — Hero',
  'slick-su-scale': 'Urban SFA — Trust & Scale',
  'slick-su-problem': 'Urban SFA — Market Problem (Cited)',
  'slick-su-lossrail': 'Urban SFA — Cost of Legacy (Loss Rail)',
  'slick-su-timeline': 'Urban SFA — Day Timeline',
  'slick-su-engine': 'Urban SFA — AI Engine',
  'slick-su-guarantee': 'Urban SFA — Guarantee',
  'slick-mt-hero': 'Modern Trade — Hero',
  'slick-mt-statbar': 'Modern Trade — Stat Bar',
  'slick-mt-problem': 'Modern Trade — Market Problem (Cited)',
  'slick-mt-split': 'Modern Trade — Split (reversible)',
  'slick-mt-icards': 'Modern Trade — Rich Impact Cards',
  'slick-mt-darktabs': 'Modern Trade — Dark Tabbed Metrics',
  'slick-mt-darkpanel': 'Modern Trade — Dark Panel',
  'slick-mt-features': 'Modern Trade — Feature Grid',
  'slick-mt-proof': 'Modern Trade — Proof Cards',
  'slick-mt-trust': 'Modern Trade — Trust / Logos',
  'slick-ud-problem': 'Urban DMS — Market Problem',
  'slick-ud-timeline': 'Urban DMS — How It Works',
  'slick-ud-impact': 'Urban DMS — Modules / Impact',
  'slick-sn-hero': 'AI Supervisor — Hero',
  'slick-sn-scale': 'AI Supervisor — Platform Scale',
  'slick-sn-problem': 'AI Supervisor — Manager Time Crisis',
  'slick-sn-howitworks': 'AI Supervisor — How It Works (Steps)',
  'slick-sn-features': 'AI Supervisor — Features',
  'slick-sn-spotlight': 'AI Supervisor — Spotlight Split',
  'slick-sn-darkcard': 'AI Supervisor — Dark Copilot Card',
  'slick-sn-recovery': 'AI Supervisor — Order Recovery',
  'slick-sn-proof': 'AI Supervisor — Proof Cards',
  layout: "Layout",
};
