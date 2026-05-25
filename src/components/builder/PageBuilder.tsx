import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Undo2, Redo2, Plus, Eye, EyeOff, Trash2, GripVertical,
  X, Palette, MousePointer2, Play,
} from "lucide-react";
import { defaultBlock } from "./blocks";
import { AddSectionDrawer } from "./AddSectionDrawer";
import { ContentEditor } from "./ContentEditor";
import { StyleEditor } from "./StyleEditor";
import { ThemePanel } from "./ThemePanel";
import { PreviewModal } from "./PreviewModal";
import {
  BLOCK_LABELS, DEFAULT_THEME,
  type Block, type BlockStyle, type BlockType, type LayoutVariant, type Page, type Theme,
} from "./types";

const INITIAL_PAGES: Page[] = [
  { id: "landing", name: "Landing", slug: "/", title: "Landing Page" },
  { id: "about", name: "About", slug: "/about", title: "About Us" },
  { id: "pricing", name: "Pricing", slug: "/pricing", title: "Pricing" },
  { id: "contact", name: "Contact", slug: "/contact", title: "Contact" },
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

const BACKEND = "http://localhost:1337";

export function PageBuilder() {
  // History stack
  const [history, setHistory] = useState<BuilderState[]>([INITIAL_STATE]);
  const [histIdx, setHistIdx] = useState(0);
  const state = history[histIdx];
  const { pages, pageBlocks } = state;

  const commit = useCallback((next: BuilderState) => {
    setHistory((h) => {
      const trimmed = h.slice(0, histIdx + 1);
      trimmed.push(next);
      // cap history to 50
      const overflow = Math.max(0, trimmed.length - 50);
      return trimmed.slice(overflow);
    });
    setHistIdx((i) => Math.min(i + 1, 49));
  }, [histIdx]);

  const [activePage, setActivePage] = useState<string>("landing");
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [editingTitle, setEditingTitle] = useState(false);
  const [addAtIndex, setAddAtIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [themeOpen, setThemeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);

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
        console.log("postMessage", msg);
        sendToIframe(msg);
      }
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
    const msg = { type: "BUILDER_BLOCKS_REORDER", blocks: reordered };
    console.log("postMessage", msg);
    sendToIframe(msg);
  };

  const onAddPage = () => {
    const name = window.prompt("New page name?");
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `p_${Date.now()}`;
    if (pages.some((p) => p.id === id)) {
      toast.error("A page with that slug already exists");
      return;
    }
    const newPage: Page = { id, name, slug: `/${id}`, title: name };
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

  const canUndo = histIdx > 0;
  const canRedo = histIdx < history.length - 1;
  const undo = () => canUndo && setHistIdx((i) => i - 1);
  const redo = () => canRedo && setHistIdx((i) => i + 1);

  // Bootstrap: load pages list + first page blocks from backend
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch(`${BACKEND}/site/builder/pages`);
        if (!res.ok) throw new Error();
        const { pages: rawPages } = await res.json() as { pages: { pageKey: string }[] };
        if (!rawPages?.length) { setLoading(false); return; }

        const builtPages: Page[] = rawPages.map((p) => ({
          id: p.pageKey,
          name: p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1),
          slug: `/${p.pageKey}`,
          title: p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1) + " Page",
        }));

        const firstKey = builtPages[0].id;
        const pageRes = await fetch(`${BACKEND}/site/builder/pages/${firstKey}`);
        const { page } = await pageRes.json() as { page: { blocks: Block[]; theme?: Theme } };

        commit({
          pages: builtPages,
          pageBlocks: { [firstKey]: page.blocks ?? [] },
        });
        if (page.theme && Object.keys(page.theme).length) setTheme(page.theme as Theme);
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
        if (page?.theme && Object.keys(page.theme).length) setTheme(page.theme as Theme);
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

  // Listen for messages from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_READY") {
        previewReady.current = true;
      } else if (e.data?.type === "BUILDER_NAVIGATE") {
        const target = pages.find((p) => p.slug === e.data.slug || p.id === e.data.slug);
        if (target) {
          setActivePage(target.id);
          setSelectedBlockId(null);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [pages]);

  // Iframe reloads when activePage changes — reset ready flag
  useEffect(() => {
    previewReady.current = false;
  }, [activePage]);

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
                  body: JSON.stringify({ blocks, theme }),
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
        {/* Left panel */}
        <aside className="w-[240px] shrink-0 flex flex-col text-white" style={{ background: "#0f172a" }}>
          <div className="flex-1 min-h-0 flex flex-col border-b border-slate-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-wider pb-muted font-semibold">Pages</span>
              <button onClick={onAddPage} className="p-1 rounded hover:bg-slate-800 pb-transition" title="New page"><Plus size={14} /></button>
            </div>
            <div className="overflow-y-auto">
              {pages.map((p) => {
                const active = p.id === activePage;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setActivePage(p.id); setSelectedBlockId(null); }}
                    className={`w-full text-left px-4 py-2 text-sm pb-transition border-l-2 ${
                      active
                        ? "border-blue-500 bg-slate-800/60 text-white"
                        : "border-transparent text-slate-300 hover:bg-slate-800/40"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-wider pb-muted font-semibold">Sections on this page</span>
              <button
                onClick={() => setAddAtIndex(blocks.length)}
                className="p-1 rounded hover:bg-slate-800 pb-transition"
                title="Add section"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="overflow-y-auto px-2 pb-3 space-y-0.5">
              {blocks.length === 0 && (
                <div className="px-2 py-4 text-xs pb-muted">No sections yet.</div>
              )}
              {blocks.map((b) => {
                const active = b.id === selectedBlockId;
                return (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onReorderDrop(b.id)}
                    onClick={() => setSelectedBlockId(b.id)}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded text-sm pb-transition cursor-pointer ${
                      active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
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
          </div>
        </aside>

        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          src={`http://localhost:3001/${activePage}?preview=1`}
          className="flex-1 border-0 min-h-0"
          title="Page preview"
        />

        {/* Right panel */}
        <aside
          data-builder-panel
          className="w-[320px] shrink-0 flex flex-col text-white border-l border-slate-800 pb-transition"
          style={{ background: "#0f172a" }}
        >
          {selectedBlock ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="text-sm font-semibold">{BLOCK_LABELS[selectedBlock.type]}</div>
                <button onClick={() => setSelectedBlockId(null)} className="p-1 rounded hover:bg-slate-800">
                  <X size={14} />
                </button>
              </div>
              <div className="flex border-b border-slate-800">
                {(["content", "style"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-2.5 text-sm capitalize pb-transition border-b-2 ${
                      activeTab === t ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div key={selectedBlock.id + activeTab} className="flex-1 overflow-y-auto p-4 pb-fade-in">
                {activeTab === "content" ? (
                  <ContentEditor block={selectedBlock} update={(patch) => updateBlockFields(selectedBlock.id, patch)} />
                ) : (
                  <StyleEditor
                    style={selectedBlock.style}
                    update={(patch) => updateBlockStyle(selectedBlock.id, patch)}
                    showTypography
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 px-6">
              <MousePointer2 size={36} className="mb-3 opacity-50" />
              <div className="text-sm">Select a section to edit</div>
            </div>
          )}
        </aside>

        <AddSectionDrawer
          open={addAtIndex !== null}
          onClose={() => setAddAtIndex(null)}
          onPickTemplate={(t) => addAtIndex !== null && addBlock(t, addAtIndex)}
          onPickLayout={(l) => addAtIndex !== null && addBlock("layout", addAtIndex, l)}
        />

        <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} theme={theme} onChange={onThemeChange} />
      </div>

      {previewOpen && <PreviewModal blocks={blocks} theme={theme} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
