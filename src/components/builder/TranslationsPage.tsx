import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Languages, Save, Search, Eye, EyeOff, RefreshCw, ChevronDown, Check, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { authJsonHeaders } from "@/lib/builder-drafts";
import { BLOCK_LABELS, type BlockType } from "./types";
import {
  mergePageStrings,
  applyPageTranslations,
  tryParseRichDoc,
  type TransRow,
  type TranslatableBlock,
} from "@/lib/i18n-walk";
import { richDocToText } from "@/lib/i18n-rich";
import { OVERLAY_LOCALES as LOCALES } from "@/lib/i18n-images";
import { RichTextInput } from "./RichTextInput";
import type { RichDoc, RichValue } from "./rich-text";

// A saved bundle value is either plain text or a JSON-serialized RichDoc (see
// richValueFor below) — Excel only ever sees plain text, so every read/compare
// against a spreadsheet cell goes through this to flatten rich values first.
function plainTextFor(raw: string | undefined): string {
  if (!raw) return "";
  const parsed = tryParseRichDoc(raw);
  return parsed ? richDocToText(parsed) : raw;
}

const EXPORT_HEADERS = {
  num: "#",
  section: "Section",
  variant: "Variant",
  english: "English (Original)",
  key: "Key",
} as const;

// Navbar/footer repeat on nearly every page — they're meant to be translated
// ONCE via the "_globals" page instead, so a per-page export would just be the
// same handful of strings duplicated across dozens of files. Excluded from the
// Excel export only — still fully editable here in /translations like any
// other block, this just keeps the exported sheet to per-page copy.
const GLOBAL_CHROME_BLOCK_TYPES = new Set<string>([
  "slick-sc-navbar",
  "slick-sc-footer",
  "slick-sc-footer-v2",
  "slick-footer-complex",
]);

interface ImportPreview {
  // key -> new value ("" means clear back to English)
  updates: Record<string, string>;
  changedCount: number;
  clearedCount: number;
}

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const RENDERER = import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai";

const blockLabel = (type: string) => BLOCK_LABELS[type as BlockType] ?? type;

