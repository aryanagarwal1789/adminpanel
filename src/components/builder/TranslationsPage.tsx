import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Languages, Save, Search, Eye, EyeOff, RefreshCw, ChevronDown, Check } from "lucide-react";
import { authJsonHeaders } from "@/lib/builder-drafts";
import { BLOCK_LABELS, type BlockType } from "./types";
import {
  mergePageStrings,
  applyPageTranslations,
  type TransRow,
  type TranslatableBlock,
  type TransValue,
} from "@/lib/i18n-walk";
import { OVERLAY_LOCALES as LOCALES } from "@/lib/i18n-images";
import { RichTextInput } from "./RichTextInput";
import type { RichValue } from "./rich-text";
import { isRichDoc, richDocToText } from "@/lib/i18n-rich";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const RENDERER = import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai";

const blockLabel = (type: string) => BLOCK_LABELS[type as BlockType] ?? type;

// A translation value counts as "set" when it has visible text — a non-blank
// string or a rich doc with text. Empty values fall back to English.
function hasTransValue(v: TransValue | undefined): boolean {
  if (isRichDoc(v)) return richDocToText(v).trim() !== "";
  return typeof v === "string" && v.trim() !== "";
}

interface PageListItem {
  pageKey: string;
}

export function TranslationsPage() {
  const [pages, setPages] = useState<string[]>([]);
  const [pageKey, setPageKey] = useState<string>("");
  const [locale, setLocale] = useState<string>(LOCALES[0].code);

  const [rows, setRows] = useState<TransRow[]>([]);
  // Raw page blocks — pushed (with translations applied) into the preview iframe.
  const [blocks, setBlocks] = useState<TranslatableBlock[]>([]);
  // Full locale bundle (all pages' keys). We must round-trip the WHOLE map on
  // save — the PUT replaces `strings` entirely — so other pages aren't wiped.
  const [bundle, setBundle] = useState<Record<string, TransValue>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  // Searchable page picker (native <select> can't filter 40+ pages).
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState("");
  const pageMenuRef = useRef<HTMLDivElement>(null);
  const filteredPages = useMemo(
    () => pages.filter((k) => k.toLowerCase().includes(pageSearch.trim().toLowerCase())),
    [pages, pageSearch],
  );

  // ── Live website preview bridge (reuses the page-builder iframe protocol) ──
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The iframe re-announces PREVIEW_READY until we ACK; track so we only push
  // once it's listening, and reset on every page switch (src reload).
  const ackedRef = useRef(false);

  // Blocks with the in-progress (unsaved) translations applied — this is what
  // the preview renders, so edits appear live before any save.
  const translatedBlocks = useMemo(
    () => applyPageTranslations(pageKey, blocks, bundle),
    [pageKey, blocks, bundle],
  );
  // Latest translated blocks for the message handler (avoids a stale closure on
  // the PREVIEW_READY reply, which fires outside React's render cycle).
  const translatedBlocksRef = useRef(translatedBlocks);
  translatedBlocksRef.current = translatedBlocks;

  const pushBlocks = useCallback((next: unknown[]) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "BUILDER_BLOCKS_REORDER", blocks: next },
      "*",
    );
  }, []);

  // Load the page list once.
  useEffect(() => {
    fetch(`${BACKEND}/site/builder/pages`)
      .then((r) => r.json())
      .then((d: { pages?: PageListItem[] }) => {
        const keys = (d.pages ?? []).map((p) => p.pageKey).sort();
        setPages(keys);
        if (keys.length && !pageKey) setPageKey(keys[0]);
      })
      .catch(() => toast.error("Failed to load pages"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the selected page's translatable strings + the locale bundle.
  const load = useCallback(async () => {
    if (!pageKey) return;
    setLoading(true);
    try {
      const [pageRes, transRes] = await Promise.all([
        fetch(`${BACKEND}/site/builder/pages/${pageKey}`),
        fetch(`${BACKEND}/site/builder/translations/${locale}`),
      ]);
      const pageData = await pageRes.json();
      const transData = await transRes.json();
      const pageBlocks = (pageData?.page?.blocks ?? []) as TranslatableBlock[];
      const mobileBlocks = (pageData?.page?.mobileBlocks ?? []) as TranslatableBlock[];
      setBlocks(pageBlocks);
      // Desktop rows + any mobile-only strings (mobile reuses desktop keys, so
      // shared slots aren't listed twice).
      setRows(mergePageStrings(pageKey, pageBlocks, mobileBlocks, blockLabel));
      setBundle((transData?.translation?.strings ?? {}) as Record<string, TransValue>);
    } catch {
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  }, [pageKey, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  // Switching page reloads the iframe (its src is keyed to pageKey) — the new
  // document re-announces PREVIEW_READY, so drop the ACK until it does.
  useEffect(() => {
    ackedRef.current = false;
  }, [pageKey]);

  // ACK the preview when it announces itself, then push the current translation.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "PREVIEW_READY") {
        ackedRef.current = true;
        iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_ACK" }, "*");
        pushBlocks(translatedBlocksRef.current);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushBlocks]);

  // Re-render the preview as translations change (debounced so fast typing
  // doesn't thrash the iframe). Only pushes once the preview has ACKed.
  useEffect(() => {
    if (!showPreview || !ackedRef.current) return;
    const t = setTimeout(() => pushBlocks(translatedBlocks), 250);
    return () => clearTimeout(t);
  }, [translatedBlocks, showPreview, pushBlocks]);

  // Close the page picker on outside click / Escape.
  useEffect(() => {
    if (!pageMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target as Node)) {
        setPageMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPageMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pageMenuOpen]);

  // Identical English copy → one shared translation. The same phrase ("Book a
  // Demo") repeats across CTAs/cards under different keys; typing it once fills
  // every occurrence so the translator never repeats themselves. Rich rows are
  // excluded — a formatted doc shouldn't be broadcast onto plain fields.
  const englishByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) if (!r.richBase && !r.segment) m.set(r.key, r.english);
    return m;
  }, [rows]);
  const keysByEnglish = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of rows) {
      if (r.richBase || r.segment) continue;
      const a = m.get(r.english) ?? [];
      if (!a.includes(r.key)) a.push(r.key);
      m.set(r.english, a);
    }
    return m;
  }, [rows]);

  const setValue = useCallback(
    (key: string, value: TransValue) => {
      // Rich-doc translations are per-field; plain strings fan out to every key
      // that shares the same English copy.
      const eng = typeof value === "string" ? englishByKey.get(key) : undefined;
      const keys = (eng && keysByEnglish.get(eng)) || [key];
      setBundle((b) => {
        const next = { ...b };
        for (const k of keys) next[k] = value;
        return next;
      });
    },
    [englishByKey, keysByEnglish],
  );

  const save = async () => {
    setSaving(true);
    try {
      // Drop empty values (blank string OR empty rich doc) so those strings fall
      // back to English on render.
      const cleaned: Record<string, TransValue> = {};
      for (const [k, v] of Object.entries(bundle)) {
        if (hasTransValue(v)) cleaned[k] = v;
      }
      const res = await fetch(`${BACKEND}/site/builder/translations/${locale}`, {
        method: "PUT",
        headers: authJsonHeaders(),
        body: JSON.stringify({ strings: cleaned }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setBundle(cleaned);
      toast.success(`Saved ${locale.toUpperCase()} translations`);
    } catch (err) {
      toast.error(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(
    () => rows.filter((r) => !search || r.english.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  // Group rows by block for a readable layout.
  const groups = useMemo(() => {
    const m = new Map<string, { label: string; rows: TransRow[] }>();
    for (const r of filtered) {
      const g = m.get(r.blockId) ?? { label: r.blockLabel, rows: [] };
      g.rows.push(r);
      m.set(r.blockId, g);
    }
    return [...m.values()];
  }, [filtered]);

  const translatedCount = rows.filter((r) => hasTransValue(bundle[r.key])).length;

  const inp = "w-full rounded-lg px-3 py-2 text-sm outline-none";
  const inpStyle = {
    background: "#1f2937",
    border: "1px solid #374151",
    color: "#e2e8f0",
  } as const;

  return (
    <div className="h-screen flex flex-col text-slate-100" style={{ background: "#0b1120" }}>
      {/* Header */}
      <header
        className="shrink-0 flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: "#1f2937" }}
      >
        <Languages size={18} className="text-teal-400" />
        <span className="text-sm font-semibold">Translations</span>

        <div className="relative ml-4" ref={pageMenuRef}>
          <button
            onClick={() => {
              setPageSearch("");
              setPageMenuOpen((o) => !o);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm min-w-[180px]"
            style={inpStyle}
            title="Choose a page"
          >
            <span className="truncate">{pageKey || "Select a page"}</span>
            <ChevronDown size={14} className="ml-auto shrink-0 text-slate-500" />
          </button>

          {pageMenuOpen && (
            <div
              className="absolute z-20 mt-1 w-72 rounded-lg shadow-xl overflow-hidden"
              style={{ background: "#111827", border: "1px solid #374151" }}
            >
              <div className="relative p-2" style={{ borderBottom: "1px solid #1f2937" }}>
                <Search
                  size={13}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  autoFocus
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Search pages…"
                  className="w-full rounded-md pl-7 pr-3 py-1.5 text-sm"
                  style={inpStyle}
                />
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {filteredPages.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-500 text-center">No pages match</p>
                ) : (
                  filteredPages.map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setPageKey(k);
                        setPageMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-700/50"
                      style={{ color: k === pageKey ? "#5eead4" : "#e2e8f0" }}
                    >
                      {k === pageKey ? (
                        <Check size={14} className="shrink-0 text-teal-400" />
                      ) : (
                        <span className="w-[14px] shrink-0" />
                      )}
                      <span className="truncate">{k}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid #374151" }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: locale === l.code ? "#0f857a" : "transparent",
                color: locale === l.code ? "#fff" : "#94a3b8",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          {translatedCount}/{rows.length} translated
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by English…"
              className="rounded-lg pl-7 pr-3 py-1.5 text-sm w-56"
              style={inpStyle}
            />
          </div>
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              background: showPreview ? "#0f857a" : "transparent",
              color: showPreview ? "#fff" : "#94a3b8",
              border: "1px solid #374151",
            }}
            title="Toggle live website preview"
          >
            {showPreview ? <Eye size={14} /> : <EyeOff size={14} />} Preview
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "#22c55e" }}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Body — editor list (left) + live website preview (right) */}
      <div className="flex-1 min-h-0 flex">
        <main className={`${showPreview ? "w-1/2" : "flex-1"} overflow-y-auto px-5 py-5`}>
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-16">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-16">
              No translatable text on this page.
            </p>
          ) : (
            <div className={`${showPreview ? "" : "max-w-4xl mx-auto"} space-y-6`}>
              {groups.map((g, gi) => (
                <div
                  key={gi}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #1f2937" }}
                >
                  <div
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
                    style={{ background: "#111827" }}
                  >
                    {g.label}
                  </div>
                  <div className="divide-y" style={{ borderColor: "#1f2937" }}>
                    {g.rows.map((r) => (
                      <div
                        key={r.key}
                        className="grid grid-cols-2 gap-4 px-4 py-3 items-start"
                        style={{ borderColor: "#1f2937" }}
                      >
                        <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {r.variant === "mobile" && (
                            <span
                              className="mr-2 align-middle rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                              style={{ background: "#312e81", color: "#c7d2fe" }}
                            >
                              Mobile
                            </span>
                          )}
                          {r.segment && (
                            <span
                              className="mr-2 align-middle rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                              style={{ background: "#3f2a1e", color: "#fdba74" }}
                              title="This heading is stored as several styled parts — translate the whole sentence here (the accent styling isn't kept in translations)"
                            >
                              Joined
                            </span>
                          )}
                          {(keysByEnglish.get(r.english)?.length ?? 1) > 1 && (
                            <span
                              className="mr-2 align-middle rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ background: "#1e3a34", color: "#5eead4" }}
                              title="This exact text appears in multiple places — one translation fills them all"
                            >
                              ×{keysByEnglish.get(r.english)?.length}
                            </span>
                          )}
                          {r.english}
                        </div>
                        {r.richBase ? (
                          <div>
                            <div className="rounded-md overflow-hidden">
                              <RichTextInput
                                label=""
                                value={(bundle[r.key] ?? undefined) as unknown as RichValue}
                                onChange={(doc) => setValue(r.key, doc)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setValue(r.key, JSON.parse(JSON.stringify(r.richBase)))
                              }
                              className="mt-1 text-[11px] text-teal-400 hover:underline bg-transparent border-none cursor-pointer px-0"
                              title="Copy the English text + formatting so you can translate in place and keep the accent styling"
                            >
                              Start from English (keep formatting)
                            </button>
                          </div>
                        ) : (
                          <textarea
                            rows={Math.min(4, Math.max(1, Math.ceil(r.english.length / 48)))}
                            value={
                              typeof bundle[r.key] === "string" ? (bundle[r.key] as string) : ""
                            }
                            onChange={(e) => setValue(r.key, e.target.value)}
                            placeholder={`${locale.toUpperCase()} — leave blank to keep English`}
                            className={inp}
                            style={{ ...inpStyle, resize: "vertical" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {showPreview && (
          <div className="w-1/2 flex flex-col min-h-0" style={{ borderLeft: "1px solid #1f2937" }}>
            <div
              className="shrink-0 flex items-center gap-2 px-4 py-2 border-b"
              style={{ borderColor: "#1f2937", background: "#111827" }}
            >
              <span className="text-xs font-medium text-slate-400">
                Live preview · <span className="text-teal-400">{locale.toUpperCase()}</span>
              </span>
              <span className="text-[11px] text-slate-600">
                updates as you type · untranslated text stays English
              </span>
              <button
                onClick={() => {
                  ackedRef.current = false;
                  iframeRef.current?.contentWindow?.postMessage({ type: "RELOAD" }, "*");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                title="Reload preview"
              >
                <RefreshCw size={12} /> Reload
              </button>
            </div>
            <iframe
              ref={iframeRef}
              key={pageKey}
              src={`${RENDERER}/${pageKey}?preview=1`}
              className="flex-1 border-0 bg-white min-h-0"
              title="Website translation preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
