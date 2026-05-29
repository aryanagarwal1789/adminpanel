import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/contact')({ component: ContactPage });

const BACKEND = 'http://localhost:1337';

interface ContactData {
  title: string;
  description: string;
  image: string;
}

const BLANK: ContactData = { title: '', description: '', image: '' };

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80 };
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const dangerBtn: React.CSSProperties = { background: 'transparent', color: '#ef4444', padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444', cursor: 'pointer', fontSize: 13 };

function ContactPage() {
  const [page, setPage] = useState<ContactData>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND}/site/pages/contact-us`)
      .then((r) => r.json())
      .then((d: { page?: Partial<ContactData> }) => setPage({ ...BLANK, ...(d.page ?? {}) }))
      .catch(() => showToast({ type: 'error', message: 'Failed to load Contact Us' }))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<ContactData>) => setPage((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/site/pages/contact-us`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { page?: Partial<ContactData> };
      setPage({ ...BLANK, ...(data.page ?? {}) });
      showToast({ type: 'success', message: 'Contact Us saved' });
    } catch {
      showToast({ type: 'error', message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Contact Us</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Title, description and image for the Contact Us page</p>
        </div>
        <button style={saveBtn} onClick={save} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div>
          <div style={card}>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Title</label>
              <input style={inp} value={page.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Get in touch" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Description</label>
              <textarea style={textareaStyle} value={page.description} onChange={(e) => update({ description: e.target.value })} placeholder="Supporting text, contact hours, response SLA, etc." rows={4} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Hero Image URL</label>
              <input style={inp} value={page.image} onChange={(e) => update({ image: e.target.value })} placeholder="https://…" />
              {page.image && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <img src={page.image} alt="" style={{ height: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid #334155' }} />
                  <button style={dangerBtn} onClick={() => update({ image: '' })}>Clear</button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
