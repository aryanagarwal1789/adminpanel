import { useState, useMemo } from "react";
import {
  X, ChevronDown, ChevronRight, Search,
  Menu, AlignCenter, Layout, Columns, Star, LayoutTemplate,
  Grid3x3, Grid, Image as ImageIcon, BarChart, Quote, Grid2x2,
  Megaphone, HelpCircle, FileText, Sparkles, MonitorPlay,
  ListOrdered, CreditCard, MessageSquareQuote, Users, TrendingUp,
  ArrowRightCircle, Zap, ShoppingCart, Puzzle, BookOpen, PanelBottom,
  List, Tag, MessageSquare, BarChart3, GitBranch, Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TemplateBlockType, LayoutVariant } from "./types";

interface TemplateItem { type: TemplateBlockType; label: string; Icon: LucideIcon }
interface Group { name: string; items: TemplateItem[] }

const GROUPS: Group[] = [
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
