// Blog Markdown importer.
//
// Turns a structured Markdown file (.md) — or a .zip containing that Markdown
// plus its images — into the EXACT same data the blog editor produces when a
// post is authored by hand: a `BlogPost`-shaped form object whose `content` is
// a `ContentBlock[]`. The result is loaded straight into the existing editor,
// so an imported post is indistinguishable from a manually created one and
// stays fully editable. No separate renderer, no new block type.
//
// Mapping (Markdown → existing blocks):
//   #            → title (frontmatter `title` wins)
//   ##  / ###+   → heading2 / heading3
//   paragraph    → paragraph (inline **bold** / *italic* / [links] preserved —
//                  the renderer parses that same inline dialect)
//   image-only ¶ → image  (consecutive images → image-grid)
//   -, *, 1.     → list (ordered flag)
//   >            → quote
//   ---          → divider
//   ``` / table  → html block (no native block type — the editor's escape hatch)
//   raw HTML     → html block
import MarkdownIt, { type Token } from 'markdown-it';
import JSZip from 'jszip';
import type { BlogPost, BlogPostSeo, ContentBlock, ContentBlockType } from './BlogPanel';

const md = new MarkdownIt({ html: true, linkify: true });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface ImportResult {
  form: Partial<BlogPost>;
  tagInput: string;
  report: string[];
}

