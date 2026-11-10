const numberFmt = new Intl.NumberFormat('en-IN');
const compactFmt = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const moneyFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' });

export const formatNumber = (n: number) => numberFmt.format(n);
export const formatCompact = (n: number) => compactFmt.format(n);
export const formatMoney = (n: number) => moneyFmt.format(n);
export const formatDate = (value?: string | null) => (value ? dateFmt.format(new Date(value)) : '—');
/** 'YYYY-MM' → 'Mar' */
export const formatMonth = (key: string) => monthFmt.format(new Date(`${key}-01T00:00:00Z`));

export function formatRelative(value?: string | null) {
  if (!value) return '—';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

export const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
