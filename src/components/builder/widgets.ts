import {
  Type, Heading1, Image as ImageIcon, MousePointerClick, Minus, MoveVertical,
  Sparkles, CreditCard, Video, FormInput, List as ListIcon, ChevronsUpDown,
  Tag, BarChart3, LayoutGrid, MessageSquare, CheckSquare, Hash, Bookmark,
  Menu, Languages, Filter, AlignLeft, Search, Layers, Clock, Layout as LayoutIcon,
  Volume2, FolderOpen, Images, Play, Mail, FileText, Rss, Calendar,
  Wallet, Package, GripHorizontal, Columns,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ButtonField } from "./defaults";

export type WidgetType = string;

export interface Widget {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
}

export interface WidgetMeta {
  label: string;
  Icon: LucideIcon;
}

export const WIDGET_REGISTRY: Record<string, WidgetMeta> = {
  row: { label: "Row (horizontal)", Icon: Columns },
  heading: { label: "Heading", Icon: Heading1 },
  paragraph: { label: "Paragraph", Icon: Type },
  text: { label: "Text", Icon: Type },
  "rich-text": { label: "Rich Text", Icon: AlignLeft },
  "section-heading": { label: "Section Heading", Icon: Heading1 },
  "section-header": { label: "Section Header", Icon: Heading1 },
  image: { label: "Image", Icon: ImageIcon },
  button: { label: "Button", Icon: MousePointerClick },
  divider: { label: "Divider", Icon: Minus },
  spacer: { label: "Spacer", Icon: MoveVertical },
  "horizontal-spacer": { label: "Horizontal Spacer", Icon: GripHorizontal },
  icon: { label: "Icon", Icon: Sparkles },
  card: { label: "Card", Icon: CreditCard },
  video: { label: "Video", Icon: Video },
  "video-embed": { label: "Video Embed", Icon: Play },
  form: { label: "Form", Icon: FormInput },
  list: { label: "List", Icon: ListIcon },
  accordion: { label: "Accordion", Icon: ChevronsUpDown },
  "pricing-card": { label: "Pricing Card", Icon: Tag },
  metrics: { label: "Metrics", Icon: BarChart3 },
  "image-grid": { label: "Image Grid", Icon: LayoutGrid },
  "testimonial-slider": { label: "Testimonial Slider", Icon: MessageSquare },
  "feature-list": { label: "Feature List", Icon: CheckSquare },
  logo: { label: "Logo", Icon: Hash },
  anchor: { label: "Anchor", Icon: Bookmark },
  "horizontal-menu": { label: "Horizontal Menu", Icon: Menu },
  "language-switcher": { label: "Language Switcher", Icon: Languages },
  "navigation-menu": { label: "Navigation Menu", Icon: Menu },
  "post-filter": { label: "Post Filter", Icon: Filter },
  "search-input": { label: "Search Input", Icon: Search },
  tabs: { label: "Tabs", Icon: Layers },
  countdown: { label: "Countdown Timer", Icon: Clock },
  "image-text": { label: "Image and Text", Icon: LayoutIcon },
  "site-header": { label: "Site Header", Icon: LayoutIcon },
  "site-search-input": { label: "Site Search Input", Icon: Search },
  "site-search-results": { label: "Site Search Results", Icon: Search },
  "audio-player": { label: "Audio Player", Icon: Volume2 },
  "content-library": { label: "Content Library", Icon: FolderOpen },
  "image-slider": { label: "Image Slider", Icon: Images },
  "logo-grid": { label: "Logo Grid", Icon: LayoutGrid },
  gallery: { label: "Gallery", Icon: Images },
  "blog-email-subscription": { label: "Blog Email Subscription", Icon: Mail },
  "post-listing": { label: "Post Listing", Icon: FileText },
  "recent-blog-posts": { label: "Recent Blog Posts", Icon: FileText },
  "rss-listing": { label: "RSS Listing", Icon: Rss },
  meetings: { label: "Meetings", Icon: Calendar },
  payment: { label: "Payment", Icon: Wallet },
  product: { label: "Product", Icon: Package },
};

