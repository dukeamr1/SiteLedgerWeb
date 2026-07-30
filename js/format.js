// Formatting helpers.
//
// MONEY: amounts are stored as INTEGER whole EGP (the keypad only enters whole
// numbers), so every sum is exact integer arithmetic — the web equivalent of the
// iOS app's `Decimal`, and immune to float drift. Floats are used only for
// display percentages and bar widths.

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function grouped(amount, lang = 'en') {
  const n = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat(lang === 'ar' ? 'en-US' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(n);
}

export function withSuffix(amount, lang = 'en') {
  return `${grouped(amount, lang)} EGP`;
}

/** Compact form for stat tiles: 128200 -> "128.2k", 1500000 -> "1.5M". */
export function short(amount) {
  const n = Math.round(Number(amount) || 0);
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return trim(v, n % 1_000_000 === 0 ? 0 : 1) + 'M';
  }
  if (n >= 1000) {
    const v = n / 1000;
    return trim(v, n % 1000 >= 100 ? 1 : 0) + 'k';
  }
  return grouped(n);
}

function trim(v, decimals) { return v.toFixed(decimals); }

export function pct(part, total) {
  if (!total) return 0;
  return Math.round((Number(part) / Number(total)) * 100);
}

export function initials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase();
}

/** Relative day label: Today / Yesterday / "3d ago" / "3 Jul". */
export function dateLabel(iso, t, lang = 'en') {
  const d = new Date(iso);
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((today - start) / 86400000);
  if (days === 0) return t('today');
  if (days === 1) return t('yesterday');
  if (days > 1 && days < 7) return lang === 'ar' ? `${days} أيام` : `${days}d ago`;
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function longDate(date, lang = 'en') {
  return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isWithin(iso, range) {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  return days >= 0 && days < (range === 'week' ? 7 : 31);
}

export function startOfDayKey(iso) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** rgba() string from a hex color at a given alpha. */
export function hexA(hex, a) {
  const h = String(hex || '').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function haptic(ms = 12) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch { /* ignore */ } }
}
