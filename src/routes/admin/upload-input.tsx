import { useRef, useState } from 'react';

const UPLOAD_URL = 'https://salescode-marketplace.salescode.ai/site/upload';

const inp: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9',
  borderRadius: 6, padding: '8px 12px', width: '100%', boxSizing: 'border-box', fontSize: 13,
};

interface UploadInputProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  /** Label shown above the field */
  label?: string;
  /** Whether to show image preview below */
  preview?: boolean;
}

/** Upload-only field for image/video URLs in the CMS admin. */
export function UploadInput({ value, onChange, accept = 'image/*,video/*', label, preview = true }: UploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { url?: string };
      if (data.url) onChange(data.url);
    } catch { setError('Upload failed'); }
    finally { setUploading(false); }
  };

  const isVideo = value && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(value);

  return (
    <div>
      {label && <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{ ...inp, width: 'auto', flexShrink: 0, cursor: uploading ? 'default' : 'pointer', background: '#1e40af', color: '#fff', fontWeight: 600, padding: '8px 14px', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? 'Uploading…' : value ? '↑ Replace' : '↑ Upload'}
        </button>
        {/* Read-only URL display */}
        {value && (
          <input
            readOnly
            style={{ ...inp, flex: 1, color: '#64748b', fontSize: 11 }}
            value={value}
            title={value}
          />
        )}
        {value && (
          <button type="button" onClick={() => onChange('')} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{error}</div>}
      {preview && value && (
        <div style={{ marginTop: 8 }}>
          {isVideo
            ? <video src={value} controls muted style={{ width: '100%', maxHeight: 100, borderRadius: 6, border: '1px solid #334155' }} />
            : <img src={value} alt="" style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #334155' }} />
          }
        </div>
      )}
    </div>
  );
}
