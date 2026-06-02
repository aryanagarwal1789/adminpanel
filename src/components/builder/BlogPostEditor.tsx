import { useEffect, useRef, useState } from "react";
import { FileText, Globe, X, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "./BlogPanel";

const BACKEND = "https://salescode-marketplace.salescode.ai";

const UPLOAD_URL = "https://salescode-marketplace.salescode.ai/site/upload";

function FeaturedImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url?: string };
      if (data.url) onChange(data.url);
    } catch { setError("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="text-xs font-medium text-slate-300 mb-1.5">Featured image</div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="w-full py-1.5 text-xs rounded-md font-medium disabled:opacity-50 pb-transition"
        style={{ background: "#1e40af", color: "#fff", border: "none", cursor: uploading ? "default" : "pointer" }}
      >
        {uploading ? "Uploading…" : value ? "↑ Replace image" : "↑ Upload featured image"}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {value && (
        <div className="mt-2 relative">
          <img src={value} alt="" className="rounded w-full object-cover" style={{ maxHeight: 120 }} />
          <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 text-xs bg-black/60 text-white rounded px-1.5 py-0.5 hover:bg-black/80">✕</button>
        </div>
      )}
    </div>
  );
}

const EMPTY: Omit<BlogPost, "_id"> = {
  slug: "", title: "", excerpt: "", body: "",
  author: "", featuredImage: "", tags: [], status: "draft",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface Props {
  post: BlogPost | null; // null = new post mode
  onClose: () => void;
  onSaved: (post: BlogPost) => void;
  onDeleted: (slug: string) => void;
}

export function BlogPostEditor({ post, onClose, onSaved, onDeleted }: Props) {
  const isNew = !post;
  const [form, setForm] = useState<Omit<BlogPost, "_id">>({ ...EMPTY });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (post) {
      setForm({ ...EMPTY, ...post });
      setTagInput((post.tags ?? []).join(", "));
      setSlugManual(true);
    } else {
      setForm({ ...EMPTY });
      setTagInput("");
      setSlugManual(false);
    }
  }, [post]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set("title", v);
    if (!slugManual) set("slug", slugify(v));
  };

  const handleSave = async (publishNow?: boolean) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim())  { toast.error("Slug is required");  return; }

    const payload: Partial<BlogPost> = {
      ...form,
      tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
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
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/posts/${post!.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      const { post: saved } = await res.json() as { post: BlogPost };
      toast.success("Post reverted to draft");
      onSaved(saved);
    } catch {
      toast.error("Failed to unpublish");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post?.slug || !window.confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/posts/${post.slug}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      toast.success("Post deleted");
      onDeleted(post.slug);
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
  };

  const input = "w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 outline-none pb-transition";
  const label = "text-xs text-slate-400 mb-1.5 block";

  return (
    <div className="flex flex-col h-full text-white" data-builder-panel>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="text-sm font-semibold truncate pr-2">
          {isNew ? "New Post" : (form.title || "Edit Post")}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 pb-transition shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Status pill */}
      <div className="px-4 py-2.5 border-b border-slate-800 shrink-0 flex items-center gap-3">
        {form.status === "published" ? (
          <span className="flex items-center gap-1.5 text-xs bg-green-900/40 text-green-400 px-2.5 py-1 rounded-full">
            <Globe size={10} /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs bg-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
            <FileText size={10} /> Draft
          </span>
        )}
        {form.publishedAt && (
          <span className="text-xs text-slate-500">
            {new Date(form.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}
        {!isNew && form.slug && (
          <a
            href={`${import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai"}/blog/${form.slug}?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white pb-transition"
          >
            Preview <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-fade-in">
        {/* Title */}
        <div>
          <label className={label}>Title *</label>
          <input
            className={input}
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="My amazing blog post"
          />
        </div>

        {/* Slug */}
        <div>
          <label className={label}>Slug *</label>
          <input
            className={input}
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
            placeholder="my-amazing-blog-post"
          />
          <div className="text-[11px] text-slate-500 mt-1">/blog/{form.slug || "…"}</div>
        </div>

        {/* Excerpt */}
        <div>
          <label className={label}>Excerpt</label>
          <textarea
            className={input + " resize-none"}
            rows={3}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Short summary shown in the blog listing…"
          />
        </div>

        {/* Body */}
        <div>
          <label className={label}>Body</label>
          <textarea
            className={input + " resize-none leading-relaxed"}
            rows={18}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={"Write your post content here.\n\nParagraphs are separated by blank lines.\nFormatting support (markdown/rich text) coming soon."}
          />
        </div>

        {/* Metadata */}
        <div className="space-y-4 pt-3 border-t border-slate-800">
          <div>
            <label className={label}>Author</label>
            <input className={input} value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Jane Doe" />
          </div>

          <FeaturedImageUpload value={form.featuredImage} onChange={(v) => set("featuredImage", v)} />

          <div>
            <label className={label}>Tags <span className="text-slate-600">(comma-separated)</span></label>
            <input
              className={input}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="engineering, product, design"
            />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-800 space-y-2">
        {form.status !== "published" ? (
          <>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-2 text-sm font-medium rounded-md text-white pb-transition disabled:opacity-50 hover:opacity-90"
              style={{ background: "#22c55e" }}
            >
              {saving ? "Publishing…" : "Publish post"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-2 text-sm rounded-md text-slate-300 border border-slate-700 hover:bg-slate-800 pb-transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 pb-transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update post"}
            </button>
            <button
              onClick={handleUnpublish}
              disabled={saving}
              className="w-full py-2 text-sm rounded-md text-slate-300 border border-slate-700 hover:bg-slate-800 pb-transition disabled:opacity-50"
            >
              Unpublish (revert to draft)
            </button>
          </>
        )}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full py-1.5 text-xs text-red-400 hover:text-red-300 pb-transition flex items-center justify-center gap-1"
          >
            <Trash2 size={11} /> Delete post
          </button>
        )}
      </div>
    </div>
  );
}