/* ── frontmatter ────────────────────────────────────────────────────── */
// Minimal YAML-front-matter parser: `key: value`, quoted strings, inline
// `[a, b]` arrays, and block `- item` arrays. Enough for blog metadata.
function parseFrontmatter(src: string): { data: Record<string, string | string[]>; body: string } {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string | string[]> = {};
  const lines = m[1].split(/\r?\n/);
  let curKey: string | null = null;
  for (const line of lines) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && curKey) {
      const arr = Array.isArray(data[curKey]) ? (data[curKey] as string[]) : [];
      arr.push(unquote(listItem[1]));
      data[curKey] = arr;
      continue;
    }
    const kv = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const raw = kv[2].trim();
    curKey = key;
    if (raw === '') { data[key] = ''; continue; } // may be a block list on following lines
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      data[key] = unquote(raw);
    }
  }
  return { data, body: src.slice(m[0].length) };
}
function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return JSON.parse(t.startsWith("'") ? `"${t.slice(1, -1).replace(/"/g, '\\"')}"` : t); } catch { return t.slice(1, -1); }
  }
  return t;
}
function asStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v.join(', ') : (v ?? '');
}
function asArr(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

/* ── markdown → blocks ──────────────────────────────────────────────── */
// Plain text of an inline token (children flattened) — for contexts that store
// plain text (list items, quotes): keeps link/emphasis TEXT, drops the markup.
function plainInline(tok: Token | undefined): string {
  if (!tok) return '';
  if (!tok.children) return tok.content ?? '';
  let s = '';
  for (const c of tok.children) {
    if (c.type === 'text' || c.type === 'code_inline') s += c.content;
    else if (c.type === 'softbreak' || c.type === 'hardbreak') s += ' ';
    else if (c.type === 'image') s += c.content; // alt
  }
  return s.replace(/\s+/g, ' ').trim();
}
function imgSrc(tok: Token): string {
  return String(tok.attrGet('src') ?? '');
}
function imgTitle(tok: Token): string {
  return String(tok.attrGet('title') ?? '');
}

function tokensToBlocks(tokens: Token[], report: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let i = 0;
  const push = (b: ContentBlock) => blocks.push(b);

  while (i < tokens.length) {
    const t = tokens[i];
    switch (t.type) {
      case 'heading_open': {
        const inline = tokens[i + 1];
        const text = (inline?.content ?? '').trim();
        const tag = t.tag; // h1..h6
        const type: ContentBlockType = tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' ? 'heading3' : 'heading2';
        if (text) push({ id: uid(), type, text });
        i += 3;
        break;
      }
      case 'paragraph_open': {
        const inline = tokens[i + 1];
        const children = inline?.children ?? [];
        const images = children.filter((c) => c.type === 'image');
        const hasText = children.some((c) => c.type === 'text' && c.content.trim());
        if (images.length && !hasText) {
          // image-only paragraph → image block(s); 2+ becomes an image-grid
          if (images.length === 1) {
            push({ id: uid(), type: 'image', url: imgSrc(images[0]), alt: images[0].content ?? '', caption: imgTitle(images[0]) });
          } else {
            push({
              id: uid(), type: 'image-grid',
              columns: (images.length >= 4 ? 4 : images.length >= 3 ? 3 : 2) as 2 | 3 | 4,
              images: images.map((im) => ({ url: imgSrc(im), alt: im.content ?? '', caption: imgTitle(im) })),
            });
          }
        } else {
          const text = (inline?.content ?? '').trim();
          if (text) push({ id: uid(), type: 'paragraph', text });
        }
        i += 3;
        break;
      }
      case 'bullet_list_open':
      case 'ordered_list_open': {
        const ordered = t.type === 'ordered_list_open';
        const items: string[] = [];
        let depth = 1;
        i++;
        while (i < tokens.length && depth > 0) {
          const tt = tokens[i];
          if (tt.type === 'bullet_list_open' || tt.type === 'ordered_list_open') depth++;
          else if (tt.type === 'bullet_list_close' || tt.type === 'ordered_list_close') depth--;
          else if (tt.type === 'inline' && depth === 1) items.push(plainInline(tt));
          i++;
        }
        const clean = items.filter((x) => x.trim());
        if (clean.length) push({ id: uid(), type: 'list', ordered, items: clean });
        break;
      }
      case 'blockquote_open': {
        const parts: string[] = [];
        let depth = 1;
        i++;
        while (i < tokens.length && depth > 0) {
          const tt = tokens[i];
          if (tt.type === 'blockquote_open') depth++;
          else if (tt.type === 'blockquote_close') depth--;
          else if (tt.type === 'inline') parts.push(plainInline(tt));
          i++;
        }
        const text = parts.join(' ').trim();
        if (text) push({ id: uid(), type: 'quote', text });
        break;
      }
      case 'hr':
        push({ id: uid(), type: 'divider' });
        i++;
        break;
      case 'fence':
      case 'code_block':
        push({ id: uid(), type: 'html', html: `<pre><code>${escapeHtml(t.content)}</code></pre>` });
        report.push('Code block → HTML block');
        i++;
        break;
      case 'html_block':
        if ((t.content ?? '').trim()) push({ id: uid(), type: 'html', html: t.content });
        i++;
        break;
      case 'table_open': {
        const start = i;
        let depth = 1;
        i++;
        while (i < tokens.length && depth > 0) {
          if (tokens[i].type === 'table_open') depth++;
          else if (tokens[i].type === 'table_close') depth--;
          i++;
        }
        const html = md.renderer.render(tokens.slice(start, i), md.options, {});
        push({ id: uid(), type: 'html', html });
        report.push('Table → HTML block');
        break;
      }
      default:
        i++;
    }
  }
  return blocks;
}

/* ── image resolution (zip) ─────────────────────────────────────────── */
const IMG_RE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
function isRemote(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || url.startsWith('/api/') || url.startsWith('data:');
}
function baseName(p: string): string {
  return p.split('/').pop() ?? p;
}
function guessMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'svg' ? 'image/svg+xml'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'gif' ? 'image/gif'
    : ext === 'webp' ? 'image/webp'
    : ext === 'avif' ? 'image/avif'
    : 'image/png';
}

