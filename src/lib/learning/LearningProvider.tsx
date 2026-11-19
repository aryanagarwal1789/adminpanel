import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fromServer, type Draft } from "./draft";
import { summarize, type ChangeItem } from "./diff";
import {
  clearStoredDraft,
  hasServerRevision,
  isStale,
  loadStoredDraft,
  rebaseDraft,
  resolveDraft,
  saveStoredDraft,
  type DraftState,
} from "./store";
import type { Learning, Locator } from "./types";
import { validate, type Problem } from "./validate";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "https://salescode-marketplace.salescode.ai";

export interface ProductOption {
  productId: string;
  name: string;
}

interface LearningContextValue {
  base: Learning | null;
  draft: Draft | null;
  loading: boolean;
  loadError: boolean;
  /** The backend ignored ?v=2 (no numeric revision): no draft is built, editing is off. */
  backendOutdated: boolean;
  /** Draft was started from an older server revision than the current base. */
  stale: boolean;
  changes: ChangeItem[];
  problems: Problem[];
  products: ProductOption[];
  /** Apply an immutable draft operation from lib/learning/draft. */
  edit: (fn: (d: Draft) => Draft) => void;
  discard: () => void;
  /** Re-read the server; keeps the draft (it becomes stale if the revision moved). */
  reload: () => Promise<Learning | null>;
  /** Adopt the current server revision as the draft's base, keeping its edits. */
  rebase: () => void;
  /** After a successful publish: re-read the server and drop the draft. */
  publishDone: () => Promise<void>;
  /** After learning.settings saved: heading/subheading live outside the draft. */
  applySettings: (heading: string, subheading: string) => void;
  /** Payload source for publish. */
  draftState: DraftState | null;
  /** Ask the course page to open and scroll to a spot. */
  focus: { locator: Locator; nonce: number } | null;
  requestFocus: (locator: Locator) => void;
}

const Ctx = createContext<LearningContextValue | null>(null);

export const BACKEND_OUTDATED_MESSAGE =
  "The learning backend hasn't been upgraded yet \u2014 editing is unavailable.";

class BackendOutdatedError extends Error {}

async function fetchBase(): Promise<Learning> {
  const r = await fetch(`${BACKEND}/site/learning?v=2`);
  if (!r.ok) throw new Error(String(r.status));
  const d = (await r.json()) as { learning?: Partial<Learning> };
  if (!hasServerRevision(d)) throw new BackendOutdatedError();
  const l = d.learning ?? {};
  return fromServer({
    heading: l.heading ?? "",
    subheading: l.subheading ?? "",
    revision: l.revision ?? 0,
    hideFeatureInfo: !!l.hideFeatureInfo,
    courses: l.courses ?? [],
  });
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<Learning | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [backendOutdated, setBackendOutdated] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [focus, setFocus] = useState<LearningContextValue["focus"]>(null);
  const nonce = useRef(0);

  useEffect(() => {
    let live = true;
    fetchBase()
      .then((b) => {
        if (!live) return;
        setBase(b);
        setState(resolveDraft(b, loadStoredDraft()));
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof BackendOutdatedError) setBackendOutdated(true);
        else setLoadError(true);
      })
      .finally(() => live && setLoading(false));
    fetch(`${BACKEND}/site/products`)
      .then((r) => r.json())
      .then((d: { products?: ProductOption[] }) => live && setProducts(d.products ?? []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const changes = useMemo(() => (base && state ? summarize(base, state.draft) : []), [base, state]);
  const problems = useMemo(() => (base && state ? validate(base, state.draft) : []), [base, state]);
  const stale = !!base && !!state && isStale(base, state);

  // Persist (or clear) the draft whenever it changes.
  useEffect(() => {
    if (!base || !state) return;
    if (changes.length === 0 && !stale) clearStoredDraft();
    else saveStoredDraft(state);
  }, [base, state, changes, stale]);

  // Leaving the page with unpublished edits.
  useEffect(() => {
    if (changes.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [changes.length]);

  const edit = useCallback((fn: (d: Draft) => Draft) => {
    setState((s) => (s ? { ...s, draft: fn(s.draft) } : s));
  }, []);

  const discard = useCallback(() => {
    setState((s) => (base && s ? { draft: fromServer(base), draftBase: base.revision } : s));
  }, [base]);

  const reload = useCallback(async () => {
    try {
      const b = await fetchBase();
      setBase(b);
      return b;
    } catch {
      return null;
    }
  }, []);

  const rebase = useCallback(() => {
    setState((s) => (base && s ? rebaseDraft(base, s) : s));
  }, [base]);

  const publishDone = useCallback(async () => {
    const b = await reload();
    if (b) setState({ draft: fromServer(b), draftBase: b.revision });
  }, [reload]);

  const applySettings = useCallback((heading: string, subheading: string) => {
    setBase((b) => (b ? { ...b, heading, subheading } : b));
    setState((s) => (s ? { ...s, draft: { ...s.draft, heading, subheading } } : s));
  }, []);

  const requestFocus = useCallback((locator: Locator) => {
    nonce.current += 1;
    setFocus({ locator, nonce: nonce.current });
  }, []);

  const value: LearningContextValue = {
    base,
    draft: state?.draft ?? null,
    loading,
    loadError,
    backendOutdated,
    stale,
    changes,
    problems,
    products,
    edit,
    discard,
    reload,
    rebase,
    publishDone,
    applySettings,
    draftState: state,
    focus,
    requestFocus,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook and provider share the private context; splitting files would only move it
export function useLearning(): LearningContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLearning must be used inside LearningProvider");
  return v;
}
