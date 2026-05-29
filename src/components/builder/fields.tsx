import { useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ButtonField, LinkField } from "./defaults";

const fieldBase =
  "w-full text-sm rounded-md px-2.5 py-1.5 outline-none pb-transition focus:border-blue-500";
const fieldStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  borderRadius: 6,
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-300 mb-1.5">{children}</label>;
}

export function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input className={fieldBase} style={fieldStyle} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea rows={rows} className={fieldBase + " resize-none"} style={fieldStyle} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input className={fieldBase} style={fieldStyle} value={value ?? ""} placeholder="https://..." onChange={(e) => onChange(e.target.value)} />
      <div className="mt-2 h-20 w-full rounded-md overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-500">No image</span>
        )}
      </div>
    </div>
  );
}

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input className={fieldBase} style={fieldStyle} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0" />
      </div>
    </div>
  );
}

export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select className={fieldBase} style={fieldStyle} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full pb-transition shrink-0"
        style={{ background: value ? "#3b82f6" : "#475569" }}
      >
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white pb-transition" style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

export function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="number" className={fieldBase} style={fieldStyle} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Slider({ label, value, onChange, min = 1, max = 100, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <span className="text-xs text-slate-400 tabular-nums">{value ?? min}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

const VARIANTS: { value: ButtonField["variant"]; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

export function ButtonEditor({ label, value, onChange }: { label: string; value: ButtonField; onChange: (v: ButtonField) => void }) {
  const v = value ?? { label: "", url: "", variant: "primary" as const };
  return (
    <div className="space-y-2 rounded-md border border-slate-700 p-3">
      <div className="text-xs font-semibold text-slate-200">{label}</div>
      <TextInput label="Button label" value={v.label} onChange={(x) => onChange({ ...v, label: x })} />
      <TextInput label="URL" value={v.url} onChange={(x) => onChange({ ...v, url: x })} />
      <Select label="Variant" value={v.variant} onChange={(x) => onChange({ ...v, variant: x })} options={VARIANTS} />
      <ColorPicker label="Background color" value={v.color ?? ""} onChange={(x) => onChange({ ...v, color: x || undefined })} />
      <ColorPicker label="Text color" value={v.textColor ?? ""} onChange={(x) => onChange({ ...v, textColor: x || undefined })} />
    </div>
  );
}

export function LinkItemEditor({ value, onChange }: { value: LinkField; onChange: (v: LinkField) => void }) {
  return (
    <div className="space-y-2">
      <TextInput label="Label" value={value.label} onChange={(x) => onChange({ ...value, label: x })} />
      <TextInput label="URL" value={value.url} onChange={(x) => onChange({ ...value, url: x })} />
    </div>
  );
}

export function Repeater<T>({
  label,
  items,
  onChange,
  newItem,
  itemPreview,
  renderItem,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  newItem: () => T;
  itemPreview: (item: T, i: number) => string;
  renderItem: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const update = (i: number, next: T) => {
    const arr = [...items];
    arr[i] = next;
    onChange(arr);
  };
  const remove = (i: number) => {
    onChange(items.filter((_, x) => x !== i));
    if (open === i) setOpen(null);
  };
  const add = () => {
    onChange([...items, newItem()]);
    setOpen(items.length);
  };
  const reorder = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    const arr = [...items];
    const [m] = arr.splice(dragIdx, 1);
    arr.splice(to, 0, m);
    onChange(arr);
    setDragIdx(null);
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-1.5">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-md border border-slate-700 bg-slate-800/40 overflow-hidden">
              <div
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(i)}
                className="flex items-center gap-2 px-2 py-1.5"
              >
                <GripVertical size={13} className="text-slate-500 cursor-grab shrink-0" />
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex-1 text-left text-xs text-slate-200 truncate flex items-center gap-1">
                  <ChevronDown size={12} style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }} className="pb-transition shrink-0" />
                  <span className="truncate">{itemPreview(it, i) || `Item ${i + 1}`}</span>
                </button>
                <button onClick={() => remove(i)} className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={12} /></button>
              </div>
              {isOpen && (
                <div className="p-3 border-t border-slate-700 space-y-2 bg-slate-900/50">
                  {renderItem(it, (next) => update(i, next))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-md py-2 pb-transition">
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}
