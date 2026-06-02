import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, Image, Package, Info, Users, Phone, ArrowLeft } from 'lucide-react';
import { AdminPreviewContext } from './admin/preview-context';

export const Route = createFileRoute('/admin')({ component: AdminLayout });

const NAV = [
  { to: '/admin/seo',      label: 'SEO',             icon: Search  },
  { to: '/admin/sections', label: 'Sections & Media', icon: Image   },
  { to: '/admin/products', label: 'Products',         icon: Package },
  { to: '/admin/about',    label: 'About Us',         icon: Info    },
  { to: '/admin/clients',  label: 'Clients',          icon: Users   },
  { to: '/admin/contact',  label: 'Contact Us',       icon: Phone   },
] as const;

const RENDERER_BASE = import.meta.env.VITE_RENDERER_URL ?? "https://demo-experience.salescode.ai";

function getPreviewUrl(pathname: string): string | null {
  if (pathname.startsWith('/admin/sections') || pathname === '/admin/' || pathname === '/admin' || pathname.startsWith('/admin/seo'))
    return `${RENDERER_BASE}/`;
  if (pathname.startsWith('/admin/about'))   return `${RENDERER_BASE}/about`;
  if (pathname.startsWith('/admin/clients')) return `${RENDERER_BASE}/clients`;
  if (pathname.startsWith('/admin/contact')) return `${RENDERER_BASE}/contact-us`;
  return null;
}

function AdminLayout() {
  const { location } = useRouterState();
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const readyCallbacks = useRef<Set<() => void>>(new Set());

  const previewUrl = getPreviewUrl(location.pathname);

  useEffect(() => { setIframeReady(false); }, [previewUrl]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') {
        // ACK so BuilderPreviewPage stops its retry interval
        iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_ACK' }, '*');
        // Re-send all live data (sections page registered its callback here)
        readyCallbacks.current.forEach((cb) => cb());
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const post = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === 'RELOAD') {
      // Force iframe to fully reload by changing its key
      setIframeReady(false);
      setIframeKey((k) => k + 1);
      return;
    }
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  const onPreviewReady = useCallback((cb: () => void) => {
    readyCallbacks.current.add(cb);
    return () => { readyCallbacks.current.delete(cb); };
  }, []);

  return (
    <AdminPreviewContext.Provider value={{ post, onPreviewReady }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: '#1e293b', display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#94a3b8', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back to Builder
          </a>
          <div style={{ height: 1, background: '#334155', margin: '0 16px 12px' }} />
          <div style={{ padding: '0 12px 8px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CMS Admin</div>
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', fontSize: 13, textDecoration: 'none',
                color: active ? '#ffffff' : '#94a3b8',
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
              }}>
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </div>

        {/* Form panel — fixed width when preview is shown, full flex-1 otherwise */}
        <div style={{
          width: previewUrl ? 420 : undefined,
          flex: previewUrl ? undefined : 1,
          flexShrink: 0,
          overflowY: 'auto',
          background: '#0f172a',
          padding: '28px 24px',
          borderRight: previewUrl ? '1px solid #1e293b' : undefined,
        }}>
          <Outlet />
        </div>

        {/* Live preview — takes remaining space */}
        {previewUrl && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#0a0f1a' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>Live Preview</span>
              <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>{previewUrl.replace(RENDERER_BASE, '') || '/'}</span>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {!iframeReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', gap: 12 }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontSize: 12, color: '#475569' }}>Loading preview…</span>
                </div>
              )}
              <iframe
                key={`${previewUrl}-${iframeKey}`}
                ref={iframeRef}
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff', display: iframeReady ? 'block' : 'none' }}
                onLoad={() => setIframeReady(true)}
              />
            </div>
          </div>
        )}
      </div>
    </AdminPreviewContext.Provider>
  );
}
