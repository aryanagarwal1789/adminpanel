// Enumerate the translatable string leaves of a builder page, producing the
// SAME keys the backend overlay (`overlayPageDoc`) reads at render time:
//   key = `${pageKey}.${blockId}.${propPath}`
// so anything saved here is applied on the live site for that locale.
//
// Only real copy is exposed for translation — URLs, internal links, hex colours,
// asset paths, numbers, and lowercase enum/icon keys (e.g. 'cover', 'buildings')
// are skipped. The overlay only swaps a leaf when its key exists in the locale
// bundle, so exposing just text keeps everything else identical to English.

const ASSET_RE = /\.(png|jpe?g|svg|webp|gif|avif|ico|bmp|mp4|webm|mov|pdf|json|css|js|mjs|woff2?|ttf|eot)(\?|#|$)/i;

export function isTranslatableString(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^(https?:)?\/\//.test(t)) return false; // absolute / protocol-relative URL
  if (t.startsWith('/')) return false;          // internal link / path
  if (/^[a-z][a-z0-9]*:\S/.test(t)) return false; // scheme-prefixed value (page:x, mailto:x, tel:x) — not copy. `\S` after ':' avoids catching lowercase copy like "note: text"
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false; // hex colour
  if (ASSET_RE.test(t)) return false;           // asset filename
  if (!/[A-Za-z]/.test(t)) return false;        // no letters → number/symbol
  if (/^[a-z0-9-]+$/.test(t)) return false;     // lowercase slug / enum / icon key
  return true;
}

function walk(value: unknown, path: string, push: (path: string, str: string) => void): void {
  if (typeof value === 'string') {
    if (isTranslatableString(value)) push(path, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, path ? `${path}.${i}` : String(i), push));
    return;
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value as Record<string, unknown>)) {
      walk((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k, push);
    }
  }
}

export interface TranslatableBlock {
  id: string;
  type: string;
  fields?: Record<string, unknown>;
}

export interface TransRow {
  blockId: string;
  blockLabel: string;
  path: string;   // dot-path within the block's fields
  key: string;    // `${pageKey}.${blockId}.${path}` — matches the render overlay
  english: string;
}

export function walkPageStrings(
  pageKey: string,
  blocks: TranslatableBlock[],
  blockLabel: (type: string) => string,
): TransRow[] {
  const rows: TransRow[] = [];
  for (const b of blocks) {
    walk(b.fields ?? {}, '', (path, str) => {
      rows.push({
        blockId: b.id,
        blockLabel: blockLabel(b.type),
        path,
        key: `${pageKey}.${b.id}.${path}`,
        english: str,
      });
    });
  }
  return rows;
}
