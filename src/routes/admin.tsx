import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';

import { Search, Image, Package, Info, Users, Phone, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

const NAV = [
  { to: '/admin/seo', label: 'SEO', icon: Search },
  { to: '/admin/sections', label: 'Sections & Media', icon: Image },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/about', label: 'About Us', icon: Info },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/contact', label: 'Contact Us', icon: Phone },
] as const;

function AdminLayout() {
  const { location } = useRouterState();
  return (
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
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', padding: 32 }}>
        <Outlet />
      </div>
    </div>
  );
}
