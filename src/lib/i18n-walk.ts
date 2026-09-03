// Enumerate the translatable string leaves of a builder page, producing the
// SAME keys the backend overlay (`overlayPageDoc`) reads at render time:
//   key = `${pageKey}.${blockId}.${propPath}`
// so anything saved here is applied on the live site for that locale.
//
// Only real copy is exposed for translation — URLs, internal links, hex colours,
// asset paths, numbers, and lowercase enum/icon keys (e.g. 'cover', 'buildings')
// are skipped. The overlay only swaps a leaf when its key exists in the locale
// bundle, so exposing just text keeps everything else identical to English.

import {
  isRichDoc,
  isInlineRichDoc,
  richDocToText,
  richDocFromText,
  type RichDoc,
} from "./i18n-rich";

const ASSET_RE =
  /\.(png|jpe?g|svg|webp|gif|avif|ico|bmp|mp4|webm|mov|pdf|json|css|js|mjs|woff2?|ttf|eot)(\?|#|$)/i;

export function isTranslatableString(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^(https?:)?\/\//.test(t)) return false; // absolute / protocol-relative URL
  if (t.startsWith("/")) return false; // internal link / path
  if (/^[a-z][a-z0-9]*:\S/.test(t)) return false; // scheme-prefixed value (page:x, mailto:x, tel:x) — not copy. `\S` after ':' avoids catching lowercase copy like "note: text"
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false; // hex colour
  if (ASSET_RE.test(t)) return false; // asset filename
  if (!/[A-Za-z]/.test(t)) return false; // no letters → number/symbol
  if (/^[a-z0-9-]+$/.test(t)) return false; // lowercase slug / enum / icon key
  return true;
}

// Rich-text (ProseMirror/Tiptap) fields store their copy in `text` leaves, but
// the same JSON also carries STRUCTURAL leaves — node/mark type names
// ('textStyle', 'listItem', 'heading'…) under `type`, formatting under `marks`,
// and colours/hrefs under `attrs`. Those are not copy: walking them floods the
// editor with fake rows ("textStyle" ×25) and corrupts nothing only because the
// bundle never gets those keys. Skip these keys so only real text is enumerated.
const RICHTEXT_STRUCT_KEYS = new Set(["type", "marks", "attrs"]);

// True for an inline `*Rich` doc field — exposed as ONE whole-field row instead
// of being walked run-by-run (see i18n-rich for why).
function isWholeFieldRich(key: string, value: unknown): value is RichDoc {
  return key.endsWith("Rich") && isRichDoc(value) && isInlineRichDoc(value);
}

function walk(
  value: unknown,
  path: string,
  push: (path: string, str: string, richBase?: RichDoc) => void,
): void {
  if (typeof value === "string") {
    if (isTranslatableString(value)) push(path, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, path ? `${path}.${i}` : String(i), push));
    return;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // The renderer (resolveRichFields) replaces `${base}` with `${base}Rich`
    // when the latter is a rich doc and DROPS the legacy field — so a stale
    // legacy value would be a phantom row that never appears on the site. Skip it.
    const shadowed = new Set<string>();
    for (const k of Object.keys(obj)) {
      if (k.endsWith("Rich") && isRichDoc(obj[k])) shadowed.add(k.slice(0, -4));
    }
    for (const k of Object.keys(obj)) {
      if (RICHTEXT_STRUCT_KEYS.has(k)) continue;
      if (shadowed.has(k)) continue;
      const child = obj[k];
      const childPath = path ? `${path}.${k}` : k;
      // Inline rich field → one row for the whole sentence (don't descend),
      // carrying the source doc so the editor can offer real rich-text controls.
      if (isWholeFieldRich(k, child)) {
        const text = richDocToText(child);
        if (isTranslatableString(text)) push(childPath, text, child);
        continue;
      }
      walk(child, childPath, push);
    }
  }
}

