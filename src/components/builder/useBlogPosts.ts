import { useCallback, useEffect, useState } from "react";
import type { BlogPost } from "./BlogPanel";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

// Module-level cache so every BlogPicker mount / re-render / keystroke shares ONE
// network call instead of refetching. `reload()` clears it for an explicit retry.
let cache: Promise<BlogPost[]> | null = null;

function fetchBlogPosts(): Promise<BlogPost[]> {
  if (!cache) {
    cache = fetch(`${BACKEND}/site/builder/blog/posts`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => (data.posts ?? []) as BlogPost[])
      .catch((e) => {
        cache = null; // don't cache failures — allow the next mount/retry to try again
        throw e;
      });
  }
  return cache;
}

export interface UseBlogPosts {
  posts: BlogPost[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/** Fetches the full blog list (published + draft) once, shared via a module cache. */
export function useBlogPosts(): UseBlogPosts {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchBlogPosts()
      .then((p) => { if (active) { setPosts(p); setLoading(false); } })
      .catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const reload = useCallback(() => {
    cache = null;
    load();
  }, [load]);

  return { posts, loading, error, reload };
}
