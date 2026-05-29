import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/seo')({ component: SeoPage });

const BACKEND = 'http://localhost:1337';

const PAGE_TABS = [
  { key: 'landing', label: 'Landing' },
  { key: 'blog', label: 'Blog' },
  { key: 'about-us', label: 'About Us' },
  { key: 'contact-us', label: 'Contact Us' },
  { key: 'client', label: 'Clients' },
] as const;

type PageKey = typeof PAGE_TABS[number]['key'];

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  focusKeyphrase: string;
  robots: string;
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
  };
  schemasEnabled: {
    softwareApplication: boolean;
    faqPage: boolean;
    organization: boolean;
    speakable: boolean;
  };
}

const BLANK_SEO: SeoData = {
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  canonicalUrl: '',
  focusKeyphrase: '',
  robots: 'index, follow',
  schemas: {
    softwareApplication: { name: '', description: '', url: '', price: '', priceCurrency: '', priceDescription: '', ratingValue: '', reviewCount: '', publisherName: '', publisherUrl: '' },
    faqPage: { items: [] },
    organization: { name: '', url: '', logo: '', description: '', linkedIn: '', twitter: '', youtube: '', founderName: '', numberOfEmployees: '' },
    speakable: { url: '', cssSelectors: [] },
  },
  schemasEnabled: { softwareApplication: false, faqPage: false, organization: false, speakable: false },
};

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box',
  fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80 };
const label: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const cardTitle: React.CSSProperties = { color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 12 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };

function Field({ lbl, children }: { lbl: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{lbl}</label>
      {children}
    </div>
  );
}

