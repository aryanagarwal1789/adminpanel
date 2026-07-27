import { useEffect, useState } from "react";

// A link value is either an external/raw URL string, or a page reference of the
// form "page:{pageKey}" that the site resolves to the page's CURRENT URL at
// render (so nav/footer links auto-update when a page's URL changes).

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";
const PAGE_REF = /^page:(.+)$/;

interface PageOption { pageKey: string; path?: string }

// Fetched once per session and shared across every LinkField instance.
let pagesCache: PageOption[] | null = null;
let pagesPromise: Promise<PageOption[]> | null = null;

async function loadPages(): Promise<PageOption[]> {
  if (pagesCache) return pagesCache;
  if (!pagesPromise) {
    pagesPromise = fetch(`${BACKEND}/site/builder/pages`)
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d: { pages?: PageOption[] }) => {
        pagesCache = (d.pages ?? []).sort((a, b) => a.pageKey.localeCompare(b.pageKey));
        return pagesCache;
      })
      .catch(() => (pagesCache = []));
  }
  return pagesPromise;
}

interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

/** Link editor: pick a page (auto-updating) or enter a custom/external URL. */
export function LinkField({ label, value, onChange }: Props) {
  const [pages, setPages] = useState<PageOption[]>(pagesCache ?? []);
  const refMatch = value.match(PAGE_REF);
  const mode: "page" | "url" = refMatch ? "page" : "url";
  const selectedKey = refMatch ? refMatch[1] : "";

  useEffect(() => { void loadPages().then(setPages); }, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => onChange(selectedKey ? `page:${selectedKey}` : `page:${pages[0]?.pageKey ?? ""}`)}
            className={`px-1.5 py-0.5 rounded ${mode === "page" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}
          >
            Page
          </button>
          <button
            type="button"
            onClick={() => onChange(mode === "page" ? "" : value)}
            className={`px-1.5 py-0.5 rounded ${mode === "url" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "page" ? (
        <select
          value={selectedKey}
          onChange={(e) => onChange(`page:${e.target.value}`)}
          className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700 outline-none focus:border-blue-500"
        >
          <option value="">— select a page —</option>
          {pages.map((p) => (
            <option key={p.pageKey} value={p.pageKey}>
              {p.pageKey}{p.path ? ` (/${p.path})` : ""}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…  or  /custom-path"
          className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700 outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}
