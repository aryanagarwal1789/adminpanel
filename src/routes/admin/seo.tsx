import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useRef, useState } from 'react';
import { UploadInput } from './upload-input';

export const Route = createFileRoute('/admin/seo')({ component: SeoPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

const PAGE_TABS = [
  { key: 'landing',    label: 'Landing'    },
  { key: 'blog',       label: 'Blog'       },
  { key: 'about-us',  label: 'About Us'   },
  { key: 'contact-us',label: 'Contact Us' },
  { key: 'client',    label: 'Clients'    },
];

type PageKey = string;

// ─── Types ─────────────────────────────────────────────────────────────────
interface SeoData {
  metaTitle: string; metaDescription: string; keywords: string[];
  ogTitle: string; ogDescription: string; ogImage: string;
  twitterTitle: string; twitterDescription: string; twitterImage: string;
  canonicalUrl: string; focusKeyphrase: string; robots: string;
  schemas: {
    softwareApplication: {
      name: string; description: string; url: string;
      price: string; priceCurrency: string; priceDescription: string;
      ratingValue: string; reviewCount: string;
      publisherName: string; publisherUrl: string;
    };
    faqPage: { items: Array<{ question: string; answer: string }> };
    organization: {
      name: string; url: string; logo: string; description: string;
      linkedIn: string; twitter: string; youtube: string;
      founderName: string; numberOfEmployees: string;
    };
    speakable: { url: string; cssSelectors: string[] };
    breadcrumbList: { items: Array<{ name: string; url: string }> };
  };
  schemasEnabled: {
    softwareApplication: boolean; faqPage: boolean;
    organization: boolean; speakable: boolean; breadcrumbList: boolean;
  };
}

interface LlmsPage { name: string; url: string; description: string }
interface LlmsData  { siteName: string; tagline: string; pages: LlmsPage[] }

const BLANK_SEO: SeoData = {
  metaTitle: '', metaDescription: '', keywords: [],
  ogTitle: '', ogDescription: '', ogImage: '',
  twitterTitle: '', twitterDescription: '', twitterImage: '',
  canonicalUrl: '', focusKeyphrase: '', robots: 'index, follow',
  schemas: {
    softwareApplication: { name: '', description: '', url: '', price: '', priceCurrency: '', priceDescription: '', ratingValue: '', reviewCount: '', publisherName: '', publisherUrl: '' },
    faqPage:        { items: [] },
    organization:   { name: '', url: '', logo: '', description: '', linkedIn: '', twitter: '', youtube: '', founderName: '', numberOfEmployees: '' },
    speakable:      { url: '', cssSelectors: [] },
    breadcrumbList: { items: [] },
  },
  schemasEnabled: { softwareApplication: false, faqPage: false, organization: false, speakable: false, breadcrumbList: false },
};

type CheckStatus = 'good' | 'ok' | 'bad';
type Toast = { type: 'success' | 'error'; message: string } | null;
interface SeoCheck { id: string; status: CheckStatus; message: string }

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  good: '#22c55e', ok: '#f59e0b', bad: '#ef4444',
  cardBg: '#1e293b', border: '#334155',
  text: '#f1f5f9', muted: '#94a3b8', subtle: '#64748b',
  inputBg: '#0f172a', blue: '#3b82f6',
};

// ─── Robots helpers ──────────────────────────────────────────────────────────
function parseRobots(r: string) {
  return {
    indexing:  r.includes('noindex')  ? 'noindex'  : 'index',
    following: r.includes('nofollow') ? 'nofollow' : 'follow',
  };
}
function buildRobots(indexing: string, following: string) {
  return `${indexing}, ${following}`;
}

// ─── SEO Checks (T11 front-load + T12 140-160) ──────────────────────────────
function computeChecks(seo: SeoData): SeoCheck[] {
  const kp    = seo.focusKeyphrase.toLowerCase().trim();
  const title = seo.metaTitle.toLowerCase();
  const desc  = seo.metaDescription.toLowerCase();
  const tl    = seo.metaTitle.length;
  const dl    = seo.metaDescription.length;
  const { indexing } = parseRobots(seo.robots);

  const kpPos       = kp ? title.indexOf(kp) : -1;
  const frontloaded = kpPos !== -1 && kpPos <= Math.ceil(tl * 0.4);

  return [
    {
      id: 'kp_set',
      status: kp ? 'good' : 'bad',
      message: kp ? 'Focus keyphrase is set.' : 'No focus keyphrase has been set for this page.',
    },
    {
      id: 'kp_title',
      status: !kp ? 'ok' : title.includes(kp) ? 'good' : 'bad',
      message: !kp ? 'Set a focus keyphrase to check title usage.'
        : title.includes(kp) ? 'The focus keyphrase appears in the SEO title.'
          : 'The focus keyphrase does not appear in the SEO title.',
    },
    {
      id: 'kp_frontload',
      status: !kp || !seo.metaTitle ? 'ok' : frontloaded ? 'good' : 'ok',
      message: !kp || !seo.metaTitle ? 'Set a keyphrase and title to check front-loading.'
        : frontloaded ? 'The keyphrase appears near the beginning of the SEO title.'
          : 'The keyphrase appears late in the title. Move it toward the front for better ranking.',
    },
    {
      id: 'kp_desc',
      status: !kp ? 'ok' : desc.includes(kp) ? 'good' : 'bad',
      message: !kp ? 'Set a focus keyphrase to check description usage.'
        : desc.includes(kp) ? 'The focus keyphrase appears in the meta description.'
          : 'The focus keyphrase does not appear in the meta description.',
    },
    {
      id: 'title_len',
      status: tl === 0 ? 'bad' : tl >= 30 && tl <= 60 ? 'good' : 'ok',
      message: tl === 0 ? 'Please create an SEO title.'
        : tl >= 30 && tl <= 60 ? `SEO title has a good length (${tl} chars).`
          : tl < 30 ? `SEO title is too short (${tl} chars). Aim for 30–60.`
            : `SEO title is too long (${tl} chars). Keep it under 60.`,
    },
    {
      // T12: tightened to 140–160
      id: 'desc_len',
      status: dl === 0 ? 'bad' : dl >= 140 && dl <= 160 ? 'good' : dl >= 80 ? 'ok' : 'bad',
      message: dl === 0 ? 'No meta description has been set.'
        : dl >= 140 && dl <= 160 ? `Meta description is ideal length (${dl} chars).`
          : dl >= 80 ? `Meta description is ${dl} chars — good but aim for 140–160 for max visibility.`
            : `Meta description is too short (${dl} chars). Aim for 140–160.`,
    },
    {
      id: 'indexable',
      status: indexing === 'index' ? 'good' : 'bad',
      message: indexing === 'index' ? 'Page is set to be indexed by search engines.'
        : 'Page has noindex set — it will not appear in search results.',
    },
    {
      id: 'og_img',
      status: seo.ogImage ? 'good' : 'ok',
      message: seo.ogImage ? 'A social sharing image has been set.' : 'No social sharing image — add one for better click-through.',
    },
    {
      id: 'canonical',
      status: seo.canonicalUrl ? 'good' : 'ok',
      message: seo.canonicalUrl ? 'A canonical URL has been set.' : 'No canonical URL — add one to prevent duplicate content issues.',
    },
    {
      id: 'schema',
      status: Object.values(seo.schemasEnabled).some(Boolean) ? 'good' : 'ok',
      message: Object.values(seo.schemasEnabled).some(Boolean)
        ? 'Structured data schema is enabled — great for rich results.'
        : 'No structured data schema enabled. Schema markup improves search visibility.',
    },
  ];
}

function overallScore(checks: SeoCheck[]) {
  const good = checks.filter(c => c.status === 'good').length;
  const bad  = checks.filter(c => c.status === 'bad').length;
  const pct  = Math.round((good / checks.length) * 100);
  if (bad === 0 && pct >= 70) return { status: 'good' as CheckStatus, label: 'Good', pct };
  if (bad <= 2)               return { status: 'ok'   as CheckStatus, label: 'OK', pct };
  return                             { status: 'bad'  as CheckStatus, label: 'Needs improvement', pct };
}

// ─── Page content extraction — reads the live rendered HTML (T10, T13) ──────
// In local dev, requests go through the Vite proxy (/renderer-proxy → experience.experience.salescode.ai)
// to avoid CORS. In production the real URL is used directly.
const RENDERER_BASE = import.meta.env.DEV
  ? '/renderer-proxy'
  : (import.meta.env.VITE_RENDERER_URL ?? 'https://experience.experience.salescode.ai');

const RENDERER_PATHS: Record<string, string> = {
  'landing':    '/',
  'blog':       '/blog',
  'about-us':  '/about',
  'contact-us': '/contact-us',
  'client':     '/clients',
};

interface PageContent {
  headings: Array<{ level: string; text: string }>;
  paragraphs: string[];
  images: Array<{ src: string; alt: string }>;
}

async function fetchPageContent(pageKey: string): Promise<PageContent> {
  const url = `${RENDERER_BASE}${RENDERER_PATHS[pageKey] ?? '/en/' + pageKey}`;
  const res  = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`${res.status}`);
  const html = await res.text();
  const doc  = new DOMParser().parseFromString(html, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .map(el => ({ level: el.tagName.toLowerCase(), text: (el.textContent ?? '').trim() }))
    .filter(h => h.text);

  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(el => (el.textContent ?? '').trim())
    .filter(Boolean);

  const images = Array.from(doc.querySelectorAll('img'))
    .map(el => ({ src: el.getAttribute('src') ?? '', alt: el.getAttribute('alt') ?? '' }))
    .filter(img => img.src);

  return { headings, paragraphs, images };
}

function computeContentChecks(content: PageContent, kp: string): SeoCheck[] {
  const h1s       = content.headings.filter(h => h.level === 'h1');
  const noAlt     = content.images.filter(img => !img.alt.trim());
  const nums      = content.headings.map(h => parseInt(h.level.replace('h','')) || 0).filter(n => n > 0);
  const hasSkip   = nums.some((n, i) => i > 0 && n - nums[i - 1] > 1);
  const firstPara = (content.paragraphs[0] ?? '').toLowerCase();
  const allText   = [...content.headings.map(h => h.text), ...content.paragraphs].join(' ');
  const words     = allText.split(/\s+/).filter(Boolean).length;
  const kpRe      = kp ? new RegExp(kp.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi') : null;
  const kpCount   = kpRe ? (allText.match(kpRe) ?? []).length : 0;
  const density   = words > 0 && kp ? +((kpCount / words) * 100).toFixed(1) : 0;

  return [
    {
      id: 'h1_count',
      status: h1s.length === 1 ? 'good' : 'bad',
      message: h1s.length === 1 ? 'Page has exactly one H1 heading.'
        : h1s.length === 0 ? 'No H1 heading found. Add one to your hero block.'
          : `Page has ${h1s.length} H1 headings — there should be exactly one.`,
    },
    {
      id: 'heading_order',
      status: nums.length === 0 ? 'ok' : hasSkip ? 'ok' : 'good',
      message: nums.length === 0 ? 'No headings detected on this page.'
        : hasSkip ? 'Heading levels skip a level (e.g. H1 → H3). Keep heading order logical.'
          : `Heading structure is logical (${content.headings.length} heading${content.headings.length !== 1 ? 's' : ''} found).`,
    },
    {
      id: 'img_alt',
      status: content.images.length === 0 ? 'ok' : noAlt.length === 0 ? 'good' : 'bad',
      message: content.images.length === 0 ? 'No images detected on this page.'
        : noAlt.length === 0 ? `All ${content.images.length} image(s) have alt text.`
          : `${noAlt.length} of ${content.images.length} image(s) are missing alt text.`,
    },
    {
      id: 'kp_intro',
      status: !kp ? 'ok' : content.paragraphs.length === 0 ? 'ok' : firstPara.includes(kp) ? 'good' : 'ok',
      message: !kp ? 'Set a keyphrase to check if it appears in the opening paragraph.'
        : content.paragraphs.length === 0 ? 'No paragraph text found to check.'
          : firstPara.includes(kp) ? 'The keyphrase appears in the opening paragraph.'
            : 'The keyphrase does not appear in the opening paragraph. Add it early.',
    },
    {
      id: 'word_count',
      status: words === 0 ? 'ok' : words >= 300 ? 'good' : words >= 150 ? 'ok' : 'bad',
      message: words === 0 ? 'No extractable text found (rich-text blocks are not counted).'
        : words >= 300 ? `Good content length (~${words} words).`
          : `Content is short (~${words} words). Aim for 300+ words for better ranking.`,
    },
    {
      id: 'kp_density',
      status: !kp || words === 0 ? 'ok' : kpCount === 0 ? 'bad' : density >= 0.5 && density <= 3 ? 'good' : 'ok',
      message: !kp || words === 0 ? 'Set a keyphrase and add content to check density.'
        : kpCount === 0 ? 'Keyphrase not found in page content.'
          : density > 3 ? `Keyphrase density ${density}% — too high, risks keyword stuffing.`
            : `Keyphrase density ${density}% (${kpCount} occurrence${kpCount !== 1 ? 's' : ''}) — within the ideal 0.5–3%.`,
    },
  ];
}

// ─── PageSpeed Insights ────────────────────────────────────────────────────
const PAGESPEED_KEY = import.meta.env.VITE_PAGESPEED_KEY ?? '';

interface PageSpeedData {
  performance:   number;
  seo:           number;
  accessibility: number;
  bestPractices: number;
  lcp: string;
  cls: string;
  tbt: string;
}

async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedData> {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${PAGESPEED_KEY}&category=performance&category=seo&category=accessibility&category=best_practices`;
  const res  = await fetch(endpoint);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json() as {
    lighthouseResult?: {
      categories?: Record<string, { score?: number }>;
      audits?:    Record<string, { displayValue?: string }>;
    };
  };
  const cats   = json.lighthouseResult?.categories ?? {};
  const audits = json.lighthouseResult?.audits     ?? {};
  return {
    performance:   Math.round((cats['performance']?.score    ?? 0) * 100),
    seo:           Math.round((cats['seo']?.score            ?? 0) * 100),
    accessibility: Math.round((cats['accessibility']?.score  ?? 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
    lcp: audits['largest-contentful-paint']?.displayValue ?? '–',
    cls: audits['cumulative-layout-shift']?.displayValue  ?? '–',
    tbt: audits['total-blocking-time']?.displayValue      ?? '–',
  };
}

function scoreColor(s: number) {
  return s >= 90 ? C.good : s >= 50 ? C.ok : C.bad;
}

function ScoreCircle({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{score}</span>
      </div>
      <span style={{ fontSize: 10, color: C.subtle, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

function PageSpeedCard({ pageKey, canonicalUrl }: { pageKey: PageKey; canonicalUrl: string }) {
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [data,     setData]     = useState<PageSpeedData | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const targetUrl = canonicalUrl || `https://experience.experience.salescode.ai${RENDERER_PATHS[pageKey] ?? '/en/' + pageKey}`;

  useEffect(() => { setData(null); setError(null); }, [strategy]);

  function run() {
    if (!PAGESPEED_KEY) { setError('Add VITE_PAGESPEED_KEY to your .env file.'); return; }
    setLoading(true); setError(null);
    fetchPageSpeed(targetUrl, strategy)
      .then(d => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Google PageSpeed</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['mobile', 'desktop'] as const).map(m => (
            <button key={m} onClick={() => setStrategy(m)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${strategy === m ? C.blue : C.border}`, background: strategy === m ? 'rgba(59,130,246,0.15)' : 'transparent', color: strategy === m ? C.blue : C.muted }}>
              {m === 'mobile' ? '📱' : '🖥'} {m}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {!data && !loading && !error && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
              Runs Google Lighthouse on the live page.<br />Takes ~5 seconds.
            </p>
            <button onClick={run} style={{ background: C.blue, color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              Run Analysis
            </button>
          </div>
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 24, height: 24, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
            <span style={{ fontSize: 12, color: C.subtle }}>Running Lighthouse…</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.bad, fontSize: 12, margin: '0 0 10px' }}>{error}</p>
            <button onClick={run} style={{ background: C.blue, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Retry</button>
          </div>
        )}
        {data && !loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              <ScoreCircle label="Performance"  score={data.performance}   />
              <ScoreCircle label="SEO"          score={data.seo}           />
              <ScoreCircle label="Accessibility" score={data.accessibility} />
              <ScoreCircle label="Best Pract."  score={data.bestPractices} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 12 }}>
              {([['LCP', data.lcp], ['CLS', data.cls], ['TBT', data.tbt]] as const).map(([label, value]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{value}</div>
                  <div style={{ fontSize: 10, color: C.subtle, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <button onClick={run} style={{ width: '100%', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '5px 0', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Re-run
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseSerpUrl(canonicalUrl: string, pageKey: string) {
  const fallbackPath = pageKey === 'landing' ? '' : `› ${pageKey}`;
  if (!canonicalUrl) return { domain: 'experience.salescode.ai', path: fallbackPath };
  try {
    const u = new URL(canonicalUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    return { domain: u.hostname, path: parts.length ? '› ' + parts.join(' › ') : '' };
  } catch { return { domain: 'experience.salescode.ai', path: fallbackPath }; }
}

function getDomain(url: string) {
  try { return new URL(url).hostname; } catch { return 'experience.salescode.ai'; }
}

function mergeSeo(loaded: Partial<SeoData>): SeoData {
  return {
    ...BLANK_SEO, ...loaded,
    schemas: {
      softwareApplication: { ...BLANK_SEO.schemas.softwareApplication, ...(loaded.schemas?.softwareApplication ?? {}) },
      faqPage:        { items: loaded.schemas?.faqPage?.items ?? [] },
      organization:   { ...BLANK_SEO.schemas.organization, ...(loaded.schemas?.organization ?? {}) },
      speakable:      { url: loaded.schemas?.speakable?.url ?? '', cssSelectors: loaded.schemas?.speakable?.cssSelectors ?? [] },
      breadcrumbList: { items: loaded.schemas?.breadcrumbList?.items ?? [] },
    },
    schemasEnabled: { ...BLANK_SEO.schemasEnabled, ...(loaded.schemasEnabled ?? {}) },
  };
}

// ─── UI primitives ───────────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  background: C.inputBg, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const SEL: React.CSSProperties = { ...INP, cursor: 'pointer' };
const TA:  React.CSSProperties = { ...INP, resize: 'vertical', minHeight: 80 };
const LBL: React.CSSProperties = { color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' };
const CARD: React.CSSProperties = { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 12 };

function Field({ lbl, hint, children }: { lbl: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={LBL}>{lbl}</label>
      {hint && <p style={{ color: C.subtle, fontSize: 11, margin: '0 0 5px', lineHeight: 1.4 }}>{hint}</p>}
      {children}
    </div>
  );
}

function LenBar({ len, max, min }: { len: number; max: number; min: number }) {
  const color = len > max ? C.bad : len >= min ? C.good : C.ok;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <div style={{ flex: 1, height: 3, background: '#334155', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min((len / max) * 100, 100)}%`, transition: 'width 0.2s' }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 42, textAlign: 'right' }}>{len}/{max}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={CARD}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span style={{ color: C.muted, fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
      </button>
      {open && <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}><div style={{ paddingTop: 14 }}>{children}</div></div>}
    </div>
  );
}

function SchemaCard({ title, enabled, onToggle, children }: { title: string; enabled: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{title}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <span style={{ fontSize: 11, color: C.muted }}>Enable</span>
          <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} />
        </label>
      </div>
      {enabled && children && <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 14px' }}>{children}</div>}
    </div>
  );
}

// ─── T4: Robots control ───────────────────────────────────────────────────────
function RobotsControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { indexing, following } = parseRobots(value);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <select value={indexing} onChange={e => onChange(buildRobots(e.target.value, following))} style={SEL}>
        <option value="index">index — visible in search</option>
        <option value="noindex">noindex — hide from search</option>
      </select>
      <select value={following} onChange={e => onChange(buildRobots(indexing, e.target.value))} style={SEL}>
        <option value="follow">follow — crawl links</option>
        <option value="nofollow">nofollow — don't crawl links</option>
      </select>
    </div>
  );
}

// ─── SEO Analysis panel ────────────────────────────────────────────────────
function CheckRow({ c }: { c: SeoCheck }) {
  const dot = c.status === 'good' ? C.good : c.status === 'ok' ? C.ok : C.bad;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: `1px solid #0f172a` }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{c.message}</span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: '8px 0 4px', marginTop: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  );
}

