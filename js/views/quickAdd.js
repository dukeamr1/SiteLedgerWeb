import * as S from '../store.js';
import { esc, grouped, hexA } from '../format.js';
import { icon, dot, subDot } from './components.js';

/**
 * Quick add / edit expense sheet. `q` is the working state in app state:
 *   { id, digits, unitId, categoryId, subcategoryId, method, workerName, note,
 *     photo, showMore, pane: 'main'|'unit'|'category', catSearch }
 */
export function quickAddSheet(ctx, q) {
  const { t } = ctx;
  const body = q.pane === 'unit' ? unitPane(ctx, q)
    : q.pane === 'category' ? categoryPane(ctx, q)
    : mainPane(ctx, q);

  return `<div class="scrim" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(q.id ? t('editExpense') : t('addExpense'))}">
      <div class="sheet-grab"></div>
      ${body}
    </div>`;
}

function mainPane(ctx, q) {
  const { t, lang } = ctx;
  const unit = q.unitId ? S.unitById(q.unitId) : null;
  const cat = q.categoryId ? S.categoryById(q.categoryId) : null;
  const sub = q.subcategoryId ? S.subcategoryById(q.subcategoryId) : null;

  const display = q.digits ? grouped(parseInt(q.digits, 10), lang) : '0';
  const sizeClass = display.length > 7 ? 'len8' : display.length > 5 ? 'len6' : '';

  const catLabel = cat ? (sub ? `${cat.name} · ${sub.name}` : cat.name) : t('uncategorized');
  const catColor = cat ? cat.colorHex : null;

  return `
    <div class="sheet-head">
      <span class="sheet-title">${esc(q.id ? t('editExpense') : t('addExpense'))}</span>
      <button class="icon-btn sm" data-act="close-sheet" aria-label="Close">${icon.close(16)}</button>
    </div>

    <div class="qa-amount">
      <div class="baseline" style="justify-content:center">
        <span class="qa-digits ${sizeClass}${q.digits ? '' : ' empty'}">${esc(display)}</span>
        <span class="qa-egp">EGP</span>
      </div>
      <div class="qa-chips">
        <button class="qa-chip" data-act="qa-pane" data-pane="unit">
          ${dot(unit ? unit.accentHex : 'var(--fg3)')}
          <span class="ellipsis">${esc(unit ? unit.name : t('chooseUnit'))}</span>
        </button>
        <button class="qa-chip" data-act="qa-pane" data-pane="category"
          style="${catColor ? `background:${hexA(catColor, 0.13)};color:${catColor};box-shadow:none` : 'background:var(--field);color:var(--fg2);box-shadow:none'}">
          ${catColor ? dot(catColor) : '<span class="dot dot-8" style="background:var(--fg3)"></span>'}
          <span class="ellipsis">${esc(catLabel)}</span>
        </button>
      </div>
    </div>

    <div class="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-act="key" data-key="${n}">${n}</button>`).join('')}
      <button class="key sm" data-act="key" data-key="000">000</button>
      <button class="key" data-act="key" data-key="0">0</button>
      <button class="key sm" data-act="key" data-key="b" aria-label="Backspace">${icon.backspace(24)}</button>
    </div>

    <div class="row gap9" style="padding:6px 20px 4px;flex-shrink:0">
      <button class="btn-ghost" style="flex:1" data-act="toggle-more">${esc(q.showMore ? t('lessDetails') : t('moreDetails'))}</button>
      <div class="segmented" style="border-radius:13px">
        <button class="${q.method === 'cash' ? 'active' : ''}" style="height:34px;padding:0 16px;flex:none" data-act="method" data-method="cash">${esc(t('cash'))}</button>
        <button class="${q.method === 'transfer' ? 'active' : ''}" style="height:34px;padding:0 16px;flex:none" data-act="method" data-method="transfer">${esc(t('transfer'))}</button>
      </div>
    </div>

    ${q.showMore ? `
      <div class="stack gap8" style="padding:4px 20px;flex-shrink:0">
        <div class="field sm">${icon.person(17)}
          <input data-field="qa-worker" value="${esc(q.workerName)}" placeholder="${esc(t('addWorker'))}"
                 autocomplete="off" list="worker-list" style="font-size:14px">
        </div>
        <datalist id="worker-list">${S.S.workers.map((w) => `<option value="${esc(w.name)}"></option>`).join('')}</datalist>
        <div class="field sm">${icon.note(17)}
          <input data-field="qa-note" value="${esc(q.note)}" placeholder="${esc(t('addNote'))}" autocomplete="off" style="font-size:14px">
        </div>
        <label class="field sm" style="color:${q.photo ? 'var(--money)' : 'var(--fg3)'};cursor:pointer">
          ${q.photo ? icon.check(17) : icon.camera(17)}
          <span style="font-size:14px;font-weight:500">${esc(q.photo ? t('photoAdded') : t('photo'))}</span>
          <input type="file" accept="image/*" data-field="qa-photo" hidden>
        </label>
      </div>` : ''}

    <div class="qa-actions">
      <button class="qa-save" data-act="save-expense">${esc(t('save'))}</button>
      <button class="qa-add" data-act="save-another" aria-label="Save and add another">${icon.plus(22)}</button>
    </div>`;
}

function unitPane(ctx, q) {
  const { t } = ctx;
  return `
    <div class="sheet-head" style="gap:12px;justify-content:flex-start">
      <button class="icon-btn sm" data-act="qa-pane" data-pane="main" aria-label="Back">${icon.back(17)}</button>
      <span class="sheet-title">${esc(t('chooseUnit'))}</span>
    </div>
    <div class="sheet-body" style="padding-top:12px">
      <div class="stack gap8">
        ${S.unitsSorted().map((u) => `
          <button class="pick-row${u.id === q.unitId ? ' selected' : ''}" data-act="pick-unit" data-id="${esc(u.id)}">
            ${dot(u.accentHex, 'dot-14')}
            <span class="grow">
              <span style="display:block" class="pick-name ellipsis">${esc(u.name)}</span>
              <span style="display:block;font-size:11.5px;color:var(--fg3);margin-top:2px" class="ellipsis">${esc(u.clientName || '—')}</span>
            </span>
            ${u.id === q.unitId ? `<span class="tick">${icon.check(18)}</span>` : ''}
          </button>`).join('')}
      </div>
    </div>`;
}

function categoryPane(ctx, q) {
  const { t } = ctx;
  const cats = q.unitId ? S.categoriesOf(q.unitId) : [];
  const query = (q.catSearch || '').trim().toLowerCase();
  const filtered = query ? cats.filter((c) => c.name.toLowerCase().includes(query)) : cats;
  const exact = cats.some((c) => c.name.toLowerCase() === query);
  const showCreate = query.length > 0 && !exact;
  const createColor = S.colorForName(q.catSearch, null) || S.nextColor();

  return `
    <div class="sheet-head" style="gap:12px;justify-content:flex-start">
      <button class="icon-btn sm" data-act="qa-pane" data-pane="main" aria-label="Back">${icon.back(17)}</button>
      <span class="sheet-title">${esc(t('chooseCategory'))}</span>
    </div>

    <div style="padding:12px 20px 8px;flex-shrink:0">
      <div class="field" style="height:48px">
        ${icon.search(18)}
        <input data-field="qa-cat-search" value="${esc(q.catSearch || '')}" placeholder="${esc(t('searchOrCreate'))}"
               autocomplete="off" data-enter="create-cat" style="font-size:15px">
      </div>
    </div>

    <div class="sheet-body">
      <div class="stack gap7" style="gap:7px">
        ${showCreate ? `
          <button class="pick-row create" data-act="create-cat">
            ${dot(createColor, 'dot-14')}
            <span class="grow pick-name ellipsis" style="color:var(--money)">${esc(createLabel(q.catSearch, ctx))}</span>
            ${icon.plus(19)}
          </button>` : ''}

        ${filtered.map((c) => {
          const subs = S.subcategoriesOf(c.id);
          const catSelected = c.id === q.categoryId && !q.subcategoryId;
          return `
            <button class="pick-row${catSelected ? ' selected' : ''}" data-act="pick-cat" data-id="${esc(c.id)}">
              ${dot(c.colorHex, 'dot-14')}
              <span class="grow pick-name ellipsis">${esc(c.name)}</span>
              ${catSelected ? `<span class="tick">${icon.check(18)}</span>` : ''}
            </button>
            ${subs.map((s) => `
              <button class="pick-row sub${s.id === q.subcategoryId ? ' selected' : ''}"
                      data-act="pick-sub" data-id="${esc(c.id)}" data-sub="${esc(s.id)}">
                ${subDot(c.colorHex, 12)}
                <span class="grow pick-name ellipsis">${esc(s.name)}</span>
                ${s.id === q.subcategoryId ? `<span class="tick">${icon.check(16)}</span>` : ''}
              </button>`).join('')}`;
        }).join('')}

        <button class="pick-row${!q.categoryId ? ' selected' : ''}" data-act="pick-cat" data-id="">
          <span class="dot dot-14" style="border:1.5px dashed var(--fg3);background:transparent"></span>
          <span class="grow pick-name" style="font-weight:500;color:var(--fg2)">${esc(t('uncategorized'))}</span>
          ${!q.categoryId ? `<span class="tick">${icon.check(18)}</span>` : ''}
        </button>
      </div>
    </div>`;
}

function createLabel(query, { lang }) {
  const name = (query || '').trim();
  return lang === 'ar' ? `إنشاء «${name}»` : `Create "${name}"`;
}
