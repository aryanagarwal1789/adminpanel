import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETPLACE_URL } from "@/lib/config";
import {
  AlignLeft, ChevronDown, ChevronUp, ExternalLink,
  FileText, Globe, Heading2, Heading3, ImageIcon,
  List, Minus, Plus, Quote, Search, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import type { BlogPost, ContentBlock, ContentBlockType } from "./BlogPanel";

const BACKEND = MARKETPLACE_URL;
const UPLOAD_URL = `${BACKEND}/site/upload`;
const RENDERER  = (import.meta.env.VITE_RENDERER_URL as string | undefined) ?? "https://demo-experience.salescode.ai";

// ── Utilities ─────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function calcReadTime(blocks: ContentBlock[]) {
  const words = blocks.reduce((n, b) => {
    if (b.text) n += b.text.split(/\s+/).length;
    if (b.items) n += b.items.join(" ").split(/\s+/).length;
    return n;
  }, 0);
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

const EMPTY: Omit<BlogPost, "_id"> = {
  slug: "", title: "", category: "Blog", excerpt: "", body: "",
  content: [], author: "", authorRole: "", readTime: "",
  featuredImage: "", featuredImageCaption: "", tags: [], status: "draft",
};

// ── Block type meta ───────────────────────────────────────────────
const BLOCK_META: { type: ContentBlockType; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { type: "paragraph",  label: "Paragraph",  Icon: AlignLeft  },
  { type: "heading2",   label: "Heading 2",  Icon: Heading2   },
  { type: "heading3",   label: "Heading 3",  Icon: Heading3   },
  { type: "image",      label: "Image",      Icon: ImageIcon  },
  { type: "quote",      label: "Quote",      Icon: Quote      },
  { type: "list",       label: "List",       Icon: List       },
  { type: "divider",    label: "Divider",    Icon: Minus      },
];

// ── Image uploader ────────────────────────────────────────────────
function ImgUpload({ value, onChange, label = "Upload image", small = false }:
  { value: string; onChange: (v: string) => void; label?: string; small?: boolean }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return; setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(UPLOAD_URL, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      const d = await r.json() as { url?: string };
      if (d.url) onChange(d.url);
    } catch { toast.error("Upload failed"); } finally { setBusy(false); }
  };
  return (
    <div>
      <button type="button" disabled={busy} onClick={() => ref.current?.click()}
        className={`rounded font-medium disabled:opacity-40 transition-opacity hover:opacity-80 ${small ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2 w-full"}`}
        style={{ background: "#1e40af", color: "#bfdbfe", border: "none", cursor: busy ? "default" : "pointer" }}>
        {busy ? "Uploading…" : value ? `Replace ${label.toLowerCase()}` : label}
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={handle} />
      {value && (
        <div className="mt-2 relative rounded-lg overflow-hidden">
          <img src={value} alt="" className="w-full object-cover block" style={{ maxHeight: small ? 80 : 140 }} />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 text-xs rounded px-1.5 py-0.5"
            style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Add block menu ────────────────────────────────────────────────
function AddMenu({ onAdd }: { onAdd: (t: ContentBlockType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative flex justify-center my-1" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all"
        style={{ color: "#00c6b1", background: "rgba(0,198,177,0.08)", border: "1px solid rgba(0,198,177,0.2)" }}>
        <Plus size={11} /> Add block
      </button>
      {open && (
        <div className="absolute top-full mt-1 z-40 rounded-xl shadow-2xl py-1.5"
          style={{ background: "#1a2035", border: "1px solid #2d3748", minWidth: 180 }}>
          {BLOCK_META.map(({ type, label, Icon }) => (
            <button key={type} type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors hover:bg-white/5"
              style={{ color: "#cbd5e1" }}
              onClick={() => { onAdd(type); setOpen(false); }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual block editor ───────────────────────────────────────
function BlockCard({ block, onChange, onDelete, onUp, onDown, first, last }:
  { block: ContentBlock; onChange: (p: Partial<ContentBlock>) => void; onDelete: () => void; onUp: () => void; onDown: () => void; first: boolean; last: boolean }) {
  const meta = BLOCK_META.find(m => m.type === block.type)!;
  const Icon = meta.Icon;

  const baseArea = "w-full bg-transparent resize-none focus:outline-none text-slate-100 placeholder:text-slate-600 leading-relaxed text-base";

  return (
    <div className="group relative rounded-2xl transition-all" style={{ background: "#111827", border: "1px solid #1f2937" }}>
      {/* Block header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#4b5563" }}>
          <Icon size={12} />{meta.label}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" disabled={first} onClick={onUp}  className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 text-slate-500 hover:text-white"><ChevronUp  size={14} /></button>
          <button type="button" disabled={last}  onClick={onDown} className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 text-slate-500 hover:text-white"><ChevronDown size={14} /></button>
          <button type="button" onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 pb-4 pt-1">
        {block.type === "paragraph" && (
          <textarea className={baseArea} rows={5} value={block.text ?? ""}
            onChange={e => onChange({ text: e.target.value })} placeholder="Write your paragraph here…" />
        )}

        {block.type === "heading2" && (
          <input className="w-full bg-transparent focus:outline-none text-white text-2xl font-bold placeholder:text-slate-600"
            value={block.text ?? ""} onChange={e => onChange({ text: e.target.value })} placeholder="Section heading…" />
        )}

        {block.type === "heading3" && (
          <input className="w-full bg-transparent focus:outline-none text-white text-lg font-semibold placeholder:text-slate-600"
            value={block.text ?? ""} onChange={e => onChange({ text: e.target.value })} placeholder="Sub-heading…" />
        )}

        {block.type === "image" && (
          <div className="space-y-3">
            <ImgUpload value={block.url ?? ""} onChange={url => onChange({ url })} label="Upload image" />
            <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-200 placeholder:text-slate-600"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
              value={block.caption ?? ""} onChange={e => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
            <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-400 placeholder:text-slate-600"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
              value={block.alt ?? ""} onChange={e => onChange({ alt: e.target.value })} placeholder="Alt text for accessibility" />
          </div>
        )}

        {block.type === "quote" && (
          <div className="space-y-2">
            <div style={{ borderLeft: "3px solid #00c6b1", paddingLeft: 16 }}>
              <textarea className={baseArea + " italic text-slate-300"} rows={3}
                value={block.text ?? ""} onChange={e => onChange({ text: e.target.value })} placeholder="Quote text…" />
            </div>
            <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-400 placeholder:text-slate-600"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
              value={block.attribution ?? ""} onChange={e => onChange({ attribution: e.target.value })} placeholder="— Attribution (optional)" />
          </div>
        )}

        {block.type === "list" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer mb-2">
              <input type="checkbox" checked={block.ordered ?? false} onChange={e => onChange({ ordered: e.target.checked })} />
              Numbered list
            </label>
            {(block.items ?? [""]).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-600 text-sm w-5 shrink-0 text-right">{block.ordered ? `${i + 1}.` : "•"}</span>
                <input className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-200 placeholder:text-slate-600"
                  style={{ background: "#1f2937", border: "1px solid #374151" }}
                  value={item} placeholder={`Item ${i + 1}…`}
                  onChange={e => { const arr = [...(block.items ?? [])]; arr[i] = e.target.value; onChange({ items: arr }); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); const arr = [...(block.items ?? [])]; arr.splice(i + 1, 0, ""); onChange({ items: arr }); }
                    if (e.key === "Backspace" && item === "" && (block.items ?? []).length > 1) { e.preventDefault(); const arr = [...(block.items ?? [])]; arr.splice(i, 1); onChange({ items: arr }); }
                  }} />
                {(block.items ?? []).length > 1 && (
                  <button type="button" className="text-slate-600 hover:text-red-400 p-1" onClick={() => { const arr = [...(block.items ?? [])]; arr.splice(i, 1); onChange({ items: arr }); }}><X size={12} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => onChange({ items: [...(block.items ?? []), ""] })}
              className="flex items-center gap-1 text-xs mt-1 hover:text-teal-400" style={{ color: "#4b5563" }}>
              <Plus size={11} /> Add item
            </button>
          </div>
        )}

        {block.type === "divider" && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: "#374151" }} />
            <span className="text-xs text-slate-600">Divider</span>
            <div className="flex-1 h-px" style={{ background: "#374151" }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Post list item ────────────────────────────────────────────────
function PostItem({ post, active, onClick }: { post: BlogPost; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
      style={{ background: active ? "rgba(0,198,177,0.1)" : "transparent", border: active ? "1px solid rgba(0,198,177,0.25)" : "1px solid transparent" }}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug truncate" style={{ color: active ? "#00c6b1" : "#e2e8f0" }}>{post.title || "Untitled"}</span>
        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: post.status === "published" ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.2)", color: post.status === "published" ? "#4ade80" : "#94a3b8" }}>
          {post.status === "published" ? "Live" : "Draft"}
        </span>
      </div>
      {post.excerpt && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#64748b" }}>{post.excerpt}</p>}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export function BlogEditorPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Omit<BlogPost, "_id">>({ ...EMPTY });
  const [tagInput, setTagInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "settings">("write");

  const isNew = !selected;

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/site/builder/blog/posts`)
      .then(r => r.json())
      .then((d: { posts?: BlogPost[] }) => setPosts(d.posts ?? []))
      .catch(() => toast.error("Failed to load posts"))
      .finally(() => setLoading(false));
  }, []);

  // Sync form when post changes
  useEffect(() => {
    if (selected) {
      setForm({ ...EMPTY, ...selected, content: selected.content ?? [] });
      setTagInput((selected.tags ?? []).join(", "));
      setSlugManual(true);
    } else {
      setForm({ ...EMPTY });
      setTagInput("");
      setSlugManual(false);
    }
  }, [selected]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set("title", v);
    if (!slugManual) set("slug", slugify(v));
  };

  // ── Content blocks ──────────────────────────────────────────────
  const blocks: ContentBlock[] = form.content ?? [];

  const setBlocks = useCallback((next: ContentBlock[]) => {
    setForm(f => ({ ...f, content: next, readTime: calcReadTime(next) }));
  }, []);

  const addBlock = (type: ContentBlockType, afterIdx?: number) => {
    const nb: ContentBlock = { id: uid(), type };
    if (type === "list") nb.items = [""];
    const next = [...blocks];
    next.splice(afterIdx !== undefined ? afterIdx + 1 : next.length, 0, nb);
    setBlocks(next);
  };

  const updateBlock = (id: string, patch: Partial<ContentBlock>) =>
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));

  const deleteBlock = (id: string) => setBlocks(blocks.filter(b => b.id !== id));

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i < 0) return;
    const next = [...blocks]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  // ── Save ────────────────────────────────────────────────────────
  const save = async (opts?: { publish?: boolean; unpublish?: boolean }) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim())  { toast.error("Slug is required");  return; }
    const payload: Partial<BlogPost> = { ...form, tags: tagInput.split(",").map(t => t.trim()).filter(Boolean) };
    if (opts?.publish)   { payload.status = "published"; if (!payload.publishedAt) payload.publishedAt = new Date().toISOString(); }
    if (opts?.unpublish) { payload.status = "draft"; }
    setSaving(true);
    try {
      const url  = isNew ? `${BACKEND}/site/builder/blog/posts` : `${BACKEND}/site/builder/blog/posts/${selected!.slug}`;
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})) as { error?: string }; throw new Error(e.error ?? String(res.status)); }
      const { post: saved } = await res.json() as { post: BlogPost };
      toast.success(opts?.publish ? "Published!" : opts?.unpublish ? "Reverted to draft" : "Saved");
      setPosts(ps => {
        const idx = ps.findIndex(p => p.slug === saved.slug);
        return idx >= 0 ? ps.map((p, i) => i === idx ? saved : p) : [saved, ...ps];
      });
      setSelected(saved);
    } catch (err) { toast.error(`Save failed: ${err}`); }
    finally { setSaving(false); }
  };

  const deletePost = async () => {
    if (!selected?.slug || !window.confirm("Delete this post permanently?")) return;
    try {
      await fetch(`${BACKEND}/site/builder/blog/posts/${selected.slug}`, { method: "DELETE" });
      toast.success("Deleted");
      setPosts(ps => ps.filter(p => p.slug !== selected.slug));
      setSelected(null);
    } catch { toast.error("Delete failed"); }
  };

  const newPost = () => { setSelected(null); setActiveTab("write"); };

  const filtered = posts.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase()));

  const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50";
  const inpStyle: React.CSSProperties = { background: "#111827", border: "1px solid #1f2937" };
  const lbl = "text-xs font-medium text-slate-400 mb-1.5 block";

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0a0f1a", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: "#0d1117", borderBottom: "1px solid #1f2937" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">Blog CMS</span>
          <span className="text-slate-600 text-sm">·</span>
          <span className="text-sm text-slate-400">SalesCode</span>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-3">
          {form.status === "published" ? (
            <span className="flex items-center gap-1.5 text-xs bg-green-900/30 text-green-400 px-2.5 py-1 rounded-full border border-green-800/40">
              <Globe size={10} /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 px-2.5 py-1 rounded-full" style={{ background: "#1f2937" }}>
              <FileText size={10} /> Draft
            </span>
          )}
          {form.readTime && <span className="text-xs text-slate-600">{form.readTime}</span>}
          {!isNew && form.slug && (
            <a href={`${RENDERER}/blog/${form.slug}?preview=1`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
              style={{ background: "#1f2937" }}>
              <ExternalLink size={12} /> Preview
            </a>
          )}
          {form.status === "published" ? (
            <>
              <button onClick={() => save()} disabled={saving}
                className="text-sm px-4 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ background: "#2563eb" }}>
                {saving ? "Saving…" : "Update"}
              </button>
              <button onClick={() => save({ unpublish: true })} disabled={saving}
                className="text-sm px-4 py-1.5 rounded-lg text-slate-300 disabled:opacity-50"
                style={{ border: "1px solid #374151" }}>
                Unpublish
              </button>
            </>
          ) : (
            <>
              <button onClick={() => save()} disabled={saving}
                className="text-sm px-4 py-1.5 rounded-lg text-slate-300 disabled:opacity-50"
                style={{ border: "1px solid #374151" }}>
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button onClick={() => save({ publish: true })} disabled={saving}
                className="text-sm px-5 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ background: "#00c6b1", color: "#000" }}>
                {saving ? "Publishing…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Post list ── */}
        <aside className="flex flex-col shrink-0 overflow-hidden" style={{ width: 280, background: "#0d1117", borderRight: "1px solid #1f2937" }}>
          <div className="p-3 space-y-2 shrink-0">
            <button onClick={newPost}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#00c6b1", color: "#000" }}>
              <Plus size={14} /> New Post
            </button>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none text-slate-300 placeholder:text-slate-600"
                style={{ background: "#111827", border: "1px solid #1f2937" }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {loading ? (
              <p className="text-xs text-slate-600 text-center py-8">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No posts found</p>
            ) : filtered.map(p => (
              <PostItem key={p.slug} post={p} active={selected?.slug === p.slug} onClick={() => { setSelected(p); setActiveTab("write"); }} />
            ))}
          </div>

          <div className="p-3 shrink-0" style={{ borderTop: "1px solid #1f2937" }}>
            <span className="text-xs text-slate-600">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
          </div>
        </aside>

        {/* ── Center: Article editor ── */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#0a0f1a" }}>
          {/* Tabs */}
          <div className="sticky top-0 z-10 flex gap-0 px-8 pt-4 shrink-0" style={{ background: "#0a0f1a" }}>
            {(["write", "settings"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="px-5 py-2.5 text-sm font-medium capitalize rounded-t-xl transition-all"
                style={{
                  background: activeTab === t ? "#111827" : "transparent",
                  color: activeTab === t ? "#fff" : "#64748b",
                  border: activeTab === t ? "1px solid #1f2937" : "1px solid transparent",
                  borderBottom: activeTab === t ? "1px solid #111827" : "1px solid transparent",
                  marginBottom: activeTab === t ? -1 : 0,
                }}>
                {t === "write" ? "Write" : "Settings"}
              </button>
            ))}
            <div className="flex-1" style={{ borderBottom: "1px solid #1f2937" }} />
          </div>

          <div className="px-8 py-8 max-w-3xl" style={{ background: "#111827", margin: "0 auto", minHeight: "calc(100vh - 120px)", borderLeft: "1px solid #1f2937", borderRight: "1px solid #1f2937" }}>

            {/* ─── WRITE TAB ─── */}
            {activeTab === "write" && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <input
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Post title…"
                    className="w-full bg-transparent focus:outline-none font-bold text-white placeholder:text-slate-700"
                    style={{ fontSize: 34, lineHeight: 1.2, letterSpacing: "-0.02em" }}
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <textarea
                    value={form.excerpt}
                    onChange={e => set("excerpt", e.target.value)}
                    placeholder="Write a short excerpt that appears in blog listings…"
                    rows={2}
                    className="w-full bg-transparent focus:outline-none resize-none text-slate-400 placeholder:text-slate-700 text-lg leading-relaxed"
                    style={{ borderBottom: "1px solid #1f2937", paddingBottom: 16 }}
                  />
                </div>

                {/* Block list */}
                <div className="space-y-3">
                  {blocks.length === 0 && (
                    <div className="text-center py-16 text-slate-700">
                      <AlignLeft size={40} className="mx-auto mb-4 opacity-30" />
                      <p className="text-base">Start writing your article</p>
                      <p className="text-sm mt-1">Add paragraphs, headings, images and more below</p>
                    </div>
                  )}

                  {blocks.map((block, i) => (
                    <div key={block.id}>
                      <BlockCard
                        block={block}
                        onChange={p => updateBlock(block.id, p)}
                        onDelete={() => deleteBlock(block.id)}
                        onUp={() => moveBlock(block.id, -1)}
                        onDown={() => moveBlock(block.id, 1)}
                        first={i === 0} last={i === blocks.length - 1}
                      />
                      <AddMenu onAdd={t => addBlock(t, i)} />
                    </div>
                  ))}

                  {/* Final add button */}
                  <AddMenu onAdd={t => addBlock(t)} />
                </div>
              </div>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {activeTab === "settings" && (
              <div className="space-y-6 max-w-xl">
                <div className="grid grid-cols-2 gap-4">
                  {/* Slug */}
                  <div className="col-span-2">
                    <label className={lbl}>URL Slug *</label>
                    <input className={inp} style={inpStyle} value={form.slug}
                      onChange={e => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                      placeholder="my-blog-post" />
                    <p className="text-xs text-slate-600 mt-1.5">/blog/{form.slug || "…"}</p>
                  </div>

                  {/* Category */}
                  <div className="col-span-2">
                    <label className={lbl}>Category</label>
                    <input className={inp} style={inpStyle} value={form.category ?? ""}
                      onChange={e => set("category", e.target.value)} placeholder="Blog, Case Study, News…" />
                  </div>

                  {/* Author */}
                  <div>
                    <label className={lbl}>Author name</label>
                    <input className={inp} style={inpStyle} value={form.author ?? ""}
                      onChange={e => set("author", e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className={lbl}>Author role</label>
                    <input className={inp} style={inpStyle} value={form.authorRole ?? ""}
                      onChange={e => set("authorRole", e.target.value)} placeholder="Product Lead" />
                  </div>
                </div>

                {/* Hero image */}
                <div>
                  <label className={lbl}>Hero image</label>
                  <ImgUpload value={form.featuredImage} onChange={v => set("featuredImage", v)} label="Upload hero image" />
                  {form.featuredImage && (
                    <input className={inp + " mt-2"} style={inpStyle} value={form.featuredImageCaption ?? ""}
                      onChange={e => set("featuredImageCaption", e.target.value)} placeholder="Image caption (optional)" />
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className={lbl}>Tags <span className="text-slate-600 font-normal">(comma-separated)</span></label>
                  <input className={inp} style={inpStyle} value={tagInput}
                    onChange={e => setTagInput(e.target.value)} placeholder="SFA, CPG, AI" />
                </div>

                {/* Read time */}
                <div>
                  <label className={lbl}>Read time <span className="text-slate-600 font-normal">(auto-calculated)</span></label>
                  <input className={inp} style={inpStyle} value={form.readTime ?? ""}
                    onChange={e => set("readTime", e.target.value)} placeholder="5 min read" />
                </div>

                {/* Danger zone */}
                {!isNew && (
                  <div className="pt-6 mt-6" style={{ borderTop: "1px solid #1f2937" }}>
                    <p className="text-xs font-medium text-slate-500 mb-3">Danger zone</p>
                    <button onClick={deletePost}
                      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors"
                      style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                      <Trash2 size={14} /> Delete this post permanently
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
