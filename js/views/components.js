// Shared markup helpers: inline SVG icons (no icon font, works offline) and the
// small repeated pieces of the design system.

import { esc, grouped, pct, initials, hexA } from '../format.js';

export const icon = {
  plus: (s = 18) => svg(s, '<path d="M12 5v14M5 12h14" stroke-width="2.4"/>'),
  back: (s = 19) => svg(s, '<path d="M15 18l-6-6 6-6" stroke-width="2.2"/>'),
  chevron: (s = 12) => svg(s, '<path d="M9 18l6-6-6-6" stroke-width="2.4"/>'),
  up: (s = 16) => svg(s, '<path d="M18 15l-6-6-6 6" stroke-width="2.2"/>'),
  down: (s = 16) => svg(s, '<path d="M6 9l6 6 6-6" stroke-width="2.2"/>'),
  close: (s = 16) => svg(s, '<path d="M18 6 6 18M6 6l12 12" stroke-width="2.2"/>'),
  check: (s = 18) => svg(s, '<path d="M20 6 9 17l-5-5" stroke-width="2.6"/>'),
  trash: (s = 15) => svg(s, '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2"/>'),
  pencil: (s = 17) => svg(s, '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-width="2"/>'),
  home: (s = 21) => svg(s, '<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" stroke-width="2"/>'),
  chart: (s = 21) => svg(s, '<path d="M3 3v18h18M8 15v3M13 10v8M18 6v12" stroke-width="2"/>'),
  people: (s = 21) => svg(s, '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" stroke-width="2"/>'),
  dots: (s = 21) => svg(s, '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
  building: (s = 40) => svg(s, '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" stroke-width="1.6"/>'),
  money: (s = 34) => svg(s, '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-width="1.6"/>'),
  share: (s = 14) => svg(s, '<path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8M16 6l-4-4-4 4M12 2v14" stroke-width="2"/>'),
  menu: (s = 15) => svg(s, '<path d="M4 6h16M4 12h16M4 18h16" stroke-width="2"/>'),
  search: (s = 18) => svg(s, '<circle cx="11" cy="11" r="7" stroke-width="2"/><path d="m21 21-4-4" stroke-width="2"/>'),
  person: (s = 17) => svg(s, '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke-width="2"/>'),
  note: (s = 17) => svg(s, '<path d="M4 5h16M4 12h16M4 19h10" stroke-width="2"/>'),
  camera: (s = 17) => svg(s, '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" stroke-width="2"/><circle cx="12" cy="13" r="4" stroke-width="2"/>'),
  backspace: (s = 24) => svg(s, '<path d="M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM17 9l-5 6M12 9l5 6" stroke-width="2"/>'),
  list: (s = 14) => svg(s, '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke-width="2"/>'),
  download: (s = 19) => svg(s, '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-width="2"/>'),
  reset: (s = 19) => svg(s, '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-width="2"/>'),
  globe: (s = 19) => svg(s, '<circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" stroke-width="2"/>'),
  print: (s = 19) => svg(s, '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M6 14h12v7H6z" stroke-width="2"/>'),
  copy: (s = 19) => svg(s, '<rect x="9" y="9" width="12" height="12" rx="2" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-width="2"/>'),
};

function svg(size, inner) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

/** Big teal money figure with dimmed EGP suffix. */
export function money(amount, { size = 44, suffix = 15, lang = 'en' } = {}) {
  return `<div class="baseline">
    <span class="money-big" style="font-size:${size}px">${grouped(amount, lang)}</span>
    <span class="money-suffix" style="font-size:${suffix}px">EGP</span>
  </div>`;
}

export function dot(hex, cls = 'dot-8') {
  return `<span class="dot ${cls}" style="background:${esc(hex)}"></span>`;
}

/** Subcategory dot — inherits the parent color as a lighter ring. */
export function subDot(hex, size = 12) {
  return `<span class="subdot" style="width:${size}px;height:${size}px;color:${esc(hex)};background:${hexA(hex, 0.28)}"></span>`;
}

export function progressBar(fraction, { thin = false, over = false } = {}) {
  const w = Math.max(3, Math.min(100, (fraction || 0) * 100));
  return `<div class="bar-track${thin ? ' thin' : ''}">
    <div class="bar-fill${over ? ' over' : ''}" style="width:${w}%"></div>
  </div>`;
}

/** Donut built from a conic-gradient — no chart library, renders offline. */
export function donut(slices, total, centerLabel, centerValue) {
  let acc = 0;
  const stops = slices.map((s) => {
    const from = total ? (acc / total) * 360 : 0;
    acc += s.amount;
    const to = total ? (acc / total) * 360 : 0;
    return `${s.colorHex} ${from}deg ${to}deg`;
  });
  const bg = stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--track)';
  return `<div class="donut-wrap"><div class="donut" style="background:${bg}">
    <div class="donut-hole">
      <span class="lbl">${esc(centerLabel)}</span>
      <span class="val">${esc(centerValue)}</span>
    </div>
  </div></div>`;
}

export function methodTag(method, t) {
  const isTransfer = method === 'transfer';
  return `<span class="tag${isTransfer ? ' transfer' : ''}">${esc(isTransfer ? t('transfer') : t('cash'))}</span>`;
}

export function avatar(name, size = 46) {
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.33)}px">${esc(initials(name))}</span>`;
}

export function unitThumb(unit) {
  const accent = unit.accentHex || '#0F766E';
  return `<span class="unit-thumb" style="background:linear-gradient(140deg,${esc(accent)},${hexA(accent, 0.72)})">${esc((unit.name || '?').charAt(0))}</span>`;
}

export function pctText(part, total) { return `${pct(part, total)}%`; }

export function emptyState({ iconHtml, title, body, actions = '' }) {
  return `<div class="empty">
    <div class="empty-icon">${iconHtml}</div>
    <h2>${esc(title)}</h2>
    <p>${esc(body)}</p>
    ${actions}
  </div>`;
}

export function screenHeader({ back = true, right = '' }) {
  return `<div class="between" style="padding-top:4px">
    ${back ? `<button class="icon-btn" data-act="back" aria-label="Back">${icon.back()}</button>` : '<span></span>'}
    <div class="row gap8">${right}</div>
  </div>`;
}
