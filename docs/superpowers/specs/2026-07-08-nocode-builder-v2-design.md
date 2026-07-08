# No-Code Website Builder v2 — Design

- **Date:** 2026-07-08
- **Status:** Approved design — pending implementation plan
- **Scope:** Cross-repo (`adminpanel`, `salescodemarketplace`, `Salescode-self-serve`)
- **Author:** rishabh.pathak@salescode.ai (with Claude)

---

## 1. Background

The current no-code page system spans three repos:

- **adminpanel** — TanStack Start SPA. Hosts the page builder (`PageBuilder.tsx`) and CMS editors. Writes configs via raw `fetch()` to the marketplace backend (hardcoded `https://salescode-marketplace.salescode.ai`).
- **salescodemarketplace** — Express + Mongoose backend. Stores builder page configs in the `builderpages` MongoDB collection (`BuilderPageModel`).
- **Salescode-self-serve** — Next.js 16 App Router site. Fetches configs and renders public pages.

### Current storage (`builderpages`)

One document per page, keyed by a globally-unique `pageKey`:

```jsonc
{
  "pageKey": "landing",          // unique, indexed
  "blocks": [                     // FLAT ordered array, no nesting
    { "id": "b1", "type": "hero-split", "order": 0,
      "fields": { ... },          // Schema.Types.Mixed — schemaless
      "style":  { ... } }         // Schema.Types.Mixed — schemaless
  ],
  "theme": { ... },               // strict:false
  "createdAt": ..., "updatedAt": ...
}
```

### Problems with v1

- **No enforced schema.** `fields`/`style` are `Mixed`; keys are "fixed" only by convention, hardcoded in **four** hand-maintained places across two repos (adminpanel `defaults.ts`, adminpanel `ContentEditor.tsx` ~switch, self-serve `blockRegistry.ts`, self-serve `BlockRenderer.tsx` ~switch). ~182 block types.
- **Drift.** The four sources and the two component sets are kept in sync by hand. A type or prop mismatch fails silently (unknown type → `default: null`, block vanishes).
- **Flat only.** `blocks[]` has no nesting; nesting is faked via special `layout`/`columns`/`widgets` cases.
- **Single site, single language, no draft/versioning.** `pageKey` is globally unique; one live document; no locale support; no multi-site.

---

## 2. Goals & non-goals

### Goals
- A **fixed, recursive config schema**: fixed keys per node, unlimited nesting.
- Real **no-code** authoring: add a component by adding one registry entry — no hand-written editor forms, no per-type switch.
- **Zero preview/publish drift** — the editor preview must be pixel-identical to the published page.
- **Multi-site** — one adminpanel manages many self-serve deployments; configs scoped per site.
- **i18n** — per-component text localized per locale, no-code and deploy-free.
- **Responsive** styling per breakpoint.

### Non-goals (this iteration)
- Migrating the ~182 legacy block types or existing live pages. Legacy pages stay frozen on the old renderer (see §10).
- Draft/published workflow, approvals, or version history (publish writes live, as today).
- A shared component npm package / monorepo (explicitly rejected in favor of the iframe-shared-renderer approach — see §7).

---

## 3. Config schema — recursive node tree

A page is a tree of nodes. **Every node has the same fixed 5-key envelope:**

```jsonc
{
  "id":       "n1",            // unique within the page
  "type":     "section",       // registry key → selects the component
  "props":    { "maxWidth": "1200" },   // fixed keys per type (registry-declared)
  "styles":   { ... },         // breakpoint-keyed map of raw CSS text (see §5)
  "children": [ /* any nodes, any depth */ ]
}
```

- `type` — string; must exist in the registry (§6). Unknown type renders nothing.
- `props` — object whose allowed keys/types/defaults are declared per `type` in the registry. Text props may be flagged `translatable` (§8).
- `styles` — universal, present on every node; breakpoint-keyed raw CSS text (§5).
- `children` — ordered array of child nodes. Nesting is unlimited; positioning is flow-based (§4).

### Page document (stored in `builderpages`)

```jsonc
{
  "siteKey":       "demo-experience",   // multi-site scope (§7)
  "pageKey":       "landing",
  "schemaVersion": 2,                   // 2 = recursive tree; legacy docs have no v2/tree
  "defaultLocale": "en",
  "tree":          { /* root node */ },
  "createdAt": ..., "updatedAt": ...
}
```

