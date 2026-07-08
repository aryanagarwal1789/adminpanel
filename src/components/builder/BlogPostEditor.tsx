import { useEffect, useRef, useState, useCallback } from "react";
import { MARKETPLACE_URL, MARKETPLACE_UPLOAD_URL } from "@/lib/config";
import {
  FileText, Globe, X, Trash2, ExternalLink,
  AlignLeft, Heading2, Heading3, ImageIcon, Quote,
  List, Minus, ChevronUp, ChevronDown, Plus, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { BlogPost, ContentBlock, ContentBlockType } from "./BlogPanel";

const BACKEND = MARKETPLACE_URL;
const UPLOAD_URL = MARKETPLACE_UPLOAD_URL;

function uid() { return Math.random().toString(36).slice(2, 10); }

function calcReadTime(content: ContentBlock[]): string {
  const words = content.reduce((acc, b) => {
    if (b.text) acc += b.text.split(/\s+/).length;
    if (b.items) acc += b.items.join(" ").split(/\s+/).length;
    return acc;
  }, 0);
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

// ── Image upload ─────────────────────────────────────────────────
function ImageUploadInline({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url?: string };
      if (data.url) onChange(data.url);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <button
        type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="w-full py-1.5 text-xs rounded font-medium disabled:opacity-50"
        style={{ background: value ? "#1e3a5f" : "#1e40af", color: "#93c5fd", border: "1px solid #1e3a8a" }}
      >
        {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} />
      {value && (
        <div className="mt-2 relative rounded overflow-hidden" style={{ maxHeight: 120 }}>
          <img src={value} alt="" className="w-full object-cover block" style={{ maxHeight: 120 }} />
          <button
            type="button" onClick={() => onChange("")}
            className="absolute top-1 right-1 text-xs rounded px-1.5 py-0.5"
            style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ── Block type config ─────────────────────────────────────────────
const BLOCK_TYPES: { type: ContentBlockType; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { type: "paragraph",  label: "Paragraph", Icon: AlignLeft },
  { type: "heading2",   label: "Heading 2", Icon: Heading2 },
  { type: "heading3",   label: "Heading 3", Icon: Heading3 },
  { type: "image",      label: "Image",     Icon: ImageIcon },
  { type: "quote",      label: "Quote",     Icon: Quote },
  { type: "list",       label: "List",      Icon: List },
  { type: "divider",    label: "Divider",   Icon: Minus },
];

function blockLabel(type: ContentBlockType) {
  return BLOCK_TYPES.find(b => b.type === type)?.label ?? type;
}

// ── Add-block picker ──────────────────────────────────────────────
function AddBlockMenu({ onAdd, onClose }: { onAdd: (t: ContentBlockType) => void; onClose: () => void }) {
  return (
    <div
      className="absolute z-50 rounded-xl shadow-2xl py-1 w-44"
      style={{ background: "#1a2035", border: "1px solid #334155", top: "100%", left: 0 }}
    >
      {BLOCK_TYPES.map(({ type, label, Icon }) => (
        <button
          key={type}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5"
          style={{ color: "#cbd5e1" }}
          onClick={() => { onAdd(type); onClose(); }}
        >
          <Icon size={13} />{label}
        </button>
      ))}
    </div>
  );
}

// ── Single block editor ────────────────────────────────────────────
function BlockEditor({
  block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block: ContentBlock;
  onChange: (patch: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const ta = "w-full bg-transparent resize-none text-sm placeholder:text-slate-600 focus:outline-none text-slate-200 leading-relaxed";
  const Icon = BLOCK_TYPES.find(b => b.type === block.type)?.Icon ?? AlignLeft;

  return (
    <div
      className="group relative rounded-lg px-3 py-2.5"
      style={{ background: "#0f172a", border: "1px solid #1e293b" }}
    >
      {/* type badge + controls */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: "#64748b" }}>
          <Icon size={11} />{blockLabel(block.type)}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1 rounded hover:bg-white/10 disabled:opacity-20" title="Move up"><ChevronUp size={12} /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1 rounded hover:bg-white/10 disabled:opacity-20" title="Move down"><ChevronDown size={12} /></button>
          <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 text-red-400" title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Content input per type */}
      {block.type === "paragraph" && (
        <textarea
          className={ta} rows={4}
          value={block.text ?? ""}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Write your paragraph…"
        />
      )}

      {(block.type === "heading2" || block.type === "heading3") && (
        <input
          className="w-full bg-transparent text-sm placeholder:text-slate-600 focus:outline-none text-slate-100 font-semibold"
          value={block.text ?? ""}
          onChange={e => onChange({ text: e.target.value })}
          placeholder={block.type === "heading2" ? "Section heading…" : "Sub-heading…"}
        />
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <ImageUploadInline value={block.url ?? ""} onChange={url => onChange({ url })} />
          <input
            className="w-full bg-slate-800/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none border border-slate-700/50"
            value={block.caption ?? ""}
            onChange={e => onChange({ caption: e.target.value })}
            placeholder="Caption (optional)"
          />
          <input
            className="w-full bg-slate-800/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none border border-slate-700/50"
            value={block.alt ?? ""}
            onChange={e => onChange({ alt: e.target.value })}
            placeholder="Alt text for accessibility"
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-2">
          <textarea
            className={ta} rows={3}
            value={block.text ?? ""}
            onChange={e => onChange({ text: e.target.value })}
            placeholder="Quote text…"
          />
          <input
            className="w-full bg-slate-800/50 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none border border-slate-700/50"
            value={block.attribution ?? ""}
            onChange={e => onChange({ attribution: e.target.value })}
            placeholder="— Attribution (optional)"
          />
        </div>
      )}

      {block.type === "list" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
              <input type="checkbox" checked={block.ordered ?? false} onChange={e => onChange({ ordered: e.target.checked })} />
              Numbered list
            </label>
          </div>
          {(block.items ?? [""]).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-slate-600 text-xs w-4 shrink-0">{block.ordered ? `${i + 1}.` : "•"}</span>
              <input
                className="flex-1 bg-slate-800/50 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none border border-slate-700/50"
                value={item}
                onChange={e => {
                  const items = [...(block.items ?? [])];
                  items[i] = e.target.value;
                  onChange({ items });
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const items = [...(block.items ?? [])];
                    items.splice(i + 1, 0, "");
                    onChange({ items });
                  }
                  if (e.key === "Backspace" && item === "" && (block.items ?? []).length > 1) {
                    e.preventDefault();
                    const items = [...(block.items ?? [])];
                    items.splice(i, 1);
                    onChange({ items });
                  }
                }}
                placeholder={`Item ${i + 1}…`}
              />
              {(block.items ?? []).length > 1 && (
                <button type="button" className="text-slate-600 hover:text-red-400" onClick={() => {
                  const items = [...(block.items ?? [])]; items.splice(i, 1); onChange({ items });
                }}><X size={10} /></button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="flex items-center gap-1 text-[11px] mt-1 hover:text-teal-400"
            style={{ color: "#64748b" }}
            onClick={() => onChange({ items: [...(block.items ?? []), ""] })}
          >
            <Plus size={10} /> Add item
          </button>
        </div>
      )}

      {block.type === "divider" && (
        <div className="py-1 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: "#334155" }} />
          <span className="text-[10px] text-slate-600">Divider</span>
          <div className="flex-1 h-px" style={{ background: "#334155" }} />
        </div>
      )}
    </div>
  );
}

// ── Metadata section ──────────────────────────────────────────────
function FeaturedImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url?: string };
      if (data.url) onChange(data.url);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="text-xs font-medium text-slate-400 mb-1.5">Hero image</div>
      <button
        type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="w-full py-1.5 text-xs rounded-md font-medium disabled:opacity-50"
        style={{ background: "#1e40af", color: "#fff", border: "none", cursor: uploading ? "default" : "pointer" }}
      >
        {uploading ? "Uploading…" : value ? "Replace hero image" : "Upload hero image"}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} />
      {value && (
        <div className="mt-2 relative rounded overflow-hidden">
          <img src={value} alt="" className="rounded w-full object-cover block" style={{ maxHeight: 110 }} />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-1 right-1 text-xs rounded px-1.5 py-0.5"
            style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ── EMPTY defaults ────────────────────────────────────────────────
const EMPTY: Omit<BlogPost, "_id"> = {
  slug: "", title: "", category: "Blog", excerpt: "", body: "",
  content: [], author: "", authorRole: "", readTime: "",
  featuredImage: "", featuredImageCaption: "", tags: [], status: "draft",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Main editor ───────────────────────────────────────────────────
interface Props {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: (post: BlogPost) => void;
  onDeleted: (slug: string) => void;
}

type Tab = "content" | "meta";

export function BlogPostEditor({ post, onClose, onSaved, onDeleted }: Props) {
  const isNew = !post;
  const [form, setForm] = useState<Omit<BlogPost, "_id">>({ ...EMPTY });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const [addMenuAt, setAddMenuAt] = useState<number | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post) {
      setForm({ ...EMPTY, ...post, content: post.content ?? [] });
      setTagInput((post.tags ?? []).join(", "));
      setSlugManual(true);
    } else {
      setForm({ ...EMPTY });
      setTagInput("");
      setSlugManual(false);
    }
  }, [post]);

  // Close add menu on outside click
  useEffect(() => {
    if (addMenuAt === null) return;
    const handler = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setAddMenuAt(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addMenuAt]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set("title", v);
    if (!slugManual) set("slug", slugify(v));
  };

  // ── Content block operations ──────────────────────────────────
  const blocks: ContentBlock[] = form.content ?? [];

  const setBlocks = (next: ContentBlock[]) => {
    set("content", next);
    set("readTime", calcReadTime(next));
  };

  const addBlock = useCallback((type: ContentBlockType, afterIndex: number) => {
    const newBlock: ContentBlock = { id: uid(), type };
    if (type === "list") newBlock.items = [""];
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, newBlock);
    setBlocks(next);
  }, [blocks]);

  const updateBlock = (id: string, patch: Partial<ContentBlock>) =>
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));

  const deleteBlock = (id: string) => setBlocks(blocks.filter(b => b.id !== id));

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i < 0) return;
    const next = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async (publishNow?: boolean) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim())  { toast.error("Slug is required");  return; }

    const payload: Partial<BlogPost> = {
      ...form,
      tags: tagInput.split(",").map(t => t.trim()).filter(Boolean),
    };
    if (publishNow) {
      payload.status = "published";
      if (!payload.publishedAt) payload.publishedAt = new Date().toISOString();
    }

    setSaving(true);
    try {
      const url = isNew
        ? `${BACKEND}/site/builder/blog/posts`
        : `${BACKEND}/site/builder/blog/posts/${post!.slug}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      const { post: saved } = await res.json() as { post: BlogPost };
      toast.success(publishNow ? "Post published!" : "Post saved");
      onSaved(saved);
    } catch (err) {
      toast.error(`Save failed: ${err}`);
    } finally { setSaving(false); }
  };

  const handleUnpublish = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/posts/${post!.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) throw new Error();
      const { post: saved } = await res.json() as { post: BlogPost };
      toast.success("Reverted to draft");
      onSaved(saved);
    } catch { toast.error("Failed to unpublish"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!post?.slug || !window.confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/posts/${post.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Post deleted");
      onDeleted(post.slug);
    } catch (err) { toast.error(`Delete failed: ${err}`); }
  };

  const input = "w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 outline-none";
  const lbl = "text-xs text-slate-400 mb-1.5 block";

  return (
    <div className="flex flex-col h-full text-white" data-builder-panel>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="text-sm font-semibold truncate pr-2">
          {isNew ? "New Blog Post" : (form.title || "Edit Post")}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 shrink-0"><X size={14} /></button>
      </div>

      {/* ── Status bar ── */}
      <div className="px-4 py-2 border-b border-slate-800 shrink-0 flex items-center gap-3">
        {form.status === "published" ? (
          <span className="flex items-center gap-1.5 text-xs bg-green-900/40 text-green-400 px-2.5 py-1 rounded-full">
            <Globe size={10} /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs bg-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
            <FileText size={10} /> Draft
          </span>
        )}
        {form.readTime && (
          <span className="text-[11px] text-slate-500">{form.readTime}</span>
        )}
        {!isNew && form.slug && (
          <a
            href={`${import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai"}/blog/${form.slug}?preview=1`}
            target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            Preview <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-800 shrink-0">
        {(["content", "meta"] as Tab[]).map(t => (
          <button
            key={t}
            className="flex-1 py-2 text-xs font-medium capitalize"
            style={{ color: tab === t ? "#00c6b1" : "#64748b", borderBottom: tab === t ? "2px solid #00c6b1" : "2px solid transparent" }}
            onClick={() => setTab(t)}
          >
            {t === "content" ? "Content" : "Settings"}
          </button>
        ))}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ CONTENT TAB ═══ */}
        {tab === "content" && (
          <div className="p-4 space-y-2">

            {/* Title (always visible in content tab) */}
            <div>
              <label className={lbl}>Title *</label>
              <input
                className={input}
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Your blog post title"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className={lbl}>Excerpt <span className="text-slate-600">— shown in listings</span></label>
              <textarea
                className={input + " resize-none"}
                rows={2}
                value={form.excerpt}
                onChange={e => set("excerpt", e.target.value)}
                placeholder="One-sentence summary of the post…"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">Article body</span>
                <span className="text-[11px] text-slate-600">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Block list */}
              <div className="space-y-2">
                {blocks.map((block, i) => (
                  <div key={block.id}>
                    <BlockEditor
                      block={block}
                      onChange={patch => updateBlock(block.id, patch)}
                      onDelete={() => deleteBlock(block.id)}
                      onMoveUp={() => moveBlock(block.id, -1)}
                      onMoveDown={() => moveBlock(block.id, 1)}
                      isFirst={i === 0}
                      isLast={i === blocks.length - 1}
                    />
                    {/* Add block between */}
                    <div className="flex justify-center relative" style={{ height: 20 }}>
                      <div className="absolute" ref={addMenuAt === i ? addMenuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setAddMenuAt(addMenuAt === i ? null : i)}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                          style={{ color: "#00c6b1", background: "rgba(0,198,177,0.1)", border: "1px solid rgba(0,198,177,0.2)" }}
                        >
                          <Plus size={9} /> Add
                        </button>
                        {addMenuAt === i && (
                          <AddBlockMenu onAdd={t => { addBlock(t, i); setAddMenuAt(null); }} onClose={() => setAddMenuAt(null)} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add first/last block */}
              <div className="relative mt-2" ref={addMenuAt === -1 ? addMenuRef : undefined}>
                <button
                  type="button"
                  onClick={() => setAddMenuAt(addMenuAt === -1 ? null : -1)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs"
                  style={{ color: "#64748b", border: "1px dashed #334155", background: "rgba(15,23,42,0.5)" }}
                >
                  <Plus size={12} />
                  {blocks.length === 0 ? "Add your first content block" : "Add block"}
                </button>
                {addMenuAt === -1 && (
                  <AddBlockMenu onAdd={t => { addBlock(t, blocks.length - 1); setAddMenuAt(null); }} onClose={() => setAddMenuAt(null)} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ META / SETTINGS TAB ═══ */}
        {tab === "meta" && (
          <div className="p-4 space-y-4">

            {/* Slug */}
            <div>
              <label className={lbl}>URL Slug *</label>
              <input
                className={input}
                value={form.slug}
                onChange={e => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                placeholder="my-blog-post"
              />
              <div className="text-[11px] text-slate-500 mt-1">/blog/{form.slug || "…"}</div>
            </div>

            {/* Category */}
            <div>
              <label className={lbl}>Category</label>
              <input className={input} value={form.category ?? ""} onChange={e => set("category", e.target.value)} placeholder="Blog, News, Case Study…" />
            </div>

            {/* Author */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Author name</label>
                <input className={input} value={form.author ?? ""} onChange={e => set("author", e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className={lbl}>Author role</label>
                <input className={input} value={form.authorRole ?? ""} onChange={e => set("authorRole", e.target.value)} placeholder="Product Lead" />
              </div>
            </div>

            {/* Hero image */}
            <FeaturedImageUpload value={form.featuredImage} onChange={v => set("featuredImage", v)} />

            {/* Hero image caption */}
            {form.featuredImage && (
              <div>
                <label className={lbl}>Hero image caption</label>
                <input className={input} value={form.featuredImageCaption ?? ""} onChange={e => set("featuredImageCaption", e.target.value)} placeholder="Photo caption…" />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className={lbl}>Tags <span className="text-slate-600">(comma-separated)</span></label>
              <input className={input} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="SFA, CPG, AI" />
            </div>

            {/* Read time override */}
            <div>
              <label className={lbl}>Read time <span className="text-slate-600">(auto-calculated)</span></label>
              <input className={input} value={form.readTime ?? ""} onChange={e => set("readTime", e.target.value)} placeholder="5 min read" />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-800 space-y-2">
        {form.status !== "published" ? (
          <>
            <button
              onClick={() => handleSave(true)} disabled={saving}
              className="w-full py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
              style={{ background: "#22c55e" }}
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
            <button
              onClick={() => handleSave(false)} disabled={saving}
              className="w-full py-2 text-sm rounded-md text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSave(false)} disabled={saving}
              className="w-full py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
              style={{ background: "#2563eb" }}
            >
              {saving ? "Saving…" : "Update post"}
            </button>
            <button
              onClick={handleUnpublish} disabled={saving}
              className="w-full py-2 text-sm rounded-md text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-50"
            >
              Unpublish
            </button>
          </>
        )}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full py-1.5 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1"
          >
            <Trash2 size={11} /> Delete post
          </button>
        )}
      </div>
    </div>
  );
}
