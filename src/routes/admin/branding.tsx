import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { UploadInput } from './upload-input';
import { usePublishOtp, PublishOtpModal } from '@/lib/otpPublish';

export const Route = createFileRoute('/admin/branding')({ component: BrandingPage });

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai';
const PORTAL = 'coke-platform';

interface PortalBranding {
  accent: string;
  accentDark: string;
  // Shown by default with the portal's built-in image; every field is optional.
  banner?: { enabled?: boolean; image?: string; headline?: string; highlights?: string[]; tagline?: string };
}

const DEFAULT_ACCENT = '#F40009';
const DEFAULT_ACCENT_DARK = '#D4000A';

type Toast = { type: 'success' | 'error'; message: string } | null;

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' };
const card: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 };
const cardTitle: React.CSSProperties = { color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 12 };
const saveBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const secBtn: React.CSSProperties = { background: 'transparent', color: '#94a3b8', padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 };
const dangerBtn: React.CSSProperties = { ...secBtn, color: '#ef4444', borderColor: '#ef4444' };

function BrandingPage() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [accentDark, setAccentDark] = useState(DEFAULT_ACCENT_DARK);
  const [bannerOn, setBannerOn] = useState(true);
  const [image, setImage] = useState('');
  const [headline, setHeadline] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3000); };

  const otp = usePublishOtp(() => showToast({ type: 'success', message: 'Branding saved' }));

  useEffect(() => {
    fetch(`${BACKEND}/site/portal-branding/${PORTAL}`)
      .then((r) => r.json())
      .then((d: { branding?: PortalBranding | null }) => {
        const b = d.branding;
        if (!b) return;
        setAccent(b.accent || DEFAULT_ACCENT);
        setAccentDark(b.accentDark || DEFAULT_ACCENT_DARK);
        setBannerOn(b.banner?.enabled !== false);
        setImage(b.banner?.image ?? '');
        setHeadline(b.banner?.headline ?? '');
        setHighlights(b.banner?.highlights ?? []);
        setTagline(b.banner?.tagline ?? '');
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load branding' }))
      .finally(() => setLoading(false));
  }, []);

  const save = () => {
    const branding: PortalBranding = {
      accent,
      accentDark,
      banner: {
        enabled: bannerOn,
        ...(image && { image }),
        ...(headline.trim() && { headline: headline.trim() }),
        ...(highlights.some((h) => h.trim()) && { highlights: highlights.map((h) => h.trim()).filter(Boolean) }),
        ...(tagline.trim() && { tagline: tagline.trim() }),
      },
    };
    otp.open('branding.update', { portal: PORTAL, branding });
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading…</div>;

  const colourField = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="color" value={value} onChange={(e) => set(e.target.value.toUpperCase())} style={{ width: 44, height: 36, padding: 0, border: '1px solid #334155', borderRadius: 6, background: '#0f172a' }} />
        <input style={inp} value={value} onChange={(e) => set(e.target.value)} placeholder="#F40009" />
      </div>
    </div>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Portal branding</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Colours and marketplace banner for the Coke platform portal</p>
        </div>
        <button style={saveBtn} onClick={save}>Save</button>
      </div>

      <PublishOtpModal otp={otp} title="Verify to save portal branding" />

      <div style={card}>
        <div style={cardTitle}>Colours</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {colourField('Accent', accent, setAccent)}
          {colourField('Accent (dark)', accentDark, setAccentDark)}
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>Marketplace banner</div>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={bannerOn} onChange={(e) => setBannerOn(e.target.checked)} />
          Show banner
        </label>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Banner image (leave empty for the default banner)</label>
          <UploadInput value={image} onChange={setImage} accept="image/*" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Headline</label>
          <input style={inp} value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Highlights</label>
          {highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inp} value={h} onChange={(e) => setHighlights((prev) => prev.map((x, k) => (k === i ? e.target.value : x)))} />
              <button style={dangerBtn} onClick={() => setHighlights((prev) => prev.filter((_, k) => k !== i))}>Remove</button>
            </div>
          ))}
          <button style={secBtn} onClick={() => setHighlights((prev) => [...prev, ''])}>+ Add highlight</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Tagline (optional)</label>
          <input style={inp} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