// A translation value is either plain text (legacy — every row before this
// feature, and any row a translator hasn't reformatted) or a JSON-serialized
// RichDoc (new — produced by the rich-text editor for *Rich rows). Try the
// latter first so a translator's formatting round-trips; malformed/non-doc
// JSON and ordinary text both fall through to the plain-text path untouched.
export function tryParseRichDoc(s: string): RichDoc | null {
  const t = s.trim();
  if (!t.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(t);
    return isRichDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface TranslatableBlock {
  id: string;
  type: string;
  fields?: Record<string, unknown>;
  hidden?: boolean;
}

export interface TransRow {
  blockId: string;
  blockLabel: string;
  path: string; // dot-path within the block's fields
  key: string; // `${pageKey}.${blockId}.${path}` — matches the render overlay
  english: string;
  variant?: "mobile"; // only set for strings that exist ONLY on the mobile layout
  // The source RichDoc, present only for *Rich whole-field rows — lets the
  // editor render the same rich-text control used elsewhere in the builder
  // instead of a plain textarea.
  richBase?: RichDoc;
}

export function walkPageStrings(
  pageKey: string,
  blocks: TranslatableBlock[],
  blockLabel: (type: string) => string,
  variant?: "mobile",
): TransRow[] {
  const rows: TransRow[] = [];
  for (const b of blocks) {
    // A hidden block never renders on the live site, so translating it wastes
    // effort and clutters the list — same rule the SEO content-extraction and
    // the public renderer already apply.
    if (b.hidden) continue;
    walk(b.fields ?? {}, "", (path, str, richBase) => {
      rows.push({
        blockId: b.id,
        blockLabel: blockLabel(b.type),
        ...(richBase ? { richBase } : {}),
        path,
        key: `${pageKey}.${b.id}.${path}`,
        english: str,
        ...(variant ? { variant } : {}),
      });
    });
  }
  return rows;
}

// Merge desktop + mobile rows into one list. Mobile blocks reuse desktop block
// ids, so any key already present from desktop is the SAME slot (one translation
// covers both) and is dropped from the mobile set. Only strings that exist
// *only* on mobile — a mobile-only block, or a field the desktop layout doesn't
// have — survive, tagged `variant: 'mobile'`.
export function mergePageStrings(
  pageKey: string,
  desktopBlocks: TranslatableBlock[],
  mobileBlocks: TranslatableBlock[],
  blockLabel: (type: string) => string,
): TransRow[] {
  const desktop = walkPageStrings(pageKey, desktopBlocks, blockLabel);
  const seen = new Set(desktop.map((r) => r.key));
  const mobileOnly = walkPageStrings(pageKey, mobileBlocks, blockLabel, "mobile").filter(
    (r) => !seen.has(r.key),
  );
  return [...desktop, ...mobileOnly];
}

// Mirror of `walk` that REBUILDS the structure, swapping each translatable
// string leaf for its translation (via `resolve(path)`) when one exists. Uses
// the exact same traversal + path scheme as `walkPageStrings`, so the paths line
// up with the keys the editor writes and the render overlay reads. Returns a new
// tree (inputs are never mutated); non-translatable leaves pass through as-is.
function applyWalk(
  value: unknown,
  path: string,
  resolve: (path: string) => string | undefined,
): unknown {
  if (typeof value === "string") {
    if (isTranslatableString(value)) return resolve(path) ?? value;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => applyWalk(v, path ? `${path}.${i}` : String(i), resolve));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      // Structural rich-text keys are never enumerated (see RICHTEXT_STRUCT_KEYS)
      // so they carry no translation — copy them through verbatim to keep the
      // rich-text tree valid for the preview renderer.
      if (RICHTEXT_STRUCT_KEYS.has(k)) {
        out[k] = (value as Record<string, unknown>)[k];
        continue;
      }
      const child = (value as Record<string, unknown>)[k];
      const childPath = path ? `${path}.${k}` : k;
      // Inline rich field → rebuild the whole doc from its one translated row.
      // The rich-text editor writes a JSON RichDoc (preserves per-run marks);
      // older/plain-text translations for the same key still work via the
      // legacy richDocFromText rebuild.
      if (isWholeFieldRich(k, child)) {
        const t = resolve(childPath);
        out[k] =
          t != null && t.trim() !== "" ? (tryParseRichDoc(t) ?? richDocFromText(t, child)) : child;
        continue;
      }
      out[k] = applyWalk(child, childPath, resolve);
    }
    return out;
  }
  return value;
}

// Produce a copy of `blocks` with every translatable leaf replaced by its
// `${pageKey}.${blockId}.${path}` entry from `bundle` (blank/missing entries keep
// the English source). The result is shaped exactly like the original blocks, so
// it can be pushed straight into the preview iframe via BUILDER_BLOCKS_REORDER.
export function applyPageTranslations<T extends TranslatableBlock>(
  pageKey: string,
  blocks: T[],
  bundle: Record<string, string>,
): T[] {
  return blocks.map((b) => ({
    ...b,
    fields: applyWalk(b.fields ?? {}, "", (path) => {
      const v = bundle[`${pageKey}.${b.id}.${path}`];
      return typeof v === "string" && v.trim() !== "" ? v : undefined;
    }) as Record<string, unknown>,
  }));
}
