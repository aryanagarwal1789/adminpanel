import type { BlockType } from "./types";

export type ButtonField = { label: string; url: string; variant: "primary" | "secondary" | "outline" | "ghost"; color?: string; textColor?: string };
export type LinkField = { label: string; url: string };

export const DEFAULT_FIELDS: Record<Exclude<BlockType, "layout">, Record<string, unknown>> = {
  "nav-simple": {
    logoImage: "",
    logoText: "Acme",
    cta: { label: "Get started", url: "#", variant: "primary" } as ButtonField,
    ctaSecondary: { label: "Log in", url: "#", variant: "ghost" } as ButtonField,
    links: [
      { label: "Home", url: "#" },
      { label: "About", url: "#" },
      { label: "Pricing", url: "#" },
    ] as LinkField[],
  },
  "nav-centered": {
    logoImage: "",
    logoText: "Acme",
    links: [
      { label: "Home", url: "#" },
      { label: "Features", url: "#" },
      { label: "Pricing", url: "#" },
      { label: "Contact", url: "#" },
    ] as LinkField[],
  },
  "footer-simple": {
    logoImage: "",
    logoText: "Acme",
    copyright: "© 2025 Acme Inc.",
    links: [
      { label: "Privacy", url: "#" },
      { label: "Terms", url: "#" },
      { label: "Contact", url: "#" },
    ] as LinkField[],
  },
  "footer-columns": {
    logoImage: "",
    logoText: "Acme",
    tagline: "Build better websites.",
    copyright: "© 2025 Acme Inc.",
    col1Title: "Product",
    col1Links: [
      { label: "Features", url: "#" },
      { label: "Pricing", url: "#" },
      { label: "Docs", url: "#" },
    ] as LinkField[],
    col2Title: "Company",
    col2Links: [
      { label: "About", url: "#" },
      { label: "Blog", url: "#" },
      { label: "Careers", url: "#" },
    ] as LinkField[],
    col3Title: "Legal",
    col3Links: [
      { label: "Privacy", url: "#" },
      { label: "Terms", url: "#" },
      { label: "Cookies", url: "#" },
    ] as LinkField[],
  },
  "hero-centered": {
    headline: "Build beautiful websites",
    subtext: "No code required. Launch in minutes.",
    primaryCta: { label: "Start free", url: "#", variant: "primary" } as ButtonField,
    secondaryCta: { label: "See demo", url: "#", variant: "outline" } as ButtonField,
    bgImage: "",
  },
  "hero-split": {
    headline: "Launch faster than ever",
    subtext: "Ship production-ready pages without writing code.",
    cta: { label: "Get started", url: "#", variant: "primary" } as ButtonField,
    image: "",
    imageRight: true,
  },
  "features-3col": {
    title: "Why choose us",
    subtext: "Everything you need to build and grow.",
    features: [
      { icon: "⚡", title: "Lightning fast", description: "Build pages in seconds." },
      { icon: "🎨", title: "Beautiful design", description: "Stunning templates included." },
      { icon: "🔧", title: "Customizable", description: "Tweak every pixel." },
    ],
  },
  "features-4col": {
    title: "Everything you need",
    subtext: "Powerful features to ship faster.",
    features: [
      { icon: "⚡", title: "Fast", description: "Lightning quick performance." },
      { icon: "🎨", title: "Beautiful", description: "Designed with care." },
      { icon: "🔧", title: "Flexible", description: "Customize anything." },
      { icon: "🚀", title: "Scalable", description: "Grows with your team." },
    ],
  },
  "text-image": {
    headline: "A better way to build",
    subtext: "Pair powerful tools with a beautiful interface that scales with your team.",
    image: "",
    imageRight: true,
  },
  "stats-bar": {
    stats: [
      { number: "10,000", label: "Users", prefix: "", suffix: "+" },
      { number: "99.9", label: "Uptime", prefix: "", suffix: "%" },
      { number: "50", label: "Countries", prefix: "", suffix: "+" },
      { number: "24/7", label: "Support", prefix: "", suffix: "" },
    ],
  },
  testimonials: {
    items: [
      { quote: "This product changed how our team ships.", author: "Jane Doe", role: "CEO, Company", avatar: "" },
      { quote: "Best decision we made this year.", author: "John Smith", role: "CTO, Startup", avatar: "" },
      { quote: "I can't imagine working without it.", author: "Alex Lee", role: "PM, Agency", avatar: "" },
    ],
  },
  "logo-grid": {
    title: "Trusted by leading teams",
    logos: Array.from({ length: 6 }).map((_, i) => ({ src: "", alt: `Logo ${i + 1}` })),
  },
  "cta-banner": {
    headline: "Ready to get started?",
    subtext: "Join thousands of teams already building with PageBuilder.",
    button: { label: "Get started", url: "#", variant: "primary" } as ButtonField,
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      { question: "How does it work?", answer: "Sign up and start building in minutes." },
      { question: "Is there a free plan?", answer: "Yes, our free plan includes core features." },
      { question: "Can I cancel anytime?", answer: "Absolutely — no contracts." },
      { question: "Do you offer support?", answer: "24/7 support on all paid plans." },
    ],
  },
  "blog-preview": {
    title: "From our blog",
    subtitle: "Thoughts, ideas, and insights from our team.",
    count: 3,
    ctaLabel: "View all posts",
    ctaUrl: "/blog",
  },
  "hero-gradient": {
    badge: "✦ New — AI-powered platform",
    headline: "Build faster with\nless friction",
    subtext: "The modern platform that helps teams ship products 2× faster. Loved by 10,000+ companies.",
    primaryCta: { label: "Start free", url: "#", variant: "primary" } as ButtonField,
    secondaryCta: { label: "See demo", url: "#", variant: "ghost" } as ButtonField,
    image: "",
  },
  "hero-centered-image": {
    badge: "Trusted by 10,000+ teams",
    headline: "The website builder\nyour team will love",
    subtext: "Design beautiful pages without writing code. Publish in minutes.",
    primaryCta: { label: "Get started free", url: "#", variant: "primary" } as ButtonField,
    secondaryCta: { label: "View demo", url: "#", variant: "outline" } as ButtonField,
    image: "https://placehold.co/1200x600/f1f5f9/94a3b8?text=Product+Screenshot",
  },
  "features-alternating": {
    title: "Everything you need to grow",
    subtext: "Powerful features built for modern teams",
    items: [
      { tag: "Design", title: "Drag-and-drop page builder", description: "Create stunning pages visually. No design skills needed. Hundreds of ready-made blocks.", image: "https://placehold.co/600x400/eff6ff/3b82f6?text=Feature+1", ctaLabel: "Learn more", ctaUrl: "#" },
      { tag: "Performance", title: "Blazing fast by default", description: "Every page is automatically optimised for Core Web Vitals. Your visitors get instant load times.", image: "https://placehold.co/600x400/f0fdf4/22c55e?text=Feature+2", ctaLabel: "Learn more", ctaUrl: "#" },
      { tag: "Analytics", title: "Built-in analytics dashboard", description: "See who visits your site, where they come from, and what they do. No third-party tools needed.", image: "https://placehold.co/600x400/fdf4ff/a855f7?text=Feature+3", ctaLabel: "Learn more", ctaUrl: "#" },
    ],
  },
  "features-icon-cards": {
    title: "Why teams choose us",
    subtext: "Built for speed, designed for scale",
    columns: 3,
    features: [
      { icon: "⚡", iconBg: "#eff6ff", title: "Lightning fast", description: "Pages load in under 200ms with our global CDN." },
      { icon: "🎨", iconBg: "#fdf4ff", title: "Beautiful templates", description: "50+ professionally designed templates to start from." },
      { icon: "🔒", iconBg: "#f0fdf4", title: "Enterprise security", description: "SOC2 compliant with 99.9% uptime SLA." },
      { icon: "📊", iconBg: "#fff7ed", title: "Smart analytics", description: "Understand your audience with built-in insights." },
      { icon: "🤝", iconBg: "#fef2f2", title: "Team collaboration", description: "Work together in real-time with live cursors." },
      { icon: "🔌", iconBg: "#f8fafc", title: "Integrations", description: "Connect with 100+ tools you already use." },
    ],
  },
  "pricing-modern": {
    title: "Simple, transparent pricing",
    subtext: "No hidden fees. Cancel anytime.",
    plans: [
      { name: "Starter", price: "$0", period: "/month", description: "Perfect for personal projects", highlighted: false, features: ["5 pages", "Custom domain", "Basic analytics", "Community support"], cta: { label: "Get started", url: "#", variant: "outline" } },
      { name: "Pro", price: "$29", period: "/month", description: "For growing businesses", highlighted: true, features: ["Unlimited pages", "Custom domain", "Advanced analytics", "Priority support", "Remove branding", "A/B testing"], cta: { label: "Start free trial", url: "#", variant: "primary" } },
      { name: "Enterprise", price: "$99", period: "/month", description: "For large teams", highlighted: false, features: ["Everything in Pro", "SSO / SAML", "Dedicated support", "Custom contracts", "SLA guarantee", "On-premise option"], cta: { label: "Contact sales", url: "#", variant: "outline" } },
    ],
  },
  "testimonials-wall": {
    title: "Loved by thousands of teams",
    items: [
      { quote: "This builder saved us months of development time. Our marketing team now ships landing pages independently.", author: "Sarah Chen", role: "Head of Marketing", company: "Acme Corp", stars: 5 },
      { quote: "The templates are absolutely beautiful. We went from zero to live website in one afternoon.", author: "Marcus Williams", role: "Founder", company: "BuildFast", stars: 5 },
      { quote: "Finally a no-code tool that doesn't feel like a compromise. Our dev team actually approves.", author: "Priya Patel", role: "CTO", company: "ScaleUp", stars: 5 },
      { quote: "We cut our web production costs by 60%. The ROI was immediate.", author: "James Liu", role: "VP Product", company: "GrowthCo", stars: 5 },
      { quote: "Best page builder I've used in 10 years. The AI suggestions are a game changer.", author: "Elena Rodriguez", role: "Designer", company: "Studio R", stars: 5 },
      { quote: "Our conversion rate went up 34% after rebuilding our landing page with this tool.", author: "Tom Bergmann", role: "Growth Lead", company: "Fintech Inc", stars: 5 },
    ],
  },
  "team-grid": {
    title: "Meet the team",
    subtext: "The people building the future of web design",
    members: [
      { name: "Alex Johnson", role: "CEO & Co-founder", avatar: "https://placehold.co/300x300/e0e7ff/4f46e5?text=AJ", linkedin: "#" },
      { name: "Maria Garcia", role: "Head of Design", avatar: "https://placehold.co/300x300/fce7f3/db2777?text=MG", linkedin: "#" },
      { name: "David Kim", role: "Lead Engineer", avatar: "https://placehold.co/300x300/d1fae5/059669?text=DK", linkedin: "#" },
      { name: "Sarah Brown", role: "Head of Product", avatar: "https://placehold.co/300x300/fef3c7/d97706?text=SB", linkedin: "#" },
    ],
  },
  "stats-bold": {
    title: "Trusted by teams worldwide",
    stats: [
      { number: "50K", suffix: "+", label: "Active users" },
      { number: "99.9", suffix: "%", label: "Uptime SLA" },
      { number: "2×", suffix: "", label: "Faster launches" },
      { number: "4.9", suffix: "★", label: "Average rating" },
    ],
  },
  "steps-process": {
    title: "Get started in minutes",
    subtext: "No credit card required",
    steps: [
      { number: "01", title: "Create your account", description: "Sign up free in 30 seconds. No credit card needed." },
      { number: "02", title: "Choose a template", description: "Pick from 50+ professionally designed templates." },
      { number: "03", title: "Customise & publish", description: "Edit content, add your brand, and go live instantly." },
    ],
  },
  "cta-banner-gradient": {
    headline: "Ready to build something amazing?",
    subtext: "Join 50,000+ teams already using our platform. Free forever for small teams.",
    primaryCta: { label: "Start for free", url: "#", variant: "primary" } as ButtonField,
    secondaryCta: { label: "Talk to sales", url: "#", variant: "ghost" } as ButtonField,
  },
  "hero-salescode": {
    badge: "World's First AI Native Platform for CPG Sales",
    title: "All your CPG Sales on One Platform.",
    description: "Build your SFA, DMS, eB2B and AI agents...",
    ctaText: "Build Your Stack",
    ctaUrl: "#product-selection",
  },
  "impact-salescode": {
    title: "Business Impact Guaranteed\nwith AI for SFA and eB2B for CPG Sales",
    videoUrl: "https://salescode.ai/wp-content/uploads/2025/09/flow-animaiton-solution-to-deployment3.mp4",
    stats: [
      { value: "35", suffix: "%", description: "Reduction in Cost-to-Serve" },
      { value: "18", suffix: "%", description: "Increase in Distribution" },
      { value: "5", suffix: "%", description: "Reduction in Daily Sales Loss" },
      { value: "3", suffix: "x", description: "Minimum Sales Uplift" },
    ],
  },
  "clients-salescode": {
    title: "Privileged to work with Top CPG Brands",
    sectionId: "cpg-brands",
  },
  "security-salescode": {
    heading: "Your Data is Safe with Us",
    certs: [
      { url: "https://salescode.ai/wp-content/uploads/2025/09/GDPR-1-r23yrj45d5eecfx8318k9wj5vikzl0sfdvoueb8d4w.webp", alt: "GDPR" },
      { url: "https://salescode.ai/wp-content/uploads/2025/09/ISO-1-r23yqigfym07rneh13e42ns6phlo8tqw8u8woiqpvk.webp", alt: "ISO 27001" },
      { url: "https://salescode.ai/wp-content/uploads/2025/09/SOC-1-r23ytr0fi2frrap64hrunudcd9n6ralm0v546txwg0.webp", alt: "SOC 2 Type 2" },
    ],
  },
  "experience-video-salescode": {
    videoUrl: "https://salescode.ai/wp-content/uploads/2025/09/experience-center-vid-for-website-video2.mp4",
    title: "SalesCode Experience Center",
    subtitle: "Experience the 'Code of Future-Ready Sales Teams & Trade'",
    linkText: "",
    linkUrl: "",
  },
  "cta-salescode": {
    badge: "Ready to Deploy",
    heading: "Ready to build your AI-powered sales platform?",
    subtext: "Start with SFA, DMS, or eB2B — or combine all three with SCAI. Go live in weeks with guaranteed, contractual results.",
    ctaText: "Build Your Stack →",
    ctaUrl: "#product-selection",
  },
  "navbar-salescode-slot": {},
  "product-selection-slot": {},
  "platform-features-slot": {},
  "integrations-slot": {},
  "blogs-section-slot": {},
  "footer-salescode-slot": {},
  "about-page-slot": {},
  "clients-page-slot": {},
  "contact-page-slot": {},
  "blog-page-slot": {},
};