// Upload every local image referenced by the blocks (and cover) and rewrite the
// url in place. Remote URLs are left untouched. Returns nothing (mutates blocks).
async function resolveImages(
  urls: string[],
  images: Map<string, File>,
  uploadImage: (f: File) => Promise<string | null>,
  report: string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const uniqueLocal = [...new Set(urls.filter((u) => u && !isRemote(u)))];
  for (const ref of uniqueLocal) {
    // match by full zip path or by basename
    const file = images.get(ref) ?? images.get(ref.replace(/^\.\//, '')) ?? images.get(baseName(ref));
    if (!file) {
      report.push(`Image not found in package: ${ref}`);
      continue;
    }
    const url = await uploadImage(file);
    if (url) resolved.set(ref, url);
    else report.push(`Upload failed: ${ref}`);
  }
  return resolved;
}

/* ── public API ─────────────────────────────────────────────────────── */
export async function importBlogFile(
  file: File,
  uploadImage: (f: File) => Promise<string | null>,
  listType: 'blog' | 'case-study' = 'blog',
): Promise<ImportResult> {
  const report: string[] = [];
  let mdText: string;
  const images = new Map<string, File>();

  if (/\.zip$/i.test(file.name)) {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((f) => !f.dir);
    const mdEntry = entries.find((f) => /\.(md|markdown)$/i.test(f.name));
    if (!mdEntry) throw new Error('No .md/.markdown file found inside the .zip');
    mdText = await mdEntry.async('string');
    for (const entry of entries) {
      if (!IMG_RE.test(entry.name)) continue;
      const blob = await entry.async('blob');
      const f = new File([blob], baseName(entry.name), { type: guessMime(entry.name) });
      images.set(entry.name, f);              // full path
      if (!images.has(baseName(entry.name))) images.set(baseName(entry.name), f); // basename fallback
    }
  } else if (/\.(md|markdown)$/i.test(file.name)) {
    mdText = await file.text();
  } else {
    throw new Error('Unsupported file — upload a .md or a .zip');
  }

  const { data, body } = parseFrontmatter(mdText);

  // Title: frontmatter wins; otherwise the first `# H1` line (which is then
  // stripped so it doesn't also become a block).
  let title = asStr(data.title);
  let mdBody = body;
  if (!title) {
    const h1 = /^\s*#\s+(.+?)\s*$/m.exec(mdBody);
    if (h1) { title = h1[1].trim(); mdBody = mdBody.slice(0, h1.index) + mdBody.slice(h1.index + h1[0].length); }
  }

  const blocks = tokensToBlocks(md.parse(mdBody, {}), report);

  // Gather every image url (cover + blocks) and resolve local ones via the zip.
  const cover = asStr(data.cover) || asStr(data.featuredImage) || asStr(data.image);
  const allUrls: string[] = [];
  if (cover) allUrls.push(cover);
  for (const b of blocks) {
    if (b.type === 'image' && b.url) allUrls.push(b.url);
    if (b.type === 'image-grid') (b.images ?? []).forEach((im) => im.url && allUrls.push(im.url));
  }
  const resolved = await resolveImages(allUrls, images, uploadImage, report);
  const map = (u: string) => resolved.get(u) ?? resolved.get(u.replace(/^\.\//, '')) ?? u;
  for (const b of blocks) {
    if (b.type === 'image' && b.url) b.url = map(b.url);
    if (b.type === 'image-grid') (b.images ?? []).forEach((im) => { if (im.url) im.url = map(im.url); });
  }

  // SEO from frontmatter (only set keys that were provided)
  const seo: BlogPostSeo = {};
  if (data.metaTitle) seo.metaTitle = asStr(data.metaTitle);
  if (data.metaDescription) seo.metaDescription = asStr(data.metaDescription);
  if (data.keywords) seo.keywords = asArr(data.keywords);
  if (data.focusKeyphrase) seo.focusKeyphrase = asStr(data.focusKeyphrase);
  if (data.canonicalUrl) seo.canonicalUrl = asStr(data.canonicalUrl);
  if (data.robots) seo.robots = asStr(data.robots);
  if (data.ogImage) seo.ogImage = asStr(data.ogImage);

  const tags = asArr(data.tags);
  const type: 'blog' | 'case-study' = asStr(data.type) === 'case-study' ? 'case-study' : listType;

  const form: Partial<BlogPost> = {
    title,
    slug: asStr(data.slug) || slugify(title),
    excerpt: asStr(data.description) || asStr(data.excerpt),
    body: '',
    content: blocks,
    author: asStr(data.author),
    authorRole: asStr(data.authorRole),
    category: asStr(data.category) || (type === 'blog' ? 'Blog' : 'Case Study'),
    type,
    featuredImage: cover ? map(cover) : '',
    featuredImageCaption: asStr(data.coverCaption),
    tags,
    status: 'draft',
    ...(Object.keys(seo).length ? { seo } : {}),
  };

  report.unshift(`Imported ${blocks.length} block${blocks.length === 1 ? '' : 's'}${resolved.size ? `, ${resolved.size} image${resolved.size === 1 ? '' : 's'} uploaded` : ''}.`);
  return { form, tagInput: tags.join(', '), report };
}