function AnalysisPanel({ checks, contentChecks, contentLoading }: {
  checks: SeoCheck[];
  contentChecks: SeoCheck[];
  contentLoading: boolean;
}) {
  const allChecks = [...checks, ...contentChecks];
  const score     = overallScore(allChecks.length ? allChecks : checks);
  const color     = score.status === 'good' ? C.good : score.status === 'ok' ? C.ok : C.bad;
  const goodCount = allChecks.filter(c => c.status === 'good').length;

  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color }}>{score.pct}%</span>
        </div>
        <div>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>SEO Analysis</div>
          <div style={{ color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
            {score.label} — {goodCount}/{allChecks.length} passing
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 12px' }}>
        <SectionLabel label="Meta & Keyphrase" />
        {checks.map(c => <CheckRow key={c.id} c={c} />)}

        <SectionLabel label="Page Content" />
        {contentLoading ? (
          <div style={{ fontSize: 12, color: C.subtle, padding: '6px 0', fontStyle: 'italic' }}>Analysing page content…</div>
        ) : contentChecks.length > 0 ? (
          contentChecks.map(c => <CheckRow key={c.id} c={c} />)
        ) : (
          <div style={{ fontSize: 12, color: C.subtle, padding: '6px 0', fontStyle: 'italic' }}>Could not load page content.</div>
        )}
      </div>
    </div>
  );
}

