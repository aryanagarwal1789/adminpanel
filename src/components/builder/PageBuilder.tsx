import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Undo2, Redo2, Plus, Eye, EyeOff, Trash2, GripVertical,
  X, Palette, Play, FileText, ChevronLeft, PenLine, Paintbrush, Settings, Layers, Globe, Search,
} from "lucide-react";
import { defaultBlock } from "./blocks";
import { AddSectionDrawer } from "./AddSectionDrawer";
import { ContentEditor } from "./ContentEditor";
import { StyleEditor } from "./StyleEditor";
import { ThemePanel } from "./ThemePanel";
import { PreviewModal } from "./PreviewModal";
import { WidgetPicker } from "./WidgetPicker";
import { BlogPanel, type BlogPost } from "./BlogPanel";
import { BlogPostEditor } from "./BlogPostEditor";
import { defaultWidget, WIDGET_REGISTRY, type Widget, type WidgetType } from "./widgets";
import { WidgetEditor } from "./WidgetEditor";
import {
  BLOCK_LABELS, DEFAULT_THEME,
  type Block, type BlockStyle, type BlockType, type LayoutVariant, type Page, type Theme,
} from "./types";

// Recursively find a widget by id in a widget array (handles row nesting)
function findWidgetInArray(widgets: Widget[], id: string): Widget | null {
  for (const w of widgets) {
    if (w.id === id) return w;
    if (w.type === "row") {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      for (const col of cols) {
        const found = findWidgetInArray(col, id);
        if (found) return found;
      }
    }
  }
  return null;
}

function findWidgetById(blocks: Block[], id: string): Widget | null {
  for (const b of blocks) {
    const f = b.fields as Record<string, unknown>;
    const bw = findWidgetInArray((f.widgets as Widget[]) ?? [], id);
    if (bw) return bw;
    const cols = (f.columns as Widget[][]) ?? [];
    for (const col of cols) {
      const cw = findWidgetInArray(col, id);
      if (cw) return cw;
    }
  }
  return null;
}

// Recursively update widget props in a widget array
function updateWidgetInArray(widgets: Widget[], id: string, props: Record<string, unknown>): { arr: Widget[]; changed: boolean } {
  let changed = false;
  const arr = widgets.map((w) => {
    if (w.id === id) { changed = true; return { ...w, props }; }
    if (w.type === "row") {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      let innerChanged = false;
      const newCols = cols.map((col) => {
        const res = updateWidgetInArray(col, id, props);
        if (res.changed) innerChanged = true;
        return res.arr;
      });
      if (innerChanged) { changed = true; return { ...w, props: { ...w.props, cols: newCols } }; }
    }
    return w;
  });
  return { arr, changed };
}

function deleteWidgetFromArray(widgets: Widget[], id: string): { arr: Widget[]; changed: boolean } {
  let changed = false;
  const arr: Widget[] = [];
  for (const w of widgets) {
    if (w.id === id) { changed = true; continue; }
    if (w.type === 'row') {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      let innerChanged = false;
      const newCols = cols.map((col) => {
        const res = deleteWidgetFromArray(col, id);
        if (res.changed) innerChanged = true;
        return res.arr;
      });
      if (innerChanged) { changed = true; arr.push({ ...w, props: { ...w.props, cols: newCols } }); continue; }
    }
    arr.push(w);
  }
  return { arr, changed };
}

function deleteWidgetFromBlocks(blocks: Block[], widgetId: string): Block[] {
  return blocks.map((b) => {
    const f = b.fields as Record<string, unknown>;
    const bwRes = deleteWidgetFromArray((f.widgets as Widget[]) ?? [], widgetId);
    if (bwRes.changed) return { ...b, fields: { ...f, widgets: bwRes.arr } };
    const cols = (f.columns as Widget[][]) ?? [];
    let colChanged = false;
    const newCols = cols.map((col) => {
      const res = deleteWidgetFromArray(col, widgetId);
      if (res.changed) colChanged = true;
      return res.arr;
    });
    if (colChanged) return { ...b, fields: { ...f, columns: newCols } };
    return b;
  });
}

function updateWidgetInBlocks(blocks: Block[], widgetId: string, props: Record<string, unknown>): Block[] {
  return blocks.map((b) => {
    const f = b.fields as Record<string, unknown>;
    // Check block.fields.widgets
    const bwRes = updateWidgetInArray((f.widgets as Widget[]) ?? [], widgetId, props);
    if (bwRes.changed) return { ...b, fields: { ...f, widgets: bwRes.arr } };
    // Check layout columns
    const cols = (f.columns as Widget[][]) ?? [];
    let colChanged = false;
    const newCols = cols.map((col) => {
      const res = updateWidgetInArray(col, widgetId, props);
      if (res.changed) colChanged = true;
      return res.arr;
    });
    if (colChanged) return { ...b, fields: { ...f, columns: newCols } };
    return b;
  });
}

