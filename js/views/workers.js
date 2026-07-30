import * as S from '../store.js';
import { esc, grouped, dateLabel } from '../format.js';
import { icon, money, avatar, emptyState, screenHeader } from './components.js';

export function workersView(ctx) {
  const { t, lang } = ctx;
  const ranked = S.workersRanked();

  if (!ranked.length) {
    return `<div class="stack gap14">
      <h1 class="title" style="padding-top:4px">${esc(t('workers'))}</h1>
      ${emptyState({ iconHtml: icon.people(38), title: t('noWorkersTitle'), body: t('noWorkersBody') })}
    </div>`;
  }

  return `<div class="stack gap14">
    <h1 class="title" style="padding-top:4px">${esc(t('workers'))}</h1>
    <div class="list card-grid">
      ${ranked.map(({ worker, total, count }) => {
        const units = new Set(S.expensesOfWorker(worker.id).map((e) => e.unitId)).size;
        const trade = tradeLabel(worker, t) || `${count} ${t('payments')}`;
        return `<button class="list-row" data-act="open-worker" data-id="${esc(worker.id)}">
          ${avatar(worker.name)}
          <div class="grow">
            <div style="font-size:14.5px;font-weight:600" class="ellipsis">${esc(worker.name)}</div>
            <div class="row-sub">${esc(trade)}</div>
          </div>
          <div style="text-align:end">
            <div class="amount" style="font-size:15px;color:var(--money)">${grouped(total, lang)}<span style="font-size:10px;font-weight:500;opacity:.6"> EGP</span></div>
            <div class="row-date">${units} ${esc(t('activeUnits'))}</div>
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

export function workerDetailView(ctx, workerId, unitFilter) {
  const { t, lang } = ctx;
  const worker = S.workerById(workerId);
  if (!worker) return '<div></div>';

  const all = S.expensesOfWorker(worker.id);
  const unitIds = [...new Set(all.map((e) => e.unitId))];
  const payments = unitFilter ? all.filter((e) => e.unitId === unitFilter) : all;
  const total = S.sum(payments);

  const filters = unitIds.length > 1 ? `
    <div class="chips scroll">
      <button class="chip${!unitFilter ? ' active' : ''}" data-act="worker-filter" data-unit="">${esc(t('allUnits'))}</button>
      ${unitIds.map((id) => {
        const u = S.unitById(id);
        return u ? `<button class="chip${unitFilter === id ? ' active' : ''}" data-act="worker-filter" data-unit="${esc(id)}">${esc(u.name)}</button>` : '';
      }).join('')}
    </div>` : '';

  return `<div class="stack gap16">
    ${screenHeader({})}
    <div class="row gap14">
      ${avatar(worker.name, 62)}
      <div>
        <h1 class="title" style="font-size:26px">${esc(worker.name)}</h1>
        <div style="font-size:12.5px;color:var(--fg3);margin-top:5px">${esc(tradeLabel(worker, t))}</div>
      </div>
    </div>

    <div class="card">
      <div class="micro mb8">${esc(t('paidToDate'))}</div>
      ${money(total, { size: 38, lang })}
      <div class="mt10" style="font-size:12px;color:var(--fg2);font-weight:500">
        ${payments.length} ${esc(t('payments'))} · ${new Set(payments.map((e) => e.unitId)).size} ${esc(t('activeUnits'))}
      </div>
    </div>

    ${filters}

    <h3 class="card-title" style="margin:0">${esc(t('payments'))}</h3>
    <div class="list">
      ${payments.map((e) => {
        const unit = S.unitById(e.unitId);
        const cat = e.categoryId ? S.categoryById(e.categoryId) : null;
        const sub = e.subcategoryId ? S.subcategoryById(e.subcategoryId) : null;
        const bits = [cat && cat.name, sub && sub.name, e.note].filter(Boolean);
        return `<button class="list-row" data-act="edit-expense" data-id="${esc(e.id)}">
          <span class="spine" style="background:${esc(cat ? cat.colorHex : S.UNCATEGORIZED_HEX)}"></span>
          <div class="grow">
            <div class="row-title ellipsis">${esc(unit ? unit.name : '—')}</div>
            <div class="row-sub ellipsis">${esc(bits.join(' · '))}</div>
          </div>
          <div style="text-align:end">
            <div class="amount" style="font-size:14.5px">${grouped(e.amount, lang)}</div>
            <div class="row-date">${esc(dateLabel(e.date, t, lang))}</div>
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function tradeLabel(worker, t) {
  if (!worker.trade) return '';
  return worker.trade === 'other' ? (worker.tradeOther || t('other')) : t(worker.trade);
}
