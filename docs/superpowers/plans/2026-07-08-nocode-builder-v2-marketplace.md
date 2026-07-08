# No-Code Builder v2 — Plan 1: Marketplace (storage + APIs + i18n)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `salescodemarketplace` store and serve site-scoped, versioned page configs (legacy v1 flat blocks + new v2 recursive tree) with a Mongo-backed, locale-overlay i18n that works for both schemas.

**Architecture:** Extend the existing `builderpages` collection with `siteKey` / `schemaVersion` / `defaultLocale` / `tree` (all `Mixed`-friendly, no data-loss migration). Add two collections (`sites`, `translations`) and three decorator controllers (`/sites`, `/site/:siteKey/builder`, `/site/:siteKey/translations`). A pure, schema-agnostic overlay module localizes a page doc from a per-(site,locale) string bundle. Legacy unscoped routes keep working, mapped to a default site.

**Tech Stack:** Node + Express 4, Mongoose 8, TypeScript, `reflect-metadata` decorator routing (`@Controller` / `@Route` + `defineRoutes`), `ts-node`. Global `logging` object is available at runtime.

**Repo for every path in this plan:** `/Users/salescode/Desktop/Work/salescodemarketplace`

> **⚠️ REPRIORITIZED 2026-07-08 (user directive):** i18n for **old (v1) pages is priority one**, and **no old data may be migrated**. Therefore:
> - **Task 1's index change + `migrateBuilderPagesSiteKey` script are DEFERRED** (they belong to later multi-site work). Do **not** change the `builderpages` unique index and do **not** run any migration now.
> - Execution order is now: **(1) Task 4 Translation model → (2) Task 5 overlay engine → (3) legacy `/site/builder` `?locale` overlay + translations CRUD** (a trimmed, additive version of Task 8/Task 7 that leaves old create/store and the pageKey-only queries untouched, keyed by a `DEFAULT_SITE_KEY` constant defined in a new `src/config/site.ts`).
> - Site-scoped routes (Task 3, Task 6) and the siteKey field on `builderpages` come **after** legacy i18n, and will be done additively (new fields default; index change only when multi-site is actually needed).
> - Old and new page create/store must both keep working; new v2 create/store is added additively (a `tree` field) with no migration.

## Global Constraints

- **No test framework / no test files** in marketplace (user directive). Each task is verified manually via `curl` against a locally-running dev server (`npm run dev`, connects to your dev Mongo) or a throwaway `npx ts-node -e` eval. Never commit a test file.
- Follow existing conventions exactly: controllers are classes with `@Controller(base)` + `@Route(method, path)` methods `(req: Request, res: Response, _next: NextFunction)`, `try/catch` → `res.status(n).json(...)`, registered in `src/server.ts` via `defineRoutes([...])`.
- Default site constant value: `demo-experience` (the current live site). Default locale: `en`.
- Mongoose subdocs use `{ _id: false }`; page-level schemas use `{ timestamps: true, versionKey: false, minimize: false }`.
- Do not break the existing `/site/builder/*` routes — legacy adminpanel still calls them until Plan 3.

---

### Task 1: Extend `builderPage` model for multi-site + v2 + migrate

**Files:**
- Modify: `src/models/builderPage.ts`
- Create: `src/scripts/migrateBuilderPagesSiteKey.ts`
- Modify: `package.json` (add one script)

**Interfaces:**
- Produces: `DEFAULT_SITE_KEY` (const `'demo-experience'`), `IBuilderNode` (`{ id, type, props, styles, children }`), and an extended `BuilderPageModel` with fields `siteKey`, `schemaVersion?`, `defaultLocale`, `tree?`, plus a compound unique index `{ siteKey, pageKey }`.
- Consumes: nothing.

- [ ] **Step 1: Replace `src/models/builderPage.ts` with the extended schema**

