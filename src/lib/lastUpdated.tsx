// Small shared "Updated by X, <when>" label used across the CMS list/detail
// pages (products, courses, SEO) that now stamp lastUpdatedBy/lastUpdatedAt
// server-side on every write (see siteContentOtpController.ts / siteSeoController.ts).
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LastUpdatedBy({
  by,
  at,
  style,
}: {
  by?: string | null;
  at?: string | null;
  style?: React.CSSProperties;
}) {
  if (!by) return null;
  return (
    <span style={{ color: '#64748b', fontSize: 11, ...style }}>
      Updated by {by}
      {at ? ` · ${timeAgo(at)}` : ''}
    </span>
  );
}
