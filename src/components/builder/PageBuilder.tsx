import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Undo2, Redo2, Plus, Eye, EyeOff, Trash2, GripVertical, Copy, Clipboard,
  X, Palette, Play, FileText, ChevronLeft, PenLine, Paintbrush, Settings, Layers, Globe, Search,
  LogOut, History, RotateCcw, Monitor, Smartphone,
} from "lucide-react";
import { defaultBlock } from "./blocks";
import { SiteUrlManager } from "./SiteUrlManager";
import { isRichDoc, type RichDoc } from "./rich-text";
import { syncRichContent, pickTextPatch } from "./rich-sync";
import { AddSectionDrawer } from "./AddSectionDrawer";
import { ContentEditor } from "./ContentEditor";
import { StyleEditor } from "./StyleEditor";
import { ThemePanel } from "./ThemePanel";
import { PreviewModal } from "./PreviewModal";
import { WidgetPicker } from "./WidgetPicker";
import { BlogPanel, type BlogPost } from "./BlogPanel";
import { BlogPostEditor } from "./BlogPostEditor";
import { defaultWidget, WIDGET_REGISTRY, type Widget, type WidgetType } from "./widgets";
import { WidgetEditor } from "./WidgetEditor";
import {
  BLOCK_LABELS, DEFAULT_THEME,
  type Block, type BlockStyle, type BlockType, type LayoutVariant, type Page, type Theme,
} from "./types";
import { getMyDraft, saveMyDraft, authJsonHeaders } from "@/lib/builder-drafts";
import { getAuth } from "@/lib/auth";

// Recursively find a widget by id in a widget array (handles row nesting)
function findWidgetInArray(widgets: Widget[], id: string): Widget | null {
  for (const w of widgets) {
    if (w.id === id) return w;
    if (w.type === "row") {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      for (const col of cols) {
        const found = findWidgetInArray(col, id);
        if (found) return found;
      }
    }
  }
  return null;
}

function findWidgetById(blocks: Block[], id: string): Widget | null {
  for (const b of blocks) {
    const f = b.fields as Record<string, unknown>;
    const bw = findWidgetInArray((f.widgets as Widget[]) ?? [], id);
    if (bw) return bw;
    const cols = (f.columns as Widget[][]) ?? [];
    for (const col of cols) {
      const cw = findWidgetInArray(col, id);
      if (cw) return cw;
    }
  }
  return null;
}

// Recursively update widget props in a widget array
function updateWidgetInArray(widgets: Widget[], id: string, props: Record<string, unknown>): { arr: Widget[]; changed: boolean } {
  let changed = false;
  const arr = widgets.map((w) => {
    if (w.id === id) { changed = true; return { ...w, props }; }
    if (w.type === "row") {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      let innerChanged = false;
      const newCols = cols.map((col) => {
        const res = updateWidgetInArray(col, id, props);
        if (res.changed) innerChanged = true;
        return res.arr;
      });
      if (innerChanged) { changed = true; return { ...w, props: { ...w.props, cols: newCols } }; }
    }
    return w;
  });
  return { arr, changed };
}

function deleteWidgetFromArray(widgets: Widget[], id: string): { arr: Widget[]; changed: boolean } {
  let changed = false;
  const arr: Widget[] = [];
  for (const w of widgets) {
    if (w.id === id) { changed = true; continue; }
    if (w.type === 'row') {
      const cols = (w.props as { cols?: Widget[][] }).cols ?? [];
      let innerChanged = false;
      const newCols = cols.map((col) => {
        const res = deleteWidgetFromArray(col, id);
        if (res.changed) innerChanged = true;
        return res.arr;
      });
      if (innerChanged) { changed = true; arr.push({ ...w, props: { ...w.props, cols: newCols } }); continue; }
    }
    arr.push(w);
  }
  return { arr, changed };
}

function deleteWidgetFromBlocks(blocks: Block[], widgetId: string): Block[] {
  return blocks.map((b) => {
    const f = b.fields as Record<string, unknown>;
    const bwRes = deleteWidgetFromArray((f.widgets as Widget[]) ?? [], widgetId);
    if (bwRes.changed) return { ...b, fields: { ...f, widgets: bwRes.arr } };
    const cols = (f.columns as Widget[][]) ?? [];
    let colChanged = false;
    const newCols = cols.map((col) => {
      const res = deleteWidgetFromArray(col, widgetId);
      if (res.changed) colChanged = true;
      return res.arr;
    });
    if (colChanged) return { ...b, fields: { ...f, columns: newCols } };
    return b;
  });
}

function updateWidgetInBlocks(blocks: Block[], widgetId: string, props: Record<string, unknown>): Block[] {
  return blocks.map((b) => {
    const f = b.fields as Record<string, unknown>;
    // Check block.fields.widgets
    const bwRes = updateWidgetInArray((f.widgets as Widget[]) ?? [], widgetId, props);
    if (bwRes.changed) return { ...b, fields: { ...f, widgets: bwRes.arr } };
    // Check layout columns
    const cols = (f.columns as Widget[][]) ?? [];
    let colChanged = false;
    const newCols = cols.map((col) => {
      const res = updateWidgetInArray(col, widgetId, props);
      if (res.changed) colChanged = true;
      return res.arr;
    });
    if (colChanged) return { ...b, fields: { ...f, columns: newCols } };
    return b;
  });
}

const INITIAL_PAGES: Page[] = [
  { id: "landing", name: "Landing", slug: "/",        title: "Landing Page", hostnames: [] },
  { id: "about",   name: "About",   slug: "/about",   title: "About Us",     hostnames: [] },
  { id: "pricing", name: "Pricing", slug: "/pricing", title: "Pricing",      hostnames: [] },
  { id: "contact", name: "Contact", slug: "/contact", title: "Contact",      hostnames: [] },
];

const seedLanding = (): Block[] =>
  (["nav-simple", "hero-centered", "features-3col", "cta-banner", "footer-simple"] as BlockType[])
    .map((t, i) => defaultBlock(t, i));

type Device = "desktop" | "mobile";

// Per-page block variants — mobile: null = never materialized (desktop serves everyone)
interface PageVariants {
  desktop: Block[];
  mobile: Block[] | null;
}

// Per-page theme variants — mirrors PageVariants; mobile: null = never materialized
interface ThemeVariants {
  desktop: Theme;
  mobile: Theme | null;
}

// Fallback for pages whose themes haven't been loaded yet — never mutated (copy-on-write)
const DEFAULT_THEME_VARIANTS: ThemeVariants = { desktop: DEFAULT_THEME, mobile: null };

interface BuilderState {
  pages: Page[];
  pageBlocks: Record<string, PageVariants>;
}

// One row in the version-history panel (metadata only; blocks fetched on demand).
interface PageVersionSummary {
  _id: string;
  savedBy?: string;
  note?: string;
  createdAt: string;
  blockCount: number;
}

// Stable serialization of a page's editable state (blocks + theme), used to tell
// whether the live editor differs from the last saved/loaded state (the tab-close
// prompt fires only when they differ).
// Full-page snapshot (both variants + both themes) used to tell whether the live
// editor differs from the last saved/loaded state. Serializing the WHOLE page (not
// just the active device) keeps the tab-close prompt correct across device switches.
function serializeSaved(entry: PageVariants, themes: ThemeVariants): string {
  return JSON.stringify({ d: entry.desktop, m: entry.mobile, td: themes.desktop, tm: themes.mobile });
}

const INITIAL_STATE: BuilderState = {
  pages: INITIAL_PAGES,
  pageBlocks: {
    landing: { desktop: seedLanding(), mobile: null },
    about:   { desktop: [], mobile: null },
    pricing: { desktop: [], mobile: null },
    contact: { desktop: [], mobile: null },
  },
};

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