```ts
import { Document, model, Schema } from 'mongoose';

// Legacy pages (schemaVersion absent/1) written before multi-site existed map to this site.
export const DEFAULT_SITE_KEY = 'demo-experience';

export interface IBuilderBlock {
  id: string;
  type: string;
  fields: Record<string, unknown>;
  style: Record<string, unknown>;
  order: number;
}

export interface IBuilderTheme {
  accentColor?: string;
  fontFamily?: string;
  [key: string]: unknown;
}

// v2 recursive node — fixed envelope, arbitrary nesting.
export interface IBuilderNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: Record<string, string>; // breakpoint key -> raw CSS text
  children: IBuilderNode[];
}

export interface IBuilderPage extends Document {
  siteKey: string;
  pageKey: string;
  schemaVersion?: number;         // 2 = v2 tree; absent/1 = legacy flat blocks
  defaultLocale: string;
  blocks: IBuilderBlock[];        // legacy
  theme: IBuilderTheme;           // legacy
  tree?: Record<string, unknown>; // v2 root node (stored as Mixed)
  createdAt: Date;
  updatedAt: Date;
}

const BuilderBlockSchema = new Schema<IBuilderBlock>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, default: {} },
    style: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false, minimize: false }
);

const BuilderThemeSchema = new Schema<IBuilderTheme>(
  {
    accentColor: { type: String },
    fontFamily: { type: String },
  },
  { _id: false, strict: false }
);

const BuilderPageSchema = new Schema<IBuilderPage>(
  {
    siteKey: { type: String, required: true, default: DEFAULT_SITE_KEY, index: true },
    pageKey: { type: String, required: true },
    schemaVersion: { type: Number },
    defaultLocale: { type: String, default: 'en' },
    blocks: { type: [BuilderBlockSchema], default: [] },
    theme: { type: BuilderThemeSchema, default: () => ({}) },
    tree: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

// Identity is now composite: a page key is unique PER SITE, not globally.
BuilderPageSchema.index({ siteKey: 1, pageKey: 1 }, { unique: true });

export const BuilderPageModel = model<IBuilderPage>('BuilderPage', BuilderPageSchema);
```

- [ ] **Step 2: Create the migration script `src/scripts/migrateBuilderPagesSiteKey.ts`**

```ts
import mongoose from 'mongoose';
import { MONGO } from '../config/config';
import { BuilderPageModel, DEFAULT_SITE_KEY } from '../models/builderPage';

// Backfills siteKey on pre-multi-site docs and swaps the unique index
// from pageKey_1 to the compound { siteKey, pageKey }.
async function run() {
  await mongoose.connect(MONGO.MONGO_CONNECTION, MONGO.MONGO_OPTIONS);

  const res = await BuilderPageModel.updateMany(
    { siteKey: { $exists: false } },
    { $set: { siteKey: DEFAULT_SITE_KEY, defaultLocale: 'en' } }
  );
  console.log('Backfilled siteKey on', res.modifiedCount, 'pages');

  try {
    await BuilderPageModel.collection.dropIndex('pageKey_1');
    console.log('Dropped legacy unique index pageKey_1');
  } catch (e) {
    console.log('Legacy index pageKey_1 not present, skipping');
  }

  await BuilderPageModel.syncIndexes();
  console.log('Indexes synced:', (await BuilderPageModel.collection.indexes()).map((i) => i.name));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Add the migration script to `package.json` `scripts`**

Add this line alongside the existing `cleanup:landing-products` / `check:experience-studio` scripts:

```json
"migrate:builder-sitekey": "ts-node src/scripts/migrateBuilderPagesSiteKey.ts",
```

- [ ] **Step 4: Run the migration against dev Mongo and verify**

Run: `npm run migrate:builder-sitekey`
Expected output (counts vary): lines like
```
Backfilled siteKey on <N> pages
Dropped legacy unique index pageKey_1   (or "not present, skipping")
Indexes synced: [ '_id_', 'siteKey_1', 'siteKey_1_pageKey_1' ]
```
The final index list MUST include `siteKey_1_pageKey_1` and MUST NOT include `pageKey_1`.

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/models/builderPage.ts src/scripts/migrateBuilderPagesSiteKey.ts package.json
git commit -m "feat(builder): site-scoped + v2-ready builderpages schema and migration"
```

---

### Task 2: `sites` model + seed

