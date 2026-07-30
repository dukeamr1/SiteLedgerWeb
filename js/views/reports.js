import * as S from '../store.js';
import { esc, grouped, isWithin } from '../format.js';
import { money, dot } from './components.js';

export function reportsView(ctx, range) {
  const { t, lang } = ctx;
  const scoped = S.S.expenses.filter((e) => isWithin(e.date, range));
  const total = S.sum(scoped);
  const unitCount = new Set(scoped.map((e) => e.unitId)).size;

  const sub = lang === 'ar'
    ? `${scoped.length} ${t('entries')} ${t('across')} ${unitCount} ${t('activeUnits')}`
    : `${scoped.length} payments across ${unitCount} units`;

  return `<div class="stack gap16">
    <h1 class="title" style="padding-top:4px">${esc(t('reports'))}</h1>

    <div class="segmented">
      <button class="${range === 'week' ? 'active' : ''}" data-act="report-range" data-range="week">${esc(t('week'))}</button>
      <button class="${range === 'month' ? 'active' : ''}" data-act="report-range" data-range="month">${esc(t('month'))}</button>
    </div>

    <div class="card">
      <div class="micro mb8">${esc(range === 'week' ? t('thisWeek') : t('thisMonth'))}</div>
      ${money(total, { size: 42, lang })}
      <div class="mt10" style="font-size:12px;color:var(--fg2)">${esc(sub)}</div>
    </div>

    <div class="detail-grid">
      <div class="card">
        <h3 class="card-title">${esc(t('byUnit'))}</h3>
        ${byUnit(scoped, ctx)}
      </div>

      <div class="card">
        <h3 class="card-title">${esc(t('byCategory'))}</h3>
        ${byCategory(scoped, ctx)}
      </div>
    </div>
  </div>`;
}

function byUnit(scoped, { t, lang }) {
  const map = new Map();
  for (const e of scoped) {
    map.set(e.unitId, (map.get(e.unitId) || 0) + e.amount);
  }
  const rows = [...map.entries()]
    .map(([id, amount]) => ({ unit: S.unitById(id), amount }))
    .filter((r) => r.unit)
    .sort((a, b) => b.amount - a.amount);

  if (!rows.length) return emptyLine(t);
  const max = Math.max(...rows.map((r) => r.amount), 1);

  return rows.map((r) => `
    <div class="bar-row">
      <div class="bar-head">
        <span class="ellipsis">${esc(r.unit.name)}</span>
        <span class="tabular">${grouped(r.amount, lang)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (r.amount / max) * 100)}%"></div></div>
    </div>`).join('');
}

function byCategory(scoped, { t, lang }) {
  const map = new Map();
  for (const e of scoped) {
    const cat = e.categoryId ? S.categoryById(e.categoryId) : null;
    const name = cat ? cat.name : t('uncategorized');
    const color = cat ? cat.colorHex : S.UNCATEGORIZED_HEX;
    if (!map.has(name)) map.set(name, { name, color, amount: 0 });
    map.get(name).amount += e.amount;
  }
  const rows = [...map.values()].sort((a, b) => b.amount - a.amount);
  if (!rows.length) return emptyLine(t);
  const max = Math.max(...rows.map((r) => r.amount), 1);

  return rows.map((r) => `
    <div class="cat-bar-row">
      ${dot(r.color, 'dot-11')}
      <span class="grow ellipsis" style="font-size:12.5px;font-weight:500">${esc(r.name)}</span>
      <div class="cat-bar-track">
        <div class="bar-fill" style="width:${Math.max(6, (r.amount / max) * 100)}%;background:${esc(r.color)}"></div>
      </div>
      <span class="cat-bar-amt">${grouped(r.amount, lang)}</span>
    </div>`).join('');
}

function emptyLine(t) {
  return `<div style="font-size:13px;color:var(--fg3)">${esc(t('noSpend'))}</div>`;
}
