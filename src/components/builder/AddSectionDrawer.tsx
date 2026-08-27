import { useState, useMemo } from "react";
import {
  X, ChevronDown, ChevronRight, Search,
  Menu, AlignCenter, Layout, Columns, Star, LayoutTemplate,
  Grid3x3, Grid, Image as ImageIcon, BarChart, Quote, Grid2x2,
  Megaphone, HelpCircle, FileText, Sparkles, MonitorPlay,
  ListOrdered, CreditCard, MessageSquareQuote, Users, TrendingUp,
  ArrowRightCircle, Zap, ShoppingCart, Puzzle, BookOpen, PanelBottom,
  List, Tag, MessageSquare, BarChart3, GitBranch, Download, Layers, Mic,
  Languages, Code, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TemplateBlockType, LayoutVariant } from "./types";

interface TemplateItem { type: TemplateBlockType; label: string; Icon: LucideIcon }
interface Group { name: string; items: TemplateItem[] }

const GROUPS: Group[] = [
  { name: "Advanced", items: [
    { type: "html-embed", label: "Custom HTML / Embed", Icon: Code },
  ]},
  { name: "Platform Branded", items: [
    { type: "slick-sc-platform-branded", label: "Platform — Sign-in Split", Icon: Sparkles },
  ]},
  { name: "Salescode Branded", items: [
    { type: "hero-salescode", label: "Hero — Salescode", Icon: Sparkles },
    { type: "impact-salescode", label: "Impact Stats", Icon: TrendingUp },
    { type: "clients-salescode", label: "Client Logos", Icon: Grid2x2 },
    { type: "security-salescode", label: "Security Banner", Icon: Zap },
    { type: "experience-video-salescode", label: "Experience Video", Icon: MonitorPlay },
    { type: "cta-salescode", label: "CTA — Salescode", Icon: Megaphone },
    { type: "navbar-salescode-slot", label: "Navbar", Icon: LayoutTemplate },
    { type: "product-selection-slot", label: "Product Selection", Icon: ShoppingCart },
    { type: "platform-features-slot", label: "Platform Features", Icon: Grid2x2 },
    { type: "integrations-slot", label: "Integrations Grid", Icon: Puzzle },
    { type: "blogs-section-slot", label: "Featured Blogs", Icon: BookOpen },
    { type: "footer-salescode-slot", label: "Footer", Icon: PanelBottom },
    { type: "about-page-slot", label: "About Page", Icon: FileText },
    { type: "clients-page-slot", label: "Clients Page", Icon: Users },
    { type: "contact-page-slot", label: "Contact Us Page", Icon: Megaphone },
    { type: "blog-page-slot", label: "Blog Page", Icon: FileText },
    { type: "slick-sc-faq-explorer", label: "FAQ Explorer (382 Q&A, search + filters)", Icon: HelpCircle },
  ]},
  { name: "Salescode Landing", items: [
    { type: "slick-sc-hero-v2",        label: "SC — Hero V2 (Person + Floating Cards)", Icon: Sparkles },
    { type: "slick-sc-hero-v3",        label: "SC — Hero V3 (Center Image)", Icon: Sparkles },
    { type: "slick-sc-video-showcase", label: "SC — Video Showcase", Icon: MonitorPlay },
    { type: "slick-sc-platform-grid",  label: "SC — Platform Grid",  Icon: Grid      },
    { type: "slick-sc-privacy-policy", label: "SC — Privacy Policy", Icon: FileText  },
    { type: "slick-sc-brand-strip", label: "SC — Brand Strip", Icon: Grid2x2 },
    { type: "slick-sc-testimonials", label: "SC — Testimonials (Reviews + Video)", Icon: MessageSquareQuote },
    { type: "slick-sc-founder-reels", label: "SC — Founder Reels", Icon: Grid2x2 },
    { type: "slick-sc-impact-stats", label: "SC — Impact Stats", Icon: TrendingUp },
    { type: "slick-sc-product-suite", label: "SC — Product Suite", Icon: Grid2x2 },
    { type: "slick-sc-ai-product-grid", label: "SC — AI Product Grid", Icon: MonitorPlay },
    { type: "slick-sc-data-safety", label: "SC — Data Safety", Icon: Sparkles },
    { type: "slick-sc-think-tank", label: "SC — Think Tank", Icon: FileText },
    { type: "slick-sc-customer-stories", label: "SC — Customer Stories", Icon: MessageSquareQuote },
    { type: "slick-sc-trust-metrics", label: "SC — Trust Metrics", Icon: TrendingUp },
    { type: "slick-sc-integrations",      label: "SC — Integrations",      Icon: Puzzle      },
    { type: "slick-sc-product-showcase",  label: "SC — Product Showcase",  Icon: MonitorPlay },
    { type: "slick-sc-product-cards",     label: "SC — Product Cards",      Icon: Grid2x2     },
    { type: "slick-sc-ai-commerce",       label: "SC — AI Commerce Stack", Icon: Grid2x2     },
    { type: "slick-sc-blog-insights",     label: "SC — Blog Insights",     Icon: BookOpen    },
  ]},
  { name: "DMS Landing", items: [
    { type: "slick-dms-hero", label: "DMS — Hero", Icon: Sparkles },
    { type: "slick-dms-hero-v2", label: "DMS — Hero V2", Icon: Sparkles },
    { type: "slick-dms-comparison", label: "DMS — Comparison Slider", Icon: Columns },
    { type: "slick-dms-features", label: "DMS — Feature Tabs", Icon: ListOrdered },
    { type: "slick-dms-features-v2", label: "DMS — Feature Tabs V2", Icon: ListOrdered },
    { type: "slick-dms-agents", label: "DMS — AI Agents", Icon: Users },
    { type: "slick-dms-voice-agents", label: "DMS — Voice AI Agents", Icon: Mic },
    { type: "slick-dms-integrations", label: "DMS — Accounting Integrations", Icon: Puzzle },
    { type: "slick-dms-integrations-v2", label: "DMS — Integrations V2 (Centered)", Icon: Puzzle },
    { type: "slick-dms-guarantee", label: "DMS — 110% Guarantee", Icon: TrendingUp },
    { type: "slick-dms-cta", label: "DMS — CTA (Dark Hero)", Icon: Zap },
    { type: "slick-dms-deploy-metrics", label: "DMS — Deployment Metrics", Icon: BarChart3 },
    { type: "slick-dms-faq", label: "DMS — FAQ", Icon: HelpCircle },
  ]},
  { name: "eB2B Landing", items: [
    { type: "slick-eb2b-hero", label: "eB2B — Hero", Icon: Sparkles },
    { type: "slick-eb2b-hero-v2", label: "eB2B — Hero V2", Icon: Sparkles },
    { type: "slick-eb2b-scale", label: "eB2B — Platform Scale", Icon: TrendingUp },
    { type: "slick-eb2b-why", label: "eB2B — Why SalesCode", Icon: MonitorPlay },
    { type: "slick-eb2b-features", label: "eB2B — Feature Cards", Icon: Grid2x2 },
    { type: "slick-eb2b-integrations", label: "eB2B — Integrations", Icon: Puzzle },
    { type: "slick-eb2b-impact", label: "eB2B — Proven Impact", Icon: BarChart3 },
    { type: "slick-eb2b-deployments", label: "eB2B — Our Deployments", Icon: Users },
    { type: "slick-eb2b-faq", label: "eB2B — FAQ", Icon: HelpCircle },
  ]},
  { name: "Clients", items: [
    { type: "slick-clients-hero",          label: "Clients — Hero",          Icon: Sparkles          },
    { type: "slick-clients-grid",          label: "Clients — Logo Grid",     Icon: Grid2x2           },
    { type: "slick-clients-testimonials",  label: "Clients — Testimonials",  Icon: MessageSquareQuote },
  ]},
  { name: "Blogs", items: [
    { type: "slick-blogs-hero", label: "Blogs — Hero", Icon: Sparkles },
  ]},
  { name: "Contact Us", items: [
    { type: "slick-contact-hero", label: "Contact — Hero", Icon: Sparkles },
  ]},
  { name: "Experience", items: [
    { type: "slick-experience-hero",  label: "Experience — Hero",  Icon: Sparkles   },
    { type: "slick-experience-video",  label: "Experience — Video",  Icon: MonitorPlay },
    { type: "slick-experience-topics", label: "Experience — Topics", Icon: ListOrdered },
    { type: "slick-exp-two-ways",              label: "Experience — Two Ways (Sessions + Workshops)", Icon: Columns          },
    { type: "slick-exp-ai-stack",              label: "Experience — AI Stack (6-card grid)",          Icon: Grid3x3           },
    { type: "slick-experience-testimonials",   label: "Experience — CPG Leaders Testimonials",       Icon: MessageSquareQuote },
  ]},
  { name: "Careers", items: [
    { type: "slick-careers-hero",  label: "Careers — Hero",  Icon: Sparkles },
    { type: "slick-careers-jobs",  label: "Careers — Open Positions (Keka)", Icon: Briefcase },
    { type: "slick-help-hero",     label: "Help Center — Hero", Icon: Sparkles },
    { type: "slick-careers-about",   label: "Careers — About",   Icon: FileText },
    { type: "slick-careers-culture", label: "Careers — Culture", Icon: Users   },
    { type: "slick-careers-expect",  label: "Careers — Expect",  Icon: Star       },
    { type: "slick-careers-process", label: "Careers — Process", Icon: ListOrdered },
    { type: "slick-careers-awards",  label: "Careers — Awards",  Icon: Tag        },
    { type: "slick-careers-life",    label: "Careers — Life",     Icon: ImageIcon  },
  ]},
  { name: "About Us", items: [
    { type: "slick-ab-hero", label: "About — Hero", Icon: Sparkles },
    { type: "slick-ab-hero-v2", label: "About — Hero V2", Icon: Sparkles },
    { type: "slick-ab-intro",            label: "About — Intro & Video",    Icon: MonitorPlay },
    { type: "slick-ab-mission-vision",   label: "About — Mission & Vision", Icon: BookOpen    },
    { type: "slick-ab-founder-banner", label: "About — Founder Banner", Icon: Star },
    { type: "slick-ab-stats", label: "About — Stats", Icon: BarChart3 },
    { type: "slick-ab-story", label: "About — Our Story", Icon: BookOpen },
    { type: "slick-ab-video", label: "About — Video", Icon: MonitorPlay },
    { type: "slick-ab-awards", label: "About — Awards", Icon: Tag },
    { type: "slick-ab-founders",    label: "About — Founders",        Icon: Users },
    { type: "slick-ab-founders-v2", label: "About — Founders V2 (Photo)", Icon: Users },
    { type: "slick-ab-founders-voice", label: "About — Founder's Voice (Videos)", Icon: MonitorPlay },
    { type: "slick-ab-investors", label: "About — Investors", Icon: TrendingUp },
    { type: "slick-ab-investors-v2", label: "About — Investors V2 (Carousel)", Icon: TrendingUp },
    { type: "slick-ab-team-section", label: "About — The Team (Tech + Biz)", Icon: Users },
    { type: "slick-ab-journey", label: "About — Our Journey (Timeline)", Icon: GitBranch },
    { type: "slick-ab-cta", label: "About — CTA", Icon: ArrowRightCircle },
  ]},
  { name: "Contact", items: [
    { type: "slick-sc-navbar", label: "SC — Navbar", Icon: Menu },
    { type: "slick-contact", label: "Contact — Form & Schedule", Icon: MessageSquare },
    { type: "slick-sc-contact-hs", label: "Contact — HubSpot Embed (native captcha)", Icon: MessageSquare },
    { type: "slick-lets-talk", label: "Contact — Let's Talk Journey", Icon: ListOrdered },
    { type: "slick-offices",    label: "Contact — Our Offices",     Icon: Grid2x2 },
    { type: "slick-offices-v2", label: "Contact — Our Offices V2",  Icon: Grid2x2 },
    { type: "slick-sc-footer", label: "SC — Footer (Teal)", Icon: PanelBottom },
    { type: "slick-sc-footer-v2", label: "SC — Footer V2 (White)", Icon: PanelBottom },
  ]},
  { name: "Saudi Presence", items: [
    { type: "slick-sc-saudi-hero",       label: "Saudi — Presence Hero",     Icon: Sparkles },
    { type: "slick-sc-saudi-leadership", label: "Saudi — Leadership Team",    Icon: Users },
    { type: "slick-sc-saudi-presence",   label: "Saudi — Presence Photos",   Icon: ImageIcon },
    { type: "slick-sc-saudi-platform",   label: "Saudi — Platform Image",    Icon: Layers },
    { type: "slick-sc-saudi-video",      label: "Saudi — Video Section",     Icon: Layers },
    { type: "slick-sc-saudi-products",   label: "Saudi — Products Grid",     Icon: Sparkles },
  ]},
  { name: "UPI Payments", items: [
    { type: "slick-sc-upi-hero",      label: "UPI — Hero",               Icon: Sparkles },
    { type: "slick-sc-upi-challenge", label: "UPI — Business Challenge", Icon: BarChart3 },
    { type: "slick-sc-upi-dark",      label: "UPI — Dark Explainer",     Icon: Layers },
    { type: "slick-sc-upi-how",       label: "UPI — How It Works",       Icon: List },
    { type: "slick-sc-upi-suite",     label: "UPI — Suite Fit",          Icon: Layers },
    { type: "slick-sc-upi-split",     label: "UPI — Features Split",     Icon: Sparkles },
    { type: "slick-sc-upi-proof",     label: "UPI — Proof",              Icon: BarChart3 },
    { type: "slick-sc-upi-related",   label: "UPI — Related Capabilities", Icon: Layers },
  ]},
  { name: "Sales Incentive", items: [
    { type: "slick-si-impact",        label: "Sales Incentive — Impact",       Icon: BarChart3 },
    { type: "slick-si-capabilities",  label: "Sales Incentive — Capabilities",  Icon: Layers },
    { type: "slick-si-darkpanel",     label: "Sales Incentive — Dark Panel",    Icon: Layers },
    { type: "slick-si-split",         label: "Sales Incentive — Split",         Icon: Columns },
    { type: "slick-si-proof",         label: "Sales Incentive — Proof",         Icon: BarChart3 },
  ]},
  { name: "AI Target Engine", items: [
    { type: "slick-ate-darkpanel",    label: "AI Target Engine — Dark Panel",   Icon: Layers },
    { type: "slick-ate-proof",        label: "AI Target Engine — Proof",        Icon: BarChart3 },
  ]},
  { name: "AI Task Engine", items: [
    { type: "slick-atk-capabilities", label: "AI Task Engine — Capabilities",   Icon: Layers },
    { type: "slick-atk-darkpanel",    label: "AI Task Engine — Dark Panel",     Icon: Layers },
    { type: "slick-atk-proof",        label: "AI Task Engine — Proof",          Icon: BarChart3 },
  ]},
  { name: "AI Analyst", items: [
    { type: "slick-aa-split",        label: "AI Analyst — Existing Stack Split", Icon: Layers },
    { type: "slick-aa-capabilities", label: "AI Analyst — Capabilities",         Icon: Layers },
  ]},
  { name: "Manager App", items: [
    { type: "slick-ma-hero",       label: "Manager App — Hero",                 Icon: Sparkles },
    { type: "slick-ma-problem",    label: "Manager App — Market Problem",       Icon: BarChart3 },
    { type: "slick-ma-signals",    label: "Manager App — Signal Layers",        Icon: List },
    { type: "slick-ma-decision",   label: "Manager App — Decision Intelligence", Icon: Layers },
    { type: "slick-ma-enterprise", label: "Manager App — Enterprise Ready",     Icon: Grid2x2 },
    { type: "slick-ma-signals-grid", label: "Manager App — Signal Grid",        Icon: Grid2x2 },
  ]},
  { name: "DMS Rural", items: [
    { type: "slick-rd-barriers",   label: "DMS Rural — Adoption Barriers",      Icon: List },
    { type: "slick-rd-showcase",   label: "DMS Rural — Month Showcase",         Icon: Sparkles },
    { type: "slick-rd-features",   label: "DMS Rural — Features",               Icon: Grid2x2 },
  ]},
  { name: "AI Coach", items: [
    { type: "slick-ac-hero",          label: "AI Coach — Hero",              Icon: Sparkles },
    { type: "slick-ac-how-it-works",  label: "AI Coach — How It Works",      Icon: ListOrdered },
    { type: "slick-ac-problem",       label: "AI Coach — Broken Coaching",   Icon: HelpCircle },
    { type: "slick-ac-capabilities",  label: "AI Coach — Capabilities",      Icon: Grid2x2 },
    { type: "slick-ac-stats",         label: "AI Coach — Impact Stats",      Icon: TrendingUp },
    { type: "slick-ac-execution",     label: "AI Coach — Built into Execution", Icon: Layers },
    { type: "slick-ac-pitch",         label: "AI Coach — Perfect Every Pitch", Icon: Zap },
    { type: "slick-ac-scenario",      label: "AI Coach — Coach in Any Scenario", Icon: Columns },
    { type: "slick-ac-launch",        label: "AI Coach — 2-Minute Launch",   Icon: BarChart3 },
    { type: "slick-ac-objections",    label: "AI Coach — Handle Objections", Icon: MessageSquare },
    { type: "slick-ac-backend",       label: "AI Coach — Backend to Frontend", Icon: Puzzle },
    { type: "slick-ac-cta",           label: "AI Coach — Final CTA",         Icon: Zap },
    { type: "slick-ac-brand-strip",   label: "AI Coach — Brand Strip",       Icon: Grid2x2 },
  ]},
  { name: "Delivery App (DMS)", items: [
    { type: "slick-da-hero",         label: "Delivery App — Hero",             Icon: Sparkles },
    { type: "slick-da-brand-strip",  label: "Delivery App — Brand Strip",      Icon: Grid2x2 },
    { type: "slick-da-problem",      label: "Delivery App — Market Problem",   Icon: TrendingUp },
    { type: "slick-da-darkpanel",    label: "Delivery App — Dark Panel",       Icon: Layers },
    { type: "slick-da-workflow",     label: "Delivery App — How It Works",     Icon: ListOrdered },
    { type: "slick-da-capabilities", label: "Delivery App — Capabilities",     Icon: Grid2x2 },
    { type: "slick-da-split",        label: "Delivery App — In-App Split",     Icon: Columns },
    { type: "slick-da-impact",       label: "Delivery App — Impact Cards",     Icon: BarChart3 },
    { type: "slick-da-proof",        label: "Delivery App — Proof",            Icon: TrendingUp },
    { type: "slick-da-cta",          label: "Delivery App — CTA Banner",       Icon: Zap },
  ]},
  { name: "Rural SFA", items: [
    { type: "slick-rs-hero",         label: "Rural SFA — Hero",              Icon: Sparkles },
    { type: "slick-rs-brand-strip",  label: "Rural SFA — Brand Strip",       Icon: Users },
    { type: "slick-rs-problem",      label: "Rural SFA — Market Problem",    Icon: BarChart3 },
    { type: "slick-rs-compare",      label: "Rural SFA — Compare Grid",      Icon: Columns },
    { type: "slick-rs-darkpanel",    label: "Rural SFA — Dark Panel",        Icon: Layers },
    { type: "slick-rs-problemgrid",  label: "Rural SFA — How It Works Grid", Icon: Grid2x2 },
    { type: "slick-rs-capabilities", label: "Rural SFA — Capabilities",      Icon: Zap },
    { type: "slick-rs-split",        label: "Rural SFA — In-App Split",      Icon: ListOrdered },
    { type: "slick-rs-impact",       label: "Rural SFA — Impact Cards",      Icon: TrendingUp },
  ]},
  { name: "Promo Engine", items: [
    { type: "slick-pe-hero",         label: "Promo Engine — Hero",           Icon: Sparkles },
    { type: "slick-pe-statbar",      label: "Promo Engine — Stat Bar",       Icon: TrendingUp },
    { type: "slick-pe-problem",      label: "Promo Engine — Market Problem", Icon: BarChart3 },
    { type: "slick-pe-darkpanel",    label: "Promo Engine — Dark Panel",     Icon: Layers },
    { type: "slick-pe-stages",       label: "Promo Engine — How It Works",   Icon: ListOrdered },
    { type: "slick-pe-capabilities", label: "Promo Engine — Capabilities",   Icon: Grid2x2 },
    { type: "slick-pe-split",        label: "Promo Engine — Lifecycle Split", Icon: Columns },
    { type: "slick-pe-impact",       label: "Promo Engine — Impact Cards",   Icon: TrendingUp },
    { type: "slick-pe-proof",        label: "Promo Engine — Reported Impact", Icon: BarChart3 },
    { type: "slick-pe-outcome-flow", label: "Promo Engine — Outcome Flow",  Icon: ListOrdered },
  ]},
  { name: "SCAI Vision (eB2B)", items: [
    { type: "slick-sv-hero",      label: "SCAI Vision — Hero",             Icon: Sparkles },
    { type: "slick-sv-scale",     label: "SCAI Vision — Scale / Trust",    Icon: TrendingUp },
    { type: "slick-sv-problem",   label: "SCAI Vision — Market Problem",   Icon: BarChart3 },
    { type: "slick-sv-darkpanel", label: "SCAI Vision — Dark Panel",       Icon: Layers },
    { type: "slick-sv-stages",    label: "SCAI Vision — How It Works",     Icon: ListOrdered },
    { type: "slick-sv-accuracy",  label: "SCAI Vision — Accuracy Bar",     Icon: BarChart },
    { type: "slick-sv-features",  label: "SCAI Vision — Six Checks Grid",  Icon: Grid2x2 },
    { type: "slick-sv-split",     label: "SCAI Vision — Split",            Icon: Columns },
    { type: "slick-sv-proof",     label: "SCAI Vision — Proof Cards",      Icon: Star },
    { type: "slick-sv-humantest", label: "SCAI Vision — Human Test",       Icon: MonitorPlay },
  ]},
  { name: "SCAI Vision (Modern Trade)", items: [
    { type: "slick-mt-hero",      label: "Modern Trade — Hero",              Icon: Sparkles },
    { type: "slick-mt-statbar",   label: "Modern Trade — Stat Bar",          Icon: TrendingUp },
    { type: "slick-mt-problem",   label: "Modern Trade — Market Problem",    Icon: BarChart3 },
    { type: "slick-mt-split",     label: "Modern Trade — Split",             Icon: Columns },
    { type: "slick-mt-icards",    label: "Modern Trade — Rich Impact Cards", Icon: Grid2x2 },
    { type: "slick-mt-darktabs",  label: "Modern Trade — Dark Tabbed Metrics", Icon: ListOrdered },
    { type: "slick-mt-darkpanel", label: "Modern Trade — Dark Panel",        Icon: Layers },
    { type: "slick-mt-features",  label: "Modern Trade — Feature Grid",      Icon: Grid },
    { type: "slick-mt-proof",     label: "Modern Trade — Proof Cards",       Icon: Star },
    { type: "slick-mt-trust",     label: "Modern Trade — Trust / Logos",     Icon: BarChart },
  ]},
  { name: "Urban DMS", items: [
    { type: "slick-ud-problem",  label: "Urban DMS — Market Problem",     Icon: BarChart3 },
    { type: "slick-ud-timeline", label: "Urban DMS — How It Works",       Icon: ListOrdered },
    { type: "slick-ud-impact",   label: "Urban DMS — Modules / Impact",   Icon: Grid2x2 },
  ]},
  { name: "CXO Conclave", items: [
    { type: "slick-conclave-hero",     label: "Conclave — Hero",          Icon: Sparkles },
    { type: "slick-conclave-trailer",  label: "Conclave — Trailer Video", Icon: MonitorPlay },
    { type: "slick-conclave-guest-scroller", label: "Conclave — Guest Scroller", Icon: Grid2x2 },
    { type: "slick-conclave-themes", label: "Conclave — Key Themes", Icon: Columns },
    { type: "slick-conclave-awards", label: "Conclave — Awards Grid", Icon: Grid2x2 },
    { type: "slick-conclave-reels", label: "Conclave — Highlight Reels", Icon: Grid2x2 },
    { type: "slick-conclave-leaders", label: "Conclave — CPG Leaders Carousel", Icon: MessageSquareQuote },
    { type: "slick-conclave-gallery", label: "Conclave — Photo Gallery", Icon: ImageIcon },
    { type: "slick-conclave-speakers", label: "Conclave — Speakers Grid", Icon: Grid2x2 },
    { type: "slick-conclave-agenda",   label: "Conclave — Agenda",        Icon: ListOrdered },
    { type: "slick-conclave-stats",    label: "Conclave — Stats",         Icon: TrendingUp },
    { type: "slick-conclave-register", label: "Conclave — Register Form", Icon: MessageSquare },
    { type: "slick-conclave-guests",   label: "Conclave — Guests Grid",   Icon: Grid2x2 },
  ]},
  { name: "SFA Landing", items: [
    { type: "slick-sfa-hero", label: "SFA — Hero", Icon: Sparkles },
    { type: "slick-sfa-hero-v2", label: "SFA — Hero V2", Icon: Sparkles },
    { type: "slick-sfa-ai-engine", label: "SFA — AI Engine", Icon: Grid2x2 },
    { type: "slick-sfa-guarantee", label: "SFA — Guarantee", Icon: TrendingUp },
    { type: "slick-sfa-insights", label: "SFA — CPG Insights", Icon: Sparkles },
    { type: "slick-sfa-revenue-loss", label: "SFA — Revenue Loss", Icon: TrendingUp },
    { type: "slick-sfa-typical", label: "SFA — Typical SFA", Icon: Sparkles },
    { type: "slick-sfa-showcase", label: "SFA — AI Native Showcase", Icon: Sparkles },
    { type: "slick-sfa-ai-engine-v2", label: "SFA — AI Engine V2", Icon: Grid2x2 },
    { type: "slick-sfa-guarantee-v2", label: "SFA — Guarantee V2", Icon: TrendingUp },
    { type: "slick-sfa-sales-team-cost", label: "SFA — Cost of a Legacy Sales Team", Icon: Users },
  ]},
  { name: "Slick Blocks", items: [
    { type: "slick-hero-split", label: "Hero Split Gradient", Icon: Sparkles },
    { type: "slick-hero-video", label: "Hero Centered Video", Icon: Star },
    { type: "slick-features-bento", label: "Features Bento Grid", Icon: Grid2x2 },
    { type: "slick-features-alternating", label: "Features Alternating", Icon: List },
    { type: "slick-pricing", label: "Pricing Cards", Icon: Tag },
    { type: "slick-testimonials-carousel", label: "Testimonials Carousel", Icon: MessageSquare },
    { type: "slick-testimonials-logos", label: "Testimonials Logos", Icon: Star },
    { type: "slick-stats", label: "Stats Counter", Icon: BarChart3 },
    { type: "slick-faq", label: "FAQ Accordion", Icon: HelpCircle },
    { type: "slick-cta-glass", label: "CTA Glass Banner", Icon: Zap },
    { type: "slick-team", label: "Team Grid", Icon: Users },
    { type: "slick-integrations", label: "Integrations Cloud", Icon: Grid2x2 },
    { type: "slick-blog-grid", label: "Blog Post Grid", Icon: BookOpen },
    { type: "slick-timeline", label: "Timeline Steps", Icon: GitBranch },
    { type: "slick-footer-complex", label: "Footer Complex", Icon: Layout },
    { type: "slick-app-download", label: "App Download", Icon: Download },
    { type: "slick-promo-banner", label: "Promo Banner", Icon: Megaphone },
    { type: "slick-app-showcase", label: "App Showcase (Scroll)", Icon: MonitorPlay },
  ]},
  { name: "SCAI Landing", items: [
    { type: "slick-scai-hero",           label: "SCAI — Hero",                Icon: Sparkles   },
    { type: "slick-scai-hero-v2",        label: "SCAI — Hero V2",             Icon: Sparkles   },
    { type: "slick-scai-how-it-works",   label: "SCAI — How It Works (Video)", Icon: MonitorPlay },
    { type: "slick-scai-capabilities",   label: "SCAI — Capabilities Hub",    Icon: Grid2x2    },
    { type: "slick-scai-why",            label: "SCAI — Why SCAI",            Icon: Sparkles   },
    { type: "slick-scai-video-showcase", label: "SCAI — Video Showcase",      Icon: MonitorPlay },
    { type: "slick-scai-agents",         label: "SCAI — Agent Ecosystem",     Icon: Users       },
    { type: "slick-scai-pilot",       label: "SCAI — Pilot Results",  Icon: TrendingUp },
    { type: "slick-scai-revenue",     label: "SCAI — Revenue Loss",   Icon: BarChart3  },
    { type: "slick-scai-quick-guide", label: "SCAI — Quick Guide",       Icon: BookOpen   },
    { type: "slick-scai-multilingual", label: "SCAI — Multilingual Voice Agent", Icon: Languages },
    { type: "slick-scai-final-cta",   label: "SCAI — Final CTA Banner",       Icon: Megaphone },
    { type: "slick-dare-to-compare",  label: "Dare to Compare",               Icon: TrendingUp },
    { type: "slick-scai-industry",    label: "SCAI — Industry Categories", Icon: Grid       },
    { type: "slick-scai-human-test",     label: "SCAI — Human Test",       Icon: MonitorPlay },
    { type: "slick-scai-global-showcase",  label: "SCAI — Global Showcase",  Icon: MonitorPlay },
    { type: "slick-scai-whatsapp-agent",   label: "SCAI — WhatsApp Agent",   Icon: MessageSquare },
    { type: "slick-scai-best-agent",       label: "SCAI — World's Best AI Sales Agent", Icon: BarChart3 },
    { type: "slick-scai-hoardings",        label: "SCAI — Sells Better than Humans", Icon: ImageIcon },
  ]},
  { name: "Urban SFA", items: [
    { type: "slick-su-hero",      label: "Urban SFA — Hero",             Icon: Sparkles },
    { type: "slick-su-scale",     label: "Urban SFA — Trust & Scale",    Icon: TrendingUp },
    { type: "slick-su-problem",   label: "Urban SFA — Market Problem",   Icon: BarChart3 },
    { type: "slick-su-lossrail",  label: "Urban SFA — Cost of Legacy",   Icon: BarChart },
    { type: "slick-su-timeline",  label: "Urban SFA — Day Timeline",     Icon: ListOrdered },
    { type: "slick-su-engine",    label: "Urban SFA — AI Engine",        Icon: Zap },
    { type: "slick-su-guarantee", label: "Urban SFA — Guarantee",        Icon: Star },
  ]},
  { name: "AI Supervisor", items: [
    { type: "slick-sn-hero",       label: "AI Supervisor — Hero",            Icon: Sparkles },
    { type: "slick-sn-scale",      label: "AI Supervisor — Platform Scale",  Icon: TrendingUp },
    { type: "slick-sn-problem",    label: "AI Supervisor — Time Crisis",     Icon: BarChart3 },
    { type: "slick-sn-howitworks", label: "AI Supervisor — How It Works",    Icon: ListOrdered },
    { type: "slick-sn-features",   label: "AI Supervisor — Features",        Icon: Grid2x2 },
    { type: "slick-sn-spotlight",  label: "AI Supervisor — Spotlight Split", Icon: Columns },
    { type: "slick-sn-darkcard",   label: "AI Supervisor — Dark Copilot",    Icon: Zap },
    { type: "slick-sn-recovery",   label: "AI Supervisor — Order Recovery",  Icon: ShoppingCart },
    { type: "slick-sn-proof",      label: "AI Supervisor — Proof Cards",     Icon: Star },
  ]},
  { name: "SCAI Vision", items: [
    { type: "slick-scai-vision-hero",      label: "SCAI Vision — Hero",       Icon: Layers },
    { type: "slick-scai-vision-insights",  label: "SCAI Vision — Insights",   Icon: Layers },
    { type: "slick-scai-vision-actions",      label: "SCAI Vision — Actions Grid", Icon: Layers },
    { type: "slick-scai-vision-revenue-loss",  label: "SCAI Vision — Revenue Loss",  Icon: Layers },
    { type: "slick-scai-vision-performance",   label: "SCAI Vision — Performance",    Icon: Layers },
    { type: "slick-scai-vision-channels",      label: "SCAI Vision — Every Channel",  Icon: Layers },
    { type: "slick-scai-vision-showcase",      label: "SCAI Vision — GT Showcase",    Icon: Layers },
    { type: "slick-scai-vision-results",       label: "SCAI Vision — Results Stats",  Icon: Layers },
    { type: "slick-scai-vision-stat-bar",      label: "SCAI Vision — Stat Bar",       Icon: Layers },
    { type: "slick-scai-vision-measures",      label: "SCAI Vision — Measures Tabs",  Icon: Layers },
    { type: "slick-scai-vision-security",      label: "SCAI Vision — Security",       Icon: Layers },
  ]},
  { name: "DigiVyapar", items: [
    { type: "slick-dv-hero", label: "DV — Hero", Icon: Sparkles },
    { type: "slick-dv-hero-v2", label: "DV — Hero V2", Icon: Sparkles },
    { type: "slick-dv-carousel", label: "DV — Platform Carousel", Icon: MonitorPlay },
    { type: "slick-dv-split", label: "DV — Split Section", Icon: Columns },
    { type: "slick-dv-register", label: "DV — Register Form", Icon: FileText },
    { type: "slick-dv-vision", label: "DV — Vision & Stats", Icon: TrendingUp },
    { type: "slick-dv-video-split", label: "DV — Video + Copy", Icon: MonitorPlay },
    { type: "slick-dv-video-pointers", label: "DV — Video + Pointers", Icon: MonitorPlay },
    { type: "slick-dv-agent", label: "DV — AI Agent Split", Icon: Sparkles },
    { type: "slick-dv-who", label: "DV — Who Can Onboard", Icon: Grid },
    { type: "slick-dv-download", label: "DV — Download App", Icon: Download },
  ]},
  { name: "Navigation", items: [
    { type: "nav-simple", label: "Nav Simple", Icon: Menu },
    { type: "nav-centered", label: "Nav Centered", Icon: AlignCenter },
  ]},
  { name: "Footer", items: [
    { type: "footer-simple", label: "Footer Simple", Icon: Layout },
    { type: "footer-columns", label: "Footer Columns", Icon: Columns },
  ]},
  { name: "Hero", items: [
    { type: "hero-centered", label: "Hero Centered", Icon: Star },
    { type: "hero-split", label: "Hero Split", Icon: LayoutTemplate },
    { type: "hero-gradient", label: "Hero Gradient", Icon: Sparkles },
    { type: "hero-centered-image", label: "Hero + Image", Icon: MonitorPlay },
  ]},
  { name: "Features", items: [
    { type: "features-3col", label: "Features 3 Column", Icon: Grid3x3 },
    { type: "features-4col", label: "Features 4 Column", Icon: Grid },
    { type: "features-alternating", label: "Features Alternating", Icon: ListOrdered },
    { type: "features-icon-cards", label: "Features Icon Cards", Icon: Zap },
  ]},
  { name: "Pricing", items: [
    { type: "pricing-modern", label: "Pricing Modern", Icon: CreditCard },
  ]},
  { name: "Social Proof", items: [
    { type: "testimonials", label: "Testimonials", Icon: Quote },
    { type: "testimonials-wall", label: "Testimonials Wall", Icon: MessageSquareQuote },
  ]},
  { name: "Team", items: [
    { type: "team-grid", label: "Team Grid", Icon: Users },
  ]},
  { name: "Stats", items: [
    { type: "stats-bar", label: "Stats Bar", Icon: BarChart },
    { type: "stats-bold", label: "Stats Bold", Icon: TrendingUp },
  ]},
  { name: "Process", items: [
    { type: "steps-process", label: "Steps Process", Icon: ArrowRightCircle },
  ]},
  { name: "Content", items: [
    { type: "text-image", label: "Text + Image", Icon: ImageIcon },
    { type: "logo-grid", label: "Logo Grid", Icon: Grid2x2 },
    { type: "faq", label: "FAQ", Icon: HelpCircle },
  ]},
  { name: "CTA", items: [
    { type: "cta-banner", label: "CTA Banner", Icon: Megaphone },
    { type: "cta-banner-gradient", label: "CTA Gradient", Icon: Sparkles },
  ]},
  { name: "Blog", items: [
    { type: "blog-preview", label: "Blog Preview", Icon: FileText },
  ]},
];

