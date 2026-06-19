import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

// Collapsible sub-element section — used for per-field styling inside composite widgets
function SubSection({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#0f172a', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}
      >
        <span>{label}</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '10px 10px', background: '#0a1628', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
}
import {
  ButtonEditor, ColorPicker, ImageField, VideoField, NumberInput, Repeater, Select,
  Slider, TextInput, Textarea, Toggle,
} from "./fields";
import type { ButtonField } from "./defaults";
import { defaultWidget, EDITABLE_TYPES, WIDGET_REGISTRY, type Widget, type WidgetType } from "./widgets";

type Align = "left" | "center" | "right";
type Variant = ButtonField["variant"];

const ALIGN_OPTS: { value: Align; label: string }[] = [
  { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" },
];
const LEVEL_OPTS = [
  { value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "h4", label: "H4" },
] as const;
const SIZE_OPTS = [
  { value: "sm", label: "Small" }, { value: "base", label: "Base" }, { value: "lg", label: "Large" },
] as const;
const VARIANT_OPTS: { value: Variant; label: string }[] = [
  { value: "primary", label: "Primary" }, { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" }, { value: "ghost", label: "Ghost" },
];

export function WidgetEditor({
  widget, update, openWidgetPicker,
}: {
  widget: Widget;
  update: (props: Record<string, unknown>) => void;
  openWidgetPicker?: (col: number, onPick: (t: WidgetType) => void) => void;
}) {
  const p = widget.props;
  const set = (k: string, v: unknown) => update({ ...p, [k]: v });

  if (!EDITABLE_TYPES.has(widget.type)) {
    return <div className="text-xs text-slate-400">No properties available — this widget is a placeholder.</div>;
  }

  switch (widget.type) {
    case "row": {
      const cols = (p.cols as Widget[][]) ?? [[], []];
      const weights = (p.weights as number[]) ?? cols.map(() => 1);
      const gap = (p.gap as number) ?? 16;

      const setCols = (n: number) => {
        const next: Widget[][] = Array.from({ length: n }, (_, i) => Array.isArray(cols[i]) ? cols[i] : []);
        update({ ...p, cols: next, weights: Array.from({ length: n }, (_, i) => weights[i] ?? 1) });
      };

      const updateCols = (next: Widget[][]) => update({ ...p, cols: next });

      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 mb-1">Columns</div>
            <div className="flex gap-1">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCols(n)}
                  className={`flex-1 py-1.5 text-xs rounded pb-transition ${cols.length === n ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                >
                  {n} col
                </button>
              ))}
            </div>
          </div>

          <Slider label="Gap (px)" min={0} max={64} value={gap} onChange={(v) => set("gap", v)} />

          {cols.map((colWidgets, colIdx) => (
            <div key={colIdx} className="rounded border border-slate-700 overflow-hidden">
              <div className="px-2 py-1.5 bg-slate-800/60 text-xs font-semibold text-slate-300">
                Column {colIdx + 1}
              </div>
              <div className="p-2 space-y-1">
                {colWidgets.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-2">Empty</div>
                )}
                {colWidgets.map((w, wIdx) => {
                  const meta = WIDGET_REGISTRY[w.type];
                  const Icon = meta?.Icon;
                  return (
                    <div key={w.id} className="flex items-center gap-1.5 bg-slate-800/40 rounded px-1.5 py-1">
                      {Icon && <Icon size={11} className="text-slate-400 shrink-0" />}
                      <span className="flex-1 text-xs text-slate-200 truncate">{meta?.label ?? w.type}</span>
                      <button
                        onClick={() => {
                          const next = cols.map((c, i) => i === colIdx ? c.filter((_, j) => j !== wIdx) : c);
                          updateCols(next);
                        }}
                        className="text-slate-500 hover:text-red-400 shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => openWidgetPicker?.(colIdx, (t) => {
                    const next = cols.map((c, i) => i === colIdx ? [...c, defaultWidget(t)] : c);
                    updateCols(next);
                  })}
                  className="w-full text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded py-1.5 pb-transition flex items-center justify-center gap-1"
                >
                  <Plus size={10} /> Add widget
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "rich-heading":
      return (
        <div className="space-y-3">
          <Textarea label="Text — wrap words in **double asterisks** for accent color" rows={3} value={p.text as string ?? ''} onChange={(v) => set("text", v)} />
          <div style={{ fontSize: 11, color: '#64748b', marginTop: -8, padding: '0 2px' }}>
            Example: <code style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3 }}>First **Cloud Distribution** Platform</code>
          </div>
          <ColorPicker label="Default text color" value={p.color as string || '#ffffff'} onChange={(v) => set("color", v)} />
          <ColorPicker label="Accent color (**highlighted** words)" value={p.accentColor as string || '#00C6B1'} onChange={(v) => set("accentColor", v)} />
          <Select label="Heading level" value={(p.level as "h1") || "h2"} onChange={(v) => set("level", v)} options={LEVEL_OPTS as unknown as { value: "h1"; label: string }[]} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <NumberInput label="Font size (px, 0 = auto)" value={(p.fontSize as number) || 0} onChange={(v) => set("fontSize", v || undefined)} />
          <Select label="Font weight" value={(p.fontWeight as string) || "700"} onChange={(v) => set("fontWeight", v)} options={[{value:"400",label:"Regular"},{value:"500",label:"Medium"},{value:"600",label:"Semibold"},{value:"700",label:"Bold"},{value:"800",label:"Extrabold"},{value:"900",label:"Black"}] as unknown as {value:"400";label:string}[]} />
          <NumberInput label="Line height (e.g. 1.1 tight, 1.5 normal)" value={(p.lineHeight as number) || 0} onChange={(v) => set("lineHeight", v || undefined)} />
          <NumberInput label="Letter spacing (px)" value={(p.letterSpacing as number) || 0} onChange={(v) => set("letterSpacing", v || undefined)} />
        </div>
      );
    case "rich-paragraph":
      return (
        <div className="space-y-3">
          <Textarea label="Text — use **word** for accent color" rows={5} value={p.text as string ?? ''} onChange={(v) => set("text", v)} />
          <div style={{ fontSize: 11, color: '#64748b', marginTop: -8, padding: '0 2px' }}>
            Example: <code style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3 }}>To create **1M+ stores** with **digital commerce**</code>
          </div>
          <ColorPicker label="Default text color" value={p.color as string || '#e2e8f0'} onChange={(v) => set("color", v)} />
          <ColorPicker label="Accent color (**highlighted** words)" value={p.accentColor as string || '#00C6B1'} onChange={(v) => set("accentColor", v)} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <NumberInput label="Font size (px)" value={(p.fontSize as number) || 18} onChange={(v) => set("fontSize", v)} />
          <NumberInput label="Line height" value={(p.lineHeight as number) || 1.7} onChange={(v) => set("lineHeight", v)} />
        </div>
      );
    case "heading":
    case "section-heading":
    case "section-header":
      return (
        <div className="space-y-3">
          <TextInput label="Text" value={p.text as string} onChange={(v) => set("text", v)} />
          <Select label="Level" value={(p.level as "h1") || "h2"} onChange={(v) => set("level", v)} options={LEVEL_OPTS as unknown as { value: "h1"; label: string }[]} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <NumberInput label="Font size (px, 0 = auto)" value={(p.fontSize as number) ?? 0} onChange={(v) => set("fontSize", v || undefined)} />
          <Select label="Font weight" value={(p.fontWeight as string) || "700"} onChange={(v) => set("fontWeight", v)} options={[{value:"400",label:"Regular"},{value:"500",label:"Medium"},{value:"600",label:"Semibold"},{value:"700",label:"Bold"},{value:"800",label:"Extrabold"},{value:"900",label:"Black"}] as unknown as {value:"700";label:string}[]} />
          <NumberInput label="Line height (e.g. 1.2)" value={(p.lineHeight as number) ?? 0} onChange={(v) => set("lineHeight", v || undefined)} />
          <NumberInput label="Letter spacing (px)" value={(p.letterSpacing as number) ?? 0} onChange={(v) => set("letterSpacing", v || undefined)} />
        </div>
      );
    case "paragraph":
    case "text":
    case "rich-text":
      return (
        <div className="space-y-3">
          <Textarea label="Text" rows={4} value={p.text as string} onChange={(v) => set("text", v)} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <NumberInput label="Font size (px, 0 = auto)" value={(p.fontSize as number) ?? 0} onChange={(v) => set("fontSize", v || undefined)} />
          <Select label="Font weight" value={(p.fontWeight as string) || "400"} onChange={(v) => set("fontWeight", v)} options={[{value:"400",label:"Regular"},{value:"500",label:"Medium"},{value:"600",label:"Semibold"},{value:"700",label:"Bold"}] as unknown as {value:"400";label:string}[]} />
          <NumberInput label="Line height (e.g. 1.6)" value={(p.lineHeight as number) ?? 0} onChange={(v) => set("lineHeight", v || undefined)} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageField label="Source URL" value={p.src as string} onChange={(v) => set("src", v)} />
          <TextInput label="Alt text" value={p.alt as string} onChange={(v) => set("alt", v)} />
          <NumberInput label="Width %" value={(p.width as number) ?? 100} onChange={(v) => set("width", v)} />
          <NumberInput label="Height (px, 0 = auto)" value={(p.height as number) ?? 0} onChange={(v) => set("height", v || undefined)} />
          <Select label="Object fit" value={(p.objectFit as "cover") || "cover"} onChange={(v) => set("objectFit", v)}
            options={[{value:"cover",label:"Cover (crop to fill)"},{value:"contain",label:"Contain (show full image)"},{value:"fill",label:"Fill (stretch)"},{value:"none",label:"None (natural size)"}] as {value:"cover";label:string}[]} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <NumberInput label="Border radius (px)" value={(p.radius as number) ?? 0} onChange={(v) => set("radius", v)} />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <TextInput label="Label" value={p.label as string} onChange={(v) => set("label", v)} />
          <TextInput label="URL" value={p.url as string} onChange={(v) => set("url", v)} />
          <Select label="Variant" value={(p.variant as Variant) || "primary"} onChange={(v) => set("variant", v)} options={VARIANT_OPTS} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <Toggle label="Full width" value={p.fullWidth as boolean} onChange={(v) => set("fullWidth", v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <ColorPicker label="Background color" value={(p.color as string) ?? ''} onChange={(v) => set("color", v)} />
          <ColorPicker label="Text color" value={(p.textColor as string) ?? ''} onChange={(v) => set("textColor", v)} />
          <ColorPicker label="Border color" value={(p.borderColor as string) ?? ''} onChange={(v) => set("borderColor", v)} />
          <NumberInput label="Border radius (px)" value={(p.borderRadius as number) ?? 6} onChange={(v) => set("borderRadius", v)} />
          <NumberInput label="Padding X (px)" value={(p.paddingX as number) ?? 16} onChange={(v) => set("paddingX", v)} />
          <NumberInput label="Padding Y (px)" value={(p.paddingY as number) ?? 8} onChange={(v) => set("paddingY", v)} />
          <NumberInput label="Font size (px)" value={(p.fontSize as number) ?? 14} onChange={(v) => set("fontSize", v)} />
        </div>
      );
    case "divider":
      return (
        <div className="space-y-3">
          <Select label="Style" value={(p.style as "solid") || "solid"} onChange={(v) => set("style", v)} options={[{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }, { value: "dotted", label: "Dotted" }] as { value: "solid"; label: string }[]} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <NumberInput label="Thickness (px)" value={p.thickness as number} onChange={(v) => set("thickness", v)} />
          <Slider label="Width %" min={5} max={100} value={(p.widthPercent as number) ?? 100} onChange={(v) => set("widthPercent", v)} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-3">
          <Slider label="Height (px)" min={8} max={200} value={p.height as number} onChange={(v) => set("height", v)} />
        </div>
      );
    case "box": {
      const innerWidgets = (p.widgets as Widget[]) ?? [];
      const updateWidgets = (next: Widget[]) => update({ ...p, widgets: next });
      return (
        <div className="space-y-3">
          <ColorPicker label="Background color" value={p.bgColor as string || ''} onChange={(v) => set("bgColor", v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Border</div>
          <Select label="Border sides" value={(p.borderSides as 'all') || 'all'} onChange={(v) => set("borderSides", v)}
            options={[{value:'all',label:'All sides'},{value:'left',label:'Left only'},{value:'right',label:'Right only'},{value:'top',label:'Top only'},{value:'bottom',label:'Bottom only'},{value:'none',label:'None'}] as {value:'all';label:string}[]} />
          {(p.borderSides as string) !== 'none' && <>
            <ColorPicker label="Border color" value={p.borderColor as string || ''} onChange={(v) => set("borderColor", v)} />
            <NumberInput label="Border width (px)" value={(p.borderWidth as number) ?? 1} onChange={(v) => set("borderWidth", v)} />
          </>}
          <NumberInput label="Border radius (px)" value={(p.borderRadius as number) ?? 12} onChange={(v) => set("borderRadius", v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <NumberInput label="Padding (px)" value={(p.padding as number) ?? 24} onChange={(v) => set("padding", v)} />
          <Slider label="Gap between items (px)" min={0} max={64} value={(p.gap as number) ?? 16} onChange={(v) => set("gap", v)} />
          <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
          <div className="text-xs text-slate-400 uppercase font-semibold">Contents ({innerWidgets.length} widgets)</div>
          {innerWidgets.length === 0 && <div className="text-xs text-slate-500">No widgets added yet.</div>}
          {innerWidgets.map((w, i) => {
            const meta = WIDGET_REGISTRY[w.type];
            return (
              <div key={w.id} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 rounded px-2 py-1.5">
                <span className="flex-1 truncate">{meta?.label ?? w.type}</span>
                <button onClick={() => updateWidgets(innerWidgets.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 shrink-0">×</button>
              </div>
            );
          })}
          <button
            onClick={() => openWidgetPicker?.(0, (t) => updateWidgets([...innerWidgets, defaultWidget(t)]))}
            className="w-full py-2 text-xs border border-dashed border-slate-700 rounded text-slate-400 hover:text-white hover:border-slate-500 pb-transition"
          >
            + Add widget to box
          </button>
        </div>
      );
    }
    case "form-advanced": {
      type FormField = { type: string; label: string; placeholder?: string; required?: boolean; width?: string; options?: string };
      const fields = (p.fields as FormField[]) ?? [];
      return (
        <div className="space-y-3">
          <TextInput label="Form title (optional)" value={p.title as string ?? ''} onChange={(v) => set("title", v)} />
          <Repeater<FormField>
            label="Fields"
            items={fields}
            onChange={(v) => set("fields", v)}
            newItem={() => ({ type: 'text', label: 'New field', placeholder: '', required: false, width: 'full' })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <>
                <Select label="Field type" value={it.type as "text"} onChange={(v) => u({ ...it, type: v })}
                  options={[{value:'text',label:'Text'},{value:'email',label:'Email'},{value:'phone',label:'Phone'},{value:'textarea',label:'Textarea'},{value:'dropdown',label:'Dropdown'},{value:'checkbox',label:'Checkbox'}] as {value:"text";label:string}[]} />
                <TextInput label="Label" value={it.label} onChange={(v) => u({ ...it, label: v })} />
                {it.type !== 'checkbox' && <TextInput label="Placeholder" value={it.placeholder ?? ''} onChange={(v) => u({ ...it, placeholder: v })} />}
                {it.type === 'dropdown' && <Textarea label="Options (one per line)" rows={3} value={it.options ?? ''} onChange={(v) => u({ ...it, options: v })} />}
                <Select label="Width" value={it.width as "full"} onChange={(v) => u({ ...it, width: v })}
                  options={[{value:'full',label:'Full width'},{value:'half',label:'Half width (2 columns)'}] as {value:"full";label:string}[]} />
                <Toggle label="Required" value={it.required ?? false} onChange={(v) => u({ ...it, required: v })} />
              </>
            )}
          />
          <TextInput label="Submit button label" value={p.submitLabel as string ?? 'Submit'} onChange={(v) => set("submitLabel", v)} />
          <ColorPicker label="Button background" value={p.submitBgColor as string || '#00C6B1'} onChange={(v) => set("submitBgColor", v)} />
          <ColorPicker label="Button text color" value={p.submitTextColor as string || '#ffffff'} onChange={(v) => set("submitTextColor", v)} />
          <ColorPicker label="Form background" value={p.bgColor as string || '#ffffff'} onChange={(v) => set("bgColor", v)} />
          <NumberInput label="Border radius (px)" value={p.borderRadius as number ?? 16} onChange={(v) => set("borderRadius", v)} />
          <NumberInput label="Padding (px)" value={p.padding as number ?? 32} onChange={(v) => set("padding", v)} />
        </div>
      );
    }
    case "app-badge":
      return (
        <div className="space-y-3">
          <Select label="Platform" value={(p.platform as "google") || "google"} onChange={(v) => set("platform", v)}
            options={[{value:'google',label:'Google Play'},{value:'apple',label:'App Store'},{value:'custom',label:'Custom'}] as {value:"google";label:string}[]} />
          <ImageField label="Badge image (upload or URL)" value={p.badgeImage as string ?? ''} onChange={(v) => set("badgeImage", v)} />
          <TextInput label="Store URL" value={p.storeUrl as string ?? '#'} onChange={(v) => set("storeUrl", v)} />
          <NumberInput label="Width (px)" value={(p.widthPx as number) ?? 160} onChange={(v) => set("widthPx", v)} />
          <NumberInput label="Height (px)" value={(p.height as number) ?? 44} onChange={(v) => set("height", v)} />
          <Select label="Object fit" value={(p.objectFit as "contain") || "contain"} onChange={(v) => set("objectFit", v)}
            options={[{value:'contain',label:'Contain (show full badge)'},{value:'cover',label:'Cover (fill & crop)'},{value:'fill',label:'Fill (stretch)'}] as {value:"contain";label:string}[]} />
        </div>
      );
    case "icon":
      return (
        <div className="space-y-3">
          <TextInput label="Icon (emoji or name)" value={p.icon as string} onChange={(v) => set("icon", v)} />
          <NumberInput label="Size (px)" value={p.size as number} onChange={(v) => set("size", v)} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <Select label="Alignment" value={(p.align as Align) || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
        </div>
      );
    case "card": {
      type SS = Record<string, unknown>;
      const cardSt   = (p.cardStyle        as SS) ?? {};
      const imageSt  = (p.imageStyle       as SS) ?? {};
      const titleSt  = (p.titleStyle       as SS) ?? {};
      const descSt   = (p.descriptionStyle as SS) ?? {};
      const btnSt    = (p.buttonStyle      as SS) ?? {};
      const sc = (key: string, st: SS) => (v: unknown) => set(key, { ...st, ...{ [v as string]: v } });
      void sc; // avoid unused warning — we use inline updaters below
      const upd = (key: string, st: SS, field: string) => (v: unknown) => set(key, { ...st, [field]: v });
      const WEIGHTS = [{value:'400',label:'Regular'},{value:'500',label:'Medium'},{value:'600',label:'Semibold'},{value:'700',label:'Bold'},{value:'800',label:'Extrabold'}] as unknown as {value:'400';label:string}[];
      const FITS = [{value:'cover',label:'Cover'},{value:'contain',label:'Contain'},{value:'fill',label:'Fill'}] as unknown as {value:'cover';label:string}[];
      return (
        <div className="space-y-1.5">
          <SubSection label="🃏 Card Container" defaultOpen>
            <ColorPicker label="Background"    value={(cardSt.bgColor     as string) || '#ffffff'}  onChange={upd('cardStyle',   cardSt,  'bgColor')} />
            <ColorPicker label="Border color"  value={(cardSt.borderColor as string) || ''}         onChange={upd('cardStyle',   cardSt,  'borderColor')} />
            <NumberInput label="Border radius" value={(cardSt.borderRadius as number) ?? 12}        onChange={upd('cardStyle',   cardSt,  'borderRadius')} />
            <NumberInput label="Padding (px)"  value={(cardSt.padding     as number) ?? 16}         onChange={upd('cardStyle',   cardSt,  'padding')} />
          </SubSection>

          <SubSection label="🖼 Image">
            <ImageField  label="Image"         value={(p.image as string) || ''}                    onChange={(v) => set('image', v)} />
            <Toggle      label="Hide image"    value={(imageSt.hidden as boolean) || false}         onChange={upd('imageStyle',  imageSt, 'hidden')} />
            <NumberInput label="Height (px)"   value={(imageSt.height as number) ?? 200}            onChange={upd('imageStyle',  imageSt, 'height')} />
            <Select      label="Object fit"    value={(imageSt.objectFit as 'cover') || 'cover'}    onChange={upd('imageStyle',  imageSt, 'objectFit')} options={FITS} />
            <NumberInput label="Border radius" value={(imageSt.borderRadius as number) ?? 0}        onChange={upd('imageStyle',  imageSt, 'borderRadius')} />
          </SubSection>

          <SubSection label="📝 Title">
            <TextInput   label="Text"          value={(p.title as string) || ''}                    onChange={(v) => set('title', v)} />
            <ColorPicker label="Color"         value={(titleSt.color      as string) || '#0f172a'}  onChange={upd('titleStyle',  titleSt, 'color')} />
            <NumberInput label="Font size (px)"value={(titleSt.fontSize   as number) ?? 0}          onChange={upd('titleStyle',  titleSt, 'fontSize')} />
            <Select      label="Font weight"   value={(titleSt.fontWeight as '700') || '700'}       onChange={upd('titleStyle',  titleSt, 'fontWeight')} options={WEIGHTS} />
            <Select      label="Alignment"     value={(titleSt.align      as Align) || 'left'}      onChange={upd('titleStyle',  titleSt, 'align')} options={ALIGN_OPTS} />
            <NumberInput label="Margin bottom" value={(titleSt.marginBottom as number) ?? 4}        onChange={upd('titleStyle',  titleSt, 'marginBottom')} />
          </SubSection>

          <SubSection label="📄 Description">
            <Textarea    label="Text"          rows={3} value={(p.description as string) || ''}     onChange={(v) => set('description', v)} />
            <ColorPicker label="Color"         value={(descSt.color      as string) || '#475569'}   onChange={upd('descriptionStyle', descSt, 'color')} />
            <NumberInput label="Font size (px)"value={(descSt.fontSize   as number) ?? 0}           onChange={upd('descriptionStyle', descSt, 'fontSize')} />
            <NumberInput label="Line height"   value={(descSt.lineHeight as number) ?? 0}           onChange={upd('descriptionStyle', descSt, 'lineHeight')} />
            <Select      label="Alignment"     value={(descSt.align      as Align) || 'left'}       onChange={upd('descriptionStyle', descSt, 'align')} options={ALIGN_OPTS} />
          </SubSection>

          <SubSection label="🔘 Button">
            <TextInput   label="Label"         value={(p.buttonLabel as string) || ''}              onChange={(v) => set('buttonLabel', v)} />
            <TextInput   label="URL"           value={(p.buttonUrl   as string) || '#'}             onChange={(v) => set('buttonUrl', v)} />
            <Toggle      label="Hide button"   value={(btnSt.hidden  as boolean) || false}          onChange={upd('buttonStyle', btnSt, 'hidden')} />
            <ColorPicker label="Background"    value={(btnSt.bgColor     as string) || ''}          onChange={upd('buttonStyle', btnSt, 'bgColor')} />
            <ColorPicker label="Text color"    value={(btnSt.textColor   as string) || ''}          onChange={upd('buttonStyle', btnSt, 'textColor')} />
            <ColorPicker label="Border color"  value={(btnSt.borderColor as string) || ''}          onChange={upd('buttonStyle', btnSt, 'borderColor')} />
            <NumberInput label="Border radius" value={(btnSt.borderRadius as number) ?? 6}          onChange={upd('buttonStyle', btnSt, 'borderRadius')} />
            <NumberInput label="Padding X"     value={(btnSt.paddingX    as number) ?? 12}          onChange={upd('buttonStyle', btnSt, 'paddingX')} />
            <NumberInput label="Padding Y"     value={(btnSt.paddingY    as number) ?? 6}           onChange={upd('buttonStyle', btnSt, 'paddingY')} />
            <NumberInput label="Font size (px)"value={(btnSt.fontSize    as number) ?? 14}          onChange={upd('buttonStyle', btnSt, 'fontSize')} />
            <Select      label="Alignment"     value={(btnSt.align       as Align) || 'left'}       onChange={upd('buttonStyle', btnSt, 'align')} options={ALIGN_OPTS} />
          </SubSection>
        </div>
      );
    }
    case "video":
    case "video-embed":
      return (
        <div className="space-y-3">
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Source</span>
          </div>
          <VideoField
            label="Upload video file (mp4, webm…)"
            value={/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test((p.url as string) ?? '') ? (p.url as string) ?? '' : ''}
            onChange={(v) => set("url", v)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
            <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>or embed URL</span>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
          </div>
          <TextInput
            label="YouTube / Vimeo URL"
            value={/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test((p.url as string) ?? '') ? '' : (p.url as string) ?? ''}
            onChange={(v) => set("url", v)}
          />
          <Select label="Aspect ratio" value={(p.aspect as "16:9") || "16:9"} onChange={(v) => set("aspect", v)} options={[{ value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" }] as { value: "16:9"; label: string }[]} />
        </div>
      );
    case "form":
      return (
        <div className="space-y-3">
          <TextInput label="Form name" value={p.name as string} onChange={(v) => set("name", v)} />
          <TextInput label="Submit button label" value={p.submitLabel as string} onChange={(v) => set("submitLabel", v)} />
        </div>
      );
    case "list":
      return (
        <div className="space-y-3">
          <Repeater<{ text: string }>
            label="Items"
            items={(p.items as { text: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ text: "New item" })}
            itemPreview={(it) => it.text}
            renderItem={(it, u) => <TextInput label="Text" value={it.text} onChange={(x) => u({ ...it, text: x })} />}
          />
          <Select label="Style" value={(p.style as "bullet") || "bullet"} onChange={(v) => set("style", v)} options={[{ value: "bullet", label: "Bullet" }, { value: "numbered", label: "Numbered" }, { value: "none", label: "None" }] as { value: "bullet"; label: string }[]} />
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-3">
          <Repeater<{ title: string; body: string }>
            label="Items"
            items={(p.items as { title: string; body: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ title: "New section", body: "Body" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Body" value={it.body} onChange={(x) => u({ ...it, body: x })} />
              </>
            )}
          />
          <Toggle label="Allow multiple open" value={p.allowMultiple as boolean} onChange={(v) => set("allowMultiple", v)} />
        </div>
      );
    case "pricing-card":
      return (
        <div className="space-y-3">
          <TextInput label="Plan name" value={p.plan as string} onChange={(v) => set("plan", v)} />
          <TextInput label="Price" value={p.price as string} onChange={(v) => set("price", v)} />
          <Select label="Period" value={(p.period as "/mo") || "/mo"} onChange={(v) => set("period", v)} options={[{ value: "/mo", label: "Per month" }, { value: "/yr", label: "Per year" }, { value: "one-time", label: "One-time" }] as { value: "/mo"; label: string }[]} />
          <Repeater<{ text: string }>
            label="Features"
            items={(p.features as { text: string }[]) ?? []}
            onChange={(v) => set("features", v)}
            newItem={() => ({ text: "New feature" })}
            itemPreview={(it) => it.text}
            renderItem={(it, u) => <TextInput label="Feature text" value={it.text} onChange={(x) => u({ ...it, text: x })} />}
          />
          <ButtonEditor label="CTA button" value={p.cta as ButtonField} onChange={(v) => set("cta", v)} />
          <Toggle label="Highlighted" value={p.highlighted as boolean} onChange={(v) => set("highlighted", v)} />
        </div>
      );
    case "metrics":
      return (
        <Repeater<{ number: string; label: string; description: string }>
          label="Metrics"
          items={(p.items as { number: string; label: string; description: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ number: "0", label: "Label", description: "" })}
          itemPreview={(it) => `${it.number} ${it.label}`}
          renderItem={(it, u) => (
            <>
              <TextInput label="Number" value={it.number} onChange={(x) => u({ ...it, number: x })} />
              <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
              <Textarea label="Description" value={it.description} onChange={(x) => u({ ...it, description: x })} />
            </>
          )}
        />
      );
    case "image-grid":
      return (
        <div className="space-y-3">
          <Repeater<{ src: string; alt: string }>
            label="Images"
            items={(p.images as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("images", v)}
            newItem={() => ({ src: "", alt: "" })}
            itemPreview={(it) => it.alt || "Image"}
            renderItem={(it, u) => (
              <>
                <ImageField label="URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
          <Select label="Columns" value={(p.columns as "3") || "3"} onChange={(v) => set("columns", v)} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }] as { value: "3"; label: string }[]} />
        </div>
      );
    case "testimonial-slider":
      return (
        <Repeater<{ quote: string; author: string; role: string; avatar: string }>
          label="Testimonials"
          items={(p.items as { quote: string; author: string; role: string; avatar: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ quote: "Great!", author: "Name", role: "Role", avatar: "" })}
          itemPreview={(it) => it.author}
          renderItem={(it, u) => (
            <>
              <Textarea label="Quote" value={it.quote} onChange={(x) => u({ ...it, quote: x })} />
              <TextInput label="Author" value={it.author} onChange={(x) => u({ ...it, author: x })} />
              <TextInput label="Role" value={it.role} onChange={(x) => u({ ...it, role: x })} />
              <ImageField label="Avatar URL" value={it.avatar} onChange={(x) => u({ ...it, avatar: x })} />
            </>
          )}
        />
      );
    case "feature-list":
      return (
        <Repeater<{ icon: string; text: string }>
          label="Items"
          items={(p.items as { icon: string; text: string }[]) ?? []}
          onChange={(v) => set("items", v)}
          newItem={() => ({ icon: "✓", text: "New feature" })}
          itemPreview={(it) => it.text}
          renderItem={(it, u) => (
            <>
              <TextInput label="Icon (emoji)" value={it.icon} onChange={(x) => u({ ...it, icon: x })} />
              <TextInput label="Text" value={it.text} onChange={(x) => u({ ...it, text: x })} />
            </>
          )}
        />
      );
    case "logo":
      return (
        <div className="space-y-3">
          <ImageField label="Image URL" value={p.src as string} onChange={(v) => set("src", v)} />
          <TextInput label="Alt text" value={p.alt as string} onChange={(v) => set("alt", v)} />
          <TextInput label="Link URL" value={p.link as string} onChange={(v) => set("link", v)} />
          <NumberInput label="Width (px)" value={p.width as number} onChange={(v) => set("width", v)} />
        </div>
      );
    case "countdown":
      return (
        <div className="space-y-3">
          <TextInput label="Label" value={p.label as string} onChange={(v) => set("label", v)} />
          <TextInput label="Target date (YYYY-MM-DD HH:MM)" value={p.targetDate as string} onChange={(v) => set("targetDate", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Text color" value={p.textColor as string} onChange={(v) => set("textColor", v)} />
          <ColorPicker label="Label color" value={p.labelColor as string} onChange={(v) => set("labelColor", v)} />
        </div>
      );
    case "tabs":
      return (
        <div className="space-y-3">
          <Repeater<{ title: string; content: string }>
            label="Tabs"
            items={(p.items as { title: string; content: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ title: "New Tab", content: "" })}
            itemPreview={(it) => it.title}
            renderItem={(it, u) => (
              <>
                <TextInput label="Title" value={it.title} onChange={(x) => u({ ...it, title: x })} />
                <Textarea label="Content" value={it.content} onChange={(x) => u({ ...it, content: x })} />
              </>
            )}
          />
          <ColorPicker label="Active color" value={p.activeColor as string} onChange={(v) => set("activeColor", v)} />
          <ColorPicker label="Inactive color" value={p.inactiveColor as string} onChange={(v) => set("inactiveColor", v)} />
        </div>
      );
    case "horizontal-spacer":
      return (
        <div className="space-y-3">
          <Slider label="Height (px)" min={1} max={20} value={p.height as number} onChange={(v) => set("height", v)} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <Slider label="Width (%)" min={10} max={100} value={p.width as number} onChange={(v) => set("width", v)} />
        </div>
      );
    case "anchor":
      return (
        <div className="space-y-3">
          <TextInput label="ID" value={p.id as string} onChange={(v) => set("id", v)} />
          <TextInput label="Label (optional)" value={p.label as string} onChange={(v) => set("label", v)} />
        </div>
      );
    case "image-text":
      return (
        <div className="space-y-3">
          <ImageField label="Image URL" value={p.image as string} onChange={(v) => set("image", v)} />
          <TextInput label="Heading" value={p.heading as string} onChange={(v) => set("heading", v)} />
          <Textarea label="Text" value={p.text as string} onChange={(v) => set("text", v)} />
          <Select label="Layout" value={(p.layout as "left") || "left"} onChange={(v) => set("layout", v)} options={[{ value: "left", label: "Image left" }, { value: "right", label: "Image right" }] as { value: "left"; label: string }[]} />
          <TextInput label="CTA label" value={p.ctaLabel as string} onChange={(v) => set("ctaLabel", v)} />
          <TextInput label="CTA URL" value={p.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
        </div>
      );
    case "horizontal-menu":
    case "navigation-menu":
      return (
        <div className="space-y-3">
          <Repeater<{ label: string; url: string }>
            label="Items"
            items={(p.items as { label: string; url: string }[]) ?? []}
            onChange={(v) => set("items", v)}
            newItem={() => ({ label: "Link", url: "#" })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <>
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
                <TextInput label="URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
              </>
            )}
          />
          <Select label="Alignment" value={(p.align as "left") || "left"} onChange={(v) => set("align", v)} options={ALIGN_OPTS} />
          <Slider label="Gap (px)" min={8} max={48} value={p.gap as number} onChange={(v) => set("gap", v)} />
          <ColorPicker label="Color" value={p.color as string} onChange={(v) => set("color", v)} />
          <ColorPicker label="Hover color" value={p.hoverColor as string} onChange={(v) => set("hoverColor", v)} />
          <NumberInput label="Font size (px)" value={p.fontSize as number} onChange={(v) => set("fontSize", v)} />
        </div>
      );
    case "logo-grid":
      return (
        <div className="space-y-3">
          <Repeater<{ src: string; alt: string; url: string }>
            label="Logos"
            items={(p.logos as { src: string; alt: string; url: string }[]) ?? []}
            onChange={(v) => set("logos", v)}
            newItem={() => ({ src: "", alt: "", url: "#" })}
            itemPreview={(it) => it.alt || "Logo"}
            renderItem={(it, u) => (
              <>
                <ImageField label="Image URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
                <TextInput label="Link URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
              </>
            )}
          />
          <Select label="Columns" value={String(p.columns || 4) as "4"} onChange={(v) => set("columns", Number(v))} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "5", label: "5" }, { value: "6", label: "6" }] as { value: "4"; label: string }[]} />
          <Toggle label="Grayscale" value={p.grayscale as boolean} onChange={(v) => set("grayscale", v)} />
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-3">
          <Repeater<{ src: string; alt: string }>
            label="Images"
            items={(p.images as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("images", v)}
            newItem={() => ({ src: "", alt: "" })}
            itemPreview={(it) => it.alt || "Image"}
            renderItem={(it, u) => (
              <>
                <ImageField label="URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
          <Select label="Columns" value={String(p.columns || 3) as "3"} onChange={(v) => set("columns", Number(v))} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }] as { value: "3"; label: string }[]} />
          <Slider label="Gap (px)" min={4} max={24} value={p.gap as number} onChange={(v) => set("gap", v)} />
          <Slider label="Border radius (px)" min={0} max={16} value={p.radius as number} onChange={(v) => set("radius", v)} />
        </div>
      );
    case "image-slider":
      return (
        <div className="space-y-3">
          <Repeater<{ src: string; alt: string }>
            label="Images"
            items={(p.images as { src: string; alt: string }[]) ?? []}
            onChange={(v) => set("images", v)}
            newItem={() => ({ src: "", alt: "" })}
            itemPreview={(it) => it.alt || "Image"}
            renderItem={(it, u) => (
              <>
                <ImageField label="URL" value={it.src} onChange={(x) => u({ ...it, src: x })} />
                <TextInput label="Alt text" value={it.alt} onChange={(x) => u({ ...it, alt: x })} />
              </>
            )}
          />
          <Select label="Aspect ratio" value={(p.aspect as "16:9") || "16:9"} onChange={(v) => set("aspect", v)} options={[{ value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" }] as { value: "16:9"; label: string }[]} />
          <Slider label="Border radius (px)" min={0} max={24} value={p.radius as number} onChange={(v) => set("radius", v)} />
          <Select label="Auto-play interval" value={String((p.autoPlay as number) ?? 3000)} onChange={(v) => set("autoPlay", Number(v))}
            options={[{value:'0',label:'Off (manual only)'},{value:'2000',label:'2 seconds'},{value:'3000',label:'3 seconds'},{value:'4000',label:'4 seconds'},{value:'5000',label:'5 seconds'},{value:'8000',label:'8 seconds'}] as {value:'0';label:string}[]} />
        </div>
      );
    case "search-input":
      return (
        <div className="space-y-3">
          <TextInput label="Placeholder" value={p.placeholder as string} onChange={(v) => set("placeholder", v)} />
          <TextInput label="Button label" value={p.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Border color" value={p.borderColor as string} onChange={(v) => set("borderColor", v)} />
        </div>
      );
    case "recent-blog-posts":
      return (
        <div className="space-y-3">
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <NumberInput label="Count (1–6)" value={p.count as number} onChange={(v) => set("count", v)} />
          <Select label="Columns" value={String(p.columns || 3) as "3"} onChange={(v) => set("columns", Number(v))} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }] as { value: "3"; label: string }[]} />
        </div>
      );
    case "post-listing":
      return (
        <div className="space-y-3">
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <Select label="Columns" value={String(p.columns || 3) as "3"} onChange={(v) => set("columns", Number(v))} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }] as { value: "3"; label: string }[]} />
        </div>
      );
    case "blog-email-subscription":
      return (
        <div className="space-y-3">
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Subtitle" value={p.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <TextInput label="Placeholder" value={p.placeholder as string} onChange={(v) => set("placeholder", v)} />
          <TextInput label="Button label" value={p.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Accent color" value={p.accentColor as string} onChange={(v) => set("accentColor", v)} />
        </div>
      );
    case "language-switcher":
      return (
        <div className="space-y-3">
          <Repeater<{ code: string; label: string }>
            label="Languages"
            items={(p.languages as { code: string; label: string }[]) ?? []}
            onChange={(v) => set("languages", v)}
            newItem={() => ({ code: "fr", label: "Français" })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <>
                <TextInput label="Code" value={it.code} onChange={(x) => u({ ...it, code: x })} />
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
              </>
            )}
          />
          <TextInput label="Current language code" value={p.current as string} onChange={(v) => set("current", v)} />
        </div>
      );
    case "audio-player":
      return (
        <div className="space-y-3">
          <TextInput label="Audio URL" value={p.src as string} onChange={(v) => set("src", v)} />
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Text color" value={p.textColor as string} onChange={(v) => set("textColor", v)} />
        </div>
      );
    case "site-header":
      return (
        <div className="space-y-3">
          <TextInput label="Logo text" value={p.logoText as string} onChange={(v) => set("logoText", v)} />
          <ImageField label="Logo image URL" value={p.logoImage as string} onChange={(v) => set("logoImage", v)} />
          <Repeater<{ label: string; url: string }>
            label="Nav links"
            items={(p.links as { label: string; url: string }[]) ?? []}
            onChange={(v) => set("links", v)}
            newItem={() => ({ label: "Link", url: "#" })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <>
                <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
                <TextInput label="URL" value={it.url} onChange={(x) => u({ ...it, url: x })} />
              </>
            )}
          />
          <TextInput label="CTA label" value={p.ctaLabel as string} onChange={(v) => set("ctaLabel", v)} />
          <TextInput label="CTA URL" value={p.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Text color" value={p.textColor as string} onChange={(v) => set("textColor", v)} />
        </div>
      );
    case "post-filter":
      return (
        <div className="space-y-3">
          <Repeater<{ label: string }>
            label="Tags"
            items={(p.tags as { label: string }[]) ?? []}
            onChange={(v) => set("tags", v)}
            newItem={() => ({ label: "Tag" })}
            itemPreview={(it) => it.label}
            renderItem={(it, u) => (
              <TextInput label="Label" value={it.label} onChange={(x) => u({ ...it, label: x })} />
            )}
          />
          <ColorPicker label="Active color" value={p.activeColor as string} onChange={(v) => set("activeColor", v)} />
        </div>
      );
    case "rss-listing":
      return (
        <div className="space-y-3">
          <TextInput label="Feed URL" value={p.feedUrl as string} onChange={(v) => set("feedUrl", v)} />
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <NumberInput label="Count" value={p.count as number} onChange={(v) => set("count", v)} />
        </div>
      );
    case "meetings":
      return (
        <div className="space-y-3">
          <TextInput label="Embed URL" value={p.embedUrl as string} onChange={(v) => set("embedUrl", v)} />
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Button label" value={p.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <TextInput label="Button URL" value={p.buttonUrl as string} onChange={(v) => set("buttonUrl", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
        </div>
      );
    case "payment":
      return (
        <div className="space-y-3">
          <TextInput label="Title" value={p.title as string} onChange={(v) => set("title", v)} />
          <TextInput label="Amount" value={p.amount as string} onChange={(v) => set("amount", v)} />
          <Textarea label="Description" value={p.description as string} onChange={(v) => set("description", v)} />
          <TextInput label="Button label" value={p.buttonLabel as string} onChange={(v) => set("buttonLabel", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
          <ColorPicker label="Accent color" value={p.accentColor as string} onChange={(v) => set("accentColor", v)} />
        </div>
      );
    case "product":
      return (
        <div className="space-y-3">
          <TextInput label="Name" value={p.name as string} onChange={(v) => set("name", v)} />
          <TextInput label="Price" value={p.price as string} onChange={(v) => set("price", v)} />
          <ImageField label="Image URL" value={p.image as string} onChange={(v) => set("image", v)} />
          <Textarea label="Description" value={p.description as string} onChange={(v) => set("description", v)} />
          <TextInput label="CTA label" value={p.ctaLabel as string} onChange={(v) => set("ctaLabel", v)} />
          <TextInput label="CTA URL" value={p.ctaUrl as string} onChange={(v) => set("ctaUrl", v)} />
          <TextInput label="Badge" value={p.badge as string} onChange={(v) => set("badge", v)} />
          <ColorPicker label="Background color" value={p.bgColor as string} onChange={(v) => set("bgColor", v)} />
        </div>
      );
    default:
      return null;
  }
}

// Exported for ContentEditor to render expandable widget list items
export function WidgetListItem({
  widget,
  isOpen,
  onToggle,
  onDelete,
  onUpdate,
  openWidgetPicker,
}: {
  widget: Widget;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (props: Record<string, unknown>) => void;
  openWidgetPicker?: (col: number, onPick: (t: WidgetType) => void) => void;
}) {
  const meta = WIDGET_REGISTRY[widget.type];
  const Icon = meta?.Icon;
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800/40 overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left text-xs text-slate-200">
          {isOpen ? <ChevronDown size={11} className="shrink-0" /> : <ChevronRight size={11} className="shrink-0" />}
          {Icon && <Icon size={13} className="text-slate-400 shrink-0" />}
          <span className="truncate">{meta?.label ?? widget.type}</span>
        </button>
        <button onClick={onDelete} className="text-slate-500 hover:text-red-400 shrink-0">
          <Trash2 size={12} />
        </button>
      </div>
      {isOpen && (
        <div className="p-3 border-t border-slate-700 bg-slate-900/60">
          <WidgetEditor widget={widget} update={onUpdate} openWidgetPicker={openWidgetPicker} />
        </div>
      )}
    </div>
  );
}
