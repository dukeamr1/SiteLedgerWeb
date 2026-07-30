import * as S from '../store.js';
import { esc, grouped, dateLabel, startOfDayKey } from '../format.js';
import { icon, money, dot, subDot, methodTag, screenHeader } from './components.js';

/**
 * Payment history for one category within a unit: total, a subcategory filter,
 * and every payment grouped by day with its date. `categoryId === null` is the
 * Uncategorized bucket.
 */
export function categoryHistoryView(ctx, unitId, categoryId, filter) {
  const { t, lang } = ctx;
  const unit = S.unitById(unitId);
  if (!unit) return '<div></div>';

  const cat = categoryId ? S.categoryById(categoryId) : null;
  const color = cat ? cat.colorHex : S.UNCATEGORIZED_HEX;
  const name = cat ? cat.name : t('uncategorized');

  const all = S.expensesOf(unitId).filter((e) => (e.categoryId || null) === (categoryId || null));
  const subs = cat ? S.subcategoriesOf(cat.id) : [];
  const present = new Set(all.map((e) => e.subcategoryId).filter(Boolean));
  const usableSubs = subs.filter((s) => present.has(s.id));
  const hasBare = all.some((e) => !e.subcategoryId);

  const filtered = filter === 'all'
    ? all
    : filter === 'none'
      ? all.filter((e) => !e.subcategoryId)
      : all.filter((e) => e.subcategoryId === filter);

  const total = S.sum(filtered);

  const chips = usableSubs.length ? `
    <div class="chips scroll">
      <button class="chip${filter === 'all' ? ' active' : ''}" data-act="cat-filter" data-filter="all">${esc(t('all'))}</button>
      ${usableSubs.map((s) => `
        <button class="chip${filter === s.id ? ' active' : ''}" data-act="cat-filter" data-filter="${esc(s.id)}">
          ${subDot(color, 10)}${esc(s.name)}
        </button>`).join('')}
      ${hasBare ? `<button class="chip${filter === 'none' ? ' active' : ''}" data-act="cat-filter" data-filter="none">${esc(t('noSubcategory'))}</button>` : ''}
    </div>` : '';

  return `<div class="stack gap16">
    ${screenHeader({})}
    <div class="row gap12">
      ${dot(color, 'dot-14')}
      <h1 class="title" style="font-size:28px">${esc(name)}</h1>
    </div>

    <div class="card">
      <div class="micro mb8">${esc(t('totalSpent'))}</div>
      ${money(total, { size: 34, lang })}
      <div class="mt10" style="font-size:12px;color:var(--fg2);font-weight:500">
        ${filtered.length} ${esc(t('payments'))}
      </div>
    </div>

    ${chips}

    <h3 class="card-title" style="margin:0">${esc(t('paymentHistory'))}</h3>

    ${filtered.length
      ? groupByDay(filtered).map((g) => dayGroup(g, ctx, color)).join('')
      : `<div style="font-size:13px;color:var(--fg3)">${esc(t('noPaymentsHere'))}</div>`}
  </div>`;
}

function groupByDay(list) {
  const map = new Map();
  for (const e of list) {
    const key = startOfDayKey(e.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([day, items]) => ({ day, items: items.sort((a, b) => new Date(b.date) - new Date(a.date)) }));
}

function dayGroup({ day, items }, ctx, color) {
  const { t, lang } = ctx;
  return `<div>
    <div class="day-label">${esc(dateLabel(new Date(day).toISOString(), t, lang))}</div>
    <div class="list">
      ${items.map((e) => historyRow(e, ctx, color)).join('')}
    </div>
  </div>`;
}

function historyRow(e, { t, lang }, color) {
  const sub = e.subcategoryId ? S.subcategoryById(e.subcategoryId) : null;
  const worker = e.workerId ? S.workerById(e.workerId) : null;
  const cat = e.categoryId ? S.categoryById(e.categoryId) : null;

  // Title prefers the subcategory, then the worker, then the category name.
  const title = (sub && sub.name) || (worker && worker.name) || (cat ? cat.name : t('uncategorized'));
  const bits = [];
  if (sub && worker) bits.push(worker.name);
  if (e.note) bits.push(e.note);

  return `<button class="list-row" data-act="edit-expense" data-id="${esc(e.id)}">
    <span class="spine" style="background:${esc(color)}"></span>
    <div class="grow">
      <div class="row-title ellipsis">${esc(title)}</div>
      ${bits.length ? `<div class="row-sub ellipsis">${esc(bits.join(' · '))}</div>` : ''}
    </div>
    <div style="text-align:end;flex-shrink:0">
      <div class="amount" style="font-size:15px">${grouped(e.amount, lang)}</div>
      <div class="row gap6" style="justify-content:flex-end;margin-top:2px">
        ${methodTag(e.method, t)}
        <span class="row-date">${esc(dateLabel(e.date, t, lang))}</span>
      </div>
    </div>
  </button>`;
}