const LAYOUTS: { variant: LayoutVariant; label: string; cols: number[] }[] = [
  { variant: "1", label: "Full width", cols: [1] },
  { variant: "2", label: "2 columns", cols: [1, 1] },
  { variant: "3", label: "3 columns", cols: [1, 1, 1] },
  { variant: "1-2", label: "1/3 · 2/3", cols: [1, 2] },
  { variant: "2-1", label: "2/3 · 1/3", cols: [2, 1] },
  { variant: "4", label: "4 columns", cols: [1, 1, 1, 1] },
];

export function AddSectionDrawer({
  open, onClose, onPickTemplate, onPickLayout,
}: {
  open: boolean;
  onClose: () => void;
  onPickTemplate: (t: TemplateBlockType) => void;
  onPickLayout: (l: LayoutVariant) => void;
}) {
  const [tab, setTab] = useState<"templates" | "layouts">("templates");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filteredGroups = useMemo(() =>
    GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(({ label, type }) =>
        !q || label.toLowerCase().includes(q) || type.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0),
  [q]);

  if (!open) return null;

  return (
    <aside
      data-builder-panel
      className="w-[320px] shrink-0 flex flex-col text-white border-l border-slate-800"
      style={{ background: "#0f172a" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="text-sm font-semibold">Add section</div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 pb-transition"><X size={14} /></button>
      </div>
      <div className="flex border-b border-slate-800 shrink-0">
        {([["templates","Templates"],["layouts","Blank Layouts"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2.5 text-sm pb-transition border-b-2 ${
              tab === k ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-7 pr-2 py-1.5 text-sm rounded-md bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 pb-transition"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {tab === "templates" ? (
          <div className="py-2">
            {filteredGroups.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-slate-400">No templates match "{search}"</div>
            )}
            {filteredGroups.map((g) => {
              const isCollapsed = !q && collapsed[g.name];
              return (
                <div key={g.name} className="border-b border-slate-800/60 last:border-b-0">
                  <button
                    onClick={() => setCollapsed((c) => ({ ...c, [g.name]: !c[g.name] }))}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-800/40 pb-transition"
                  >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    <span className="text-sm font-semibold flex-1">{g.name}</span>
                    <span className="text-xs text-slate-400">{g.items.length}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                      {g.items.map(({ type, label, Icon }) => (
                        <button
                          key={type}
                          onClick={() => onPickTemplate(type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-md bg-slate-800/40 hover:bg-slate-700 hover:ring-1 hover:ring-blue-500 pb-transition"
                        >
                          <Icon size={22} className="text-slate-300" />
                          <span className="text-[11px] text-center text-slate-200 leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-4">
              Choose a column structure. You can add widgets inside each column.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {LAYOUTS.map((l) => (
                <button
                  key={l.variant}
                  onClick={() => onPickLayout(l.variant)}
                  className="flex flex-col gap-2 p-3 rounded-md bg-slate-800/40 hover:bg-slate-700 hover:ring-1 hover:ring-blue-500 pb-transition"
                >
                  <div
                    className="grid gap-1 h-14"
                    style={{ gridTemplateColumns: l.cols.map(c => `${c}fr`).join(" ") }}
                  >
                    {l.cols.map((_, i) => <div key={i} className="rounded-sm bg-slate-500" />)}
                  </div>
                  <span className="text-xs text-slate-200 text-center">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
