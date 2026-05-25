import { X } from "lucide-react";
import { ColorPicker, Select, Slider } from "./fields";
import type { Theme } from "./types";

const FONTS = ["Inter", "Poppins", "DM Sans", "Plus Jakarta Sans", "Lato", "Roboto", "Montserrat"];
const FONT_OPTS = FONTS.map((f) => ({ value: f, label: f }));

const RADII: { value: string; label: string; px: number }[] = [
  { value: "0", label: "None", px: 0 },
  { value: "4", label: "Small", px: 4 },
  { value: "8", label: "Medium", px: 8 },
  { value: "16", label: "Large", px: 16 },
  { value: "9999", label: "Full", px: 9999 },
];

const BUTTON_STYLES: { value: Theme["buttonStyle"]; label: string }[] = [
  { value: "filled", label: "Filled" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

export function ThemePanel({ open, onClose, theme, onChange }: { open: boolean; onClose: () => void; theme: Theme; onChange: (t: Theme) => void }) {
  if (!open) return null;
  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => onChange({ ...theme, [k]: v });

  return (
    <aside
      data-builder-panel
      className="absolute top-0 right-0 bottom-0 w-[320px] z-50 flex flex-col text-white border-l border-slate-800 shadow-2xl"
      style={{ background: "#0f172a" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="text-sm font-semibold">Theme</div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 pb-transition"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <Section title="Colors">
          <ColorPicker label="Accent / Primary color" value={theme.accent} onChange={(v) => set("accent", v)} />
          <ColorPicker label="Page background color" value={theme.pageBg} onChange={(v) => set("pageBg", v)} />
        </Section>

        <Section title="Typography">
          <Select label="Body font" value={theme.bodyFont} onChange={(v) => set("bodyFont", v)} options={FONT_OPTS} />
          <Select label="Heading font" value={theme.headingFont} onChange={(v) => set("headingFont", v)} options={FONT_OPTS} />
          <Slider label="Base font size (px)" min={14} max={20} value={theme.baseFontSize} onChange={(v) => set("baseFontSize", v)} />
        </Section>

        <Section title="Shapes">
          <div className="text-xs font-medium text-slate-300 mb-2">Border radius</div>
          <div className="grid grid-cols-5 gap-1.5">
            {RADII.map((r) => {
              const active = theme.radius === r.px;
              return (
                <button
                  key={r.value}
                  onClick={() => set("radius", r.px)}
                  className={`text-[10px] py-2 pb-transition border ${active ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                  style={{ borderRadius: Math.min(r.px, 12) }}
                  title={r.label}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="text-xs font-medium text-slate-300 mb-2">Button style</div>
          <div className="grid grid-cols-3 gap-1.5">
            {BUTTON_STYLES.map((b) => {
              const active = theme.buttonStyle === b.value;
              return (
                <button
                  key={b.value}
                  onClick={() => set("buttonStyle", b.value)}
                  className={`text-xs py-2 rounded pb-transition border ${active ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pb-4 border-b border-slate-800 last:border-b-0">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{title}</div>
      {children}
    </div>
  );
}