export interface WidgetCategory { key: string; name: string; types: WidgetType[] }

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  { key: "theme", name: "Theme", types: [
    "row","accordion","anchor","button","card","countdown","heading",
    "horizontal-menu","language-switcher","navigation-menu","post-filter","rich-text",
    "search-input","section-header","spacer","tabs","text","video",
  ]},
  { key: "text", name: "Text", types: ["heading","metrics","rich-text","section-heading"] },
  { key: "design", name: "Design", types: [
    "row","accordion","card","divider","horizontal-menu","horizontal-spacer",
    "image-text","pricing-card","site-header","tabs",
  ]},
  { key: "functionality", name: "Functionality", types: ["anchor","site-search-input","site-search-results"] },
  { key: "forms-buttons", name: "Forms and Buttons", types: ["button","form"] },
  { key: "body-content", name: "Body Content", types: ["countdown","feature-list","list","testimonial-slider"] },
  { key: "media", name: "Media", types: [
    "audio-player","content-library","icon","image","image-grid","image-slider",
    "logo","logo-grid","video","video-embed","gallery",
  ]},
  { key: "blog", name: "Blog", types: [
    "blog-email-subscription","post-filter","post-listing","recent-blog-posts","rss-listing",
  ]},
  { key: "crm", name: "CRM", types: ["meetings","payment","product"] },
];

// Editable types — anything else inserts a placeholder.
export const EDITABLE_TYPES = new Set<string>([
  "row",
  "heading","paragraph","text","rich-text","section-heading","section-header",
  "image","button","divider","spacer","icon","card","video","video-embed",
  "form","list","accordion","pricing-card","metrics","image-grid",
  "testimonial-slider","feature-list","logo",
  // new widgets
  "countdown","tabs","horizontal-spacer","anchor","image-text",
  "horizontal-menu","navigation-menu","logo-grid","gallery","image-slider",
  "search-input","recent-blog-posts","post-listing","blog-email-subscription",
  "language-switcher","audio-player","site-header","post-filter",
  "rss-listing","meetings","payment","product",
]);

const defaultButton: ButtonField = { label: "Click me", url: "#", variant: "primary" };

