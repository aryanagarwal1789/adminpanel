import React, { useRef, useState } from "react";
import { authUploadHeaders } from "@/lib/auth";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ButtonField, LinkField } from "./defaults";
import { useBlogPosts } from "./useBlogPosts";
import {
  DEFAULT_LOCALE,
  OVERLAY_LOCALES,
  isUsableVariant,
  type ImageI18n,
} from "@/lib/i18n-images";

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

const UPLOAD_URL = `${import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai"}/site/upload`;

export function VideoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(UPLOAD_URL, { method: "POST", headers: authUploadHeaders(), body: form });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { url?: string };
      if (data.url) onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isVideo = value && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value);

  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 text-xs rounded-md pb-transition font-medium disabled:opacity-50"
        style={{ background: "#7c3aed", color: "#fff", border: "none", cursor: uploading ? "default" : "pointer" }}
      >
        {uploading ? "Uploading…" : value ? "↑ Replace video" : "↑ Upload video"}
      </button>
      <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleFile} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <div className="mt-2 w-full rounded-md overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
        {value && isVideo ? (
          <video src={value} className="w-full h-full object-cover" controls />
        ) : value ? (
          <span className="text-xs text-slate-400 px-2 text-center break-all">{value}</span>
        ) : (
          <span className="text-xs text-slate-500">No video uploaded</span>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1 text-xs text-red-400 hover:text-red-300 pb-transition"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  i18n,
  onI18nChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Per-locale overrides for this field, keyed by non-English locale code.
   *  Omit (along with onI18nChange) to keep the control's original English-only
   *  behavior — nothing breaks for fields that haven't adopted this yet. */
  i18n?: ImageI18n;
  onI18nChange?: (next: ImageI18n | undefined) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);

  const localeAware = onI18nChange !== undefined;
  const isEnglish = !localeAware || locale === DEFAULT_LOCALE;
  const override = localeAware ? i18n?.[locale] : undefined;
  const hasOverride = isUsableVariant(override);
  // What this control edits right now: the base value on English, else the
  // current locale's override (or nothing, when it inherits English).
  const editValue = isEnglish ? value : (hasOverride ? (override as string) : "");

  const setOverride = (url: string) => {
    if (!onI18nChange) return;
    onI18nChange({ ...i18n, [locale]: url });
  };
  const clearOverride = () => {
    if (!onI18nChange) return;
    const next = { ...i18n };
    delete next[locale];
    // Never persist an empty override object — absent sidecar, not `{}`.
    onI18nChange(Object.keys(next).length ? next : undefined);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(UPLOAD_URL, { method: "POST", headers: authUploadHeaders(), body: form });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { url?: string };
      if (data.url) {
        if (isEnglish) onChange(data.url);
        else setOverride(data.url);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (isEnglish) onChange("");
    else clearOverride();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>{label}</Label>
        {localeAware && (
          <select
            className="text-xs rounded-md px-1.5 py-0.5 outline-none pb-transition"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", borderRadius: 6 }}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value={DEFAULT_LOCALE}>English</option>
            {OVERLAY_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {isUsableVariant(i18n?.[l.code]) ? `● ${l.label}` : l.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {!isEnglish && !hasOverride && (
        <p className="text-xs text-slate-500 mb-1">Inherits English — no override set</p>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 text-xs rounded-md pb-transition font-medium disabled:opacity-50"
        style={{ background: "#1e40af", color: "#fff", border: "none", cursor: uploading ? "default" : "pointer" }}
      >
        {uploading
          ? "Uploading…"
          : isEnglish
            ? (value ? "↑ Replace file" : "↑ Upload image / video")
            : (hasOverride ? "↑ Replace override" : `↑ Upload ${locale.toUpperCase()} override`)}
      </button>
      <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <div
        className="mt-2 h-20 w-full rounded-md overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center"
        style={!isEnglish && !hasOverride ? { opacity: 0.5 } : undefined}
      >
        {editValue || (!isEnglish && value) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={editValue || value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-500">No file uploaded</span>
        )}
      </div>
      {(isEnglish ? !!value : hasOverride) && (
        <button
          type="button"
          onClick={handleRemove}
          className="mt-1 text-xs text-red-400 hover:text-red-300 pb-transition"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {isEnglish ? "Remove" : "Use English"}
        </button>
      )}
    </div>
  );
}

/**
 * Uploads several files at once and hands back their URLs in selection order —
 * for repeater-of-images fields (e.g. a photo gallery) where adding N photos
 * one ImageField at a time is the bottleneck. Purely additive: callers append
 * `urls` to their existing array, this component holds no list state itself.
 */
export function MultiImageUploadButton({ onUploaded }: { onUploaded: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });
    const urls: string[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(UPLOAD_URL, { method: "POST", headers: authUploadHeaders(), body: form });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json() as { url?: string };
        if (data.url) urls.push(data.url);
        else failed++;
      } catch {
        failed++;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    if (urls.length) onUploaded(urls);
    if (failed) setError(`${failed} of ${files.length} file${files.length === 1 ? "" : "s"} failed to upload`);
    setUploading(false);
    setProgress(null);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 text-xs rounded-md pb-transition font-medium disabled:opacity-50"
        style={{ background: "#1e40af", color: "#fff", border: "none", cursor: uploading ? "default" : "pointer" }}
      >
        {uploading
          ? `Uploading ${progress ? `${progress.done}/${progress.total}` : "…"}`
          : "↑ Upload multiple images"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

/**
 * Bind ImageField's per-locale override props to a container object: reads
 * `container[key]` as the base value, and writes/reads the override sidecar
 * `container[key + 'I18n']` on the SAME container. Works for both block fields
 * (via ContentEditor's `update`) and repeater items (via `u`) — both are
 * "merge a patch into the container" callbacks, so the sidecar always lands
 * next to the value it overrides, and survives Repeater reordering because it
 * rides the item rather than an index-addressed path.
 *
 *   <ImageField label="Logo" {...imageI18nProps(f, 'logoImage', update)} />
 *   <ImageField label="Avatar" {...imageI18nProps(it, 'avatar', (p) => u({ ...it, ...p }))} />
 */
export function imageI18nProps<C>(
  container: C,
  key: string,
  merge: (patch: Partial<C>) => void,
) {
  const rec = container as Record<string, unknown>;
  const i18nKey = `${key}I18n`;
  return {
    value: (rec[key] as string) ?? "",
    onChange: (v: string) => merge({ [key]: v } as Partial<C>),
    i18n: rec[i18nKey] as ImageI18n | undefined,
    onI18nChange: (next: ImageI18n | undefined) => merge({ [i18nKey]: next } as Partial<C>),
  };
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
  openIndex,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  newItem: () => T;
  itemPreview: (item: T, i: number) => string;
  renderItem: (item: T, update: (next: T) => void) => React.ReactNode;
  openIndex?: number;
}) {
  const [open, setOpen] = useState<number | null>(openIndex ?? null);
  React.useEffect(() => {
    if (openIndex !== undefined && openIndex !== null) setOpen(openIndex);
  }, [openIndex]);
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

/**
 * BlogPicker — hand-pick published blog posts (by slug) for a block instance.
 * Value is an ordered string[] of slugs. Empty = renderer auto-shows newest posts.
 * Fetches the blog list via the shared cached `useBlogPosts` hook.
 */
export function BlogPicker({ label, value, onChange }: { label: string; value: string[]; onChange: (slugs: string[]) => void }) {
  const { posts, loading, error, reload } = useBlogPosts();
  const [query, setQuery] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const published = posts.filter((p) => p.status === "published");
  const bySlug = new Map(published.map((p) => [p.slug, p]));

  const reorder = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    const arr = [...value];
    const [m] = arr.splice(dragIdx, 1);
    arr.splice(to, 0, m);
    onChange(arr);
    setDragIdx(null);
  };
  const removeAt = (i: number) => onChange(value.filter((_, x) => x !== i));
  const addSlug = (slug: string) => { if (!value.includes(slug)) onChange([...value, slug]); };

  const q = query.trim().toLowerCase();
  const available = published.filter((p) => !value.includes(p.slug) && (!q || p.title.toLowerCase().includes(q)));

  return (
    <div>
      <Label>{label}</Label>
      {loading ? (
        <p className="text-xs text-slate-500 py-2">Loading posts…</p>
      ) : error ? (
        <div className="text-xs text-slate-400 py-2">
          Couldn’t load posts. <button onClick={reload} className="text-blue-400 hover:underline">Retry</button>
        </div>
      ) : (
        <>
          {value.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {value.map((slug, i) => {
                const post = bySlug.get(slug);
                return (
                  <div
                    key={slug}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorder(i)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-slate-700 bg-slate-800/40"
                  >
                    <GripVertical size={13} className="text-slate-500 cursor-grab shrink-0" />
                    <span className="flex-1 text-xs text-slate-200 truncate">
                      {post ? post.title : `${slug} (missing)`}
                    </span>
                    <button onClick={() => removeAt(i)} className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={12} /></button>
                  </div>
                );
              })}
            </div>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts to add…"
            className={fieldBase}
            style={fieldStyle}
          />
          {published.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No published posts yet.</p>
          ) : (
            <div className="mt-1.5 max-h-52 overflow-y-auto space-y-1 pr-1">
              {available.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">{q ? "No matches." : "All posts added."}</p>
              ) : (
                available.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => addSlug(p.slug)}
                    className="w-full flex items-center gap-1.5 text-left text-xs text-slate-300 hover:text-white px-2 py-1.5 rounded-md hover:bg-slate-800/60"
                  >
                    <Plus size={12} className="text-slate-500 shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </button>
                ))
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-1.5">Leave empty to auto-show the 6 newest published posts.</p>
        </>
      )}
    </div>
  );
}
