import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Languages, Save, Search } from "lucide-react";
import { authJsonHeaders } from "@/lib/builder-drafts";
import { BLOCK_LABELS, type BlockType } from "./types";
import { walkPageStrings, type TransRow, type TranslatableBlock } from "@/lib/i18n-walk";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

// Base language is English (the stored page). These are the overlay locales.
const LOCALES: { code: string; label: string }[] = [
  { code: "id", label: "Bahasa (id)" },
  { code: "pt", label: "Português (pt)" },
  { code: "es", label: "Español (es)" },
];

const blockLabel = (type: string) => BLOCK_LABELS[type as BlockType] ?? type;

interface PageListItem { pageKey: string }

export function TranslationsPage() {
  const [pages, setPages] = useState<string[]>([]);
  const [pageKey, setPageKey] = useState<string>("");
  const [locale, setLocale] = useState<string>(LOCALES[0].code);

  const [rows, setRows] = useState<TransRow[]>([]);
  // Full locale bundle (all pages' keys). We must round-trip the WHOLE map on
  // save — the PUT replaces `strings` entirely — so other pages aren't wiped.
  const [bundle, setBundle] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Load the page list once.
  useEffect(() => {
    fetch(`${BACKEND}/site/builder/pages`)
      .then(r => r.json())
      .then((d: { pages?: PageListItem[] }) => {
        const keys = (d.pages ?? []).map(p => p.pageKey).sort();
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
      const blocks = (pageData?.page?.blocks ?? []) as TranslatableBlock[];
      setRows(walkPageStrings(pageKey, blocks, blockLabel));
      setBundle((transData?.translation?.strings ?? {}) as Record<string, string>);
    } catch {
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  }, [pageKey, locale]);

  useEffect(() => { void load(); }, [load]);

  const setValue = (key: string, value: string) =>
    setBundle(b => ({ ...b, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      // Drop empty values so those strings fall back to English on render.
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(bundle)) {
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

  const filtered = useMemo(
    () => rows.filter(r => !search || r.english.toLowerCase().includes(search.toLowerCase())),
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

  const translatedCount = rows.filter(r => (bundle[r.key] ?? "").trim() !== "").length;

  const inp = "w-full rounded-lg px-3 py-2 text-sm outline-none";
  const inpStyle = { background: "#1f2937", border: "1px solid #374151", color: "#e2e8f0" } as const;

  return (
    <div className="h-screen flex flex-col text-slate-100" style={{ background: "#0b1120" }}>
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "#1f2937" }}>
        <Languages size={18} className="text-teal-400" />
        <span className="text-sm font-semibold">Translations</span>

        <select
          value={pageKey}
          onChange={e => setPageKey(e.target.value)}
          className="ml-4 rounded-lg px-3 py-1.5 text-sm"
          style={inpStyle}
        >
          {pages.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #374151" }}>
          {LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: locale === l.code ? "#0f857a" : "transparent", color: locale === l.code ? "#fff" : "#94a3b8" }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">{translatedCount}/{rows.length} translated</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by English…"
              className="rounded-lg pl-7 pr-3 py-1.5 text-sm w-56"
              style={inpStyle}
            />
          </div>
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

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-5 py-5">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-16">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-16">No translatable text on this page.</p>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-xl overflow-hidden" style={{ border: "1px solid #1f2937" }}>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400" style={{ background: "#111827" }}>
                  {g.label}
                </div>
                <div className="divide-y" style={{ borderColor: "#1f2937" }}>
                  {g.rows.map(r => (
                    <div key={r.key} className="grid grid-cols-2 gap-4 px-4 py-3 items-start" style={{ borderColor: "#1f2937" }}>
                      <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{r.english}</div>
                      <textarea
                        rows={Math.min(4, Math.max(1, Math.ceil(r.english.length / 48)))}
                        value={bundle[r.key] ?? ""}
                        onChange={e => setValue(r.key, e.target.value)}
                        placeholder={`${locale.toUpperCase()} — leave blank to keep English`}
                        className={inp}
                        style={{ ...inpStyle, resize: "vertical" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
