import { useState, useMemo } from "react";
import {
  X, ChevronDown, ChevronRight, Search,
  Menu, AlignCenter, Layout, Columns, Star, LayoutTemplate,
  Grid3x3, Grid, Image as ImageIcon, BarChart, Quote, Grid2x2,
  Megaphone, HelpCircle, FileText, Sparkles, MonitorPlay,
  ListOrdered, CreditCard, MessageSquareQuote, Users, TrendingUp,
  ArrowRightCircle, Zap, ShoppingCart, Puzzle, BookOpen, PanelBottom,
  List, Tag, MessageSquare, BarChart3, GitBranch, Download, Layers,
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
  { name: "Salescode Landing", items: [
    { type: "slick-sc-hero-v2",        label: "SC — Hero V2 (Person + Floating Cards)", Icon: Sparkles },
    { type: "slick-sc-hero-v3",        label: "SC — Hero V3 (Center Image)", Icon: Sparkles },
    { type: "slick-sc-video-showcase", label: "SC — Video Showcase", Icon: MonitorPlay },
    { type: "slick-sc-platform-grid",  label: "SC — Platform Grid",  Icon: Grid      },
    { type: "slick-sc-privacy-policy", label: "SC — Privacy Policy", Icon: FileText  },
    { type: "slick-sc-brand-strip", label: "SC — Brand Strip", Icon: Grid2x2 },
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
    { type: "slick-ab-investors", label: "About — Investors", Icon: TrendingUp },
    { type: "slick-ab-investors-v2", label: "About — Investors V2 (Carousel)", Icon: TrendingUp },
    { type: "slick-ab-team-section", label: "About — The Team (Tech + Biz)", Icon: Users },
    { type: "slick-ab-journey", label: "About — Our Journey (Timeline)", Icon: GitBranch },
    { type: "slick-ab-cta", label: "About — CTA", Icon: ArrowRightCircle },
  ]},
  { name: "Contact", items: [
    { type: "slick-sc-navbar", label: "SC — Navbar", Icon: Menu },
    { type: "slick-contact", label: "Contact — Form & Schedule", Icon: MessageSquare },
    { type: "slick-lets-talk", label: "Contact — Let's Talk Journey", Icon: ListOrdered },
    { type: "slick-offices",    label: "Contact — Our Offices",     Icon: Grid2x2 },
    { type: "slick-offices-v2", label: "Contact — Our Offices V2",  Icon: Grid2x2 },
    { type: "slick-sc-footer", label: "SC — Footer (Teal)", Icon: PanelBottom },
    { type: "slick-sc-footer-v2", label: "SC — Footer V2 (White)", Icon: PanelBottom },
  ]},
  { name: "Saudi Presence", items: [
    { type: "slick-sc-saudi-hero", label: "Saudi — Presence Hero", Icon: Sparkles },
  ]},
  { name: "CXO Conclave", items: [
    { type: "slick-conclave-hero",     label: "Conclave — Hero",          Icon: Sparkles },
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
    { type: "slick-scai-industry",    label: "SCAI — Industry Categories", Icon: Grid       },
    { type: "slick-scai-human-test",     label: "SCAI — Human Test",       Icon: MonitorPlay },
    { type: "slick-scai-global-showcase",  label: "SCAI — Global Showcase",  Icon: MonitorPlay },
    { type: "slick-scai-whatsapp-agent",   label: "SCAI — WhatsApp Agent",   Icon: MessageSquare },
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