const INITIAL_PAGES: Page[] = [
  { id: "landing", name: "Landing", slug: "/",        title: "Landing Page", hostnames: [] },
  { id: "about",   name: "About",   slug: "/about",   title: "About Us",     hostnames: [] },
  { id: "pricing", name: "Pricing", slug: "/pricing", title: "Pricing",      hostnames: [] },
  { id: "contact", name: "Contact", slug: "/contact", title: "Contact",      hostnames: [] },
];

const seedLanding = (): Block[] =>
  (["nav-simple", "hero-centered", "features-3col", "cta-banner", "footer-simple"] as BlockType[])
    .map((t, i) => defaultBlock(t, i));

interface BuilderState {
  pages: Page[];
  pageBlocks: Record<string, Block[]>;
}

const INITIAL_STATE: BuilderState = {
  pages: INITIAL_PAGES,
  pageBlocks: { landing: seedLanding(), about: [], pricing: [], contact: [] },
};

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

export function PageBuilder() {
  // Undo/redo history — stack + index kept in a SINGLE state object so they can
  // never desync. (Previously these were two separate useState values updated in
  // commit(); because setHistory used the stale closure `histIdx` while setHistIdx
  // used a functional update, two commits in quick succession — e.g. StrictMode
  // double-invoking the bootstrap effect — pushed the index past the stack length,
  // leaving state undefined and wiping loaded pages back to defaults.)
  const [hist, setHist] = useState<{ stack: BuilderState[]; idx: number }>({
    stack: [INITIAL_STATE],
    idx: 0,
  });
  const state = hist.stack[hist.idx] ?? INITIAL_STATE;
  const { pages, pageBlocks } = state;

  const commit = useCallback((next: BuilderState) => {
    setHist(({ stack, idx }) => {
      const trimmed = stack.slice(0, idx + 1);
      trimmed.push(next);
      // cap history to 50 entries
      const overflow = Math.max(0, trimmed.length - 50);
      const newStack = trimmed.slice(overflow);
      return { stack: newStack, idx: newStack.length - 1 };
    });
  }, []);

  const [activePage, setActivePage] = useState<string>("landing");
  const [pageSearch, setPageSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPageHostnames, setEditingPageHostnames] = useState<string | null>(null);
  const [addAtIndex, setAddAtIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [themeOpen, setThemeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<null | "pages" | "sections">(null);

  // Push a history entry when preview opens so pressing Back closes it
  useEffect(() => {
    if (previewOpen) {
      window.history.pushState({ preview: true }, '');
    }
  }, [previewOpen]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.preview) {
        // going forward into preview — ignore
        return;
      }
      // Back was pressed — close the modal instead of navigating
      setPreviewOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);

  // Widget selection state
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [widgetTab, setWidgetTab] = useState<"content" | "style">("content");

  // Nested item focus (click on a specific item inside a slick block)
  const [focusedNestedItem, setFocusedNestedItem] = useState<{ blockId: string; itemKey: string; itemIndex: number } | null>(null);

  // Blog state
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogNewMode, setBlogNewMode] = useState(false);
  const [blogRefreshKey, setBlogRefreshKey] = useState(0);
  const isBlogMode = activePage === "__blog__" || activePage === "blog";

  // Widget picker (lifted out of right-panel overflow context to avoid clipping)
  const [widgetPicker, setWidgetPicker] = useState<{ onPick: (t: WidgetType) => void } | null>(null);
  const openWidgetPicker = useCallback((
    _col: number, onPick: (t: WidgetType) => void,
  ) => setWidgetPicker({ onPick }), []);
  const closeWidgetPicker = useCallback(() => setWidgetPicker(null), []);

  // Drag-to-canvas widget drop
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  const [dragCursorPos, setDragCursorPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ type: WidgetType; label: string; started: boolean; startX: number; startY: number } | null>(null);

  const handleWidgetPointerDown = useCallback((type: WidgetType, e: React.MouseEvent) => {
    dragRef.current = {
      type,
      label: WIDGET_REGISTRY[type]?.label ?? type,
      started: false,
      startX: e.clientX,
      startY: e.clientY,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setDragCursorPos({ x: e.clientX, y: e.clientY });
      if (!drag.started) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.sqrt(dx * dx + dy * dy) < 6) return;
        drag.started = true;
        setIsDraggingWidget(true);
        document.body.style.cursor = 'grabbing';
        if (iframeRef.current) iframeRef.current.style.pointerEvents = 'none';
        iframeRef.current?.contentWindow?.postMessage({ type: 'DRAG_START', widgetType: drag.type }, '*');
      }
      if (drag.started && iframeRef.current) {
        const rect = iframeRef.current.getBoundingClientRect();
        iframeRef.current.contentWindow?.postMessage({ type: 'DRAG_OVER', x: e.clientX - rect.left, y: e.clientY - rect.top }, '*');
      }
    };
    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.started && iframeRef.current) {
        const rect = iframeRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inFrame = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        iframeRef.current.contentWindow?.postMessage(
          inFrame ? { type: 'DRAG_DROP', x, y, widgetType: drag.type } : { type: 'DRAG_CANCEL' },
          '*',
        );
        iframeRef.current.style.pointerEvents = '';
      }
      document.body.style.cursor = '';
      dragRef.current = null;
      setIsDraggingWidget(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []); // uses refs — no deps needed

  const blocks = pageBlocks[activePage] ?? [];
  const currentPage = pages.find((p) => p.id === activePage) ?? pages[0];
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (previewReady.current) {
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    }
  }, []);

  const setBlocks = useCallback((next: Block[], opts?: { blockId?: string; patchKind?: "fields" | "style" | "columns" }) => {
    const nextState: BuilderState = {
      ...state,
      pageBlocks: { ...pageBlocks, [activePage]: next },
    };
    commit(nextState);
    if (opts?.blockId) {
      const b = next.find((x) => x.id === opts.blockId);
      if (b) {
        const msg: Record<string, unknown> = { type: "BUILDER_BLOCK_UPDATE", blockId: opts.blockId };
        if (opts.patchKind === "fields") msg.fields = b.fields;
        if (opts.patchKind === "style") msg.style = b.style;
        if (opts.patchKind === "columns") msg.columns = (b.fields as { columns?: unknown[] }).columns;
        sendToIframe(msg);
      }
    } else {
      // Block added / removed / reordered / hidden — sync full list
      sendToIframe({ type: "BUILDER_BLOCKS_REORDER", blocks: next });
    }
  }, [state, pageBlocks, activePage, commit, sendToIframe]);

  const setPages = useCallback((next: Page[]) => {
    commit({ ...state, pages: next });
  }, [state, commit]);

  const deleteBlock = (id: string, confirmFirst = false) => {
    if (confirmFirst && !window.confirm("Delete this section?")) return;
    setBlocks(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const toggleHidden = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)));
  };

  const addBlock = (type: BlockType, index: number, layout?: LayoutVariant) => {
    const next = [...blocks];
    next.splice(index, 0, defaultBlock(type, index, layout));
    setBlocks(next.map((b, i) => ({ ...b, order: i })));
    setAddAtIndex(null);
  };

  const updateBlockFields = (id: string, patch: Record<string, unknown>) => {
    const isColumns = "columns" in patch;
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, fields: { ...b.fields, ...patch } } : b)),
      { blockId: id, patchKind: isColumns ? "columns" : "fields" },
    );
  };

  const updateBlockStyle = (id: string, patch: Partial<BlockStyle>) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, ...patch } } : b)),
      { blockId: id, patchKind: "style" },
    );
  };

  const onReorderDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragId);
    const to = blocks.findIndex((b) => b.id === targetId);
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered);
    setDragId(null);
  };

  const onAddPage = () => {
    const name = window.prompt("New page name?");
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `p_${Date.now()}`;
    if (pages.some((p) => p.id === id)) {
      toast.error("A page with that slug already exists");
      return;
    }
    const newPage: Page = { id, name, slug: `/${id}`, title: name, hostnames: [] };
    commit({ pages: [...pages, newPage], pageBlocks: { ...pageBlocks, [id]: [] } });
    setActivePage(id);
    setSelectedBlockId(null);
  };

  const onThemeChange = (t: Theme) => {
    setTheme(t);
    const msg = { type: "BUILDER_THEME_UPDATE", theme: t };
    console.log("postMessage", msg);
    sendToIframe(msg);
  };

  const canUndo = hist.idx > 0;
  const canRedo = hist.idx < hist.stack.length - 1;
  const undo = () => setHist((h) => (h.idx > 0 ? { ...h, idx: h.idx - 1 } : h));
  const redo = () =>
    setHist((h) => (h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h));

  // Bootstrap: load pages list + first page blocks from backend
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch(`${BACKEND}/site/builder/pages`);
        if (!res.ok) throw new Error();
        const { pages: rawPages } = await res.json() as { pages: { pageKey: string; hostnames?: string[] }[] };
        if (!rawPages?.length) { setLoading(false); return; }

        // Known safe page keys — scraper bait, well-known paths, and HTML-entity duplicates are excluded
        const BLOCKED_PATTERNS = [
          /\./,                          // any file extension (favicon.ico, .env, etc.)
          /&/,                           // HTML entity duplicates (&amp;)
          /^apple-app-site-association/, // iOS well-known path
          /^_/,                          // internal Next.js paths
          /firebase/i,                   // firebase SDK paths from bots
          /\.env/i,                      // .env file probes
          /wp-/i,                        // WordPress scanner probes
          /admin-sdk/i,                  // SDK paths from bots
        ];
        const builtPages: Page[] = rawPages
          .filter((p) => {
            if (p.pageKey === "__blog__") return false;
            if (BLOCKED_PATTERNS.some((rx) => rx.test(p.pageKey))) return false;
            return true;
          })
          .map((p) => ({
            id: p.pageKey,
            name: p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1),
            slug: `/${p.pageKey}`,
            title: p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1) + " Page",
            hostnames: p.hostnames ?? [],
          }));

        const firstKey = builtPages[0].id;
        const pageRes = await fetch(`${BACKEND}/site/builder/pages/${firstKey}`);
        if (!pageRes.ok) throw new Error(`Failed to load page: ${pageRes.status}`);
        const { page } = await pageRes.json() as { page: { blocks: Block[]; theme?: Theme } };

        commit({
          pages: builtPages,
          pageBlocks: { [firstKey]: page.blocks ?? [] },
        });
        if (page.theme && Object.keys(page.theme).length) {
          // Normalize theme — backend may have old field names from a previous editor
          const raw = page.theme as unknown as Record<string, unknown>;
          const normalized: Partial<Theme> = {
            accent:       (raw.accent      ?? raw.accentColor) as string | undefined,
            pageBg:       (raw.pageBg      ?? raw.backgroundColor) as string | undefined,
            bodyFont:     (raw.bodyFont    ?? raw.fontFamily) as string | undefined,
            headingFont:  (raw.headingFont ?? raw.fontFamily) as string | undefined,
            baseFontSize: (raw.baseFontSize) as number | undefined,
            radius:       (raw.radius) as number | undefined,
            buttonStyle:  (raw.buttonStyle) as Theme['buttonStyle'] | undefined,
          };
          setTheme({ ...DEFAULT_THEME, ...Object.fromEntries(Object.entries(normalized).filter(([, v]) => v != null)) });
        }
        setActivePage(firstKey);
      } catch {
        // backend not running — keep mock data
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load blocks from backend when switching to a page not yet in state
  useEffect(() => {
    if (loading) return;
    if (pageBlocks[activePage] !== undefined) return;
    fetch(`${BACKEND}/site/builder/pages/${activePage}`)
      .then((r) => r.json())
      .then(({ page }) => {
        commit({
          ...state,
          pageBlocks: { ...pageBlocks, [activePage]: (page?.blocks ?? []) as Block[] },
        });
        if (page?.theme && Object.keys(page.theme).length) {
          const raw = page.theme as unknown as Record<string, unknown>;
          setTheme({ ...DEFAULT_THEME, ...(raw.accent      ? { accent: raw.accent }           : raw.accentColor    ? { accent: raw.accentColor }      : {}),
                                       ...(raw.bodyFont    ? { bodyFont: raw.bodyFont }        : raw.fontFamily     ? { bodyFont: raw.fontFamily }      : {}),
                                       ...(raw.headingFont ? { headingFont: raw.headingFont }  : raw.fontFamily     ? { headingFont: raw.fontFamily }   : {}),
                                       ...(raw.pageBg      ? { pageBg: raw.pageBg }            : {}),
                                       ...(raw.baseFontSize ? { baseFontSize: raw.baseFontSize } : {}),
                                       ...(raw.radius      ? { radius: raw.radius }            : {}),
                                       ...(raw.buttonStyle ? { buttonStyle: raw.buttonStyle }  : {}) } as Theme);
        }
      })
      .catch(() => {
        commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: [] } });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, loading]);

  // Click outside right panel to deselect
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-builder-panel]")) return;
      setSelectedBlockId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset to content tab when switching blocks
  useEffect(() => {
    if (selectedBlockId) setActiveTab("content");
  }, [selectedBlockId]);

  // Sync selection into the iframe whenever it changes from the left panel
  useEffect(() => {
    sendToIframe({ type: "SECTION_SELECT", blockId: selectedBlockId });
  }, [selectedBlockId, sendToIframe]);

  // Sync widget selection into the iframe so the blue outline stays in sync
  useEffect(() => {
    sendToIframe({ type: "WIDGET_SELECT", widgetId: selectedWidgetId });
  }, [selectedWidgetId, sendToIframe]);

  // Listen for messages from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_READY") {
        previewReady.current = true;
        iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_ACK" }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_BLOCKS_REORDER", blocks }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_THEME_UPDATE", theme }, "*");
      } else if (e.data?.type === "BUILDER_NAVIGATE") {
        const target = pages.find((p) => p.slug === e.data.slug || p.id === e.data.slug);
        if (target) {
          setActivePage(target.id);
          setSelectedBlockId(null);
        }
      } else if (e.data?.type === "WIDGET_DELETE") {
        const { widgetId } = e.data as { widgetId: string };
        const nextBlocks = deleteWidgetFromBlocks(blocks, widgetId);
        setBlocks(nextBlocks);
        if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
      } else if (e.data?.type === "WIDGET_CLICK") {
        const { widgetId } = e.data as { widgetId: string };
        setSelectedWidgetId(widgetId);
        setWidgetTab("content");
        setSelectedBlockId(null);
      } else if (e.data?.type === "SECTION_NESTED_ITEM_CLICK") {
        const { blockId, itemKey, itemIndex } = e.data as { blockId: string; itemKey: string; itemIndex: number };
        setSelectedWidgetId(null);
        setSelectedBlockId(blockId);
        setFocusedNestedItem({ blockId, itemKey, itemIndex });
        setActiveTab("content");
      } else if (e.data?.type === "SECTION_CLICK") {
        setSelectedWidgetId(null);
        setSelectedBlockId(e.data.blockId ?? null);
        setFocusedNestedItem(null);
      } else if (e.data?.type === "SECTION_SELECT_EDIT") {
        setSelectedWidgetId(null);
        setSelectedBlockId(e.data.blockId ?? null);
      } else if (e.data?.type === "SECTION_DELETE") {
        const id = e.data.blockId as string;
        setBlocks(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
        setSelectedBlockId((prev) => (prev === id ? null : prev));
      } else if (e.data?.type === "SECTION_MOVE_UP") {
        const id = e.data.blockId as string;
        const sorted = [...blocks].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === id);
        if (idx <= 0) return;
        const next = [...sorted];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setBlocks(next.map((b, i) => ({ ...b, order: i })));
      } else if (e.data?.type === "SECTION_MOVE_DOWN") {
        const id = e.data.blockId as string;
        const sorted = [...blocks].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === id);
        if (idx < 0 || idx >= sorted.length - 1) return;
        const next = [...sorted];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setBlocks(next.map((b, i) => ({ ...b, order: i })));
      } else if (e.data?.type === "SECTION_ADD_AFTER") {
        setAddAtIndex((e.data.afterIndex as number) + 1);
      } else if (e.data?.type === "WIDGET_DROPPED") {
        const { blockId, col, widgetType: wt } = e.data as { blockId: string; col: number; widgetType: WidgetType };
        const widget = defaultWidget(wt);
        setBlocks(
          blocks.map((b) => {
            if (b.id !== blockId) return b;
            if (col >= 0) {
              const existingCols = ((b.fields as Record<string, unknown>).columns as Widget[][]) ?? [];
              const next: Widget[][] = Array.from(
                { length: Math.max(existingCols.length, col + 1) },
                (_, i) => Array.isArray(existingCols[i]) ? [...existingCols[i]] : [],
              );
              next[col] = [...next[col], widget];
              return { ...b, fields: { ...b.fields, columns: next } };
            } else {
              const existing = ((b.fields as Record<string, unknown>).widgets as Widget[]) ?? [];
              return { ...b, fields: { ...b.fields, widgets: [...existing, widget] } };
            }
          }),
          { blockId, patchKind: col >= 0 ? "columns" : "fields" },
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [pages, blocks, setBlocks]);

  // Iframe reloads when activePage changes — reset ready flag
  useEffect(() => {
    previewReady.current = false;
  }, [activePage]);

  // Push blocks to iframe whenever they change (covers initial load via bootstrap)
  useEffect(() => {
    if (previewReady.current) {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_BLOCKS_REORDER", blocks }, "*");
    }
  }, [blocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject Google Fonts for theme fonts
  const fontHref = useMemo(() => {
    const families = Array.from(new Set([theme.bodyFont, theme.headingFont]))
      .map((f) => `${f.replace(/ /g, "+")}:wght@400;500;600;700`)
      .join("&family=");
    return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  }, [theme.bodyFont, theme.headingFont]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0f172a", color: "#94a3b8", fontFamily: "system-ui" }}>
        <div className="text-center">
          <div className="text-2xl mb-2 animate-pulse">⚙️</div>
          <div className="text-sm">Loading pages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#0f172a" }}>
      <link rel="stylesheet" href={fontHref} />
      {/* Top bar */}
      <header
        className="h-[52px] flex items-center justify-between px-4 text-white shrink-0 border-b border-slate-800"
        style={{ background: "#0f172a" }}
      >
        <div className="flex items-center gap-6 w-[240px]">
          <div className="font-bold tracking-tight">PageBuilder</div>
        </div>
        <div className="flex-1 text-center">
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={currentPage.title}
              onBlur={(e) => {
                const v = e.target.value || currentPage.title;
                setPages(pages.map((pg) => (pg.id === activePage ? { ...pg, title: v } : pg)));
                setEditingTitle(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="bg-slate-800 text-white text-sm px-2 py-1 rounded outline-none border border-slate-600"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium hover:bg-slate-800 px-2 py-1 rounded pb-transition"
            >
              {currentPage.title}
            </button>
          )}
          <div className="text-xs pb-muted">{currentPage.slug}</div>
        </div>
        <div className="flex items-center gap-2 w-auto justify-end">
          <a href="/admin" className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition inline-flex items-center gap-1.5" title="CMS Admin" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Settings size={13} /> CMS
          </a>
          <button onClick={undo} disabled={!canUndo} className="p-2 rounded hover:bg-slate-800 pb-transition disabled:opacity-30 disabled:hover:bg-transparent" title="Undo"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={!canRedo} className="p-2 rounded hover:bg-slate-800 pb-transition disabled:opacity-30 disabled:hover:bg-transparent" title="Redo"><Redo2 size={16} /></button>
          <button onClick={() => setThemeOpen(true)} className="p-2 rounded hover:bg-slate-800 pb-transition" title="Theme"><Palette size={16} /></button>
          <button onClick={() => setPreviewOpen(true)} className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition inline-flex items-center gap-1.5">
            <Play size={13} /> Preview
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${BACKEND}/site/builder/pages/${activePage}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blocks, theme, hostnames: currentPage.hostnames ?? [] }),
                });
                if (!res.ok) throw new Error(`${res.status}`);
                toast.success("Page published successfully");
              } catch (err) {
                toast.error(`Publish failed — is the backend running? (${err})`);
              }
            }}
            className="px-3 py-1.5 text-sm rounded-md font-medium text-white pb-transition hover:opacity-90"
            style={{ background: "#22c55e" }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Narrow icon sidebar — always visible, 48px */}
        <div className="w-12 shrink-0 flex flex-col items-center py-2 gap-1 border-r border-slate-800" style={{ background: "#0f172a" }}>
          <button
            onClick={() => setAddAtIndex(blocks.length)}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white pb-transition"
            title="Add section"
          >
            <Plus size={18} />
          </button>
          <div className="w-6 h-px bg-slate-700 my-1" />
          <button
            onClick={() => setLeftPanel((p) => (p === "sections" ? null : "sections"))}
            className={`w-9 h-9 flex items-center justify-center rounded pb-transition ${leftPanel === "sections" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"}`}
            title="Page sections"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => setLeftPanel((p) => (p === "pages" ? null : "pages"))}
            className={`w-9 h-9 flex items-center justify-center rounded pb-transition ${leftPanel === "pages" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"}`}
            title="Pages"
          >
            <FileText size={18} />
          </button>
        </div>

        {/* Left slide panel — opens when icon clicked */}
        {leftPanel && (
          <aside className="w-[280px] shrink-0 flex flex-col text-white border-r border-slate-800" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {leftPanel === "pages" ? "Pages" : isBlogMode ? "Blog Posts" : "Sections"}
              </span>
              <div className="flex items-center gap-1">
                {leftPanel === "sections" && !isBlogMode && (
                  <button onClick={() => setAddAtIndex(blocks.length)} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="Add section">
                    <Plus size={14} />
                  </button>
                )}
                {leftPanel === "sections" && isBlogMode && (
                  <button onClick={() => { setSelectedBlogPost(null); setBlogNewMode(true); }} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="New post">
                    <Plus size={14} />
                  </button>
                )}
                {leftPanel === "pages" && (
                  <button onClick={onAddPage} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="New page">
                    <Plus size={14} />
                  </button>
                )}
                <button onClick={() => setLeftPanel(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition">
                  <X size={14} />
                </button>
              </div>
            </div>

            {leftPanel === "pages" && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={pageSearch}
                      onChange={(e) => setPageSearch(e.target.value)}
                      placeholder="Search pages..."
                      className="w-full bg-slate-800 text-white text-xs pl-8 pr-7 py-1.5 rounded outline-none border border-slate-700 focus:border-blue-500 placeholder:text-slate-500 pb-transition"
                    />
                    {pageSearch && (
                      <button
                        onClick={() => setPageSearch("")}
                        title="Clear search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                {(() => {
                  const q = pageSearch.trim().toLowerCase();
                  const filtered = q
                    ? pages.filter((p) =>
                        p.name.toLowerCase().includes(q) ||
                        p.slug.toLowerCase().includes(q) ||
                        (p.hostnames ?? []).some((h) => h.toLowerCase().includes(q))
                      )
                    : pages;
                  if (filtered.length === 0) {
                    return (
                      <div className="px-4 py-4 text-xs text-slate-500">
                        No pages match &ldquo;{pageSearch}&rdquo;.
                      </div>
                    );
                  }
                  return filtered.map((p) => {
                  const active = p.id === activePage;
                  const hn = p.hostnames ?? [];
                  const isEditingHn = editingPageHostnames === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`group flex flex-col border-l-2 pb-transition ${
                        active ? "border-blue-500 bg-slate-800/60" : "border-transparent hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Page name row */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => { setActivePage(p.id); setSelectedBlockId(null); }}
                          className={`flex-1 text-left px-4 py-2 text-sm ${active ? "text-white" : "text-slate-300"}`}
                        >
                          {p.name}
                        </button>
                        {p.id !== "__blog__" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete page "${p.name}"? This cannot be undone.`)) return;
                              try {
                                await fetch(`${BACKEND}/site/builder/pages/${p.id}`, { method: "DELETE" });
                              } catch { /* ignore */ }
                              const remaining = pages.filter((pg) => pg.id !== p.id);
                              const nextActive = activePage === p.id
                                ? (remaining.find((pg) => pg.id !== "__blog__")?.id ?? "landing")
                                : activePage;
                              commit({
                                pages: remaining,
                                pageBlocks: Object.fromEntries(
                                  Object.entries(pageBlocks).filter(([k]) => k !== p.id)
                                ),
                              });
                              setActivePage(nextActive);
                              setSelectedBlockId(null);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 pb-transition shrink-0"
                            title={`Delete ${p.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Hostnames row — always visible for every page */}
                      <div className="flex items-start gap-1.5 px-4 pb-2.5">
                        <Globe size={11} className="text-slate-500 mt-0.5 shrink-0" />
                        {isEditingHn ? (
                          <input
                            autoFocus
                            defaultValue={hn.join(', ')}
                            onBlur={(e) => {
                              const vals = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                              setPages(pages.map((pg) => pg.id === p.id ? { ...pg, hostnames: vals } : pg));
                              setEditingPageHostnames(null);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            placeholder="salescode.ai, demo.salescode.ai"
                            className="flex-1 bg-slate-700 text-white text-xs px-2 py-0.5 rounded outline-none border border-blue-500 min-w-0"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingPageHostnames(p.id)}
                            className="text-left flex-1 min-w-0"
                            title="Set which domains serve this page (empty = all domains)"
                          >
                            {hn.length > 0 ? (
                              <span className="text-xs text-slate-400 truncate block">{hn.join(', ')}</span>
                            ) : (
                              <span className="text-xs text-slate-600 hover:text-slate-400 pb-transition">+ add URLs</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                  });
                })()}
                </div>
              </div>
            )}

            {leftPanel === "sections" && (
              isBlogMode ? (
                <BlogPanel
                  selectedSlug={blogNewMode ? null : (selectedBlogPost?.slug ?? null)}
                  onSelect={(post) => { setSelectedBlogPost(post); setBlogNewMode(false); }}
                  onNew={() => { setSelectedBlogPost(null); setBlogNewMode(true); }}
                  refreshKey={blogRefreshKey}
                />
              ) : (
                <div className="overflow-y-auto flex-1 px-2 pb-3 pt-1 space-y-0.5">
                  {blocks.length === 0 && (
                    <div className="px-2 py-4 text-xs text-slate-500">No sections yet.</div>
                  )}
                  {blocks.map((b) => {
                    const isActive = b.id === selectedBlockId;
                    return (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={() => setDragId(b.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onReorderDrop(b.id)}
                        onClick={() => { setSelectedBlockId(b.id); setSelectedWidgetId(null); }}
                        className={`group flex items-center gap-2 px-2 py-1.5 rounded text-sm pb-transition cursor-pointer ${
                          isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <GripVertical size={14} className="opacity-50 cursor-grab" />
                        <span className="flex-1 truncate">{BLOCK_LABELS[b.type]}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleHidden(b.id); }}
                          className="opacity-60 hover:opacity-100"
                        >
                          {b.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(b.id, true); }}
                          className="opacity-60 hover:opacity-100 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </aside>
        )}

        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          src={(() => {
            const base = import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai";
            if (isBlogMode) {
              return selectedBlogPost && !blogNewMode
                ? `${base}/blog/${selectedBlogPost.slug}?preview=1`
                : `${base}/blog?preview=1`;
            }
            return activePage === 'landing'
              ? `${base}/landing?preview=1`
              : `${base}/${activePage}?preview=1`;
          })()}
          className="flex-1 border-0 min-h-0"
          title="Page preview"
        />

        {/* Right panel slot — AddSection drawer takes priority, then content editor */}
        {addAtIndex !== null ? (
          <AddSectionDrawer
            open
            onClose={() => setAddAtIndex(null)}
            onPickTemplate={(t) => addAtIndex !== null && addBlock(t, addAtIndex)}
            onPickLayout={(l) => addAtIndex !== null && addBlock("layout", addAtIndex, l)}
          />
        ) : (selectedWidgetId !== null || selectedBlock !== null || (isBlogMode && (blogNewMode || selectedBlogPost !== null))) && (
          <aside
            data-builder-panel
            className="w-[320px] shrink-0 flex flex-col text-white border-l border-slate-800"
            style={{ background: "#0f172a" }}
          >
            {isBlogMode ? (
              (blogNewMode || selectedBlogPost) ? (
                <BlogPostEditor
                  post={blogNewMode ? null : selectedBlogPost}
                  onClose={() => { setBlogNewMode(false); setSelectedBlogPost(null); }}
                  onSaved={(saved) => { setSelectedBlogPost(saved); setBlogNewMode(false); setBlogRefreshKey((k) => k + 1); }}
                  onDeleted={(_slug) => { setSelectedBlogPost(null); setBlogNewMode(false); setBlogRefreshKey((k) => k + 1); }}
                />
              ) : null
            ) : selectedWidgetId ? (() => {
              const selWidget = findWidgetById(blocks, selectedWidgetId);
              if (!selWidget) return (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 px-6">
                  <div className="text-sm">Widget not found</div>
                </div>
              );
              const widgetLabel = WIDGET_REGISTRY[selWidget.type]?.label ?? selWidget.type;
              return (
                <>
                  <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedWidgetId(null)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 pb-transition"
                      >
                        <ChevronLeft size={11} />
                        Contents
                      </button>
                      <button onClick={() => setSelectedWidgetId(null)} className="p-1 rounded hover:bg-slate-700 text-slate-400 pb-transition">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="text-base font-semibold text-white leading-tight">{widgetLabel}</div>
                  </div>
                  <div className="flex border-b border-slate-800">
                    {([
                      { key: "content" as const, label: "Content", Icon: PenLine },
                      { key: "style"   as const, label: "Styles",  Icon: Paintbrush },
                    ]).map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        onClick={() => setWidgetTab(key)}
                        className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 pb-transition border-b-2 ${
                          widgetTab === key ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div key={selWidget.id + widgetTab} className="flex-1 overflow-y-auto p-4 pb-fade-in">
                    {widgetTab === "content" ? (
                      <WidgetEditor
                        widget={selWidget}
                        update={(props) => {
                          const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, props);
                          setBlocks(nextBlocks);
                        }}
                        openWidgetPicker={openWidgetPicker}
                      />
                    ) : (
                      <div className="space-y-4">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Background</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(selWidget.props.bgColor as string) || "#ffffff"}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, bgColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="h-8 w-10 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={(selWidget.props.bgColor as string) || ""}
                              placeholder="#ffffff"
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, bgColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Text Color</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(selWidget.props.textColor as string) || "#000000"}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, textColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="h-8 w-10 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={(selWidget.props.textColor as string) || ""}
                              placeholder="#000000"
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, textColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Padding</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range" min={0} max={80}
                              value={(selWidget.props.padding as number) ?? 0}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, padding: Number(e.target.value) });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props.padding as number) ?? 0}px</span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Border Radius</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range" min={0} max={40}
                              value={(selWidget.props.borderRadius as number) ?? 0}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, borderRadius: Number(e.target.value) });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props.borderRadius as number) ?? 0}px</span>
                          </div>
                        </label>
                        <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Spacing &amp; Position</span>
                        <div className="grid grid-cols-2 gap-2">
                          {(['marginTop','marginBottom','marginLeft','marginRight'] as const).map((k) => (
                            <label key={k} className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500 capitalize">{k.replace('margin','').toLowerCase()} margin</span>
                              <div className="flex items-center gap-1">
                                <input type="range" min={0} max={120}
                                  value={(selWidget.props[k] as number) ?? 0}
                                  onChange={(e) => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, [k]: Number(e.target.value) }); setBlocks(nb); }}
                                  className="flex-1 accent-blue-500" />
                                <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props[k] as number) ?? 0}px</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Width (px, 0 = auto)</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={2000}
                              value={(selWidget.props.styleWidthPx as number) ?? 0}
                              onChange={(e) => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, styleWidthPx: Number(e.target.value) || undefined }); setBlocks(nb); }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                              placeholder="0 = auto" />
                            <span className="text-xs text-slate-400">px</span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Align in column</span>
                          <div className="flex gap-2">
                            {(['left','center','right'] as const).map((a) => (
                              <button key={a} type="button"
                                onClick={() => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, widgetAlign: a }); setBlocks(nb); }}
                                className={`flex-1 py-1.5 rounded text-xs font-medium pb-transition ${(selWidget.props.widgetAlign as string ?? 'left') === a ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                              >
                                {a.charAt(0).toUpperCase() + a.slice(1)}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              );
            })() : selectedBlock ? (
              <>
                <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Contents</span>
                    <button onClick={() => { setSelectedBlockId(null); setFocusedNestedItem(null); }} className="p-1 rounded hover:bg-slate-700 text-slate-400 pb-transition">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="text-base font-semibold text-white leading-tight">{BLOCK_LABELS[selectedBlock.type]}</div>
                </div>
                <div className="flex border-b border-slate-800">
                  {([
                    { key: "content" as const, label: "Content", Icon: PenLine },
                    { key: "style"   as const, label: "Styles",  Icon: Paintbrush },
                  ]).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 pb-transition border-b-2 ${
                        activeTab === key ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
                <div key={selectedBlock.id + activeTab} className="flex-1 overflow-y-auto p-4 pb-fade-in">
                  {activeTab === "content" ? (
                    <ContentEditor
                      block={selectedBlock}
                      update={(patch) => updateBlockFields(selectedBlock.id, patch)}
                      openWidgetPicker={openWidgetPicker}
                      focusedItem={focusedNestedItem?.blockId === selectedBlock.id ? focusedNestedItem : null}
                    />
                  ) : (
                    <StyleEditor
                      style={selectedBlock.style}
                      update={(patch) => updateBlockStyle(selectedBlock.id, patch)}
                      showTypography
                    />
                  )}
                </div>
              </>
            ) : null}
          </aside>
        )}

        {/* Widget picker — absolute overlay on the right panel, escaped from overflow clipping */}
        {widgetPicker && (
          <aside
            data-builder-panel
            className="absolute top-0 right-0 bottom-0 w-[320px] z-40 flex flex-col text-white border-l border-slate-800 shadow-2xl"
            style={{ background: "#0f172a" }}
          >
            <WidgetPicker
              open
              onClose={closeWidgetPicker}
              onPick={(t) => { widgetPicker.onPick(t); closeWidgetPicker(); }}
              onDragStart={handleWidgetPointerDown}
            />
          </aside>
        )}

        {/* Drag ghost — follows cursor while dragging a widget to canvas */}
        {isDraggingWidget && dragRef.current && (
          <div
            style={{
              position: 'fixed',
              left: dragCursorPos.x + 14,
              top: dragCursorPos.y + 14,
              pointerEvents: 'none',
              zIndex: 9999,
              background: '#1e40af',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'system-ui',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            + {dragRef.current.label}
          </div>
        )}

        <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} theme={theme} onChange={onThemeChange} />
      </div>

      {previewOpen && <PreviewModal blocks={blocks} theme={theme} pageKey={activePage} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
