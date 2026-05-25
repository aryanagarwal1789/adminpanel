import { useState } from "react";
import {
  X, ChevronDown, ChevronRight,
  Menu, AlignCenter, Layout, Columns, Star, LayoutTemplate,
  Grid3x3, Grid, Image as ImageIcon, BarChart, Quote, Grid2x2,
  Megaphone, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TemplateBlockType, LayoutVariant } from "./types";

interface TemplateItem { type: TemplateBlockType; label: string; Icon: LucideIcon }
interface Group { name: string; items: TemplateItem[] }

const GROUPS: Group[] = [
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
  ]},
  { name: "Features", items: [
    { type: "features-3col", label: "Features 3 Column", Icon: Grid3x3 },
    { type: "features-4col", label: "Features 4 Column", Icon: Grid },
  ]},
  { name: "Content", items: [
    { type: "text-image", label: "Text + Image", Icon: ImageIcon },
    { type: "stats-bar", label: "Stats Bar", Icon: BarChart },
    { type: "testimonials", label: "Testimonials", Icon: Quote },
    { type: "logo-grid", label: "Logo Grid", Icon: Grid2x2 },
    { type: "cta-banner", label: "CTA Banner", Icon: Megaphone },
    { type: "faq", label: "FAQ", Icon: HelpCircle },
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

  if (!open) return null;

  return (
    <aside
      data-builder-panel
      className="absolute top-0 right-0 bottom-0 w-[400px] z-30 flex flex-col text-white border-l border-slate-800 shadow-2xl pb-transition"
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

      <div className="flex-1 overflow-y-auto">
        {tab === "templates" ? (
          <div className="py-2">
            {GROUPS.map((g) => {
              const isCollapsed = collapsed[g.name];
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