// Edit-lock identity: a stable random id per browser (owns the lock) + the
// display name entered at login (shown as "X is editing this page").
function getEditor(): { id: string; name: string } {
  let id = localStorage.getItem("pb_editor_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("pb_editor_id", id); }
  const name = localStorage.getItem("pb_editor_name") || "Editor";
  return { id, name };
}

// Domain that the publish OTP may be emailed to. Enforced again server-side.
const OTP_EMAIL_DOMAIN = "salescode.ai";

// The email to send the publish OTP to WITHOUT prompting — only for a real SSO
// session. The credential fallback (`token === "local-dev"`) is treated as
// "not SSO", so the user is asked to enter/confirm an address.
function ssoEmail(): string | null {
  const a = getAuth();
  return a?.email && a.token && a.token !== "local-dev" ? a.email : null;
}

function isValidOtpEmail(email: string): boolean {
  return new RegExp(`^[^@\\s]+@${OTP_EMAIL_DOMAIN.replace(".", "\\.")}$`).test(email.trim().toLowerCase());
}

// Normalize a theme payload — backend may have old field names from a previous editor
function normalizeTheme(rawTheme: unknown): Theme {
  const raw = rawTheme as Record<string, unknown>;
  const normalized: Partial<Theme> = {
    accent:       (raw.accent      ?? raw.accentColor) as string | undefined,
    pageBg:       (raw.pageBg      ?? raw.backgroundColor) as string | undefined,
    bodyFont:     (raw.bodyFont    ?? raw.fontFamily) as string | undefined,
    headingFont:  (raw.headingFont ?? raw.fontFamily) as string | undefined,
    baseFontSize: (raw.baseFontSize) as number | undefined,
    radius:       (raw.radius) as number | undefined,
    buttonStyle:  (raw.buttonStyle) as Theme['buttonStyle'] | undefined,
  };
  return { ...DEFAULT_THEME, ...Object.fromEntries(Object.entries(normalized).filter(([, v]) => v != null)) };
}

interface PagePayload {
  blocks?: Block[];
  mobileBlocks?: Block[];
  theme?: Theme;
  mobileTheme?: Theme;
  updatedAt?: string;
}

// Split a backend page payload into desktop/mobile variants (null = not materialized)
function parsePagePayload(page: PagePayload | undefined) {
  return {
    desktop: (page?.blocks ?? []) as Block[],
    mobile: (page?.mobileBlocks ?? null) as Block[] | null,
    theme: page?.theme && Object.keys(page.theme).length ? normalizeTheme(page.theme) : null,
    mobileTheme: page?.mobileTheme && Object.keys(page.mobileTheme).length ? normalizeTheme(page.mobileTheme) : null,
  };
}

export function PageBuilder() {
  // Undo/redo history — stack + index kept in a SINGLE state object so they can
  // never desync. (Previously these were two separate useState values updated in
  // commit(); because setHistory used the stale closure `histIdx` while setHistIdx
  // used a functional update, two commits in quick succession — e.g. StrictMode
  // double-invoking the bootstrap effect — pushed the index past the stack length,
  // leaving state undefined and wiping loaded pages back to defaults.)
  const [hist, setHist] = useState<{ stack: BuilderState[]; idx: number }>({
    stack: [INITIAL_STATE],
    idx: 0,
  });
  const state = hist.stack[hist.idx] ?? INITIAL_STATE;
  const { pages, pageBlocks } = state;

  const commit = useCallback((next: BuilderState) => {
    setHist(({ stack, idx }) => {
      const trimmed = stack.slice(0, idx + 1);
      trimmed.push(next);
      // cap history to 50 entries
      const overflow = Math.max(0, trimmed.length - 50);
      const newStack = trimmed.slice(overflow);
      return { stack: newStack, idx: newStack.length - 1 };
    });
  }, []);

  const [activePage, setActivePage] = useState<string>("landing");
  const [pageSearch, setPageSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPageHostnames, setEditingPageHostnames] = useState<string | null>(null);
  const [addAtIndex, setAddAtIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [clipboardBlock, setClipboardBlock] = useState<Block | null>(() => {
    try { const s = localStorage.getItem('pb_clipboard'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  // Per-page, per-device themes — deliberately NOT part of undo history (same as the
  // old themeByDevice). Keyed by pageKey so loading/publishing one page can never
  // pick up another page's theme (previously theme state was global, so a cached
  // page silently reused whatever theme was last fetched).
  const [themesByPage, setThemesByPage] = useState<Record<string, ThemeVariants>>({});
  // Which variant is being edited — deliberately NOT part of undo history (like activePage)
  const [device, setDevice] = useState<Device>("desktop");
  const [themeOpen, setThemeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<null | "pages" | "sections" | "urls">(null);

  // Push a history entry when preview opens so pressing Back closes it
  useEffect(() => {
    if (previewOpen) {
      window.history.pushState({ preview: true }, '');
    }
  }, [previewOpen]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.preview) {
        // going forward into preview — ignore
        return;
      }
      // Back was pressed — close the modal instead of navigating
      setPreviewOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);

  // Widget selection state
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [widgetTab, setWidgetTab] = useState<"content" | "style">("content");

  // Nested item focus (click on a specific item inside a slick block)
  const [focusedNestedItem, setFocusedNestedItem] = useState<{ blockId: string; itemKey: string; itemIndex: number } | null>(null);

  // ── Edit-lock (soft TTL lease) ──
  // lockedBy = name of another editor currently holding this page (null = free / mine).
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  // updatedAt (per pageKey) as of the last time this client loaded/saved that page —
  // used to detect if someone else has saved since, even after the lock has been released.
  const [pageUpdatedAt, setPageUpdatedAt] = useState<Record<string, string>>({});
  // Save conflict: someone else's newer save was detected when we tried to publish.
  const [saveConflict, setSaveConflict] = useState<{ pageKey: string; updatedAt: string; updatedBy?: string } | null>(null);
  const heldByMe = useRef(false);
  const activePageRef = useRef(activePage);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);

  // Unsaved-changes tracking for the tab-close prompt. `savedBaselineRef` holds a
  // serialized snapshot of each page's last SAVED/LOADED state; `liveSnapshotRef`
  // mirrors the live page state so the beforeunload handler can compare synchronously.
  const savedBaselineRef = useRef<Record<string, string>>({});
  const liveSnapshotRef = useRef<string>("");

  const acquireLock = useCallback(async (pageKey: string, force = false): Promise<boolean> => {
    const { id, name } = getEditor();
    try {
      const res = await fetch(`${BACKEND}/site/builder/pages/${pageKey}/lock`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ editorId: id, editorName: name, force }),
      });
      if (res.status === 409) {
        const d = await res.json().catch(() => ({}));
        heldByMe.current = false;
        setLockedBy(d.lockedBy || "another editor");
        return false;
      }
      if (res.ok) { heldByMe.current = true; setLockedBy(null); return true; }
    } catch { /* offline — treat as held to avoid false "locked" banner */ }
    heldByMe.current = true;
    setLockedBy(null);
    return true;
  }, []);

  // ── OTP-gated publish ──
  // Publishing requires a 6-digit OTP emailed to the editor. SSO users get it
  // sent straight to their address; everyone else enters an @salescode.ai email
  // (re-validated server-side). The page is staged server-side on request and
  // only written once the OTP is verified. The staged `body` mirrors the direct
  // publish payload (desktop + optional mobile variants) so the server applies
  // exactly what the editor sees.
  const [publishOtp, setPublishOtp] = useState<{
    pageKey: string;
    body: Record<string, unknown>;
    entry: PageVariants;
    themes: ThemeVariants;
    step: "email" | "otp";
    email: string;
    emailFromSso: boolean;
    sessionId?: string;
    sentTo?: string;
    submitting: boolean;
    error?: string;
  } | null>(null);
  const [otpInput, setOtpInput] = useState("");

  // Post-publish bookkeeping shared by the OTP verify success path.
  const applyPublishSuccess = useCallback(
    (pageKey: string, entry: PageVariants, themes: ThemeVariants, page: any) => {
      if (page?.updatedAt) setPageUpdatedAt((m) => ({ ...m, [pageKey]: page.updatedAt as string }));
      setSaveConflict(null);
      // Page is now saved — this state is the new "clean" baseline.
      savedBaselineRef.current[pageKey] = serializeSaved(entry, themes);
      toast.success("Page published successfully");
    },
    [],
  );

  // Step 1 — stage the publish and email an OTP. Shared by the SSO fast-path,
  // the email-entry submit, and the "Resend" action. `staged.body` is the full
  // publish payload (desktop + optional mobile variants) built in publishPage.
  const requestPublishOtp = useCallback(
    async (staged: { pageKey: string; body: Record<string, unknown> }, email: string) => {
      setPublishOtp((s) => (s ? { ...s, submitting: true, error: undefined } : s));
      try {
        const res = await fetch(`${BACKEND}/site/builder/otp/request`, {
          method: "POST",
          headers: authJsonHeaders(),
          body: JSON.stringify({ ...staged.body, pageKey: staged.pageKey, email }),
        });
        const d = await res.json().catch(() => ({} as any));
        if (res.status === 423) {
          setLockedBy(d.lockedBy || "another editor");
          heldByMe.current = false;
          setPublishOtp(null);
          toast.error(`Locked by ${d.lockedBy || "another editor"} — can't publish.`);
          return;
        }
        if (res.status === 409) {
          setSaveConflict({ pageKey: staged.pageKey, updatedAt: d.updatedAt, updatedBy: d.updatedBy });
          setPublishOtp(null);
          return;
        }
        if (!res.ok) {
          setPublishOtp((s) => (s ? { ...s, submitting: false, error: d.error || `Couldn't send OTP (${res.status})` } : s));
          return;
        }
        setOtpInput("");
        setPublishOtp((s) =>
          s ? { ...s, step: "otp", email, sessionId: d.sessionId, sentTo: d.sentTo, submitting: false, error: undefined } : s,
        );
        toast.success(`OTP sent to ${d.sentTo || email}`);
      } catch {
        setPublishOtp((s) => (s ? { ...s, submitting: false, error: "Couldn't send OTP — is the backend running?" } : s));
      }
    },
    [],
  );

  // Entry point wired to the Publish button. Builds the publish payload from the
  // current desktop/mobile variants, then opens the OTP flow instead of writing.
  const publishPage = useCallback(
    (pageKey: string) => {
      const { id, name } = getEditor();
      const entry = pageBlocks[pageKey] ?? { desktop: [], mobile: null };
      const themes = themesByPage[pageKey] ?? DEFAULT_THEME_VARIANTS;
      const pageMeta = pages.find((p) => p.id === pageKey);
      const hostnames = pageMeta?.hostnames ?? [];
      const body: Record<string, unknown> = {
        blocks: entry.desktop, theme: themes.desktop, hostnames, editorId: id, editorName: name,
        lastKnownUpdatedAt: pageUpdatedAt[pageKey],
      };
      // CMS URL (bucket + slug) — publishing a page also saves its route.
      if (pageMeta?.bucketId !== undefined) body.bucketId = pageMeta.bucketId;
      if (pageMeta?.urlSlug !== undefined) body.slug = pageMeta.urlSlug;
      // Mobile variant is included only once materialized locally — omission preserves server state
      if (entry.mobile !== null) {
        body.mobileBlocks = entry.mobile;
        if (themes.mobile !== null) body.mobileTheme = themes.mobile;
      }
      const staged = { pageKey, body, entry, themes };
      const sso = ssoEmail();
      if (sso) {
        setPublishOtp({ ...staged, step: "otp", email: sso, emailFromSso: true, submitting: true });
        void requestPublishOtp({ pageKey, body }, sso);
      } else {
        setPublishOtp({ ...staged, step: "email", email: getAuth()?.email ?? "", emailFromSso: false, submitting: false });
      }
    },
    [requestPublishOtp, pageBlocks, themesByPage, pages, pageUpdatedAt],
  );

  // Step 2 — verify the OTP; the server applies the staged publish on success.
  const verifyPublishOtp = useCallback(async () => {
    setPublishOtp((cur) => {
      if (!cur?.sessionId) return cur;
      const code = otpInput.trim();
      if (!/^\d{6}$/.test(code)) return { ...cur, error: "Enter the 6-digit code" };
      // Fire the request; state transitions happen in the async block below.
      void (async () => {
        try {
          const res = await fetch(`${BACKEND}/site/builder/otp/verify`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify({ sessionId: cur.sessionId, otp: code }),
          });
          const d = await res.json().catch(() => ({} as any));
          if (res.ok && d.ok) {
            applyPublishSuccess(cur.pageKey, cur.entry, cur.themes, d.page);
            setPublishOtp(null);
            setOtpInput("");
            return;
          }
          if (res.status === 400 && typeof d.attemptsRemaining === "number") {
            setPublishOtp((s) => (s ? { ...s, submitting: false, error: `Invalid OTP — ${d.attemptsRemaining} attempt(s) left` } : s));
            return;
          }
          if (res.status === 410) {
            setPublishOtp((s) => (s ? { ...s, submitting: false, sessionId: undefined, error: "OTP expired — request a new one" } : s));
            return;
          }
          if (res.status === 423 && d.lockedBy) {
            setLockedBy(d.lockedBy);
            heldByMe.current = false;
            setPublishOtp(null);
            toast.error(`Locked by ${d.lockedBy} — can't publish.`);
            return;
          }
          if (res.status === 423) {
            setPublishOtp(null);
            setOtpInput("");
            toast.error(d.error || "Too many attempts — request a new OTP.");
            return;
          }
          if (res.status === 409) {
            setSaveConflict({ pageKey: cur.pageKey, updatedAt: d.updatedAt, updatedBy: d.updatedBy });
            setPublishOtp(null);
            return;
          }
          setPublishOtp((s) => (s ? { ...s, submitting: false, error: d.error || `Verify failed (${res.status})` } : s));
        } catch {
          setPublishOtp((s) => (s ? { ...s, submitting: false, error: "Verify failed — is the backend running?" } : s));
        }
      })();
      return { ...cur, submitting: true, error: undefined };
    });
  }, [otpInput, applyPublishSuccess]);

  // Email-entry submit (non-SSO path): validate the domain, then request an OTP.
  const submitPublishEmail = useCallback(() => {
    setPublishOtp((cur) => {
      if (!cur) return cur;
      const email = cur.email.trim().toLowerCase();
      if (!isValidOtpEmail(email)) return { ...cur, error: `Enter a valid @${OTP_EMAIL_DOMAIN} email` };
      void requestPublishOtp({ pageKey: cur.pageKey, body: cur.body }, email);
      return { ...cur, email, submitting: true, error: undefined };
    });
  }, [requestPublishOtp]);

  const reloadActivePage = useCallback(async (pageKey: string) => {
    try {
      const res = await fetch(`${BACKEND}/site/builder/pages/${pageKey}`);
      const { page } = await res.json();
      const parsed = parsePagePayload(page);
      // Replaces BOTH variants with server state — a local unseeded mobile copy is
      // discarded, which is the correct "discard local changes" semantics here.
      commit({
        ...state,
        pageBlocks: { ...pageBlocks, [pageKey]: { desktop: parsed.desktop, mobile: parsed.mobile } },
      });
      // Same semantics for themes: server state replaces local (no theme on the
      // server means the default, not whatever was edited locally).
      setThemesByPage((cur) => ({
        ...cur,
        [pageKey]: { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
      }));
      if (page?.updatedAt) setPageUpdatedAt((m) => ({ ...m, [pageKey]: page.updatedAt as string }));
      setSaveConflict(null);
      // Freshly loaded from server — this is the clean baseline (full page state).
      savedBaselineRef.current[pageKey] = serializeSaved(
        { desktop: parsed.desktop, mobile: parsed.mobile },
        { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
      );
      toast.success("Reloaded the latest version of this page.");
    } catch (err) {
      toast.error(`Reload failed — is the backend running? (${err})`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pageBlocks]);

  // ── Version history ──
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<PageVersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const openVersions = useCallback(async (pageKey: string) => {
    setVersionsOpen(true);
    setVersionsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/site/builder/pages/${pageKey}/versions?minimalResponse=true`);
      if (!res.ok) throw new Error(`${res.status}`);
      const { versions: list } = await res.json();
      setVersions((list ?? []) as PageVersionSummary[]);
    } catch {
      setVersions([]);
      toast.error("Couldn't load version history — is the backend running?");
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  // Load a snapshot into the editor without publishing it — the editor can then
  // Publish to keep it or Undo to discard.
  const previewVersion = useCallback(async (pageKey: string, versionId: string) => {
    try {
      const res = await fetch(`${BACKEND}/site/builder/pages/${pageKey}/versions/${versionId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const { version } = await res.json();
      if (!version) return;
      // Versions store the desktop blocks/theme — load into the desktop variant, keep any local mobile variant.
      commit({ ...state, pageBlocks: { ...pageBlocks, [pageKey]: { desktop: (version.blocks ?? []) as Block[], mobile: pageBlocks[pageKey]?.mobile ?? null } } });
      if (version.theme && Object.keys(version.theme).length) {
        setThemesByPage((cur) => ({ ...cur, [pageKey]: { desktop: normalizeTheme(version.theme), mobile: cur[pageKey]?.mobile ?? null } }));
      }
      setVersionsOpen(false);
      toast.message("Loaded this version into the editor. Publish to keep it, or Undo to discard.");
    } catch {
      toast.error("Couldn't load that version.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pageBlocks, commit]);

  // Restore a snapshot: persist it live (backend snapshots the current state first)
  // then reflect the restored page in the editor.
  const restoreVersion = useCallback(async (pageKey: string, versionId: string) => {
    const { id, name } = getEditor();
    setRestoringId(versionId);
    try {
      const res = await fetch(`${BACKEND}/site/builder/pages/${pageKey}/restore/${versionId}`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ editorId: id, editorName: name }),
      });
      if (res.status === 423) {
        const d = await res.json().catch(() => ({}));
        setLockedBy(d.lockedBy || "another editor");
        heldByMe.current = false;
        toast.error(`Locked by ${d.lockedBy || "another editor"} — can't restore.`);
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);
      const { page } = await res.json();
      const restoredBlocks = (page?.blocks ?? []) as Block[];
      const restoredTheme =
        page?.theme && Object.keys(page.theme).length ? normalizeTheme(page.theme) : (themesByPage[pageKey]?.desktop ?? DEFAULT_THEME);
      const keptMobile = pageBlocks[pageKey]?.mobile ?? null;
      const keptMobileTheme = themesByPage[pageKey]?.mobile ?? null;
      commit({ ...state, pageBlocks: { ...pageBlocks, [pageKey]: { desktop: restoredBlocks, mobile: keptMobile } } });
      setThemesByPage((cur) => ({ ...cur, [pageKey]: { desktop: restoredTheme, mobile: cur[pageKey]?.mobile ?? null } }));
      if (page?.updatedAt) setPageUpdatedAt((m) => ({ ...m, [pageKey]: page.updatedAt as string }));
      setSaveConflict(null);
      // Restore persists to the server — the restored state is the clean baseline.
      savedBaselineRef.current[pageKey] = serializeSaved(
        { desktop: restoredBlocks, mobile: keptMobile },
        { desktop: restoredTheme, mobile: keptMobileTheme },
      );
      setVersionsOpen(false);
      toast.success("Page restored to the selected version.");
    } catch (err) {
      toast.error(`Restore failed — is the backend running? (${err})`);
    } finally {
      setRestoringId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pageBlocks, commit]);

  const releaseLock = useCallback((pageKey: string) => {
    const { id } = getEditor();
    try {
      fetch(`${BACKEND}/site/builder/pages/${pageKey}/unlock`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ editorId: id }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  }, []);

  // Acquire on page open, heartbeat every 60s (only while visible), release on switch.
  useEffect(() => {
    if (activePage === "__blog__") return; // pseudo-page, nothing to lock
    let timer: ReturnType<typeof setInterval> | undefined;
    acquireLock(activePage);
    timer = setInterval(() => {
      if (heldByMe.current && document.visibilityState === "visible") acquireLock(activePage);
    }, 60_000);
    const onVis = () => { if (document.visibilityState === "visible" && heldByMe.current) acquireLock(activePage); };
    document.addEventListener("visibilitychange", onVis);
    const pageAtMount = activePage;
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      if (heldByMe.current) releaseLock(pageAtMount);
      heldByMe.current = false;
    };
  }, [activePage, acquireLock, releaseLock]);

  // Best-effort release when the tab closes, plus a browser confirm prompt — but
  // ONLY when the current page has unsaved changes (the live state differs from
  // the last saved/loaded baseline). Setting returnValue triggers the native
  // "Leave site? / Reload site?" dialog; the wording is browser-controlled.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (heldByMe.current) releaseLock(activePageRef.current);
      const pageKey = activePageRef.current;
      const baseline = savedBaselineRef.current[pageKey];
      const current = liveSnapshotRef.current;
      // No baseline yet = page not loaded; only warn when there's a real diff.
      if (baseline !== undefined && current !== baseline) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [releaseLock]);

  // Blog state
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogNewMode, setBlogNewMode] = useState(false);
  const [blogRefreshKey, setBlogRefreshKey] = useState(0);
  const isBlogMode = activePage === "__blog__" || activePage === "blog";
  // On the blog page the left panel toggles between managing Posts (default) and
  // editing page Sections. `blogPosts` = "currently showing the posts manager".
  const [blogTab, setBlogTab] = useState<'posts' | 'sections'>('posts');
  const blogPosts = isBlogMode && blogTab === 'posts';

  // Widget picker (lifted out of right-panel overflow context to avoid clipping)
  const [widgetPicker, setWidgetPicker] = useState<{ onPick: (t: WidgetType) => void } | null>(null);
  const openWidgetPicker = useCallback((
    _col: number, onPick: (t: WidgetType) => void,
  ) => setWidgetPicker({ onPick }), []);
  const closeWidgetPicker = useCallback(() => setWidgetPicker(null), []);

  // Drag-to-canvas widget drop
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  const [dragCursorPos, setDragCursorPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ type: WidgetType; label: string; started: boolean; startX: number; startY: number } | null>(null);

  const handleWidgetPointerDown = useCallback((type: WidgetType, e: React.MouseEvent) => {
    dragRef.current = {
      type,
      label: WIDGET_REGISTRY[type]?.label ?? type,
      started: false,
      startX: e.clientX,
      startY: e.clientY,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setDragCursorPos({ x: e.clientX, y: e.clientY });
      if (!drag.started) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.sqrt(dx * dx + dy * dy) < 6) return;
        drag.started = true;
        setIsDraggingWidget(true);
        document.body.style.cursor = 'grabbing';
        if (iframeRef.current) iframeRef.current.style.pointerEvents = 'none';
        iframeRef.current?.contentWindow?.postMessage({ type: 'DRAG_START', widgetType: drag.type }, '*');
      }
      if (drag.started && iframeRef.current) {
        const rect = iframeRef.current.getBoundingClientRect();
        iframeRef.current.contentWindow?.postMessage({ type: 'DRAG_OVER', x: e.clientX - rect.left, y: e.clientY - rect.top }, '*');
      }
    };
    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.started && iframeRef.current) {
        const rect = iframeRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inFrame = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        iframeRef.current.contentWindow?.postMessage(
          inFrame ? { type: 'DRAG_DROP', x, y, widgetType: drag.type } : { type: 'DRAG_CANCEL' },
          '*',
        );
        iframeRef.current.style.pointerEvents = '';
      }
      document.body.style.cursor = '';
      dragRef.current = null;
      setIsDraggingWidget(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []); // uses refs — no deps needed

  // Derived read chokepoint — panels/mutators/postMessage below keep using the
  // names `blocks`/`theme`; an unmaterialized mobile variant falls back to desktop.
  const entry = pageBlocks[activePage];
  const blocks = (device === "mobile" ? (entry?.mobile ?? entry?.desktop) : entry?.desktop) ?? [];
  const pageThemes = themesByPage[activePage] ?? DEFAULT_THEME_VARIANTS;
  const theme = device === "mobile" ? (pageThemes.mobile ?? pageThemes.desktop) : pageThemes.desktop;
  const currentPage = pages.find((p) => p.id === activePage) ?? pages[0];
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;
  // Mobile editing canvas — same condition as the header device toggle
  const mobileCanvas = device === "mobile" && activePage !== "__blog__";

  // Keep the live-state refs in sync for the beforeunload dirty check.
  useEffect(() => {
    const entry = pageBlocks[activePage] ?? { desktop: [], mobile: null };
    const themes = themesByPage[activePage] ?? DEFAULT_THEME_VARIANTS;
    liveSnapshotRef.current = serializeSaved(entry, themes);
  }, [pageBlocks, themesByPage, activePage]);

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    if (previewReady.current) {
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    }
  }, []);

  const setBlocks = useCallback((next: Block[], opts?: { blockId?: string; patchKind?: "fields" | "style" | "columns"; otherBlocks?: Block[]; structural?: boolean }) => {
    const cur = pageBlocks[activePage] ?? { desktop: [], mobile: null };
    // Copy-on-write: an edit in mobile mode materializes the mobile variant
    const nextEntry: PageVariants = device === "mobile" ? { ...cur, mobile: next } : { ...cur, desktop: next };
    // Text-content sync: mirror the SAME words into the other device's variant
    // (opts.otherBlocks is prebuilt by updateBlockFields, styling/breaks kept).
    if (opts?.otherBlocks) {
      if (device === "mobile") nextEntry.desktop = opts.otherBlocks;
      else nextEntry.mobile = opts.otherBlocks;
    }
    // Structural sync — DESKTOP DRIVES STRUCTURE. When a section is added, removed,
    // reordered, duplicated or pasted on DESKTOP, mirror the same section list into
    // the (already materialized) mobile variant, matched by block id:
    //   • a section mobile already has  → keep mobile's own block (its per-device
    //     style / fields / images / hidden), only fix its position;
    //   • a section mobile doesn't have → insert an independent deep-cloned copy
    //     (same id, so the text-content sync keeps the words in step afterwards).
    // Any section no longer on desktop is dropped from mobile. Mobile-side
    // structural edits deliberately do NOT restructure desktop, and an
    // unmaterialized mobile (null) is left alone (it already inherits desktop).
    if (opts?.structural && device === "desktop" && cur.mobile !== null) {
      const mobileById = new Map(cur.mobile.map((b) => [b.id, b]));
      nextEntry.mobile = next.map((b, i) => {
        const existing = mobileById.get(b.id);
        return existing
          ? { ...existing, order: i }
          : { ...(JSON.parse(JSON.stringify(b)) as Block), order: i };
      });
    }
    const nextState: BuilderState = {
      ...state,
      pageBlocks: { ...pageBlocks, [activePage]: nextEntry },
    };
    commit(nextState);
    if (opts?.blockId) {
      const b = next.find((x) => x.id === opts.blockId);
      if (b) {
        const msg: Record<string, unknown> = { type: "BUILDER_BLOCK_UPDATE", blockId: opts.blockId };
        if (opts.patchKind === "fields") msg.fields = b.fields;
        if (opts.patchKind === "style") msg.style = b.style;
        if (opts.patchKind === "columns") msg.columns = (b.fields as { columns?: unknown[] }).columns;
        sendToIframe(msg);
      }
    } else {
      // Block added / removed / reordered / hidden — sync full list
      sendToIframe({ type: "BUILDER_BLOCKS_REORDER", blocks: next });
    }
  }, [state, pageBlocks, activePage, device, commit, sendToIframe]);

  const setPages = useCallback((next: Page[]) => {
    commit({ ...state, pages: next });
  }, [state, commit]);

  const deleteBlock = (id: string, confirmFirst = false) => {
    if (confirmFirst && !window.confirm("Delete this section?")) return;
    setBlocks(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })), { structural: true });
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const copyBlockToClipboard = (id: string) => {
    const src = blocks.find((b) => b.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    localStorage.setItem('pb_clipboard', JSON.stringify(copy));
    setClipboardBlock(copy);
    toast.success('Section copied — switch to any page and paste it');
  };

  const pasteFromClipboard = () => {
    if (!clipboardBlock) return;
    const pasted = {
      ...JSON.parse(JSON.stringify(clipboardBlock)),
      id: `b_${Math.random().toString(36).slice(2, 9)}`,
      order: blocks.length,
    };
    setBlocks([...blocks, pasted].map((b, i) => ({ ...b, order: i })), { structural: true });
    setSelectedBlockId(pasted.id);
    toast.success('Section pasted');
  };

  const duplicateBlock = (id: string) => {
    const src = blocks.find((b) => b.id === id);
    if (!src) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const copy = {
      ...JSON.parse(JSON.stringify(src)),
      id: `b_${Math.random().toString(36).slice(2, 9)}`,
    };
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    setBlocks(next.map((b, i) => ({ ...b, order: i })), { structural: true });
    setSelectedBlockId(copy.id);
  };

  const toggleHidden = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)));
  };

  const addBlock = (type: BlockType, index: number, layout?: LayoutVariant) => {
    const next = [...blocks];
    next.splice(index, 0, defaultBlock(type, index, layout));
    setBlocks(next.map((b, i) => ({ ...b, order: i })), { structural: true });
    setAddAtIndex(null);
  };

  const updateBlockFields = (id: string, patch: Record<string, unknown>) => {
    const isColumns = "columns" in patch;
    const nextActive = blocks.map((b) => (b.id === id ? { ...b, fields: { ...b.fields, ...patch } } : b));

    // Mirror TEXT content (words only) into the matching block in the OTHER device
    // variant, preserving that variant's own inline styling + line breaks. Skipped
    // when the other variant isn't materialized (unmaterialized mobile already
    // inherits desktop at render).
    // Fail-safe: a sync error must NEVER block the primary edit — on any failure
    // we just skip mirroring for this change.
    let otherBlocks: Block[] | undefined;
    try {
      const cur = pageBlocks[activePage];
      const otherVar = device === "mobile" ? cur?.desktop : cur?.mobile;
      if (otherVar && otherVar.length) {
        const textPatch = pickTextPatch(patch);
        if (Object.keys(textPatch).length) {
          otherBlocks = otherVar.map((b) => {
            if (b.id !== id) return b;
            const f = { ...(b.fields as Record<string, unknown>) };
            for (const [k, v] of Object.entries(textPatch)) {
              f[k] = isRichDoc(v) ? syncRichContent(f[k] as RichDoc | undefined, v) : v;
            }
            return { ...b, fields: f };
          });
        }
      }
    } catch (e) {
      console.error("[text-sync] skipped for this edit", e);
      otherBlocks = undefined;
    }

    setBlocks(nextActive, { blockId: id, patchKind: isColumns ? "columns" : "fields", otherBlocks });
  };

  const updateBlockStyle = (id: string, patch: Partial<BlockStyle>) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, ...patch } } : b)),
      { blockId: id, patchKind: "style" },
    );
  };

  const onReorderDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragId);
    const to = blocks.findIndex((b) => b.id === targetId);
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, order: i }));
    setBlocks(reordered, { structural: true });
    setDragId(null);
  };

  const onAddPage = () => {
    const name = window.prompt("New page name?");
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `p_${Date.now()}`;
    if (pages.some((p) => p.id === id)) {
      toast.error("A page with that slug already exists");
      return;
    }
    const newPage: Page = { id, name, slug: `/${id}`, title: name, hostnames: [] };
    commit({ pages: [...pages, newPage], pageBlocks: { ...pageBlocks, [id]: { desktop: [], mobile: null } } });
    setActivePage(id);
    setSelectedBlockId(null);
  };

  const onThemeChange = (t: Theme) => {
    // The [theme] effect below pushes BUILDER_THEME_UPDATE to the iframe — no direct send here
    setThemesByPage((cur) => {
      const pageEntry = cur[activePage] ?? DEFAULT_THEME_VARIANTS;
      return {
        ...cur,
        [activePage]: device === "mobile" ? { ...pageEntry, mobile: t } : { ...pageEntry, desktop: t },
      };
    });
  };

  // First open of mobile mode for a page: seed it as a deep copy of desktop,
  // KEEPING block ids (variants never coexist in one array; stable ids keep
  // translations intact). Committed as a normal history entry — undoing past it
  // reverts mobile to null and the canvas falls back to desktop.
  const seedMobileIfNeeded = useCallback((pageKey: string) => {
    const pageEntry = pageBlocks[pageKey];
    if (!pageEntry || pageEntry.mobile !== null) return;
    const seeded: Block[] = JSON.parse(JSON.stringify(pageEntry.desktop));
    commit({ ...state, pageBlocks: { ...pageBlocks, [pageKey]: { ...pageEntry, mobile: seeded } } });
    setThemesByPage((cur) => {
      const themes = cur[pageKey] ?? DEFAULT_THEME_VARIANTS;
      return themes.mobile !== null ? cur : { ...cur, [pageKey]: { ...themes, mobile: { ...themes.desktop } } };
    });
    toast.success("Mobile layout created from your desktop layout");
  }, [state, pageBlocks, commit]);

  const switchDevice = (next: Device) => {
    if (next === device) return;
    // Seeded ids are identical across variants — clear selection/drag state
    setSelectedBlockId(null);
    setSelectedWidgetId(null);
    setFocusedNestedItem(null);
    setAddAtIndex(null);
    setDragId(null);
    if (next === "mobile") seedMobileIfNeeded(activePage);
    setDevice(next);
  };

  const canUndo = hist.idx > 0;
  const canRedo = hist.idx < hist.stack.length - 1;
  const undo = () => setHist((h) => (h.idx > 0 ? { ...h, idx: h.idx - 1 } : h));
  const redo = () =>
    setHist((h) => (h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h));

  // Bootstrap: load pages list + first page blocks from backend
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch(`${BACKEND}/site/builder/pages`);
        if (!res.ok) throw new Error();
        const { pages: rawPages } = await res.json() as { pages: { pageKey: string; hostnames?: string[]; bucketId?: string | null; slug?: string; path?: string }[] };
        if (!rawPages?.length) { setLoading(false); return; }

        // Known safe page keys — scraper bait, well-known paths, and HTML-entity duplicates are excluded
        const BLOCKED_PATTERNS = [
          /\./,                          // any file extension (favicon.ico, .env, etc.)
          /&/,                           // HTML entity duplicates (&amp;)
          /^apple-app-site-association/, // iOS well-known path
          /^_/,                          // internal Next.js paths
          /firebase/i,                   // firebase SDK paths from bots
          /\.env/i,                      // .env file probes
          /wp-/i,                        // WordPress scanner probes
          /admin-sdk/i,                  // SDK paths from bots
        ];
        // Reserved store for global components (shared navbar/footer). It's a real
        // page doc but never a public URL; editors open it here to edit site-wide
        // components once. Allowed through the `/^_/` block below.
        const GLOBALS_KEY = "_globals";
        const builtPages: Page[] = rawPages
          .filter((p) => {
            if (p.pageKey === "__blog__") return false;
            if (p.pageKey === GLOBALS_KEY) return true; // keep the globals store visible
            if (BLOCKED_PATTERNS.some((rx) => rx.test(p.pageKey))) return false;
            return true;
          })
          .map((p) => ({
            id: p.pageKey,
            name: p.pageKey === GLOBALS_KEY ? "🌐 Global Components" : p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1),
            slug: `/${p.pageKey}`,
            title: p.pageKey === GLOBALS_KEY ? "Global Components" : p.pageKey.charAt(0).toUpperCase() + p.pageKey.slice(1) + " Page",
            hostnames: p.hostnames ?? [],
            bucketId: p.bucketId ?? null,
            urlSlug: p.slug ?? "",
            path: p.path ?? "",
          }));

        const firstKey = builtPages[0].id;
        const pageRes = await fetch(`${BACKEND}/site/builder/pages/${firstKey}`);
        if (!pageRes.ok) throw new Error(`Failed to load page: ${pageRes.status}`);
        const { page } = await pageRes.json() as { page: PagePayload };

        const parsed = parsePagePayload(page);
        commit({
          pages: builtPages,
          pageBlocks: { [firstKey]: { desktop: parsed.desktop, mobile: parsed.mobile } },
        });
        if (page.updatedAt) setPageUpdatedAt((m) => ({ ...m, [firstKey]: page.updatedAt as string }));
        setThemesByPage((cur) => ({
          ...cur,
          [firstKey]: { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
        }));
        // Record the clean baseline for the tab-close prompt (full page state).
        savedBaselineRef.current[firstKey] = serializeSaved(
          { desktop: parsed.desktop, mobile: parsed.mobile },
          { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
        );
        setActivePage(firstKey);
      } catch {
        // backend not running — keep mock data
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load blocks from backend when switching to a page not yet in state
  useEffect(() => {
    if (loading) return;
    if (pageBlocks[activePage] !== undefined) return;
    fetch(`${BACKEND}/site/builder/pages/${activePage}`)
      .then((r) => r.json())
      .then(({ page }) => {
        const parsed = parsePagePayload(page);
        commit({
          ...state,
          pageBlocks: { ...pageBlocks, [activePage]: { desktop: parsed.desktop, mobile: parsed.mobile } },
        });
        if (page?.updatedAt) setPageUpdatedAt((m) => ({ ...m, [activePage]: page.updatedAt as string }));
        // Written to THIS page's entry only — other pages' themes stay untouched
        setThemesByPage((cur) => ({
          ...cur,
          [activePage]: { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
        }));
        // Record the clean baseline for the tab-close prompt (full page state).
        savedBaselineRef.current[activePage] = serializeSaved(
          { desktop: parsed.desktop, mobile: parsed.mobile },
          { desktop: parsed.theme ?? DEFAULT_THEME, mobile: parsed.mobileTheme },
        );
      })
      .catch(() => {
        commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: { desktop: [], mobile: null } } });
        savedBaselineRef.current[activePage] = serializeSaved({ desktop: [], mobile: null }, DEFAULT_THEME_VARIANTS);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, loading]);

  // Seed the mobile variant when switching pages while already in mobile mode.
  // Keyed on activePage + entry arrival only — NOT on pageBlocks — so undoing
  // past the seed doesn't immediately re-seed (that would fight undo).
  const entryLoaded = pageBlocks[activePage] !== undefined;
  useEffect(() => {
    if (device !== "mobile" || activePage === "__blog__" || !entryLoaded) return;
    seedMobileIfNeeded(activePage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, entryLoaded]);

  // Click outside right panel to deselect
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-builder-panel]")) return;
      setSelectedBlockId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset to content tab when switching blocks
  useEffect(() => {
    if (selectedBlockId) setActiveTab("content");
  }, [selectedBlockId]);

  // Sync selection into the iframe whenever it changes from the left panel
  useEffect(() => {
    sendToIframe({ type: "SECTION_SELECT", blockId: selectedBlockId });
  }, [selectedBlockId, sendToIframe]);

  // Sync widget selection into the iframe so the blue outline stays in sync
  useEffect(() => {
    sendToIframe({ type: "WIDGET_SELECT", widgetId: selectedWidgetId });
  }, [selectedWidgetId, sendToIframe]);

  // Listen for messages from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_READY") {
        previewReady.current = true;
        iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_ACK" }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_BLOCKS_REORDER", blocks }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_THEME_UPDATE", theme }, "*");
      } else if (e.data?.type === "BUILDER_NAVIGATE") {
        const target = pages.find((p) => p.slug === e.data.slug || p.id === e.data.slug);
        if (target) {
          setActivePage(target.id);
          setSelectedBlockId(null);
        }
      } else if (e.data?.type === "WIDGET_DELETE") {
        const { widgetId } = e.data as { widgetId: string };
        const nextBlocks = deleteWidgetFromBlocks(blocks, widgetId);
        setBlocks(nextBlocks);
        if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
      } else if (e.data?.type === "WIDGET_CLICK") {
        const { widgetId } = e.data as { widgetId: string };
        setSelectedWidgetId(widgetId);
        setWidgetTab("content");
        setSelectedBlockId(null);
      } else if (e.data?.type === "SECTION_NESTED_ITEM_CLICK") {
        const { blockId, itemKey, itemIndex } = e.data as { blockId: string; itemKey: string; itemIndex: number };
        setSelectedWidgetId(null);
        setSelectedBlockId(blockId);
        setFocusedNestedItem({ blockId, itemKey, itemIndex });
        setActiveTab("content");
      } else if (e.data?.type === "SECTION_CLICK") {
        setSelectedWidgetId(null);
        setSelectedBlockId(e.data.blockId ?? null);
        setFocusedNestedItem(null);
      } else if (e.data?.type === "SECTION_SELECT_EDIT") {
        setSelectedWidgetId(null);
        setSelectedBlockId(e.data.blockId ?? null);
      } else if (e.data?.type === "SECTION_DELETE") {
        const id = e.data.blockId as string;
        setBlocks(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
        setSelectedBlockId((prev) => (prev === id ? null : prev));
      } else if (e.data?.type === "SECTION_MOVE_UP") {
        const id = e.data.blockId as string;
        const sorted = [...blocks].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === id);
        if (idx <= 0) return;
        const next = [...sorted];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setBlocks(next.map((b, i) => ({ ...b, order: i })));
      } else if (e.data?.type === "SECTION_MOVE_DOWN") {
        const id = e.data.blockId as string;
        const sorted = [...blocks].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === id);
        if (idx < 0 || idx >= sorted.length - 1) return;
        const next = [...sorted];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setBlocks(next.map((b, i) => ({ ...b, order: i })));
      } else if (e.data?.type === "SECTION_ADD_AFTER") {
        setAddAtIndex((e.data.afterIndex as number) + 1);
      } else if (e.data?.type === "WIDGET_DROPPED") {
        const { blockId, col, widgetType: wt } = e.data as { blockId: string; col: number; widgetType: WidgetType };
        const widget = defaultWidget(wt);
        setBlocks(
          blocks.map((b) => {
            if (b.id !== blockId) return b;
            if (col >= 0) {
              const existingCols = ((b.fields as Record<string, unknown>).columns as Widget[][]) ?? [];
              const next: Widget[][] = Array.from(
                { length: Math.max(existingCols.length, col + 1) },
                (_, i) => Array.isArray(existingCols[i]) ? [...existingCols[i]] : [],
              );
              next[col] = [...next[col], widget];
              return { ...b, fields: { ...b.fields, columns: next } };
            } else {
              const existing = ((b.fields as Record<string, unknown>).widgets as Widget[]) ?? [];
              return { ...b, fields: { ...b.fields, widgets: [...existing, widget] } };
            }
          }),
          { blockId, patchKind: col >= 0 ? "columns" : "fields" },
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [pages, blocks, theme, setBlocks]);

  // Iframe reloads when activePage changes — reset ready flag
  useEffect(() => {
    previewReady.current = false;
  }, [activePage]);

  // Push blocks to iframe whenever they change (covers initial load via bootstrap)
  useEffect(() => {
    if (previewReady.current) {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_BLOCKS_REORDER", blocks }, "*");
    }
  }, [blocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push theme to iframe whenever it changes (covers device switch — the iframe src doesn't change)
  useEffect(() => {
    if (previewReady.current) {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_THEME_UPDATE", theme }, "*");
    }
  }, [theme]);

  // Inject Google Fonts for theme fonts
  const fontHref = useMemo(() => {
    const families = Array.from(new Set([theme.bodyFont, theme.headingFont]))
      .map((f) => `${f.replace(/ /g, "+")}:wght@400;500;600;700`)
      .join("&family=");
    return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  }, [theme.bodyFont, theme.headingFont]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0f172a", color: "#94a3b8", fontFamily: "system-ui" }}>
        <div className="text-center">
          <div className="text-2xl mb-2 animate-pulse">⚙️</div>
          <div className="text-sm">Loading pages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#0f172a" }}>
      <link rel="stylesheet" href={fontHref} />
      {/* Top bar */}
      <header
        className="h-[52px] flex items-center justify-between px-4 text-white shrink-0 border-b border-slate-800"
        style={{ background: "#0f172a" }}
      >
        <div className="flex items-center gap-6 w-[240px]">
          <div className="font-bold tracking-tight">PageBuilder</div>
        </div>
        <div className="flex-1 text-center">
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={currentPage.title}
              onBlur={(e) => {
                const v = e.target.value || currentPage.title;
                setPages(pages.map((pg) => (pg.id === activePage ? { ...pg, title: v } : pg)));
                setEditingTitle(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="bg-slate-800 text-white text-sm px-2 py-1 rounded outline-none border border-slate-600"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium hover:bg-slate-800 px-2 py-1 rounded pb-transition"
            >
              {currentPage.title}
            </button>
          )}
          {device === "mobile" && activePage !== "__blog__" && (
            <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              Mobile
            </span>
          )}
          <div className="text-xs pb-muted">{currentPage.slug}</div>
        </div>
        <div className="flex items-center gap-2 w-auto justify-end">
          {activePage !== "__blog__" && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={() => switchDevice("desktop")}
                className={`p-2 rounded pb-transition ${device === "desktop" ? "text-white bg-slate-700" : "text-slate-400 hover:text-white"}`}
                title="Desktop"
              >
                <Monitor size={15} />
              </button>
              <button
                onClick={() => switchDevice("mobile")}
                className={`p-2 rounded pb-transition ${device === "mobile" ? "text-white bg-slate-700" : "text-slate-400 hover:text-white"}`}
                title="Mobile"
              >
                <Smartphone size={15} />
              </button>
            </div>
          )}
          <a href="/admin" className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition inline-flex items-center gap-1.5" title="CMS Admin" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Settings size={13} /> CMS
          </a>
          <button onClick={undo} disabled={!canUndo} className="p-2 rounded hover:bg-slate-800 pb-transition disabled:opacity-30 disabled:hover:bg-transparent" title="Undo"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={!canRedo} className="p-2 rounded hover:bg-slate-800 pb-transition disabled:opacity-30 disabled:hover:bg-transparent" title="Redo"><Redo2 size={16} /></button>
          <button onClick={() => openVersions(activePage)} className="p-2 rounded hover:bg-slate-800 pb-transition" title="Version history"><History size={16} /></button>
          <button onClick={() => setThemeOpen(true)} className="p-2 rounded hover:bg-slate-800 pb-transition" title="Theme"><Palette size={16} /></button>
          <button onClick={() => setPreviewOpen(true)} className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition inline-flex items-center gap-1.5">
            <Play size={13} /> Preview
          </button>
          <button
            onClick={async () => {
              try { await saveMyDraft(activePage, blocks, theme); toast.success("Draft saved"); }
              catch { toast.error("Could not save draft"); }
            }}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition"
            title="Save the current page as your personal draft"
          >
            Save draft
          </button>
          <button
            onClick={async () => {
              try {
                const draft = await getMyDraft(activePage);
                if (!draft) { toast("No saved draft for this page"); return; }
                commit({ ...state, pageBlocks: { ...pageBlocks, [activePage]: { ...(pageBlocks[activePage] ?? { desktop: [], mobile: null }), [device]: (draft.blocks ?? []) as Block[] } } });
                if (draft.theme && Object.keys(draft.theme).length) {
                  setThemesByPage((cur) => ({ ...cur, [activePage]: { ...(cur[activePage] ?? DEFAULT_THEME_VARIANTS), [device]: { ...DEFAULT_THEME, ...(draft.theme as Theme) } } }));
                }
                toast.success("Applied your last draft");
              } catch { toast.error("Could not load draft"); }
            }}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-600 hover:bg-slate-800 pb-transition"
            title="Load your last saved draft for this page"
          >
            Apply last draft
          </button>
          <button
            disabled={!!lockedBy || (!!saveConflict && saveConflict.pageKey === activePage)}
            title={lockedBy ? `Locked by ${lockedBy}` : saveConflict?.pageKey === activePage ? "Reload the latest version before publishing" : undefined}
            onClick={() => publishPage(activePage)}
            className="px-3 py-1.5 text-sm rounded-md font-medium text-white pb-transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#22c55e" }}
          >
            Publish
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            title="Log out"
            className="p-2 rounded hover:bg-slate-800 pb-transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Save conflict — someone else saved this page after we last loaded/saved it */}
      {saveConflict && saveConflict.pageKey === activePage && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium text-red-900 bg-red-100 border-b border-red-300">
          <span>⚠️ This page was updated{saveConflict.updatedBy ? ` by ${saveConflict.updatedBy}` : ""} since you loaded it. Reload to see the latest version before you can publish.</span>
          <button
            onClick={() => reloadActivePage(activePage)}
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 pb-transition"
          >
            Reload latest
          </button>
        </div>
      )}

      {/* Edit-lock banner — page is being edited by someone else (view-only) */}
      {lockedBy && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium text-amber-900 bg-amber-100 border-b border-amber-300">
          <span>🔒 {lockedBy} is editing this page — you’re in view-only mode. Publishing is disabled to avoid overwriting their work.</span>
          <button
            onClick={async () => {
              const ok = await acquireLock(activePage, true);
              if (ok) toast.success("You’ve taken over editing this page.");
            }}
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 pb-transition"
          >
            Take over
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Narrow icon sidebar — always visible, 48px */}
        <div className="w-12 shrink-0 flex flex-col items-center py-2 gap-1 border-r border-slate-800" style={{ background: "#0f172a" }}>
          <button
            onClick={() => setAddAtIndex(blocks.length)}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white pb-transition"
            title="Add section"
          >
            <Plus size={18} />
          </button>
          <div className="w-6 h-px bg-slate-700 my-1" />
          <button
            onClick={() => setLeftPanel((p) => (p === "sections" ? null : "sections"))}
            className={`w-9 h-9 flex items-center justify-center rounded pb-transition ${leftPanel === "sections" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"}`}
            title="Page sections"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => setLeftPanel((p) => (p === "pages" ? null : "pages"))}
            className={`w-9 h-9 flex items-center justify-center rounded pb-transition ${leftPanel === "pages" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"}`}
            title="Pages"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={() => setLeftPanel((p) => (p === "urls" ? null : "urls"))}
            className={`w-9 h-9 flex items-center justify-center rounded pb-transition ${leftPanel === "urls" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"}`}
            title="Site URLs & buckets"
          >
            <Globe size={18} />
          </button>
        </div>

        {/* Left slide panel — opens when icon clicked */}
        {leftPanel && (
          <aside className="w-[280px] shrink-0 flex flex-col text-white border-r border-slate-800" style={{ background: "#0f172a" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              {leftPanel === "sections" && isBlogMode ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBlogTab('posts')}
                    className={`text-xs font-semibold px-2 py-0.5 rounded pb-transition ${blogTab === 'posts' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setBlogTab('sections')}
                    className={`text-xs font-semibold px-2 py-0.5 rounded pb-transition ${blogTab === 'sections' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Sections
                  </button>
                </div>
              ) : (
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {leftPanel === "pages" ? "Pages" : leftPanel === "urls" ? "Site URLs" : "Sections"}
                </span>
              )}
              <div className="flex items-center gap-1">
                {leftPanel === "sections" && !blogPosts && (
                  <button onClick={() => setAddAtIndex(blocks.length)} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="Add section">
                    <Plus size={14} />
                  </button>
                )}
                {leftPanel === "sections" && blogPosts && (
                  <button onClick={() => { setSelectedBlogPost(null); setBlogNewMode(true); }} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="New post">
                    <Plus size={14} />
                  </button>
                )}
                {leftPanel === "pages" && (
                  <button onClick={onAddPage} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition" title="New page">
                    <Plus size={14} />
                  </button>
                )}
                <button onClick={() => setLeftPanel(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400 pb-transition">
                  <X size={14} />
                </button>
              </div>
            </div>

            {leftPanel === "pages" && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={pageSearch}
                      onChange={(e) => setPageSearch(e.target.value)}
                      placeholder="Search pages..."
                      className="w-full bg-slate-800 text-white text-xs pl-8 pr-7 py-1.5 rounded outline-none border border-slate-700 focus:border-blue-500 placeholder:text-slate-500 pb-transition"
                    />
                    {pageSearch && (
                      <button
                        onClick={() => setPageSearch("")}
                        title="Clear search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                {(() => {
                  const q = pageSearch.trim().toLowerCase();
                  const filtered = q
                    ? pages.filter((p) =>
                        p.name.toLowerCase().includes(q) ||
                        p.slug.toLowerCase().includes(q) ||
                        (p.hostnames ?? []).some((h) => h.toLowerCase().includes(q))
                      )
                    : pages;
                  if (filtered.length === 0) {
                    return (
                      <div className="px-4 py-4 text-xs text-slate-500">
                        No pages match &ldquo;{pageSearch}&rdquo;.
                      </div>
                    );
                  }
                  return filtered.map((p) => {
                  const active = p.id === activePage;
                  const hn = p.hostnames ?? [];
                  const isEditingHn = editingPageHostnames === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`group flex flex-col border-l-2 pb-transition ${
                        active ? "border-blue-500 bg-slate-800/60" : "border-transparent hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Page name row */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => { setActivePage(p.id); setSelectedBlockId(null); }}
                          className={`flex-1 text-left px-4 py-2 text-sm ${active ? "text-white" : "text-slate-300"}`}
                        >
                          {p.name}
                        </button>
                        {/* Page deletion removed from the UI — the builder API has no
                            auth, and a public DELETE endpoint was used to wipe all pages
                            (incident 2026-07-18). Pages are now deleted manually from the
                            DB only; the backend no longer exposes a delete route. */}
                      </div>

                      {/* Hostnames row — always visible for every page */}
                      <div className="flex items-start gap-1.5 px-4 pb-2.5">
                        <Globe size={11} className="text-slate-500 mt-0.5 shrink-0" />
                        {isEditingHn ? (
                          <input
                            autoFocus
                            defaultValue={hn.join(', ')}
                            onBlur={(e) => {
                              const vals = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                              setPages(pages.map((pg) => pg.id === p.id ? { ...pg, hostnames: vals } : pg));
                              setEditingPageHostnames(null);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            placeholder="salescode.ai, demo.salescode.ai"
                            className="flex-1 bg-slate-700 text-white text-xs px-2 py-0.5 rounded outline-none border border-blue-500 min-w-0"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingPageHostnames(p.id)}
                            className="text-left flex-1 min-w-0"
                            title="Set which domains serve this page (empty = all domains)"
                          >
                            {hn.length > 0 ? (
                              <span className="text-xs text-slate-400 truncate block">{hn.join(', ')}</span>
                            ) : (
                              <span className="text-xs text-slate-600 hover:text-slate-400 pb-transition">+ add URLs</span>
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                  });
                })()}
                </div>
              </div>
            )}

            {leftPanel === "urls" && (
              <SiteUrlManager
                pages={pages}
                activePageId={activePage}
                onSelectPage={(id) => { setActivePage(id); setSelectedBlockId(null); }}
                onPageChange={(pageKey, patch) => setPages(pages.map((pg) => (pg.id === pageKey ? { ...pg, ...patch } : pg)))}
              />
            )}

            {leftPanel === "sections" && (
              blogPosts ? (
                <BlogPanel
                  selectedSlug={blogNewMode ? null : (selectedBlogPost?.slug ?? null)}
                  onSelect={(post) => { setSelectedBlogPost(post); setBlogNewMode(false); }}
                  onNew={() => { setSelectedBlogPost(null); setBlogNewMode(true); }}
                  refreshKey={blogRefreshKey}
                />
              ) : (
                <div className="overflow-y-auto flex-1 px-2 pb-3 pt-1 space-y-0.5">
                  {clipboardBlock && (
                    <button
                      onClick={pasteFromClipboard}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 pb-transition mb-1"
                    >
                      <Clipboard size={12} />
                      <span className="flex-1 text-left truncate">Paste: {BLOCK_LABELS[(clipboardBlock as Block).type]}</span>
                    </button>
                  )}
                  {blocks.length === 0 && (
                    <div className="px-2 py-4 text-xs text-slate-500">No sections yet.</div>
                  )}
                  {blocks.map((b) => {
                    const isActive = b.id === selectedBlockId;
                    return (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={() => setDragId(b.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onReorderDrop(b.id)}
                        onClick={() => { setSelectedBlockId(b.id); setSelectedWidgetId(null); }}
                        className={`group flex items-center gap-2 px-2 py-1.5 rounded text-sm pb-transition cursor-pointer ${
                          isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <GripVertical size={14} className="opacity-50 cursor-grab" />
                        <span className="flex-1 truncate">{BLOCK_LABELS[b.type]}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleHidden(b.id); }}
                          className="opacity-60 hover:opacity-100"
                          title="Show/hide"
                        >
                          {b.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyBlockToClipboard(b.id); }}
                          className="opacity-60 hover:opacity-100 hover:text-blue-400"
                          title="Copy to clipboard (paste on any page)"
                        >
                          <Clipboard size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(b.id, true); }}
                          className="opacity-60 hover:opacity-100 hover:text-red-400"
                          title="Delete section"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </aside>
        )}

        {/* Preview iframe — mobile mode renders a 390×844 frame centered on a dark backdrop */}
        <div
          className={`flex-1 min-h-0 min-w-0 flex ${mobileCanvas ? "items-start justify-center overflow-auto" : ""}`}
          style={mobileCanvas ? { background: "#1e293b", padding: "24px 0" } : undefined}
        >
          <iframe
            ref={iframeRef}
            src={(() => {
              const base = import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai";
              if (isBlogMode) {
                return blogPosts && selectedBlogPost && !blogNewMode
                  ? `${base}/blog/${selectedBlogPost.slug}?preview=1`
                  : `${base}/blog?preview=1`;
              }
              return activePage === 'landing'
                ? `${base}/landing?preview=1`
                : `${base}/${activePage}?preview=1`;
            })()}
            className={mobileCanvas ? "border-0 shrink-0" : "flex-1 border-0 min-h-0"}
            style={mobileCanvas ? { border: "1px solid #334155", borderRadius: 12, width: 390, height: 844, background: "#ffffff" } : undefined}
            title="Page preview"
          />
        </div>

        {/* Right panel slot — AddSection drawer takes priority, then content editor */}
        {addAtIndex !== null ? (
          <AddSectionDrawer
            open
            onClose={() => setAddAtIndex(null)}
            onPickTemplate={(t) => addAtIndex !== null && addBlock(t, addAtIndex)}
            onPickLayout={(l) => addAtIndex !== null && addBlock("layout", addAtIndex, l)}
          />
        ) : (selectedWidgetId !== null || selectedBlock !== null || (blogPosts && (blogNewMode || selectedBlogPost !== null))) && (
          <aside
            data-builder-panel
            className="w-[320px] shrink-0 flex flex-col text-white border-l border-slate-800"
            style={{ background: "#0f172a" }}
          >
            {blogPosts ? (
              (blogNewMode || selectedBlogPost) ? (
                <BlogPostEditor
                  post={blogNewMode ? null : selectedBlogPost}
                  onClose={() => { setBlogNewMode(false); setSelectedBlogPost(null); }}
                  onSaved={(saved) => { setSelectedBlogPost(saved); setBlogNewMode(false); setBlogRefreshKey((k) => k + 1); }}
                  onDeleted={(_slug) => { setSelectedBlogPost(null); setBlogNewMode(false); setBlogRefreshKey((k) => k + 1); }}
                />
              ) : null
            ) : selectedWidgetId ? (() => {
              const selWidget = findWidgetById(blocks, selectedWidgetId);
              if (!selWidget) return (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 px-6">
                  <div className="text-sm">Widget not found</div>
                </div>
              );
              const widgetLabel = WIDGET_REGISTRY[selWidget.type]?.label ?? selWidget.type;
              return (
                <>
                  <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedWidgetId(null)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 pb-transition"
                      >
                        <ChevronLeft size={11} />
                        Contents
                      </button>
                      <button onClick={() => setSelectedWidgetId(null)} className="p-1 rounded hover:bg-slate-700 text-slate-400 pb-transition">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="text-base font-semibold text-white leading-tight">{widgetLabel}</div>
                  </div>
                  <div className="flex border-b border-slate-800">
                    {([
                      { key: "content" as const, label: "Content", Icon: PenLine },
                      { key: "style"   as const, label: "Styles",  Icon: Paintbrush },
                    ]).map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        onClick={() => setWidgetTab(key)}
                        className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 pb-transition border-b-2 ${
                          widgetTab === key ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div key={selWidget.id + widgetTab} className="flex-1 overflow-y-auto p-4 pb-fade-in">
                    {widgetTab === "content" ? (
                      <WidgetEditor
                        widget={selWidget}
                        update={(props) => {
                          const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, props);
                          setBlocks(nextBlocks);
                        }}
                        openWidgetPicker={openWidgetPicker}
                      />
                    ) : (
                      <div className="space-y-4">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Background</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(selWidget.props.bgColor as string) || "#ffffff"}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, bgColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="h-8 w-10 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={(selWidget.props.bgColor as string) || ""}
                              placeholder="#ffffff"
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, bgColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Text Color</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(selWidget.props.textColor as string) || "#000000"}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, textColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="h-8 w-10 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={(selWidget.props.textColor as string) || ""}
                              placeholder="#000000"
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, textColor: e.target.value });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Padding</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range" min={0} max={80}
                              value={(selWidget.props.padding as number) ?? 0}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, padding: Number(e.target.value) });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props.padding as number) ?? 0}px</span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Border Radius</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range" min={0} max={40}
                              value={(selWidget.props.borderRadius as number) ?? 0}
                              onChange={(e) => {
                                const nextBlocks = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, borderRadius: Number(e.target.value) });
                                setBlocks(nextBlocks);
                              }}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props.borderRadius as number) ?? 0}px</span>
                          </div>
                        </label>
                        <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Spacing &amp; Position</span>
                        <div className="grid grid-cols-2 gap-2">
                          {(['marginTop','marginBottom','marginLeft','marginRight'] as const).map((k) => (
                            <label key={k} className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500 capitalize">{k.replace('margin','').toLowerCase()} margin</span>
                              <div className="flex items-center gap-1">
                                <input type="range" min={0} max={120}
                                  value={(selWidget.props[k] as number) ?? 0}
                                  onChange={(e) => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, [k]: Number(e.target.value) }); setBlocks(nb); }}
                                  className="flex-1 accent-blue-500" />
                                <span className="text-xs text-slate-300 w-8 text-right">{(selWidget.props[k] as number) ?? 0}px</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Width (px, 0 = auto)</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={2000}
                              value={(selWidget.props.styleWidthPx as number) ?? 0}
                              onChange={(e) => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, styleWidthPx: Number(e.target.value) || undefined }); setBlocks(nb); }}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                              placeholder="0 = auto" />
                            <span className="text-xs text-slate-400">px</span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Align in column</span>
                          <div className="flex gap-2">
                            {(['left','center','right'] as const).map((a) => (
                              <button key={a} type="button"
                                onClick={() => { const nb = updateWidgetInBlocks(blocks, selectedWidgetId, { ...selWidget.props, widgetAlign: a }); setBlocks(nb); }}
                                className={`flex-1 py-1.5 rounded text-xs font-medium pb-transition ${(selWidget.props.widgetAlign as string ?? 'left') === a ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                              >
                                {a.charAt(0).toUpperCase() + a.slice(1)}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              );
            })() : selectedBlock ? (
              <>
                <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Contents</span>
                    <button onClick={() => { setSelectedBlockId(null); setFocusedNestedItem(null); }} className="p-1 rounded hover:bg-slate-700 text-slate-400 pb-transition">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="text-base font-semibold text-white leading-tight">{BLOCK_LABELS[selectedBlock.type]}</div>
                </div>
                <div className="flex border-b border-slate-800">
                  {([
                    { key: "content" as const, label: "Content", Icon: PenLine },
                    { key: "style"   as const, label: "Styles",  Icon: Paintbrush },
                  ]).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 pb-transition border-b-2 ${
                        activeTab === key ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
                <div key={selectedBlock.id + activeTab} className="flex-1 overflow-y-auto p-4 pb-fade-in">
                  {activeTab === "content" ? (
                    <ContentEditor
                      block={selectedBlock}
                      update={(patch) => updateBlockFields(selectedBlock.id, patch)}
                      openWidgetPicker={openWidgetPicker}
                      focusedItem={focusedNestedItem?.blockId === selectedBlock.id ? focusedNestedItem : null}
                    />
                  ) : (
                    <StyleEditor
                      style={selectedBlock.style}
                      update={(patch) => updateBlockStyle(selectedBlock.id, patch)}
                      showTypography
                    />
                  )}
                </div>
              </>
            ) : null}
          </aside>
        )}

        {/* Widget picker — absolute overlay on the right panel, escaped from overflow clipping */}
        {widgetPicker && (
          <aside
            data-builder-panel
            className="absolute top-0 right-0 bottom-0 w-[320px] z-40 flex flex-col text-white border-l border-slate-800 shadow-2xl"
            style={{ background: "#0f172a" }}
          >
            <WidgetPicker
              open
              onClose={closeWidgetPicker}
              onPick={(t) => { widgetPicker.onPick(t); closeWidgetPicker(); }}
              onDragStart={handleWidgetPointerDown}
            />
          </aside>
        )}

        {/* Drag ghost — follows cursor while dragging a widget to canvas */}
        {isDraggingWidget && dragRef.current && (
          <div
            style={{
              position: 'fixed',
              left: dragCursorPos.x + 14,
              top: dragCursorPos.y + 14,
              pointerEvents: 'none',
              zIndex: 9999,
              background: '#1e40af',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'system-ui',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            + {dragRef.current.label}
          </div>
        )}

        <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} theme={theme} onChange={onThemeChange} />
      </div>

      {previewOpen && (
        <PreviewModal
          desktopBlocks={entry?.desktop ?? []}
          mobileBlocks={entry?.mobile ?? null}
          desktopTheme={pageThemes.desktop}
          mobileTheme={pageThemes.mobile}
          initialViewport={device}
          pageKey={activePage}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Version history drawer */}
      {versionsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVersionsOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <History size={16} />
                <span className="text-sm font-semibold">Version history</span>
                <span className="text-xs text-slate-400">{currentPage.title}</span>
              </div>
              <button onClick={() => setVersionsOpen(false)} className="p-1.5 rounded hover:bg-slate-800 pb-transition" title="Close">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {versionsLoading ? (
                <div className="p-6 text-center text-sm text-slate-400">Loading…</div>
              ) : versions.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No versions yet. A snapshot is saved every time you publish this page.
                </div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {versions.map((v) => (
                    <li key={v._id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100">
                          {new Date(v.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {v.savedBy || "Unknown"} · {v.blockCount} block{v.blockCount === 1 ? "" : "s"}
                          {v.note === "pre-restore" ? " · before restore" : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => previewVersion(activePage, v._id)}
                          className="rounded-md border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800 pb-transition inline-flex items-center gap-1"
                          title="Load into the editor without publishing"
                        >
                          <Eye size={12} /> Preview
                        </button>
                        <button
                          onClick={() => restoreVersion(activePage, v._id)}
                          disabled={restoringId === v._id || !!lockedBy}
                          title={lockedBy ? `Locked by ${lockedBy}` : "Restore and publish this version"}
                          className="rounded-md px-2 py-1 text-xs font-medium text-white pb-transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                          style={{ background: "#22c55e" }}
                        >
                          <RotateCcw size={12} /> {restoringId === v._id ? "Restoring…" : "Restore"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-700 px-4 py-2 text-[11px] text-slate-500">
              Keeps the last 50 published versions. Restoring saves the current state first, so it can be undone.
            </div>
          </div>
        </div>
      )}

      {/* Publish OTP — verify the editor before writing the page */}
      {publishOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setPublishOtp(null); setOtpInput(""); }} />
          <div className="relative w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <span className="text-sm font-semibold">Verify to publish</span>
              <button
                onClick={() => { setPublishOtp(null); setOtpInput(""); }}
                className="p-1.5 rounded hover:bg-slate-800 pb-transition"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>

            {publishOtp.step === "email" ? (
              <div className="space-y-3 px-4 py-4">
                <p className="text-xs text-slate-400">
                  Enter your <span className="font-medium text-slate-200">@{OTP_EMAIL_DOMAIN}</span> email — we'll send a
                  6-digit code to confirm this publish.
                </p>
                <input
                  autoFocus
                  type="email"
                  value={publishOtp.email}
                  onChange={(e) => setPublishOtp((s) => (s ? { ...s, email: e.target.value, error: undefined } : s))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitPublishEmail(); }}
                  placeholder={`you@${OTP_EMAIL_DOMAIN}`}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-slate-400"
                />
                {publishOtp.error && <p className="text-xs text-red-400">{publishOtp.error}</p>}
                <button
                  onClick={submitPublishEmail}
                  disabled={publishOtp.submitting || !isValidOtpEmail(publishOtp.email)}
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-white pb-transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "#22c55e" }}
                >
                  {publishOtp.submitting ? "Sending…" : "Send code"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 px-4 py-4">
                <p className="text-xs text-slate-400">
                  {publishOtp.sentTo ? (
                    <>Enter the 6-digit code sent to <span className="font-medium text-slate-200">{publishOtp.sentTo}</span>.</>
                  ) : (
                    "Sending code…"
                  )}
                </p>
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") verifyPublishOtp(); }}
                  placeholder="••••••"
                  className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-slate-400"
                />
                {publishOtp.error && <p className="text-xs text-red-400">{publishOtp.error}</p>}
                <button
                  onClick={verifyPublishOtp}
                  disabled={publishOtp.submitting || otpInput.length !== 6 || !publishOtp.sessionId}
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-white pb-transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "#22c55e" }}
                >
                  {publishOtp.submitting ? "Verifying…" : "Verify & publish"}
                </button>
                <button
                  onClick={() =>
                    requestPublishOtp({ pageKey: publishOtp.pageKey, body: publishOtp.body }, publishOtp.email)
                  }
                  disabled={publishOtp.submitting}
                  className="w-full rounded-md border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800 pb-transition disabled:opacity-40"
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