**Files:**
- Create: `src/models/site.ts`
- Create: `src/seeds/seedSites.ts`
- Modify: `src/server.ts` (import + call seed after Mongo connect)

**Interfaces:**
- Produces: `SiteModel` (`{ siteKey (unique), label, hosts: string[], previewUrl }`), `seedSites()`.
- Consumes: nothing.

- [ ] **Step 1: Create `src/models/site.ts`**

```ts
import { Document, model, Schema } from 'mongoose';

export interface ISite extends Document {
  siteKey: string;
  label: string;
  hosts: string[];
  previewUrl: string;
}

const SiteSchema = new Schema<ISite>(
  {
    siteKey: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: '' },
    hosts: { type: [String], default: [] },
    previewUrl: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

export const SiteModel = model<ISite>('Site', SiteSchema);
```

- [ ] **Step 2: Create `src/seeds/seedSites.ts`**

```ts
import { SiteModel } from '../models/site';

const SITES = [
  {
    siteKey: 'demo-experience',
    label: 'Demo Experience',
    hosts: ['demo-experience.salescode.ai'],
    previewUrl: 'https://demo-experience.salescode.ai',
  },
  {
    siteKey: 'products',
    label: 'Products',
    hosts: ['products.salescode.ai'],
    previewUrl: 'https://products.salescode.ai',
  },
];

// Upsert-only: never overwrites edits made to an existing site row.
export async function seedSites() {
  for (const s of SITES) {
    await SiteModel.updateOne({ siteKey: s.siteKey }, { $setOnInsert: s }, { upsert: true });
  }
  logging.info('Seeded sites');
}
```

- [ ] **Step 3: Wire `seedSites` into `src/server.ts`**

Add the import near the other seed imports (around line 48-49):

```ts
import { seedSites } from './seeds/seedSites';
```

In `Main()`, immediately after the existing `await seedExperienceStudioReference();` line (inside the Mongo-connect `try` block), add:

```ts
        await seedSites();
```

- [ ] **Step 4: Start the server and verify the seed ran**

Run: `npm run dev`
Expected: startup logs include `Seeded sites` and no Mongo errors. Leave it running for the next step.

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/models/site.ts src/seeds/seedSites.ts src/server.ts
git commit -m "feat(sites): add sites collection and seed for demo-experience + products"
```

---

### Task 3: `/sites` controller (list + resolve-by-host)

**Files:**
- Create: `src/controller/sitesController.ts`
- Modify: `src/server.ts` (import + register)

**Interfaces:**
- Produces: `GET /sites` → `{ sites: [{ siteKey, label, hosts, previewUrl }] }`; `GET /sites/resolve?host=<h>` → `{ site: { siteKey, previewUrl } }` (404 if unknown, 400 if host missing).
- Consumes: `SiteModel` (Task 2).

- [ ] **Step 1: Create `src/controller/sitesController.ts`**

```ts
import { NextFunction, Request, Response } from 'express';
import { Controller } from '../decorator/controller';
import { Route } from '../decorator/route';
import { SiteModel } from '../models/site';

