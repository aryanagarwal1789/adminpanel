import { useCallback, useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

export type ContentBlockType = 'paragraph' | 'heading2' | 'heading3' | 'image' | 'quote' | 'list' | 'divider' | 'faq' | 'image-grid';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  text?: string;        // paragraph / heading2 / heading3 / quote / faq (section title)
  attribution?: string; // quote
  url?: string;         // image
  caption?: string;     // image
  alt?: string;         // image
  items?: string[];     // list
  ordered?: boolean;    // list
  faqItems?: { q: string; a: string }[]; // faq
  columns?: 2 | 3 | 4; // image-grid
  images?: { url: string; caption?: string; alt?: string }[]; // image-grid
}

export interface BlogPost {
  _id?: string;
  slug: string;
  title: string;
  category?: string;
  excerpt: string;
  body: string;
  content?: ContentBlock[];
  author?: string;
  authorRole?: string;
  readTime?: string;
  featuredImage: string;
  featuredImageCaption?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt?: string;
  createdAt?: string;
}

interface Props {
  selectedSlug: string | null;
  onSelect: (post: BlogPost) => void;
  onNew: () => void;
  refreshKey: number;
}

export function BlogPanel({ selectedSlug, onSelect, onNew, refreshKey }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/site/builder/blog/posts`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      toast.error("Could not load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider pb-muted font-semibold">Blog Posts</span>
        <button onClick={onNew} className="p-1 rounded hover:bg-slate-800 pb-transition" title="New post">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 mt-1 space-y-0.5">
        {loading && (
          <div className="text-xs text-slate-500 px-2 py-6 text-center">Loading…</div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-xs text-slate-400 px-2 py-8 text-center">
            <FileText size={28} className="mx-auto mb-3 opacity-40" />
            No posts yet.
            <button onClick={onNew} className="block mx-auto mt-2 text-blue-400 hover:text-blue-300">
              Create your first post →
            </button>
          </div>
        )}

        {posts.map((post) => (
          <button
            key={post.slug}
            onClick={() => onSelect(post)}
            className={`w-full text-left px-3 py-2 rounded text-sm pb-transition ${
              selectedSlug === post.slug
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex-1 truncate font-medium">{post.title || "Untitled"}</span>
              <span
                className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                  post.status === "published"
                    ? "bg-green-900/60 text-green-400"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {post.status}
              </span>
            </div>
            {post.excerpt && (
              <div className="text-xs text-slate-500 mt-0.5 truncate">{post.excerpt}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
