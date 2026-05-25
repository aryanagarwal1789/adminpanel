import type { BlockType } from "./types";

export type ButtonField = { label: string; url: string; variant: "primary" | "secondary" | "outline" | "ghost" };
export type LinkField = { label: string; url: string };

export const DEFAULT_FIELDS: Record<Exclude<BlockType, "layout">, Record<string, unknown>> = {
  "nav-simple": {
    logoImage: "",
    logoText: "Acme",
    cta: { label: "Get started", url: "#", variant: "primary" } as ButtonField,
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
};
