import { createFileRoute } from '@tanstack/react-router';
import { authJsonHeaders } from '@/lib/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminPreview } from './preview-context';
import { UploadInput } from './upload-input';

export const Route = createFileRoute('/admin/about')({ component: AboutPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';

interface AboutData {
  title: string;
  description: string;
  bannerImage: string;
  video: string;
}

const BLANK: AboutData = { title: '', description: '', bannerImage: '', video: '' };

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const textareaStyle: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80 };
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#ef4444', padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444', cursor: 'pointer', fontSize: 13 };

function AboutPage() {
  const [page, setPage] = useState<AboutData>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const { post, onPreviewReady } = useAdminPreview();
  const pageRef = useRef<AboutData>(BLANK);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND}/site/pages/about-us`)
      .then((r) => r.json())
      .then((d: { page?: Partial<AboutData> }) => setPage({ ...BLANK, ...(d.page ?? {}) }))
      .catch(() => showToast({ type: 'error', message: 'Failed to load About Us' }))
      .finally(() => setLoading(false));
  }, []);

  // Keep ref in sync for the onPreviewReady callback
  useEffect(() => { pageRef.current = page; }, [page]);

  // Re-send when iframe (re)connects
  const sendToPreview = useCallback(() => {
    post({ type: 'PAGE_UPDATE', pageId: 'about-us', page: pageRef.current });
  }, [post]);
  useEffect(() => onPreviewReady(sendToPreview), [onPreviewReady, sendToPreview]);

  // Live update as user types
  useEffect(() => {
    if (loading) return;
    post({ type: 'PAGE_UPDATE', pageId: 'about-us', page });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<AboutData>) => setPage((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/site/pages/about-us`, {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify({ page }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { page?: Partial<AboutData> };
      setPage({ ...BLANK, ...(data.page ?? {}) });
      showToast({ type: 'success', message: 'About Us saved' });
      post({ type: 'RELOAD' });
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
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>About Us</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Title, description, banner image and video for the About Us page</p>
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
              <input style={inp} value={page.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. About SalesCode" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Description</label>
              <textarea style={textareaStyle} value={page.description} onChange={(e) => update({ description: e.target.value })} placeholder="Paragraph describing the company, mission and team" rows={4} />
            </div>
          </div>

          <div style={card}>
            <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Media</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Banner Image URL</label>
              <UploadInput value={page.bannerImage} onChange={(bannerImage) => update({ bannerImage })} accept="image/*" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Video URL</label>
              <UploadInput value={page.video} onChange={(video) => update({ video })} accept="video/*" />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