export const WIDGET_DEFAULTS: Record<string, Record<string, unknown>> = {
  row: { cols: [[], []], weights: [1, 1], gap: 16 },
  heading: { text: "Heading", level: "h2", align: "left", color: "#0f172a" },
  "section-heading": { text: "Section heading", level: "h2", align: "left", color: "#0f172a" },
  "section-header": { text: "Section header", level: "h2", align: "left", color: "#0f172a" },
  paragraph: { text: "Add your paragraph text here.", size: "base", align: "left", color: "#334155" },
  text: { text: "Add your text here.", size: "base", align: "left", color: "#334155" },
  "rich-text": { text: "Rich text content goes here.", size: "base", align: "left", color: "#334155" },
  image: { src: "", alt: "", width: 100, radius: 8 },
  button: { label: "Click me", url: "#", variant: "primary", align: "left", fullWidth: false },
  divider: { style: "solid", color: "#e2e8f0", thickness: 1 },
  spacer: { height: 40 },
  icon: { icon: "✨", size: 32, color: "#3b82f6", align: "left" },
  card: { title: "Card title", description: "Card description.", image: "", buttonLabel: "Learn more", buttonUrl: "#" },
  video: { url: "", aspect: "16:9" },
  "video-embed": { url: "", aspect: "16:9" },
  form: { name: "Contact form", submitLabel: "Submit" },
  list: { items: [{ text: "Item 1" }, { text: "Item 2" }, { text: "Item 3" }], style: "bullet" },
  accordion: {
    items: [
      { title: "What is included?", body: "Everything you need to get started in minutes." },
      { title: "How does billing work?", body: "" },
      { title: "Can I cancel anytime?", body: "" },
    ],
    allowMultiple: false,
  },
  "pricing-card": {
    plan: "Pro", price: "$29", period: "/mo",
    features: [{ text: "Feature one" }, { text: "Feature two" }, { text: "Feature three" }],
    cta: defaultButton,
    highlighted: false,
  },
  metrics: {
    items: [
      { number: "100+", label: "Users", description: "Active monthly users" },
      { number: "99.9%", label: "Uptime", description: "Guaranteed SLA" },
    ],
  },
  "image-grid": {
    images: [{ src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }],
    columns: "3",
  },
  "testimonial-slider": {
    items: [
      { quote: "Amazing product!", author: "Jane Doe", role: "CEO", avatar: "" },
    ],
  },
  "feature-list": {
    items: [
      { icon: "⚡", text: "Lightning fast performance" },
      { icon: "🔒", text: "Secure by default" },
      { icon: "✨", text: "Delightful experience" },
    ],
  },
  logo: { src: "", alt: "Logo", link: "#", width: 120 },
  countdown: {
    targetDate: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 16); })(),
    label: "Offer ends in",
    bgColor: "#1e3a8a",
    textColor: "#ffffff",
    labelColor: "#93c5fd",
  },
  tabs: {
    items: [
      { title: "Tab 1", content: "Content for tab 1." },
      { title: "Tab 2", content: "Content for tab 2." },
    ],
    activeColor: "#3b82f6",
    inactiveColor: "#64748b",
  },
  "horizontal-spacer": { height: 1, color: "#e2e8f0", width: 100 },
  anchor: { id: "section-1", label: "" },
  "image-text": {
    image: "",
    heading: "Heading",
    text: "Add your description here.",
    layout: "left",
    ctaLabel: "Learn more",
    ctaUrl: "#",
  },
  "horizontal-menu": {
    items: [{ label: "Home", url: "#" }, { label: "About", url: "#" }, { label: "Contact", url: "#" }],
    align: "left",
    gap: 24,
    color: "#0f172a",
    hoverColor: "#3b82f6",
    fontSize: 14,
  },
  "navigation-menu": {
    items: [{ label: "Home", url: "#" }, { label: "About", url: "#" }, { label: "Contact", url: "#" }],
    align: "left",
    gap: 24,
    color: "#0f172a",
    hoverColor: "#3b82f6",
    fontSize: 14,
  },
  "logo-grid": {
    logos: [{ src: "", alt: "Logo 1", url: "#" }, { src: "", alt: "Logo 2", url: "#" }],
    columns: 4,
    grayscale: false,
  },
  gallery: {
    images: [{ src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }],
    columns: 3,
    gap: 8,
    radius: 4,
  },
  "image-slider": {
    images: [{ src: "", alt: "" }],
    aspect: "16:9",
    radius: 8,
  },
  "search-input": {
    placeholder: "Search...",
    buttonLabel: "Search",
    bgColor: "#ffffff",
    borderColor: "#e2e8f0",
  },
  "recent-blog-posts": { count: 3, title: "Recent Posts", columns: 3 },
  "post-listing": { title: "All Posts", columns: 3 },
  "blog-email-subscription": {
    title: "Subscribe to our newsletter",
    subtitle: "Get the latest posts",
    placeholder: "Your email",
    buttonLabel: "Subscribe",
    bgColor: "#eff6ff",
    accentColor: "#3b82f6",
  },
  "language-switcher": {
    languages: [{ code: "en", label: "English" }, { code: "es", label: "Español" }],
    current: "en",
  },
  "audio-player": { src: "", title: "Audio", bgColor: "#1e293b", textColor: "#ffffff" },
  "site-header": {
    logoText: "Site",
    logoImage: "",
    links: [{ label: "Home", url: "#" }, { label: "About", url: "#" }],
    ctaLabel: "Get started",
    ctaUrl: "#",
    bgColor: "#0f172a",
    textColor: "#ffffff",
  },
  "post-filter": {
    tags: [{ label: "All" }, { label: "News" }, { label: "Tutorial" }],
    activeColor: "#3b82f6",
  },
  "rss-listing": { feedUrl: "", title: "RSS Feed", count: 5 },
  meetings: {
    embedUrl: "",
    title: "Book a Meeting",
    buttonLabel: "Schedule",
    buttonUrl: "#",
    bgColor: "#f8fafc",
  },
  payment: {
    title: "Complete Purchase",
    amount: "$29",
    description: "",
    buttonLabel: "Pay now",
    bgColor: "#ffffff",
    accentColor: "#22c55e",
  },
  product: {
    name: "Product Name",
    price: "$49",
    image: "",
    description: "",
    ctaLabel: "Buy now",
    ctaUrl: "#",
    badge: "",
    bgColor: "#ffffff",
  },
};

export function defaultWidget(type: WidgetType): Widget {
  return {
    id: `w_${Math.random().toString(36).slice(2, 9)}`,
    type,
    props: WIDGET_DEFAULTS[type] ? JSON.parse(JSON.stringify(WIDGET_DEFAULTS[type])) : {},
  };
}
