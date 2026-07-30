import * as S from '../store.js';
import { esc, grouped, short, dateLabel, pct } from '../format.js';
import { icon, money, dot, progressBar, donut, methodTag, avatar, emptyState, screenHeader } from './components.js';

export function unitView(ctx, unitId) {
  const { t, lang } = ctx;
  const unit = S.unitById(unitId);
  if (!unit) return '<div class="screen"></div>';

  const expenses = S.expensesOf(unit.id);
  const total = S.unitTotal(unit.id);
  const frac = S.budgetFraction(unit);
  const over = frac !== null && frac > 1;

  const head = screenHeader({
    right: `
      <button class="pill-btn" data-act="open-statement" data-id="${esc(unit.id)}">${icon.share(14)}${esc(t('shareBtn'))}</button>
      <button class="icon-btn sm" data-act="edit-unit" data-id="${esc(unit.id)}" aria-label="${esc(t('editUnitTitle'))}">${icon.menu(15)}</button>`,
  });

  const title = `
    <div>
      <h1 class="title">${esc(unit.name)}</h1>
      <div style="font-size:12.5px;color:var(--fg3);margin-top:6px">
        ${esc(unit.clientName || '—')}${unit.address ? ' · ' + esc(unit.address) : ''}
      </div>
    </div>`;

  const totalCard = `
    <div class="card">
      <div class="micro mb8">${esc(t('totalSpent'))}</div>
      ${money(total, { size: 40, lang })}
      ${frac !== null ? `
        <div class="mt16">
          ${progressBar(frac, { over })}
          <div class="between mt8">
            <span style="font-size:11.5px;color:var(--fg2);font-weight:500">${grouped(total, lang)} / ${grouped(unit.budget, lang)} EGP</span>
            <span style="font-size:12px;font-weight:700;color:${over ? 'var(--over)' : 'var(--money)'}">${Math.round(frac * 100)}%</span>
          </div>
        </div>` : `<div class="mt12" style="font-size:12px;color:var(--fg3);font-weight:500">${esc(t('noBudget'))}</div>`}
    </div>`;

  if (!expenses.length) {
    return `<div class="stack gap16">
      ${head}${title}${totalCard}
      ${emptyState({ iconHtml: icon.money(34), title: t('noExpTitle'), body: t('noExpBody') })}
    </div>`;
  }

  const slices = S.categoryBreakdown(unit.id).map((b) => ({ ...b, name: b.name || t('uncategorized') }));
  const workers = S.workersOnUnit(unit.id);

  const breakdown = `
    <div class="card">
      <h3 class="card-title">${esc(t('byCategory'))}</h3>
      ${donut(slices, total, t('total'), short(total))}
      <div class="breakdown">
        ${slices.map((s) => `
          <button class="breakdown-row" data-act="open-cat-history" data-unit="${esc(unit.id)}" data-cat="${esc(s.categoryId || '')}">
            ${dot(s.colorHex, 'dot-12')}
            <span class="grow breakdown-name ellipsis">${esc(s.name)}</span>
            <span class="amount" style="font-size:14px">${grouped(s.amount, lang)}</span>
            <span class="breakdown-pct">${pct(s.amount, total)}%</span>
            <span class="chev">${icon.chevron(12)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  const workerStrip = workers.length ? `
    <div>
      <div class="micro mb10" style="letter-spacing:.08em;font-size:11px">${esc(t('workersOnUnit'))}</div>
      <div class="chips scroll">
        ${workers.map(({ worker, total: wt }) => `
          <button class="worker-pill" data-act="open-worker" data-id="${esc(worker.id)}">
            ${avatar(worker.name, 30)}
            <span style="text-align:start">
              <span style="display:block;font-size:12px;font-weight:600" class="ellipsis">${esc(worker.name)}</span>
              <span style="display:block;font-size:11px;font-weight:700;color:var(--money)" class="tabular">${grouped(wt, lang)}</span>
            </span>
          </button>`).join('')}
      </div>
    </div>` : '';

  const list = `
    <div class="between" style="align-items:baseline">
      <h3 class="card-title" style="margin:0">${esc(t('expenses'))}</h3>
      <span style="font-size:11px;color:var(--fg3);font-weight:500">${esc(t('swipeHint'))}</span>
    </div>
    <div class="list">
      ${expenses.map((e) => expenseRow(e, ctx)).join('')}
    </div>`;

  // Two-column on desktop (summary left, payment list right); stacked on mobile.
  return `<div class="stack gap16">
    ${head}${title}
    <div class="detail-grid">
      <div class="stack gap16">${totalCard}${breakdown}${workerStrip}</div>
      <div class="stack gap12">${list}</div>
    </div>
  </div>`;
}

export function expenseRow(e, { t, lang }) {
  const cat = e.categoryId ? S.categoryById(e.categoryId) : null;
  const sub = e.subcategoryId ? S.subcategoryById(e.subcategoryId) : null;
  const worker = e.workerId ? S.workerById(e.workerId) : null;
  const color = cat ? cat.colorHex : S.UNCATEGORIZED_HEX;

  const title = cat ? cat.name : t('uncategorized');
  const parts = [sub && sub.name, worker && worker.name, e.note].filter(Boolean);
  const subtitle = parts.length ? parts.join(' · ') : (e.method === 'transfer' ? t('transfer') : t('cash'));

  return `<div class="swipe" data-swipe data-id="${esc(e.id)}">
    <div class="swipe-actions">
      <button class="edit" data-act="edit-expense" data-id="${esc(e.id)}">${icon.pencil(17)}${esc(t('edit'))}</button>
      <button class="del" data-act="delete-expense" data-id="${esc(e.id)}">${icon.trash(17)}${esc(t('delete'))}</button>
    </div>
    <div class="swipe-body list-row" data-act="edit-expense" data-id="${esc(e.id)}">
      <span class="spine" style="background:${esc(color)}"></span>
      <div class="grow">
        <div class="row-title ellipsis">${esc(title)}</div>
        <div class="row-sub ellipsis">${esc(subtitle)}</div>
      </div>
      <div style="text-align:end;flex-shrink:0">
        <div class="amount" style="font-size:15px">${grouped(e.amount, lang)}</div>
        <div class="row gap6" style="justify-content:flex-end;margin-top:2px">
          ${methodTag(e.method, t)}
          <span class="row-date">${esc(dateLabel(e.date, t, lang))}</span>
        </div>
      </div>
    </div>
  </div>`;
}