@Controller('/sites')
class SitesController {
  @Route('get', '/')
  async list(_req: Request, res: Response, _next: NextFunction) {
    try {
      const sites = await SiteModel.find(
        {},
        { siteKey: 1, label: 1, hosts: 1, previewUrl: 1, _id: 0 }
      ).lean();
      return res.status(200).json({ sites });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('get', '/resolve')
  async resolve(req: Request, res: Response, _next: NextFunction) {
    try {
      const host = String(req.query.host || '').trim().toLowerCase();
      if (!host) return res.status(400).json({ error: 'host query param required' });
      const site = await SiteModel.findOne(
        { hosts: host },
        { siteKey: 1, previewUrl: 1, _id: 0 }
      ).lean();
      if (!site) return res.status(404).json({ error: 'No site for host', host });
      return res.status(200).json({ site });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default SitesController;
```

- [ ] **Step 2: Register in `src/server.ts`**

Add import near the other controller imports:

```ts
import SitesController from './controller/sitesController';
```

Add `SitesController,` to the `defineRoutes([...])` array (e.g. right after `BuilderPagesController,`).

- [ ] **Step 3: Restart `npm run dev` and verify both routes**

Run: `curl -s localhost:3000/sites`
(Replace `3000` with `SERVER_PORT` from your dev config if different.)
Expected: JSON containing both seeded sites, e.g.
```json
{"sites":[{"siteKey":"demo-experience","label":"Demo Experience","hosts":["demo-experience.salescode.ai"],"previewUrl":"https://demo-experience.salescode.ai"},{"siteKey":"products","label":"Products","hosts":["products.salescode.ai"],"previewUrl":"https://products.salescode.ai"}]}
```

Run: `curl -s "localhost:3000/sites/resolve?host=products.salescode.ai"`
Expected: `{"site":{"siteKey":"products","previewUrl":"https://products.salescode.ai"}}`

Run: `curl -s -o /dev/null -w "%{http_code}\n" "localhost:3000/sites/resolve?host=nope.example.com"`
Expected: `404`

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/sitesController.ts src/server.ts
git commit -m "feat(sites): GET /sites and GET /sites/resolve host lookup"
```

---

### Task 4: `translations` model

**Files:**
- Create: `src/models/translation.ts`

**Interfaces:**
- Produces: `TranslationModel` (`{ siteKey, locale, strings: Record<string,string> }`, unique `{ siteKey, locale }`).
- Consumes: nothing.

- [ ] **Step 1: Create `src/models/translation.ts`**

```ts
import { Document, model, Schema } from 'mongoose';

export interface ITranslation extends Document {
  siteKey: string;
  locale: string;
  strings: Record<string, string>; // key = `${pageKey}.${entityId}.${propPath}`
}

const TranslationSchema = new Schema<ITranslation>(
  {
    siteKey: { type: String, required: true },
    locale: { type: String, required: true },
    strings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

TranslationSchema.index({ siteKey: 1, locale: 1 }, { unique: true });

export const TranslationModel = model<ITranslation>('Translation', TranslationSchema);
```

- [ ] **Step 2: Verify the model compiles and the index name is right**

Run:
```bash
npx ts-node -e "import('./src/models/translation').then(m=>console.log('ok', m.TranslationModel.modelName))"
```
Expected: prints `ok Translation` with no TypeScript/compile errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/models/translation.ts
git commit -m "feat(i18n): add translations collection (per site+locale string bundle)"
```

---

### Task 5: i18n overlay engine (pure, schema-agnostic)

**Files:**
- Create: `src/modules/i18nOverlay.ts`

**Interfaces:**
- Produces: `overlayPageDoc(doc, strings) => doc'` — returns a new page doc with translatable string leaves replaced from `strings`. Handles v2 (`doc.tree` when `schemaVersion === 2`) and v1 (`doc.blocks[]`). Key format `${pageKey}.${entityId}.${propPath}`. Missing key → keep base.
- Consumes: nothing (pure).

- [ ] **Step 1: Create `src/modules/i18nOverlay.ts`**

```ts
type Strings = Record<string, string>;

// Recursively map every string leaf of `value`, calling visit(dotPath, str).
// dotPath is relative to the entity content root (props for v2, fields for v1).
function mapStringLeaves(
  value: unknown,
  path: string,
  visit: (dotPath: string, str: string) => string
): unknown {
  if (typeof value === 'string') return visit(path, value);
  if (Array.isArray(value)) {
    return value.map((v, i) => mapStringLeaves(v, path ? `${path}.${i}` : String(i), visit));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      out[k] = mapStringLeaves(
        (value as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
        visit
      );
    }
    return out;
  }
  return value;
}

function replacerFor(pageKey: string, entityId: string, strings: Strings) {
  return (dotPath: string, str: string): string => {
    const key = `${pageKey}.${entityId}.${dotPath}`;
    return Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : str;
  };
}

function overlayNode(node: any, pageKey: string, strings: Strings): any {
  if (!node || typeof node !== 'object') return node;
  const props =
    node.props !== undefined
      ? mapStringLeaves(node.props, '', replacerFor(pageKey, node.id, strings))
      : node.props;
  const children = Array.isArray(node.children)
    ? node.children.map((c: any) => overlayNode(c, pageKey, strings))
    : node.children;
  return { ...node, props, children };
}

// Returns a NEW page doc with translatable strings overlaid. No mutation.
export function overlayPageDoc(doc: any, strings: Strings): any {
  if (!doc || !strings || Object.keys(strings).length === 0) return doc;
  const pageKey = doc.pageKey;

  if (doc.schemaVersion === 2 && doc.tree) {
    return { ...doc, tree: overlayNode(doc.tree, pageKey, strings) };
  }

  if (Array.isArray(doc.blocks)) {
    const blocks = doc.blocks.map((b: any) => {
      const fields =
        b.fields !== undefined
          ? mapStringLeaves(b.fields, '', replacerFor(pageKey, b.id, strings))
          : b.fields;
      return { ...b, fields };
    });
    return { ...doc, blocks };
  }

  return doc;
}
```

- [ ] **Step 2: Verify both schemas overlay correctly (throwaway eval, no file committed)**

Run (v2 tree — nested prop replaced, missing key kept):
```bash
npx ts-node -e "const {overlayPageDoc}=require('./src/modules/i18nOverlay'); const d={pageKey:'landing',schemaVersion:2,tree:{id:'n1',type:'section',props:{},styles:{},children:[{id:'n2',type:'heading',props:{text:'Grow',sub:'keep'},styles:{},children:[]}]}}; console.log(JSON.stringify(overlayPageDoc(d,{'landing.n2.text':'Crece'}).tree.children[0].props));"
```
Expected: `{"text":"Crece","sub":"keep"}`

Run (v1 legacy blocks — array-nested field path):
```bash
npx ts-node -e "const {overlayPageDoc}=require('./src/modules/i18nOverlay'); const d={pageKey:'landing',blocks:[{id:'b1',type:'hero',fields:{headline:'Hi',items:[{title:'A'},{title:'B'}]}}]}; console.log(JSON.stringify(overlayPageDoc(d,{'landing.b1.headline':'Hola','landing.b1.items.1.title':'Bee'}).blocks[0].fields));"
```
Expected: `{"headline":"Hola","items":[{"title":"A"},{"title":"Bee"}]}`

- [ ] **Step 3: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/modules/i18nOverlay.ts
git commit -m "feat(i18n): schema-agnostic overlay engine for v1 blocks and v2 tree"
```

---

### Task 6: `/site/:siteKey/builder` controller (site-scoped pages + locale overlay)

**Files:**
- Create: `src/controller/siteBuilderPagesController.ts`
- Modify: `src/server.ts` (import + register)

**Interfaces:**
- Produces:
  - `GET  /site/:siteKey/builder/pages` → `{ pages: [{ pageKey, schemaVersion, updatedAt }] }`
  - `GET  /site/:siteKey/builder/pages/:pageKey?locale=xx` → `{ page }` (localized when `locale` given and ≠ `defaultLocale`; upserts an empty page if missing)
  - `PUT  /site/:siteKey/builder/pages/:pageKey` body `{ blocks?, theme?, tree?, schemaVersion?, defaultLocale? }` → `{ page }`
  - `DELETE /site/:siteKey/builder/pages/:pageKey` → `{ success: true }`
- Consumes: `BuilderPageModel` (Task 1), `TranslationModel` (Task 4), `overlayPageDoc` (Task 5).

- [ ] **Step 1: Create `src/controller/siteBuilderPagesController.ts`**

```ts
import { NextFunction, Request, Response } from 'express';
import { Controller } from '../decorator/controller';
import { Route } from '../decorator/route';
import { BuilderPageModel } from '../models/builderPage';
import { TranslationModel } from '../models/translation';
import { overlayPageDoc } from '../modules/i18nOverlay';

@Controller('/site/:siteKey/builder')
class SiteBuilderPagesController {
  @Route('get', '/pages')
  async listPages(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey } = req.params;
      const pages = await BuilderPageModel.find(
        { siteKey },
        { pageKey: 1, schemaVersion: 1, updatedAt: 1, _id: 0 }
      ).lean();
      return res.status(200).json({ pages });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('get', '/pages/:pageKey')
  async getPage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey, pageKey } = req.params;
      const locale = req.query.locale ? String(req.query.locale) : undefined;
      const page = await BuilderPageModel.findOneAndUpdate(
        { siteKey, pageKey },
        { $setOnInsert: { siteKey, pageKey, blocks: [], theme: {}, defaultLocale: 'en' } },
        { upsert: true, new: true, lean: true }
      );

      let out: any = page;
      if (locale && locale !== (page as any).defaultLocale) {
        const bundle = await TranslationModel.findOne(
          { siteKey, locale },
          { strings: 1, _id: 0 }
        ).lean();
        if (bundle && (bundle as any).strings) {
          out = overlayPageDoc(page, (bundle as any).strings);
        }
      }
      return res.status(200).json({ page: out });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('put', '/pages/:pageKey')
  async updatePage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey, pageKey } = req.params;
      const { blocks, theme, tree, schemaVersion, defaultLocale } = req.body as {
        blocks?: unknown[];
        theme?: unknown;
        tree?: unknown;
        schemaVersion?: number;
        defaultLocale?: string;
      };
      const update: Record<string, unknown> = {};
      if (blocks !== undefined) update.blocks = blocks;
      if (theme !== undefined) update.theme = theme;
      if (tree !== undefined) update.tree = tree;
      if (schemaVersion !== undefined) update.schemaVersion = schemaVersion;
      if (defaultLocale !== undefined) update.defaultLocale = defaultLocale;

      const page = await BuilderPageModel.findOneAndUpdate(
        { siteKey, pageKey },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ page });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('delete', '/pages/:pageKey')
  async deletePage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey, pageKey } = req.params;
      await BuilderPageModel.deleteOne({ siteKey, pageKey });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default SiteBuilderPagesController;
```

- [ ] **Step 2: Register in `src/server.ts`**

Add import:
```ts
import SiteBuilderPagesController from './controller/siteBuilderPagesController';
```
Add `SiteBuilderPagesController,` to the `defineRoutes([...])` array.

- [ ] **Step 3: Restart `npm run dev`; write a v2 page and read it back**

Write a v2 tree page:
```bash
curl -s -X PUT localhost:3000/site/products/builder/pages/landing \
  -H 'Content-Type: application/json' \
  -d '{"schemaVersion":2,"defaultLocale":"en","tree":{"id":"n1","type":"section","props":{},"styles":{},"children":[{"id":"n2","type":"heading","props":{"text":"Grow your sales"},"styles":{},"children":[]}]}}'
```
Expected: `{"page":{...,"siteKey":"products","pageKey":"landing","schemaVersion":2,...}}`

Read base (no locale):
```bash
curl -s localhost:3000/site/products/builder/pages/landing
```
Expected: `page.tree.children[0].props.text` == `"Grow your sales"`.

- [ ] **Step 4: Verify site isolation**

Run: `curl -s localhost:3000/site/demo-experience/builder/pages/landing`
Expected: a DIFFERENT document from `products/landing` (empty/`blocks:[]` unless demo has its own), proving `{siteKey,pageKey}` scoping works.

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/siteBuilderPagesController.ts src/server.ts
git commit -m "feat(builder): site-scoped page CRUD with locale overlay"
```

---

### Task 7: `/site/:siteKey/translations` controller + end-to-end i18n check

**Files:**
- Create: `src/controller/siteTranslationsController.ts`
- Modify: `src/server.ts` (import + register)

**Interfaces:**
- Produces:
  - `GET /site/:siteKey/translations/:locale` → `{ translation: { siteKey, locale, strings } }` (empty bundle if none)
  - `PUT /site/:siteKey/translations/:locale` body `{ strings }` → `{ translation }`
- Consumes: `TranslationModel` (Task 4); relies on Task 6's localized GET for the end-to-end check.

- [ ] **Step 1: Create `src/controller/siteTranslationsController.ts`**

```ts
import { NextFunction, Request, Response } from 'express';
import { Controller } from '../decorator/controller';
import { Route } from '../decorator/route';
import { TranslationModel } from '../models/translation';

@Controller('/site/:siteKey/translations')
class SiteTranslationsController {
  @Route('get', '/:locale')
  async get(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey, locale } = req.params;
      const bundle = await TranslationModel.findOne(
        { siteKey, locale },
        { siteKey: 1, locale: 1, strings: 1, _id: 0 }
      ).lean();
      return res
        .status(200)
        .json({ translation: bundle || { siteKey, locale, strings: {} } });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('put', '/:locale')
  async put(req: Request, res: Response, _next: NextFunction) {
    try {
      const { siteKey, locale } = req.params;
      const { strings } = req.body as { strings?: Record<string, string> };
      const translation = await TranslationModel.findOneAndUpdate(
        { siteKey, locale },
        { $set: { strings: strings || {} } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ translation });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default SiteTranslationsController;
```

- [ ] **Step 2: Register in `src/server.ts`**

Add import:
```ts
import SiteTranslationsController from './controller/siteTranslationsController';
```
Add `SiteTranslationsController,` to the `defineRoutes([...])` array.

- [ ] **Step 3: Restart `npm run dev`; save a Spanish bundle for the v2 page from Task 6**

```bash
curl -s -X PUT localhost:3000/site/products/translations/es \
  -H 'Content-Type: application/json' \
  -d '{"strings":{"landing.n2.text":"Crece tus ventas"}}'
```
Expected: `{"translation":{...,"locale":"es","strings":{"landing.n2.text":"Crece tus ventas"}}}`

- [ ] **Step 4: Verify the localized read (end-to-end i18n on a v2 page)**

Run: `curl -s "localhost:3000/site/products/builder/pages/landing?locale=es"`
Expected: `page.tree.children[0].props.text` == `"Crece tus ventas"`.

Run base again: `curl -s localhost:3000/site/products/builder/pages/landing`
Expected: still `"Grow your sales"` (base unchanged; overlay is read-only).

- [ ] **Step 5: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/siteTranslationsController.ts src/server.ts
git commit -m "feat(i18n): translations CRUD + end-to-end locale overlay on v2 pages"
```

---

### Task 8: Backward-compat legacy `/site/builder/*` + i18n for legacy pages

**Files:**
- Modify: `src/controller/builderPagesController.ts`

**Interfaces:**
- Produces: legacy `/site/builder/*` routes now operate on the `DEFAULT_SITE_KEY` document set, and `GET /site/builder/pages/:pageKey?locale=xx` overlays translations (i18n for legacy pages).
- Consumes: `BuilderPageModel` + `DEFAULT_SITE_KEY` (Task 1), `TranslationModel` (Task 4), `overlayPageDoc` (Task 5).

- [ ] **Step 1: Replace `src/controller/builderPagesController.ts`**

```ts
import { NextFunction, Request, Response } from 'express';
import { Controller } from '../decorator/controller';
import { Route } from '../decorator/route';
import { BuilderPageModel, DEFAULT_SITE_KEY } from '../models/builderPage';
import { TranslationModel } from '../models/translation';
import { overlayPageDoc } from '../modules/i18nOverlay';

// Legacy unscoped routes. Kept working for the current adminpanel; all operations
// are pinned to DEFAULT_SITE_KEY so they stay consistent with the compound index.
@Controller('/site/builder')
class BuilderPagesController {
  @Route('get', '/pages')
  async listPages(_req: Request, res: Response, _next: NextFunction) {
    try {
      const pages = await BuilderPageModel.find(
        { siteKey: DEFAULT_SITE_KEY },
        { pageKey: 1, updatedAt: 1, _id: 0 }
      ).lean();
      return res.status(200).json({ pages });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('get', '/pages/:pageKey')
  async getPage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      const locale = req.query.locale ? String(req.query.locale) : undefined;
      const page = await BuilderPageModel.findOneAndUpdate(
        { siteKey: DEFAULT_SITE_KEY, pageKey },
        { $setOnInsert: { siteKey: DEFAULT_SITE_KEY, pageKey, blocks: [], theme: {}, defaultLocale: 'en' } },
        { upsert: true, new: true, lean: true }
      );

      let out: any = page;
      if (locale && locale !== (page as any).defaultLocale) {
        const bundle = await TranslationModel.findOne(
          { siteKey: DEFAULT_SITE_KEY, locale },
          { strings: 1, _id: 0 }
        ).lean();
        if (bundle && (bundle as any).strings) {
          out = overlayPageDoc(page, (bundle as any).strings);
        }
      }
      return res.status(200).json({ page: out });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('put', '/pages/:pageKey')
  async updatePage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      const { blocks, theme } = req.body as { blocks?: unknown[]; theme?: unknown };
      const update: Record<string, unknown> = {};
      if (blocks !== undefined) update.blocks = blocks;
      if (theme !== undefined) update.theme = theme;
      const page = await BuilderPageModel.findOneAndUpdate(
        { siteKey: DEFAULT_SITE_KEY, pageKey },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ page });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Route('delete', '/pages/:pageKey')
  async deletePage(req: Request, res: Response, _next: NextFunction) {
    try {
      const { pageKey } = req.params;
      await BuilderPageModel.deleteOne({ siteKey: DEFAULT_SITE_KEY, pageKey });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default BuilderPagesController;
```

- [ ] **Step 2: Restart `npm run dev`; verify legacy route still reads/writes**

Write via legacy route:
```bash
curl -s -X PUT localhost:3000/site/builder/pages/legacydemo \
  -H 'Content-Type: application/json' \
  -d '{"blocks":[{"id":"b1","type":"hero-split","order":0,"fields":{"headline":"Hi"},"style":{}}],"theme":{}}'
```
Expected: `page.siteKey` == `"demo-experience"`, `page.blocks[0].fields.headline` == `"Hi"`.

- [ ] **Step 3: Verify i18n overlay works on a LEGACY (v1) page**

Save a legacy bundle then read localized:
```bash
curl -s -X PUT localhost:3000/site/demo-experience/translations/es \
  -H 'Content-Type: application/json' \
  -d '{"strings":{"legacydemo.b1.headline":"Hola"}}'
curl -s "localhost:3000/site/builder/pages/legacydemo?locale=es"
```
Expected: `page.blocks[0].fields.headline` == `"Hola"` (legacy page localized via the same overlay engine).

- [ ] **Step 4: Commit**

```bash
cd /Users/salescode/Desktop/Work/salescodemarketplace
git add src/controller/builderPagesController.ts
git commit -m "feat(builder): pin legacy routes to default site + i18n overlay for v1 pages"
```

---

## Self-Review

**Spec coverage (Plan 1 = marketplace slice of the spec):**
- §3 page document (`siteKey`, `schemaVersion`, `defaultLocale`, `tree`) → Task 1. ✅
- §8 i18n overlay (schema-agnostic, both v1 + v2), translations store → Tasks 4, 5, 7, 8. ✅
- §9 multi-site (`sites` registry, host→siteKey resolve, site-scoped endpoints) → Tasks 2, 3, 6. ✅
- §11 storage changes (`builderpages` fields + compound index, `sites`, `translations`) → Tasks 1, 2, 4. ✅
- §7 endpoints (marketplace rows of the table) → Tasks 3, 6, 7. ✅ (`/api/registry` is self-serve — Plan 2, not here.)
- §10 legacy coexistence + legacy i18n → Tasks 1, 8. ✅
- **Out of scope for Plan 1 (deferred):** recursive renderer, registry + prop-schema JSON, per-breakpoint CSS, editor chrome, iframe/postMessage, site selector, self-serve host resolution, machine-seed translations. These belong to Plan 2 (self-serve) and Plan 3 (adminpanel).

**Placeholder scan:** No TBD/TODO; every step has concrete code or an exact command with expected output. ✅

**Type consistency:** `overlayPageDoc(doc, strings)` signature identical in Tasks 5, 6, 8. `DEFAULT_SITE_KEY` defined in Task 1, imported in Tasks 2/8. `TranslationModel.strings`, `BuilderPageModel` fields, and route shapes match across tasks. ✅

**Note for the executor:** curl examples use port `3000`; substitute your dev `SERVER_PORT`. All curls hit your **dev** Mongo (there is no test DB) — do not run against production.