// A saved translation for a *Rich row is either a JSON RichDoc (written by
// RichTextInput below) or plain text (legacy — every translation saved before
// this control existed). i18n-walk's RichDoc and rich-text.tsx's RichDoc are
// two independently-declared but structurally identical types (same JSON
// shape, kept dependency-free so this logic can be mirrored in the backend
// overlay) — the cast just bridges the two declarations, not the runtime value.
function richValueFor(raw: string | undefined): RichValue {
  if (!raw) return "";
  const parsed = tryParseRichDoc(raw);
  return parsed ? (parsed as unknown as RichDoc) : raw;
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
  const [bundle, setBundle] = useState<Record<string, string>>({});
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
    () =>
      applyPageTranslations(pageKey, blocks, bundle).filter(
        (b) => !b.hiddenLocales?.includes(locale),
      ),
    [pageKey, blocks, bundle, locale],
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

  // Highlight the section being translated — the preview iframe (rendered in
  // the same edit-mode canvas as the page builder) already outlines whichever
  // block id it receives a SECTION_SELECT for; we just drive it from row focus.
  const selectBlock = useCallback((blockId: string | null) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "SECTION_SELECT", blockId }, "*");
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
      // Blocks hidden for the locale being edited never render there, so their
      // strings aren't worth listing — same rationale as the `hidden` check
      // walkPageStrings already applies.
      const forLocale = (b: TranslatableBlock) => !b.hiddenLocales?.includes(locale);
      const pageBlocks = ((pageData?.page?.blocks ?? []) as TranslatableBlock[]).filter(forLocale);
      const mobileBlocks = ((pageData?.page?.mobileBlocks ?? []) as TranslatableBlock[]).filter(forLocale);
      setBlocks(pageBlocks);
      // Desktop rows + any mobile-only strings (mobile reuses desktop keys, so
      // shared slots aren't listed twice).
      setRows(mergePageStrings(pageKey, pageBlocks, mobileBlocks, blockLabel));
      setBundle((transData?.translation?.strings ?? {}) as Record<string, string>);
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
  // every occurrence so the translator never repeats themselves.
  const englishByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.key, r.english);
    return m;
  }, [rows]);
  const keysByEnglish = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of rows) {
      const a = m.get(r.english) ?? [];
      if (!a.includes(r.key)) a.push(r.key);
      m.set(r.english, a);
    }
    return m;
  }, [rows]);

  const setValue = useCallback(
    (key: string, value: string) => {
      const eng = englishByKey.get(key);
      const keys = (eng && keysByEnglish.get(eng)) || [key];
      setBundle((b) => {
        const next = { ...b };
        for (const k of keys) next[k] = value;
        return next;
      });
    },
    [englishByKey, keysByEnglish],
  );

  // Takes an explicit bundle (rather than always reading the `bundle` state)
  // so a caller that just computed a new bundle — e.g. import, right after its
  // own setBundle — can persist it immediately without waiting a render for
  // state to catch up.
  const save = async (toSave: Record<string, string> = bundle) => {
    setSaving(true);
    try {
      // Drop empty values so those strings fall back to English on render.
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(toSave)) {
        if (typeof v === "string" && v.trim() !== "") cleaned[k] = v;
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

  // ── Export to Excel ─────────────────────────────────────────────────────
  // blockId -> type, so export can drop navbar/footer rows without needing
  // `type` added to TransRow itself (shared/dependency-free util — see
  // i18n-walk.ts's own comments on why it stays that way).
  const blockTypeById = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of blocks) m.set(b.id, b.type);
    return m;
  }, [blocks]);

  // One row per row shown in the editor (not deduped by English text, so it's
  // a 1:1 mirror of what's on screen) — includes whatever is in `bundle` right
  // now, saved or not, so an in-progress review session exports faithfully.
  // Navbar/footer excluded — see GLOBAL_CHROME_BLOCK_TYPES.
  const exportTranslations = () => {
    const exportRows = rows.filter((r) => {
      const type = blockTypeById.get(r.blockId);
      return !type || !GLOBAL_CHROME_BLOCK_TYPES.has(type);
    });
    if (!exportRows.length) {
      toast.error("Nothing to export — this page has no translatable text.");
      return;
    }
    const data = exportRows.map((r, i) => ({
      [EXPORT_HEADERS.num]: i + 1,
      [EXPORT_HEADERS.section]: r.blockLabel,
      [EXPORT_HEADERS.variant]: r.variant === "mobile" ? "Mobile" : "",
      [EXPORT_HEADERS.english]: r.english,
      [`Translation (${locale.toUpperCase()})`]: plainTextFor(bundle[r.key]),
      [EXPORT_HEADERS.key]: r.key,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 9 }, { wch: 60 }, { wch: 60 }, { wch: 46 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Translations");
    XLSX.writeFile(wb, `${pageKey}-${locale}-translations.xlsx`);
  };

  // ── Import from Excel ───────────────────────────────────────────────────
  // Parses the uploaded file and computes a diff against the current bundle,
  // WITHOUT applying anything yet — the confirm modal (driven by
  // `importPreview`) is what actually calls save(). Matches primarily by the
  // Key column (exact, stable); falls back to matching by English text for a
  // row whose Key cell was edited/removed, since a shared English phrase is
  // already how the editor itself groups rows (see keysByEnglish above) — a
  // row with neither a usable Key nor a recognized English value is skipped.
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file: File) => {
    let json: Record<string, unknown>[];
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
    } catch {
      toast.error("Couldn't read that file — is it a valid .xlsx export?");
      return;
    }
    if (!json.length) {
      toast.error("That file has no rows.");
      return;
    }

    const headers = Object.keys(json[0]);
    const keyHeader = headers.find((h) => h.trim().toLowerCase() === EXPORT_HEADERS.key.toLowerCase());
    const englishHeader = headers.find((h) => /^english/i.test(h.trim()));
    const translationHeader = headers.find((h) => /^translation/i.test(h.trim()));

    if (!translationHeader) {
      toast.error('No "Translation" column found in that file.');
      return;
    }

    const byKey = new Map<string, string>();
    const byEnglish = new Map<string, string>();
    for (const row of json) {
      const value = String(row[translationHeader] ?? "").trim();
      const key = keyHeader ? String(row[keyHeader] ?? "").trim() : "";
      const english = englishHeader ? String(row[englishHeader] ?? "").trim() : "";
      if (key) byKey.set(key, value);
      else if (english) byEnglish.set(english, value);
    }

    const updates: Record<string, string> = {};
    let changedCount = 0;
    let clearedCount = 0;
    for (const r of rows) {
      const matched = byKey.has(r.key) ? byKey.get(r.key)! : byEnglish.get(r.english);
      if (matched === undefined) continue;
      const currentPlain = plainTextFor(bundle[r.key]).trim();
      if (matched === currentPlain) continue;
      updates[r.key] = matched;
      changedCount++;
      if (!matched) clearedCount++;
    }

    if (changedCount === 0) {
      toast.info("No changes — that file matches what's already here.");
      return;
    }
    setImportPreview({ updates, changedCount, clearedCount });
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    const next = { ...bundle };
    for (const [k, v] of Object.entries(importPreview.updates)) {
      if (v) next[k] = v;
      else delete next[k]; // empty cell → clear → falls back to English
    }
    setBundle(next);
    setImportPreview(null);
    await save(next);
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

  const translatedCount = rows.filter((r) => (bundle[r.key] ?? "").trim() !== "").length;

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
            onClick={exportTranslations}
            disabled={loading || !rows.length}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            style={{ color: "#94a3b8", border: "1px solid #374151" }}
            title="Download this page's text (this locale) as an Excel file"
          >
            <Download size={14} /> Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow re-selecting the same file next time
              if (file) void handleImportFile(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || !rows.length}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            style={{ color: "#94a3b8", border: "1px solid #374151" }}
            title="Upload a filled-in Excel export to bulk-fill translations"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={() => save()}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "#22c55e" }}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {importPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5"
            style={{ background: "#111827", border: "1px solid #374151" }}
          >
            <h2 className="text-sm font-semibold mb-2">Apply imported translations?</h2>
            <p className="text-sm text-slate-300 mb-1">
              <span className="font-semibold text-teal-400">{importPreview.changedCount}</span>{" "}
              row{importPreview.changedCount === 1 ? "" : "s"} will be updated for{" "}
              <span className="font-semibold">{locale.toUpperCase()}</span>.
            </p>
            {importPreview.clearedCount > 0 && (
              <p className="text-xs text-amber-400 mb-3">
                {importPreview.clearedCount} of those have an empty cell and will be cleared back
                to English.
              </p>
            )}
            <p className="text-xs text-slate-500 mb-4">
              This will save immediately — there's no further confirmation after this.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImportPreview(null)}
                className="rounded-lg px-3 py-1.5 text-sm"
                style={{ color: "#94a3b8", border: "1px solid #374151" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                style={{ background: "#0f857a" }}
              >
                Apply &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <div onFocus={() => selectBlock(r.blockId)} onBlur={() => selectBlock(null)}>
                            <RichTextInput
                              label={`${locale.toUpperCase()} — leave blank to keep English`}
                              value={richValueFor(bundle[r.key])}
                              onChange={(doc) => setValue(r.key, JSON.stringify(doc))}
                            />
                          </div>
                        ) : (
                          <textarea
                            rows={Math.min(4, Math.max(1, Math.ceil(r.english.length / 48)))}
                            value={bundle[r.key] ?? ""}
                            onChange={(e) => setValue(r.key, e.target.value)}
                            onFocus={() => selectBlock(r.blockId)}
                            onBlur={() => selectBlock(null)}
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