// ─── Google SERP preview ──────────────────────────────────────────────────
function Highlighted({ text, kp }: { text: string; kp: string }) {
  if (!kp || !text) return <>{text || ''}</>;
  const escaped = kp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return <>{parts.map((p, i) => p.toLowerCase() === kp.toLowerCase() ? <strong key={i} style={{ fontWeight: 700, textDecoration: 'underline' }}>{p}</strong> : p)}</>;
}

function SerpPreview({ seo, pageKey }: { seo: SeoData; pageKey: string }) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const { domain, path } = parseSerpUrl(seo.canonicalUrl, pageKey);
  const kp          = seo.focusKeyphrase.trim();
  const displayTitle = seo.metaTitle    || 'Add an SEO title…';
  const displayDesc  = seo.metaDescription || 'Add a meta description to improve click-through rates from search results.';
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Google Preview</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['desktop', 'mobile'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${mode === m ? C.blue : C.border}`, background: mode === m ? 'rgba(59,130,246,0.15)' : 'transparent', color: mode === m ? C.blue : C.muted }}>
              {m === 'desktop' ? '🖥' : '📱'} {m}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', maxWidth: mode === 'desktop' ? '100%' : 280, fontFamily: 'arial, sans-serif', border: '1px solid #e8eaed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#5f6368', flexShrink: 0 }}>S</div>
            <div>
              <div style={{ fontSize: 13, color: '#202124', lineHeight: 1.2 }}>{domain}</div>
              <div style={{ fontSize: 11, color: '#4d5156', lineHeight: 1.2 }}>{domain}{path ? ' ' + path : ''}</div>
            </div>
          </div>
          <div style={{ fontSize: mode === 'desktop' ? 18 : 16, color: '#1a0dab', marginBottom: 3, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Highlighted text={displayTitle} kp={kp} />
          </div>
          <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.5 }}>
            <Highlighted text={displayDesc} kp={kp} />
          </div>
        </div>
        {kp && <p style={{ fontSize: 11, color: C.subtle, marginTop: 8 }}>Keyphrase "<strong style={{ color: C.muted }}>{kp}</strong>" highlighted where it appears.</p>}
      </div>
    </div>
  );
}

// ─── Social card preview ──────────────────────────────────────────────────
function SocialPreview({ seo }: { seo: SeoData }) {
  const [tab, setTab] = useState<'og' | 'twitter'>('og');
  const domain  = seo.canonicalUrl ? getDomain(seo.canonicalUrl) : 'experience.salescode.ai';
  const ogTitle = seo.ogTitle      || seo.metaTitle;
  const ogDesc  = seo.ogDescription || seo.metaDescription;
  const twTitle = seo.twitterTitle  || seo.metaTitle;
  const twDesc  = seo.twitterDescription || seo.metaDescription;
  return (
    <div style={CARD}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Social Preview</span>
        <div style={{ display: 'flex', marginTop: 10, borderBottom: `1px solid ${C.border}` }}>
          {([['og', 'Facebook / LinkedIn'], ['twitter', 'Twitter / X']] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'none', color: tab === k ? C.blue : C.muted, borderBottom: `2px solid ${tab === k ? C.blue : 'transparent'}`, marginBottom: -1 }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {tab === 'og' ? (
          <div style={{ border: '1px solid #3e4042', borderRadius: 8, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
            {seo.ogImage ? <img src={seo.ogImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: 160, background: '#3a3b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b3b8', fontSize: 12 }}>No image set</div>}
            <div style={{ padding: '10px 12px', background: '#242526' }}>
              <div style={{ fontSize: 11, color: '#b0b3b8', textTransform: 'uppercase', marginBottom: 3 }}>{domain}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e6eb', marginBottom: 3 }}>{ogTitle || <em style={{ fontWeight: 400, color: '#b0b3b8' }}>OG title not set</em>}</div>
              <div style={{ fontSize: 12, color: '#b0b3b8' }}>{ogDesc || <em>OG description not set</em>}</div>
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
            {seo.twitterImage ? <img src={seo.twitterImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: 160, background: '#1e2732', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b98a5', fontSize: 12 }}>No image set</div>}
            <div style={{ padding: '10px 12px', background: '#15202b' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e7e9ea', marginBottom: 3 }}>{twTitle || <em style={{ fontWeight: 400, color: '#8b98a5' }}>Twitter title not set</em>}</div>
              <div style={{ fontSize: 12, color: '#8b98a5', marginBottom: 5 }}>{twDesc || <em>Twitter description not set</em>}</div>
              <div style={{ fontSize: 12, color: '#8b98a5' }}>🔗 {domain}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── T2 + A5: Site-wide view (Sitemap + llms.txt) ─────────────────────────
function SiteView({ tabs }: { tabs: Array<{ key: string; label: string }> }) {
  const [pageData, setPageData]     = useState<Record<string, Partial<SeoData>> | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [llms, setLlms]             = useState<LlmsData>({ siteName: 'Salescode AI', tagline: '', pages: tabs.map(t => ({ name: t.label, url: t.key === 'landing' ? 'https://experience.salescode.ai/' : `https://experience.salescode.ai/${t.key}`, description: '' })) });
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    Promise.all(tabs.map(t => fetch(`${BACKEND}/site/seo/${t.key}`).then(r => r.json())))
      .then(results => {
        const map: Record<string, Partial<SeoData>> = {};
        tabs.forEach((t, i) => { map[t.key] = results[i].seo ?? {}; });
        setPageData(map);
        setLlms(prev => ({
          ...prev,
          pages: tabs.map((t, i) => {
            const d = results[i].seo ?? {} as Partial<SeoData>;
            return {
              name: t.label,
              url:  d.canonicalUrl || (t.key === 'landing' ? 'https://experience.salescode.ai/' : `https://experience.salescode.ai/${t.key}`),
              description: prev.pages[i]?.description || d.metaDescription || '',
            };
          }),
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingMap(false));
  }, [tabs]);

  function generateLlmsTxt() {
    const lines: string[] = [];
    lines.push(`# ${llms.siteName}`);
    lines.push('');
    if (llms.tagline) { lines.push(`> ${llms.tagline}`); lines.push(''); }
    lines.push('## Key Pages');
    lines.push('');
    llms.pages.forEach(p => {
      if (p.url) lines.push(`- [${p.name}](${p.url})${p.description ? ': ' + p.description : ''}`);
    });
    return lines.join('\n');
  }

  const llmsTxt = generateLlmsTxt();

  function copyLlms() {
    navigator.clipboard.writeText(llmsTxt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const SEL_SM: React.CSSProperties = { ...SEL, fontSize: 12, padding: '5px 8px' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* ── Sitemap & Indexing Overview (T2) ── */}
      <div>
        <div style={CARD}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Sitemap & Indexing Overview</div>
            <p style={{ color: C.subtle, fontSize: 12, margin: '4px 0 0' }}>
              Pages marked <em>noindex</em> are excluded from your sitemap automatically.
            </p>
          </div>
          <div style={{ padding: '0 4px 4px' }}>
            {loadingMap ? (
              <div style={{ color: C.muted, padding: 24, textAlign: 'center', fontSize: 13 }}>Loading page data…</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Page', 'Canonical URL', 'Indexed', 'In Sitemap'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: C.subtle, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabs.map(t => {
                    const d = pageData?.[t.key] ?? {};
                    const { indexing } = parseRobots(d.robots ?? 'index, follow');
                    const isIndexed    = indexing === 'index';
                    const canonical    = d.canonicalUrl || `experience.salescode.ai/${t.key === 'landing' ? '' : t.key}`;
                    return (
                      <tr key={t.key} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 12px', color: C.text, fontWeight: 600 }}>{t.label}</td>
                        <td style={{ padding: '10px 12px', color: C.subtle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={canonical}>{canonical}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: isIndexed ? C.good : C.bad, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isIndexed ? C.good : C.bad, display: 'inline-block' }} />
                            {isIndexed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: isIndexed ? C.good : C.subtle, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isIndexed ? C.good : C.subtle, display: 'inline-block' }} />
                            {isIndexed ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#0f172a', borderRadius: '0 0 8px 8px' }}>
            <p style={{ color: C.subtle, fontSize: 11, margin: 0 }}>
              To change a page's indexing, open its tab above and update the <strong style={{ color: C.muted }}>Robots</strong> setting.
              Your sitemap URL: <code style={{ color: C.blue }}>https://experience.salescode.ai/sitemap.xml</code>
            </p>
          </div>
        </div>
      </div>

      {/* ── llms.txt Generator (A5) ── */}
      <div>
        <div style={CARD}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>llms.txt Generator</div>
                <p style={{ color: C.subtle, fontSize: 12, margin: '4px 0 0' }}>
                  <code style={{ color: C.blue }}>llms.txt</code> tells AI answer engines (ChatGPT, Perplexity, Gemini) what your site is about and which pages to index.
                </p>
              </div>
              <button onClick={copyLlms} style={{ background: copied ? C.good : C.blue, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 12, flexShrink: 0, transition: 'background 0.2s' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Field lbl="Site Name">
                <input style={INP} value={llms.siteName} onChange={e => setLlms(p => ({ ...p, siteName: e.target.value }))} placeholder="Salescode AI" />
              </Field>
              <Field lbl="One-line tagline">
                <input style={INP} value={llms.tagline} onChange={e => setLlms(p => ({ ...p, tagline: e.target.value }))} placeholder="AI-powered field sales intelligence for CPG brands" />
              </Field>
            </div>

            <label style={LBL}>Key Pages</label>
            {llms.pages.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, marginBottom: 8, alignItems: 'start' }}>
                <div style={{ color: C.muted, fontSize: 12, paddingTop: 9, fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 6 }}>
                  <input style={{ ...INP, fontSize: 11 }} value={p.url} onChange={e => setLlms(prev => ({ ...prev, pages: prev.pages.map((pg, idx) => idx === i ? { ...pg, url: e.target.value } : pg) }))} placeholder="URL" />
                  <input style={{ ...INP, fontSize: 11 }} value={p.description} onChange={e => setLlms(prev => ({ ...prev, pages: prev.pages.map((pg, idx) => idx === i ? { ...pg, description: e.target.value } : pg) }))} placeholder="Brief description…" />
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={LBL}>Preview</label>
              <pre style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, fontSize: 11, color: C.muted, margin: 0, overflowX: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {llmsTxt}
              </pre>
            </div>

            <p style={{ color: C.subtle, fontSize: 11, margin: '12px 0 0', lineHeight: 1.6 }}>
              After copying, save as <code style={{ color: C.blue }}>llms.txt</code> and publish it at <code style={{ color: C.blue }}>https://experience.salescode.ai/llms.txt</code> (in your public root folder).
            </p>
          </div>
          {/* suppress unused var warning for SEL_SM */}
          <span style={{ display: 'none' }}>{SEL_SM.fontSize}</span>
        </div>
      </div>

    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
function SeoPage() {
  const [activeTab, setActiveTab]       = useState<string>('landing');
  const [tabs, setTabs]                 = useState<Array<{ key: string; label: string }>>(PAGE_TABS);
  const [dropOpen, setDropOpen]         = useState(false);
  const dropRef                         = useRef<HTMLDivElement>(null);
  const [seo, setSeo]                   = useState<SeoData>(BLANK_SEO);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState<Toast>(null);
  const [keywordsInput, setKeywords]    = useState('');
  const [speakableInput, setSpeakable]  = useState('');
  const [pageContent, setPageContent]   = useState<PageContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3000); };
  const isPage = activeTab !== 'site';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load all builder pages and merge with the static tab list
  useEffect(() => {
    fetch(`${BACKEND}/site/builder/pages`)
      .then(r => r.json())
      .then((data: { pages?: Array<{ pageKey: string }> }) => {
        // Include common key aliases so variants like 'clients'/'client', 'about'/'about-us' don't duplicate
        const staticKeys = new Set([
          ...PAGE_TABS.map(t => t.key),
          'about', 'clients', 'contact',
        ]);
        const seen = new Set<string>();
        const newTabs = (data.pages ?? [])
          .filter(p => {
            if (!p.pageKey || p.pageKey === '__blog__') return false;
            if (staticKeys.has(p.pageKey)) return false;
            if (seen.has(p.pageKey)) return false;
            seen.add(p.pageKey);
            return true;
          })
          .map(p => ({
            key: p.pageKey,
            label: p.pageKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          }));
        if (newTabs.length) setTabs(prev => [...prev, ...newTabs]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isPage) return;
    setLoading(true);
    setContentLoading(true);
    setPageContent(null);

    const seoFetch = fetch(`${BACKEND}/site/seo/${activeTab}`)
      .then(r => r.json())
      .then((data: { seo?: Partial<SeoData> }) => {
        const merged = mergeSeo(data.seo ?? {});
        setSeo(merged);
        setKeywords((data.seo?.keywords ?? []).join(', '));
        setSpeakable((merged.schemas.speakable.cssSelectors ?? []).join('\n'));
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load SEO data' }))
      .finally(() => setLoading(false));

    const contentFetch = fetchPageContent(activeTab)
      .then(content => setPageContent(content))
      .catch(() => setPageContent({ headings: [], paragraphs: [], images: [] }))
      .finally(() => setContentLoading(false));

    return () => { void seoFetch; void contentFetch; };
  }, [activeTab]);

  const update       = (patch: Partial<SeoData>) => setSeo(p => ({ ...p, ...patch }));
  const updateSchema = <K extends keyof SeoData['schemas']>(key: K, patch: Partial<SeoData['schemas'][K]>) =>
    setSeo(p => ({ ...p, schemas: { ...p.schemas, [key]: { ...p.schemas[key], ...patch } } }));
  const toggleSchema = (key: keyof SeoData['schemasEnabled'], v: boolean) =>
    setSeo(p => ({ ...p, schemasEnabled: { ...p.schemasEnabled, [key]: v } }));

  const addFaq    = () => setSeo(p => ({ ...p, schemas: { ...p.schemas, faqPage: { items: [...p.schemas.faqPage.items, { question: '', answer: '' }] } } }));
  const updateFaq = (i: number, patch: Partial<{ question: string; answer: string }>) =>
    setSeo(p => ({ ...p, schemas: { ...p.schemas, faqPage: { items: p.schemas.faqPage.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) } } }));
  const removeFaq = (i: number) =>
    setSeo(p => ({ ...p, schemas: { ...p.schemas, faqPage: { items: p.schemas.faqPage.items.filter((_, idx) => idx !== i) } } }));

  const addCrumb    = () => setSeo(p => ({ ...p, schemas: { ...p.schemas, breadcrumbList: { items: [...p.schemas.breadcrumbList.items, { name: '', url: '' }] } } }));
  const updateCrumb = (i: number, patch: Partial<{ name: string; url: string }>) =>
    setSeo(p => ({ ...p, schemas: { ...p.schemas, breadcrumbList: { items: p.schemas.breadcrumbList.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) } } }));
  const removeCrumb = (i: number) =>
    setSeo(p => ({ ...p, schemas: { ...p.schemas, breadcrumbList: { items: p.schemas.breadcrumbList.items.filter((_, idx) => idx !== i) } } }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...seo,
        keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
        schemas: { ...seo.schemas, speakable: { ...seo.schemas.speakable, cssSelectors: speakableInput.split('\n').map(s => s.trim()).filter(Boolean) } },
      };
      const res = await fetch(`${BACKEND}/site/seo/${activeTab}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast({ type: 'success', message: 'SEO settings saved.' });
    } catch {
      showToast({ type: 'error', message: 'Save failed. Please try again.' });
    } finally { setSaving(false); }
  };

  const checks        = isPage ? computeChecks(seo) : [];
  const contentChecks = isPage && pageContent ? computeContentChecks(pageContent, seo.focusKeyphrase.toLowerCase().trim()) : [];
  const sa     = seo.schemas.softwareApplication;
  const org    = seo.schemas.organization;
  const speak  = seo.schemas.speakable;
  const faq    = seo.schemas.faqPage;
  const crumb  = seo.schemas.breadcrumbList;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'success' ? '#15803d' : '#b91c1c', color: '#fff', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>SEO</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '3px 0 0' }}>Optimize for search engines and social sharing</p>
        </div>
        {isPage && (
          <button onClick={save} disabled={saving || loading} style={{ background: C.blue, color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: saving || loading ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Page selector row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <div ref={dropRef} style={{ position: 'relative', flex: 1 }}>
          {/* Trigger button */}
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#0f172a', border: `1px solid ${isPage && !dropOpen ? C.blue : dropOpen ? C.blue : C.border}`, color: C.text, borderRadius: 6, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', outline: 'none', boxSizing: 'border-box' }}
          >
            <span>{isPage ? (tabs.find(t => t.key === activeTab)?.label ?? activeTab) : 'Select a page…'}</span>
            <span style={{ color: C.muted, fontSize: 10, flexShrink: 0, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
          </button>
          {/* Dropdown panel */}
          {dropOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 260, overflowY: 'auto', zIndex: 200, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setDropOpen(false); }}
                  style={{ width: '100%', padding: '8px 12px', background: t.key === activeTab ? 'rgba(59,130,246,0.15)' : 'transparent', border: 'none', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', color: t.key === activeTab ? C.blue : C.text, fontSize: 13, fontWeight: t.key === activeTab ? 600 : 400, display: 'block', boxSizing: 'border-box' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { setActiveTab('site'); setDropOpen(false); }} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid ${activeTab === 'site' ? C.blue : C.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: activeTab === 'site' ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === 'site' ? C.blue : C.muted, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
          🌐 Site Settings
        </button>
      </div>

      {/* Site view */}
      {activeTab === 'site' && <SiteView tabs={tabs} />}

      {/* Per-page view */}
      {isPage && (
        loading ? (
          <div style={{ color: C.muted, padding: 32, textAlign: 'center', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}>Loading SEO data…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* Left column */}
            <div>
              <div style={{ ...CARD, padding: 20, marginBottom: 12 }}>
                <label style={{ ...LBL, fontSize: 13, letterSpacing: 0 }}>Focus Keyphrase</label>
                <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 10px' }}>The main keyword you want this page to rank for. Drives all analysis checks.</p>
                <input style={{ ...INP, fontSize: 15, padding: '10px 14px' }} value={seo.focusKeyphrase} onChange={e => update({ focusKeyphrase: e.target.value })} placeholder="e.g. sales intelligence software" />
              </div>

              <SerpPreview seo={seo} pageKey={activeTab} />
              <SocialPreview seo={seo} />

              <Section title="Meta Tags">
                <Field lbl="SEO Title" hint="Keep under 60 chars. Put your keyphrase near the front.">
                  <input style={INP} value={seo.metaTitle} onChange={e => update({ metaTitle: e.target.value })} placeholder="Page title for search engines" />
                  <LenBar len={seo.metaTitle.length} max={60} min={30} />
                </Field>
                <Field lbl="Meta Description" hint="140–160 chars. Include the keyphrase and one compelling proof point.">
                  <textarea style={TA} value={seo.metaDescription} onChange={e => update({ metaDescription: e.target.value })} placeholder="Summary shown in search results" />
                  <LenBar len={seo.metaDescription.length} max={160} min={140} />
                </Field>
                <Field lbl="Canonical URL">
                  <input style={INP} value={seo.canonicalUrl} onChange={e => update({ canonicalUrl: e.target.value })} placeholder="https://experience.salescode.ai/…" />
                </Field>
                <Field lbl="Robots — Indexing & Link Following" hint="Controls whether search engines index this page and follow its links.">
                  <RobotsControl value={seo.robots} onChange={v => update({ robots: v })} />
                </Field>
                <Field lbl="Keywords (comma-separated)">
                  <input style={INP} value={keywordsInput} onChange={e => setKeywords(e.target.value)} placeholder="sales, ai, cpg, sfa" />
                </Field>
              </Section>

              <Section title="Open Graph — Facebook & LinkedIn" defaultOpen={false}>
                <Field lbl="OG Title"><input style={INP} value={seo.ogTitle} onChange={e => update({ ogTitle: e.target.value })} placeholder="Defaults to SEO title if empty" /></Field>
                <Field lbl="OG Description"><textarea style={TA} value={seo.ogDescription} onChange={e => update({ ogDescription: e.target.value })} placeholder="Defaults to meta description if empty" /></Field>
                <Field lbl="OG Image"><UploadInput value={seo.ogImage} onChange={ogImage => update({ ogImage })} accept="image/*" /></Field>
              </Section>

              <Section title="Twitter / X" defaultOpen={false}>
                <Field lbl="Twitter Title"><input style={INP} value={seo.twitterTitle} onChange={e => update({ twitterTitle: e.target.value })} placeholder="Defaults to SEO title if empty" /></Field>
                <Field lbl="Twitter Description"><textarea style={TA} value={seo.twitterDescription} onChange={e => update({ twitterDescription: e.target.value })} placeholder="Defaults to meta description if empty" /></Field>
                <Field lbl="Twitter Image"><UploadInput value={seo.twitterImage} onChange={twitterImage => update({ twitterImage })} accept="image/*" /></Field>
              </Section>

              <Section title="Structured Data / Schema Markup" defaultOpen={false}>
                <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 14px' }}>Schema markup helps search engines unlock rich results in Google.</p>

                <SchemaCard title="Software Application" enabled={seo.schemasEnabled.softwareApplication} onToggle={v => toggleSchema('softwareApplication', v)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field lbl="Name"><input style={INP} value={sa.name} onChange={e => updateSchema('softwareApplication', { name: e.target.value })} placeholder="Salescode AI" /></Field>
                    <Field lbl="URL"><input style={INP} value={sa.url} onChange={e => updateSchema('softwareApplication', { url: e.target.value })} placeholder="https://experience.salescode.ai" /></Field>
                  </div>
                  <Field lbl="Description"><textarea style={TA} value={sa.description} onChange={e => updateSchema('softwareApplication', { description: e.target.value })} /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field lbl="Publisher Name"><input style={INP} value={sa.publisherName} onChange={e => updateSchema('softwareApplication', { publisherName: e.target.value })} /></Field>
                    <Field lbl="Publisher URL"><input style={INP} value={sa.publisherUrl} onChange={e => updateSchema('softwareApplication', { publisherUrl: e.target.value })} /></Field>
                  </div>
                </SchemaCard>

                {/* A1: BreadcrumbList */}
                <SchemaCard title="Breadcrumb List (A1)" enabled={seo.schemasEnabled.breadcrumbList} onToggle={v => toggleSchema('breadcrumbList', v)}>
                  <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 10px' }}>Adds breadcrumb links in Google search results. Add items in order from home → current page.</p>
                  {crumb.items.length === 0 && <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 10px' }}>No breadcrumb items yet.</p>}
                  {crumb.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input style={INP} value={item.name} onChange={e => updateCrumb(idx, { name: e.target.value })} placeholder={idx === 0 ? 'Home' : 'Page name'} />
                      <input style={INP} value={item.url} onChange={e => updateCrumb(idx, { url: e.target.value })} placeholder={idx === 0 ? 'https://experience.salescode.ai/' : 'https://experience.salescode.ai/…'} />
                      <button onClick={() => removeCrumb(idx)} style={{ background: 'none', border: `1px solid ${C.bad}`, color: C.bad, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={addCrumb} style={{ background: C.blue, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Add Breadcrumb</button>
                </SchemaCard>

                <SchemaCard title="FAQ Page" enabled={seo.schemasEnabled.faqPage} onToggle={v => toggleSchema('faqPage', v)}>
                  {faq.items.length === 0 && <p style={{ color: C.subtle, fontSize: 12, margin: '0 0 10px' }}>No FAQ items yet. Add questions to generate FAQ schema.</p>}
                  {faq.items.map((item, idx) => (
                    <div key={idx} style={{ background: C.inputBg, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                      <Field lbl={`Question ${idx + 1}`}><input style={INP} value={item.question} onChange={e => updateFaq(idx, { question: e.target.value })} placeholder="What is Salescode AI?" /></Field>
                      <Field lbl="Answer"><textarea style={TA} value={item.answer} onChange={e => updateFaq(idx, { answer: e.target.value })} placeholder="Salescode AI is…" /></Field>
                      <button onClick={() => removeFaq(idx)} style={{ background: 'none', border: `1px solid ${C.bad}`, color: C.bad, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Remove</button>
                    </div>
                  ))}
                  <button onClick={addFaq} style={{ background: C.blue, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Question</button>
                </SchemaCard>

                <SchemaCard title="Organization" enabled={seo.schemasEnabled.organization} onToggle={v => toggleSchema('organization', v)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field lbl="Name"><input style={INP} value={org.name} onChange={e => updateSchema('organization', { name: e.target.value })} /></Field>
                    <Field lbl="URL"><input style={INP} value={org.url} onChange={e => updateSchema('organization', { url: e.target.value })} /></Field>
                  </div>
                  <Field lbl="Logo"><UploadInput value={org.logo} onChange={logo => updateSchema('organization', { logo })} accept="image/*" preview={false} /></Field>
                  <Field lbl="Description"><textarea style={TA} value={org.description} onChange={e => updateSchema('organization', { description: e.target.value })} /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field lbl="LinkedIn"><input style={INP} value={org.linkedIn} onChange={e => updateSchema('organization', { linkedIn: e.target.value })} /></Field>
                    <Field lbl="Twitter / X"><input style={INP} value={org.twitter} onChange={e => updateSchema('organization', { twitter: e.target.value })} /></Field>
                    <Field lbl="YouTube"><input style={INP} value={org.youtube} onChange={e => updateSchema('organization', { youtube: e.target.value })} /></Field>
                    <Field lbl="Founder Name"><input style={INP} value={org.founderName} onChange={e => updateSchema('organization', { founderName: e.target.value })} /></Field>
                  </div>
                </SchemaCard>

                <SchemaCard title="Speakable (Voice Search)" enabled={seo.schemasEnabled.speakable} onToggle={v => toggleSchema('speakable', v)}>
                  <Field lbl="URL"><input style={INP} value={speak.url} onChange={e => updateSchema('speakable', { url: e.target.value })} placeholder="https://experience.salescode.ai/…" /></Field>
                  <Field lbl="CSS Selectors (one per line)">
                    <textarea style={TA} value={speakableInput} onChange={e => setSpeakable(e.target.value)} placeholder={'.article-headline\n.article-body p'} rows={4} />
                  </Field>
                </SchemaCard>
              </Section>
            </div>

            {/* Right column — sticky analysis */}
            <div style={{ position: 'sticky', top: 0 }}>
              <AnalysisPanel checks={checks} contentChecks={contentChecks} contentLoading={contentLoading} />
              <PageSpeedCard key={activeTab} pageKey={activeTab} canonicalUrl={seo.canonicalUrl} />
              <div style={{ ...CARD, padding: 16 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Legend</div>
                {[{ dot: C.good, text: 'Good — no action needed' }, { dot: C.ok, text: 'OK — consider improving' }, { dot: C.bad, text: 'Problem — needs attention' }].map(({ dot, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: C.muted }}>{text}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 12, color: C.subtle, margin: 0, lineHeight: 1.6 }}>
                    Set a <strong style={{ color: C.muted }}>Focus Keyphrase</strong> first — it powers all keyphrase checks above.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )
      )}
    </div>
  );
}