The `builderpages` schema is already `Mixed`, so the tree stores with **no Mongo migration** — only a new field, a `schemaVersion` discriminator, and an index change (§9).

---

## 4. Layout & positioning

**Flow-based, parent-controlled — not absolute x/y coordinates.**

- A child's position = its **order in the parent's `children[]`** + the **parent's flex/grid styles** + the child's own margin/align.
- Containers use `display:flex` / `display:grid` (set via the parent node's `styles`).
- In the editor: **drag to reorder** within a container, **drag between containers** to reparent (moves the node between `children[]` arrays).
- **No absolute positioning by default** — pixel coordinates break responsiveness. Overlap is an opt-in per-node `position:absolute` via raw CSS only.

---

## 5. Styles — universal, per-breakpoint, raw CSS text

Every node carries a `styles` object. It is a **breakpoint-keyed map**, each value a **raw CSS text string**:

```jsonc
"styles": {
  "base": "padding:80px 24px; background:#0f172a; display:flex; gap:24px;",
  "md":   "padding:40px 16px; font-size:36px;",          // ≤ 1024px
  "sm":   "padding:24px 12px; flex-direction:column;"    // ≤ 640px
}
```

- **Fixed, shared breakpoint set, desktop-first:** `base` (desktop) / `md` (≤1024) / `sm` (≤640). Defined in one shared constant so both repos agree.
- Values are **raw CSS** (no token scale) — full control; author types CSS values directly in the style panel.
- **Editor:** a universal Style Panel (same for every component) plus a **viewport switcher** (Desktop / Tablet / Mobile). Editing at a breakpoint writes that breakpoint's key; `base` cascades.
- **Render:** each node gets a scoped class (from `node.id`); the renderer emits the CSS plus media queries:

```css
.n1 { padding:80px 24px; background:#0f172a; display:flex; gap:24px; }
@media (max-width:1024px){ .n1 { padding:40px 16px; font-size:36px; } }
@media (max-width:640px) { .n1 { padding:24px 12px; flex-direction:column; } }
```

- Adding a component gets full styling for free — zero extra code.
- Styles are never translated (§8).

---

## 6. Registry — the single source of truth

The registry maps each `type` to its component and its prop schema. It **lives in self-serve** (the renderer owns it).

```ts
// self-serve registry entry
{
  type: 'heading',
  label: 'Heading',
  category: 'Text',
  acceptsChildren: false,
  propsSchema: [
    { key: 'text',  label: 'Text',  type: 'text',  default: 'Title', translatable: true },
    { key: 'level', label: 'Level', type: 'enum',  options: [1,2,3], default: 2 },
  ],
  // component: React implementation (code, self-serve only)
}
```

- **Prop schema is data** (keys, types, defaults, options, `translatable`) — self-serve serializes it to JSON and serves it (endpoint or generated file) for adminpanel to consume.
- **Components are code** — only self-serve holds them (it renders). adminpanel never imports components.
- Registry declares which props are `translatable` (text/textarea/richtext/label/alt/SEO). URLs, colors, image srcs, enums, and styles are never translated.

---

## 7. Ownership & repo responsibilities

| Concern | Home | Notes |
|---|---|---|
| Components (React) | **self-serve only** | single implementation; primitives + composites |
| Renderer | **self-serve only** | one recursive renderer for BOTH preview & publish |
| Registry (type → component + prop schema) | **self-serve** | source of truth |
| Prop schemas as JSON | served by self-serve → **adminpanel** | adminpanel auto-builds forms; no component code |
| Editor chrome (tree, forms, style panel, toolbars) | **adminpanel** | |
| Canvas | **iframe → self-serve renderer** (preview mode) | edits stream via postMessage → **WYSIWYG guaranteed** |
| Storage / APIs | **marketplace** | `builderpages`, `sites`, `translations` collections |

**Why the iframe canvas:** the only way to guarantee the preview matches the published page is to render both with the *same* code. adminpanel provides the editor chrome; the canvas is a live iframe into self-serve's renderer in preview mode. Edits are streamed over the existing postMessage channel (`BUILDER_*` messages already exist in `BuilderPreviewPage.tsx`; extend with tree ops: `NODE_UPSERT`, `NODE_MOVE`, `NODE_DELETE`, `PROPS_UPDATE`, `STYLES_UPDATE`). This eliminates the two-component-library drift.

### Recursive renderer (self-serve)

```
render(node):
  Comp = REGISTRY[node.type]
  if !Comp: return null
  emitScopedCss(node.id, node.styles)          // class + media queries
  return <Comp {...node.props} styleId={node.id}>
           {node.children.map(render)}
         </Comp>
```

Branches on `schemaVersion`: `2` → recursive renderer; legacy → existing flat renderer, untouched.

---

## 8. Internationalization (i18n)

**Applies to BOTH legacy (v1 flat `blocks`) and new (v2 `tree`) pages.** Base text lives inline in the config; translations are per-locale key→text bundles stored in Mongo and edited in adminpanel; marketplace overlays them at read time via a **schema-agnostic, path-based engine**.

- **Base (default-locale, e.g. `en`) text stays inline** in the stored config — v2 in node `props`, v1 in block `fields`. Authors type text in the builder as today; no change to base-language authoring.
- **Translation key** = `<pageKey>.<entityId>.<propPath>`, where `entityId` is the node id (v2) or block id (v1) and `propPath` is the dot-path to the string leaf within `props`/`fields`. Examples: `landing.n2.text`, `landing.b1.items.0.title`.
- Bundles are stored per site + locale (one doc spans all pages of the site; the page-prefixed keys disambiguate):

```jsonc
// translations collection (Mongo), adminpanel-edited
{ "siteKey": "demo-experience", "locale": "es",
  "strings": { "landing.n2.text": "Crece tus ventas con IA",
               "landing.b1.headline": "El futuro de las ventas" } }
```

- **Overlay engine (schema-agnostic):** walk the page doc; for every entity (v2 node OR v1 block) and every string leaf in its content, compute the key; if present in `strings`, replace the value; otherwise keep the base. **Identical logic for both schemas** — the bundle alone determines what is translated, so legacy pages need no per-type "translatable-field" registry.
- **What the editor offers as translatable:** v2 uses the registry `translatable` flag (precise). v1 has no registry, so adminpanel lists the page's string leaves as candidates and the author marks which to translate (URLs/colors/image srcs excluded by the author). Only marked strings get keys written to the bundle.
- **adminpanel** gets a translations panel: pick a locale, edit strings side-by-side with base (optional machine-seed to pre-fill). Saved to Mongo — adding/fixing a language needs **no deploy**.
- **Read path** (marketplace):

```
GET /site/{siteKey}/builder/pages/{pageKey}?locale=es      (host→siteKey, +locale)
  → load page doc (v1 blocks[] OR v2 tree; base text inline)
  → if locale ≠ defaultLocale: overlay the page's strings from translations[locale]
  → missing key → fall back to base text
  → return localized doc (same shape it was stored in)
```

- **self-serve** passes `?locale` on BOTH the v2 fetch and the legacy fetch. The legacy flat renderer needs no change — it renders whatever (already-localized) text it receives.
- The overlay is cheap string substitution on pre-authored bundles — fast, deterministic, cacheable. No live machine translation on the request path.

---

## 9. Multi-site

**Configs are scoped per site.** Today `pageKey` is globally unique; it becomes composite `(siteKey, pageKey)`.

### `sites` registry (new collection)

```jsonc
{ "siteKey": "demo-experience", "label": "Demo Experience",
  "hosts": ["demo-experience.salescode.ai"],
  "previewUrl": "https://demo-experience.salescode.ai" }
{ "siteKey": "products", "label": "Products",
  "hosts": ["products.salescode.ai"],
  "previewUrl": "https://products.salescode.ai" }
```

### Site identity — by request host + registry

- **self-serve** reads its own hostname from the request (Next `headers()`), resolves `host → siteKey` via the `sites` registry (lookup cached with short revalidate), then fetches `/site/{siteKey}/builder/pages/{pageKey}`. Adding a website = one registry row + DNS, **no redeploy**.
- Unknown host → 404.

### adminpanel — site selector

- A **site dropdown** (from the registry). Selecting a site scopes every read/write to that `siteKey`, and points the **iframe preview at that site's `previewUrl`** (editing "products" previews on products.salescode.ai).
- Each site's `next.config.ts` must list adminpanel in CSP `frame-ancestors` (demo already does; products adds the same line).

### Endpoints

Marketplace (site-scoped config, translations, sites):
```
GET  /site/{siteKey}/builder/pages                       list pages
GET  /site/{siteKey}/builder/pages/{pageKey}?locale=xx   read (localized) config
PUT  /site/{siteKey}/builder/pages/{pageKey}             write config tree
GET  /site/{siteKey}/translations/{locale}               read a locale bundle
PUT  /site/{siteKey}/translations/{locale}               write a locale bundle
GET  /sites                                              list sites (adminpanel dropdown)
GET  /sites/resolve?host=...                             host → siteKey (self-serve)
```

Self-serve (owns the registry; serves prop schemas as data for adminpanel forms):
```
GET  {selfServeOrigin}/api/registry                      prop schemas as JSON (global, not site-scoped)
```
The registry is a single global source of truth (same component set for all sites this
iteration). adminpanel fetches it from self-serve to auto-build forms; marketplace is not
involved in serving it.

---

## 10. Scope, coexistence & migration

**New-only.** The v2 recursive system serves *new* pages, starting with a **curated primitive component set**: `page`, `section`, `row`, `column`, `heading`, `text`, `image`, `button`, `spacer` (grow over time).

- Existing pages stay **frozen on the legacy flat renderer**, selected by `schemaVersion` (v1/absent → flat renderer; `2` → recursive renderer).
- **No converter, no porting** of the 182 legacy types this iteration.
- Same `builderpages` collection for both; the version field discriminates.
- **i18n is the one capability legacy pages DO gain** — the schema-agnostic overlay engine (§8) localizes v1 `blocks[].fields` too. Only *structure and components* are frozen; text can be translated on both v1 and v2 pages.
- Consequence: two renderers coexist in self-serve indefinitely until legacy pages are retired or rebuilt.

---

## 11. Storage changes summary (`salescodemarketplace`)

- **`builderpages`** — add `siteKey`, `schemaVersion`, `defaultLocale`, `tree`. Keep `blocks`/`theme` for legacy docs. Change index: drop `pageKey`-unique, add compound unique `{ siteKey: 1, pageKey: 1 }`. (`fields`/`style` already `Mixed` → tree stores as-is.)
- **`sites`** — new collection: `{ siteKey (unique), label, hosts[], previewUrl }`.
- **`translations`** — new collection: `{ siteKey, locale, strings }`, unique `{ siteKey, locale }`.

---

## 12. End-to-end data flow

```
AUTHOR (adminpanel)
  pick site (dropdown) ──▶ scope = siteKey
  edit chrome (tree/props/styles/translations)
  canvas = iframe → self-serve /preview  (postMessage live edits) ── WYSIWYG
  publish ──PUT /site/{siteKey}/builder/pages/{pageKey}──▶ marketplace

STORE (marketplace)
  builderpages { siteKey, pageKey, schemaVersion:2, defaultLocale, tree }
  translations { siteKey, locale, strings }
  sites        { siteKey, hosts, previewUrl }

VISITOR (self-serve, e.g. demo-experience.salescode.ai)
  read request host ──▶ resolve host→siteKey (sites registry)
  GET /site/{siteKey}/builder/pages/{pageKey}?locale=xx
    marketplace: load tree + overlay translations[locale] ──▶ localized tree
  recursive renderer: type→component, apply per-breakpoint styles, recurse children
  ──▶ published localized responsive page
```

---

## 13. Defaults chosen (not separately confirmed)

- Breakpoints: `base` desktop / `md ≤1024` / `sm ≤640`, desktop-first (max-width overrides).
- v2 lives in the **same** `builderpages` collection (discriminated by `schemaVersion`), not a new collection.
- Unknown host → 404.
- Translatable-prop key format: `pageKey.nodeId.propPath`.

---

## 14. Open items for the implementation plan

- Exact postMessage protocol for tree ops (message shapes, id references, batching).
- How self-serve caches the `host→siteKey` resolution and the prop-schema JSON (revalidate windows).
- Scoped-CSS injection mechanism in the renderer (generated `<style>` per page vs per-node) and SSR ordering.
- Garbage-collection of orphaned translation keys when nodes are deleted.
- Auth on the site-scoped write endpoints (currently `/site/*` has no auth — out of scope here but flagged).
- The curated component set's exact prop schemas (per-component design).
