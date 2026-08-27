import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, useCallback } from 'react';
import { authUploadHeaders } from '@/lib/auth';

export const Route = createFileRoute('/admin/media')({ component: MediaLinks });

const UPLOAD_URL = `${import.meta.env.VITE_BACKEND_URL ?? 'https://salescode-marketplace.salescode.ai'}/site/upload`;

const VIDEO_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

/** One finished (or failed) upload, newest first in the list. */
interface Asset {
  id: string;
  name: string;
  size: number;
  url?: string;
  error?: string;
  kind: 'image' | 'video';
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const panel: React.CSSProperties = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 };

function MediaLinks() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(async (file: File) => {
    // seed a nonrandom id from name+size+time-agnostic counter via list length
    const id = `${file.name}-${file.size}-${file.lastModified}`;
    const kind: Asset['kind'] = file.type.startsWith('video/') || VIDEO_RE.test(file.name) ? 'video' : 'image';
    setBusy((n) => n + 1);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(UPLOAD_URL, { method: 'POST', headers: authUploadHeaders(), body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = (await res.json()) as { url?: string };
      if (!data.url) throw new Error('No URL returned');
      setAssets((prev) => [{ id, name: file.name, size: file.size, url: data.url, kind }, ...prev]);
    } catch (e) {
      setAssets((prev) => [{ id, name: file.name, size: file.size, error: (e as Error).message, kind }, ...prev]);
    } finally {
      setBusy((n) => n - 1);
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      Array.from(files).forEach((f) => void uploadOne(f));
    },
    [uploadOne],
  );

  const copy = useCallback((url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      window.setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    });
  }, []);

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Media Links</h1>
      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>
        Upload an image or video to get a hosted link you can paste anywhere — a page field, a blog post, or an
        email. Files are stored on the same CDN the site uses.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          ...panel,
          borderStyle: 'dashed',
          borderColor: dragging ? '#3b82f6' : '#334155',
          background: dragging ? 'rgba(59,130,246,0.08)' : '#111827',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {busy > 0 ? `Uploading ${busy} file${busy > 1 ? 's' : ''}…` : 'Drop files here or click to browse'}
        </div>
        <div style={{ color: '#64748b', fontSize: 12 }}>Images (PNG, JPG, WEBP, SVG…) and videos (MP4, WEBM…)</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Results */}
      {assets.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assets.map((a) => (
            <div key={a.id} style={{ ...panel, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* thumb */}
              <div
                style={{
                  width: 64,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {a.url && a.kind === 'image' ? (
                  <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : a.url && a.kind === 'video' ? (
                  <video src={a.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 18 }}>{a.kind === 'video' ? '🎬' : '🖼️'}</span>
                )}
              </div>

              {/* details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#f1f5f9',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={a.name}
                >
                  {a.name} <span style={{ color: '#64748b', fontWeight: 400 }}>· {fmtSize(a.size)}</span>
                </div>
                {a.error ? (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{a.error}</div>
                ) : (
                  <div
                    style={{
                      color: '#38bdf8',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 3,
                    }}
                    title={a.url}
                  >
                    {a.url}
                  </div>
                )}
              </div>

              {/* actions */}
              {a.url && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => copy(a.url as string)}
                    style={{
                      background: copied === a.url ? '#16a34a' : '#1e40af',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copied === a.url ? '✓ Copied' : 'Copy link'}
                  </button>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'none',
                      color: '#94a3b8',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      padding: '7px 10px',
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Open
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