function SeoPage() {
  const [activeKey, setActiveKey] = useState<PageKey>('landing');
  const [seo, setSeo] = useState<SeoData>(BLANK_SEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [speakableInput, setSpeakableInput] = useState('');

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/site/seo/${activeKey}`)
      .then((r) => r.json())
      .then((data: { seo?: Partial<SeoData> }) => {
        const loaded = data.seo ?? {};
        const merged: SeoData = {
          ...BLANK_SEO,
          ...loaded,
          schemas: {
            softwareApplication: { ...BLANK_SEO.schemas.softwareApplication, ...(loaded.schemas?.softwareApplication ?? {}) },
            faqPage: { items: loaded.schemas?.faqPage?.items ?? [] },
            organization: { ...BLANK_SEO.schemas.organization, ...(loaded.schemas?.organization ?? {}) },
            speakable: { url: loaded.schemas?.speakable?.url ?? '', cssSelectors: loaded.schemas?.speakable?.cssSelectors ?? [] },
          },
          schemasEnabled: { ...BLANK_SEO.schemasEnabled, ...(loaded.schemasEnabled ?? {}) },
        };
        setSeo(merged);
        setKeywordsInput((loaded.keywords ?? []).join(', '));
        setSpeakableInput((merged.schemas.speakable.cssSelectors ?? []).join('\n'));
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load SEO' }))
      .finally(() => setLoading(false));
  }, [activeKey]);

  const update = (patch: Partial<SeoData>) => setSeo((p) => ({ ...p, ...patch }));
  const updateSchema = <K extends keyof SeoData['schemas']>(key: K, patch: Partial<SeoData['schemas'][K]>) =>
    setSeo((p) => ({ ...p, schemas: { ...p.schemas, [key]: { ...p.schemas[key], ...patch } } }));
  const toggleSchema = (key: keyof SeoData['schemasEnabled'], v: boolean) =>
    setSeo((p) => ({ ...p, schemasEnabled: { ...p.schemasEnabled, [key]: v } }));

  const addFaqItem = () => setSeo((p) => ({ ...p, schemas: { ...p.schemas, faqPage: { items: [...p.schemas.faqPage.items, { question: '', answer: '' }] } } }));
  const updateFaqItem = (idx: number, patch: Partial<{ question: string; answer: string }>) =>
    setSeo((p) => ({ ...p, schemas: { ...p.schemas, faqPage: { items: p.schemas.faqPage.items.map((it, i) => i === idx ? { ...it, ...patch } : it) } } }));
  const removeFaqItem = (idx: number) =>
    setSeo((p) => ({ ...p, schemas: { ...p.schemas, faqPage: { items: p.schemas.faqPage.items.filter((_, i) => i !== idx) } } }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...seo,
        keywords: keywordsInput.split(',').map((k) => k.trim()).filter(Boolean),
        schemas: { ...seo.schemas, speakable: { ...seo.schemas.speakable, cssSelectors: speakableInput.split('\n').map((s) => s.trim()).filter(Boolean) } },
      };
      const res = await fetch(`${BACKEND}/site/seo/${activeKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: payload }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      showToast({ type: 'success', message: 'SEO saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const sa = seo.schemas.softwareApplication;
  const org = seo.schemas.organization;
  const speak = seo.schemas.speakable;
  const faq = seo.schemas.faqPage;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>SEO</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Meta tags, Open Graph, and structured data schemas per page</p>
        </div>
        <button style={saveBtn} onClick={save} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {PAGE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveKey(t.key)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeKey === t.key ? '#3b82f6' : 'transparent',
              color: activeKey === t.key ? '#fff' : '#94a3b8',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div>
          {/* Basic Meta */}
          <div style={card}>
            <div style={cardTitle}>Basic Meta</div>
            <Field lbl="Meta Title">
              <input style={inp} value={seo.metaTitle} onChange={(e) => update({ metaTitle: e.target.value })} placeholder="Page title for search engines" />
              <span style={{ fontSize: 11, color: seo.metaTitle.length > 60 ? '#ef4444' : seo.metaTitle.length >= 30 ? '#22c55e' : '#f59e0b', marginTop: 3, display: 'block' }}>
                {seo.metaTitle.length}/60 chars
              </span>
            </Field>
            <Field lbl="Meta Description">
              <textarea style={textareaStyle} value={seo.metaDescription} onChange={(e) => update({ metaDescription: e.target.value })} placeholder="Summary shown in search results (150-160 chars)" />
              <span style={{ fontSize: 11, color: seo.metaDescription.length > 160 ? '#ef4444' : seo.metaDescription.length >= 80 ? '#22c55e' : '#f59e0b', marginTop: 3, display: 'block' }}>
                {seo.metaDescription.length}/160 chars
              </span>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field lbl="Focus Keyphrase">
                <input style={inp} value={seo.focusKeyphrase} onChange={(e) => update({ focusKeyphrase: e.target.value })} placeholder="Primary keyword" />
              </Field>
              <Field lbl="Canonical URL">
                <input style={inp} value={seo.canonicalUrl} onChange={(e) => update({ canonicalUrl: e.target.value })} placeholder="https://salescode.ai/…" />
              </Field>
            </div>
            <Field lbl="Keywords (comma-separated)">
              <input style={inp} value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="sales, ai, cpg, sfa" />
            </Field>
            <Field lbl="Robots">
              <input style={inp} value={seo.robots} onChange={(e) => update({ robots: e.target.value })} placeholder="index, follow" />
            </Field>
          </div>

          {/* Open Graph */}
          <div style={card}>
            <div style={cardTitle}>Open Graph (Facebook, LinkedIn)</div>
            <Field lbl="OG Title">
              <input style={inp} value={seo.ogTitle} onChange={(e) => update({ ogTitle: e.target.value })} placeholder="Shown when the page is shared" />
            </Field>
            <Field lbl="OG Description">
              <textarea style={textareaStyle} value={seo.ogDescription} onChange={(e) => update({ ogDescription: e.target.value })} placeholder="Description shown when shared" />
            </Field>
            <Field lbl="OG Image URL">
              <input style={inp} value={seo.ogImage} onChange={(e) => update({ ogImage: e.target.value })} placeholder="https://…" />
            </Field>
          </div>

          {/* Twitter */}
          <div style={card}>
            <div style={cardTitle}>Twitter / X</div>
            <Field lbl="Twitter Title">
              <input style={inp} value={seo.twitterTitle} onChange={(e) => update({ twitterTitle: e.target.value })} />
            </Field>
            <Field lbl="Twitter Description">
              <textarea style={textareaStyle} value={seo.twitterDescription} onChange={(e) => update({ twitterDescription: e.target.value })} />
            </Field>
            <Field lbl="Twitter Image URL">
              <input style={inp} value={seo.twitterImage} onChange={(e) => update({ twitterImage: e.target.value })} placeholder="https://…" />
            </Field>
          </div>

          {/* Software Application Schema */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={cardTitle}>Software Application Schema</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                <input type="checkbox" checked={seo.schemasEnabled.softwareApplication} onChange={(e) => toggleSchema('softwareApplication', e.target.checked)} />
                Enable
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field lbl="Name"><input style={inp} value={sa.name} onChange={(e) => updateSchema('softwareApplication', { name: e.target.value })} placeholder="Salescode AI" /></Field>
              <Field lbl="URL"><input style={inp} value={sa.url} onChange={(e) => updateSchema('softwareApplication', { url: e.target.value })} placeholder="https://salescode.ai" /></Field>
            </div>
            <Field lbl="Description"><textarea style={textareaStyle} value={sa.description} onChange={(e) => updateSchema('softwareApplication', { description: e.target.value })} placeholder="Short description" /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field lbl="Publisher Name"><input style={inp} value={sa.publisherName} onChange={(e) => updateSchema('softwareApplication', { publisherName: e.target.value })} placeholder="Salescode" /></Field>
              <Field lbl="Publisher URL"><input style={inp} value={sa.publisherUrl} onChange={(e) => updateSchema('softwareApplication', { publisherUrl: e.target.value })} placeholder="https://salescode.ai" /></Field>
            </div>
          </div>

          {/* FAQ Schema */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={cardTitle}>FAQ Page Schema</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                <input type="checkbox" checked={seo.schemasEnabled.faqPage} onChange={(e) => toggleSchema('faqPage', e.target.checked)} />
                Enable
              </label>
            </div>
            {faq.items.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 13, padding: '12px 0' }}>No FAQ items yet.</div>
            )}
            {faq.items.map((item, idx) => (
              <div key={idx} style={{ background: '#0f172a', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <Field lbl={`Question ${idx + 1}`}>
                  <input style={inp} value={item.question} onChange={(e) => updateFaqItem(idx, { question: e.target.value })} placeholder="What is Salescode AI?" />
                </Field>
                <Field lbl="Answer">
                  <textarea style={textareaStyle} value={item.answer} onChange={(e) => updateFaqItem(idx, { answer: e.target.value })} placeholder="Salescode AI is…" />
                </Field>
                <button style={{ ...secBtn, color: '#ef4444', borderColor: '#ef4444' }} onClick={() => removeFaqItem(idx)}>Remove</button>
              </div>
            ))}
            <button style={secBtn} onClick={addFaqItem}>+ Add question</button>
          </div>

          {/* Organization Schema */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={cardTitle}>Organization Schema</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                <input type="checkbox" checked={seo.schemasEnabled.organization} onChange={(e) => toggleSchema('organization', e.target.checked)} />
                Enable
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field lbl="Name"><input style={inp} value={org.name} onChange={(e) => updateSchema('organization', { name: e.target.value })} placeholder="Salescode" /></Field>
              <Field lbl="URL"><input style={inp} value={org.url} onChange={(e) => updateSchema('organization', { url: e.target.value })} placeholder="https://salescode.ai" /></Field>
            </div>
            <Field lbl="Logo URL"><input style={inp} value={org.logo} onChange={(e) => updateSchema('organization', { logo: e.target.value })} placeholder="https://…" /></Field>
            <Field lbl="Description"><textarea style={textareaStyle} value={org.description} onChange={(e) => updateSchema('organization', { description: e.target.value })} placeholder="What the organization does" /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field lbl="LinkedIn"><input style={inp} value={org.linkedIn} onChange={(e) => updateSchema('organization', { linkedIn: e.target.value })} placeholder="https://linkedin.com/company/…" /></Field>
              <Field lbl="Twitter / X"><input style={inp} value={org.twitter} onChange={(e) => updateSchema('organization', { twitter: e.target.value })} placeholder="https://x.com/…" /></Field>
              <Field lbl="YouTube"><input style={inp} value={org.youtube} onChange={(e) => updateSchema('organization', { youtube: e.target.value })} placeholder="https://youtube.com/@…" /></Field>
              <Field lbl="Founder Name"><input style={inp} value={org.founderName} onChange={(e) => updateSchema('organization', { founderName: e.target.value })} placeholder="Jane Doe" /></Field>
            </div>
          </div>

          {/* Speakable Schema */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={cardTitle}>Speakable Schema</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                <input type="checkbox" checked={seo.schemasEnabled.speakable} onChange={(e) => toggleSchema('speakable', e.target.checked)} />
                Enable
              </label>
            </div>
            <Field lbl="URL"><input style={inp} value={speak.url} onChange={(e) => updateSchema('speakable', { url: e.target.value })} placeholder="https://salescode.ai/some-page" /></Field>
            <Field lbl="CSS Selectors (one per line)">
              <textarea style={textareaStyle} value={speakableInput} onChange={(e) => setSpeakableInput(e.target.value)} placeholder={'.article-headline\n.article-body p'} rows={4} />
            </Field>
          </div>

        </div>
      )}
    </div>
  );
}
