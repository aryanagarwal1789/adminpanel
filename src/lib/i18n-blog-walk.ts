// Translatable-string walker for blog posts — mirrors the backend's generic
// `overlayNamespaced`/`overlayValue` (salescodemarketplace/src/modules/i18nOverlay.ts)
// EXACTLY: same key scheme `blog.<slug>.<path>`, same id-keyed array segments
// (a content block's own `id` is used as its path segment instead of its
// array index, so reordering blocks in the editor doesn't break existing
// translations). Kept as a parallel, dependency-free implementation — like
// i18n-images.ts — since the two repos don't share code.

import { isTranslatableString } from "./i18n-walk";
import type { TransRow } from "./i18n-walk";
import type { BlogPost } from "../components/builder/BlogPanel";

// Identifiers, enums, dates, URLs and raw JSON — never offered for
// translation even when they happen to contain letters.
const EXCLUDED_KEYS = new Set([
  "id",
  "_id",
  "slug",
  "status",
  "type",
  "featuredImage",
  "tags",
  "link",
  "order",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "lastModifiedBy",
  "url",
  "jsonLd",
  "canonicalUrl",
  "robots",
  "ogImage",
  "twitterImage",
  // The 'html' content-block type stores a raw HTML/embed snippet (iframe,
  // custom markup), not copy — hand-editing it in a plain textarea here
  // would silently risk breaking the markup. If a locale genuinely needs a
  // different embed, that's a dev/CMS-field change, not a translation row.
  "html",
]);

// Content-block types whose `text` is markdown-flavoured copy (see
// BlogEditorPage.tsx's mdToHtml/blockMode) — everything else (quote, list
// items, captions, faqItems) is plain text with no markup support.
const MARKUP_MODE_BY_BLOCK_TYPE: Record<string, "paragraph" | "heading"> = {
  paragraph: "paragraph",
  heading2: "heading",
  heading3: "heading",
};

function arraySegment(value: unknown, index: number): string | number {
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return index;
}

function sectionFor(path: string, post: BlogPost): { blockId: string; blockLabel: string } {
  const top = path.split(".")[0];
  if (top === "seo") return { blockId: "seo", blockLabel: "SEO" };
  if (top === "content") {
    const blockId = path.split(".")[1];
    const block = post.content?.find((b) => b.id === blockId);
    return { blockId: `content-${blockId}`, blockLabel: block ? `Content — ${block.type}` : "Content" };
  }
  return { blockId: "meta", blockLabel: "Post Details" };
}

function walk(value: unknown, path: string, push: (path: string, str: string) => void): void {
  if (typeof value === "string") {
    if (isTranslatableString(value)) push(path, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => {
      const seg = arraySegment(v, i);
      walk(v, path ? `${path}.${seg}` : String(seg), push);
    });
    return;
  }
  if (value && typeof value === "object") {
    for (const k of Object.keys(value as Record<string, unknown>)) {
      if (EXCLUDED_KEYS.has(k)) continue;
      walk((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k, push);
    }
  }
}

// Produces rows keyed exactly like the backend overlay reads them:
// `blog.<slug>.<path>` — matches `overlayNamespaced(post, 'blog.<slug>', strings)`.
export function walkBlogStrings(post: BlogPost): TransRow[] {
  const namespace = `blog.${post.slug}`;
  const rows: TransRow[] = [];
  walk(post as unknown, "", (path, str) => {
    const { blockId, blockLabel } = sectionFor(path, post);
    // Only a content block's own `text` leaf (content.<blockId>.text) carries
    // markdown markup — every other field (caption, alt, faqItems, etc.) is
    // plain text even on the same block.
    const segs = path.split(".");
    const isBlockText = segs[0] === "content" && segs[2] === "text";
    const block = isBlockText ? post.content?.find((b) => b.id === segs[1]) : undefined;
    const markupMode = block ? MARKUP_MODE_BY_BLOCK_TYPE[block.type] : undefined;
    rows.push({
      blockId,
      blockLabel,
      path,
      key: `${namespace}.${path}`,
      english: str,
      ...(markupMode ? { markupMode } : {}),
    });
  });
  return rows;
}
