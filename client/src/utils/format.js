// Change CURRENCY (e.g. 'USD') and LOCALE to switch how every price is shown.
export const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatPrice = (n) => money.format(Number(n) || 0);

export const pad = (n) => String(n).padStart(2, '0');

// Images saved by the local uploader look like "/uploads/x.jpg". In production the
// API lives on another domain, so they need that domain in front.
const ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export function imgUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith('/uploads') ? `${ORIGIN}${url}` : url;
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
