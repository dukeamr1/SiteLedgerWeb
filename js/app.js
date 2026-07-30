// Site Ledger PWA — router, rendering and interaction.
// Views are pure functions returning HTML; all interaction runs through a single
// delegated listener keyed on [data-act].

import * as S from './store.js';
import { makeT } from './i18n.js';
import { buildSeed } from './seed.js';
import { esc, grouped, uid, haptic } from './format.js';
import { icon } from './views/components.js';
import { homeView } from './views/home.js';
import { unitView } from './views/unit.js';
import { categoryHistoryView } from './views/categoryHistory.js';
import { unitEditView } from './views/unitEdit.js';
import { quickAddSheet } from './views/quickAdd.js';
import { workersView, workerDetailView } from './views/workers.js';
import { reportsView } from './views/reports.js';
import { moreSheet, confirmSheet } from './views/sheets.js';
import { statementSheet, statementSummary } from './views/statement.js';

const appEl = document.getElementById('app');
const tabbarEl = document.getElementById('tabbar');
const overlayEl = document.getElementById('overlay');
const toastHost = document.getElementById('toast-host');

const BASE = { units: { name: 'home' }, workers: { name: 'workers' }, reports: { name: 'reports' } };

const state = {
  tab: 'units',
  stacks: { units: [], workers: [], reports: [] },
  reportRange: 'week',
  catFilter: 'all',
  workerFilter: null,
  stmtRange: 'all',
  qa: null,       // quick-add working state
  edit: null,     // unit-edit draft
  sheet: null,    // { type, ... }
  installEvent: null,
  installDismissed: false,
};

let toastTimer = null;

/* ----------------------------- context ----------------------------- */

function ctx() {
  const lang = S.S.lang;
  return { t: makeT(lang), lang };
}

function currentRoute() {
  const stack = state.stacks[state.tab];
  return stack.length ? stack[stack.length - 1] : BASE[state.tab];
}

function push(route) { state.stacks[state.tab].push(route); render(); }
function back() {
  const stack = state.stacks[state.tab];
  if (stack.length) stack.pop();
  render();
}

/* ----------------------------- render ----------------------------- */

function screenHtml(c) {
  const route = currentRoute();
  switch (route.name) {
    case 'home': return homeView({ ...c, installBanner: installBannerHtml(c) });
    case 'unit': return unitView(c, route.id);
    case 'catHistory': return categoryHistoryView(c, route.unitId, route.catId, state.catFilter);
    case 'unitEdit': return unitEditView(c, state.edit);
    case 'workers': return workersView(c);
    case 'worker': return workerDetailView(c, route.id, state.workerFilter);
    case 'reports': return reportsView(c, state.reportRange);
    default: return '';
  }
}

function tabbarHtml(c) {
  const { t } = c;
  const inUnits = state.tab === 'units';
  const tab = (id, ic, label, active) => `
    <button class="tab${active ? ' active' : ''}" data-act="tab" data-tab="${id}">
      ${ic}<span>${esc(label)}</span>
    </button>`;

  // The wordmark and the FAB's text label only show in the desktop sidebar.
  return `
    <div class="sidebar-head">
      <span class="sidebar-logo">S</span>
      <span class="sidebar-word">Site Ledger</span>
    </div>
    ${tab('units', icon.home(21), t('units'), inUnits)}
    ${tab('reports', icon.chart(21), t('reports'), state.tab === 'reports')}
    <button class="fab" data-act="open-quick-add" aria-label="${esc(t('addExpense'))}">
      ${icon.plus(27)}<span class="fab-label">${esc(t('addExpense'))}</span>
    </button>
    ${tab('workers', icon.people(21), t('workers'), state.tab === 'workers')}
    <button class="tab" data-act="open-more">${icon.dots(21)}<span>${esc(t('more'))}</span></button>`;
}

function sheetHtml(c) {
  const s = state.sheet;
  if (!s) return '';
  switch (s.type) {
    case 'more': return moreSheet(c);
    case 'quickadd': return quickAddSheet(c, state.qa);
    case 'statement': return statementSheet(c, s.unitId, state.stmtRange);
    case 'confirm': return confirmSheet(c, s);
    default: return '';
  }
}

function installBannerHtml(c) {
  if (!state.installEvent || state.installDismissed) return '';
  const { t } = c;
  return `<div class="install-banner">
    <span style="color:var(--money)">${icon.download(19)}</span>
    <span class="grow txt">${esc(t('installHint'))}</span>
    <button class="chip active" data-act="install">${esc(t('install'))}</button>
    <button class="mini-btn" data-act="dismiss-install" aria-label="Dismiss">${icon.close(14)}</button>
  </div>`;
}

export function render() {
  const c = ctx();
  const doc = document.documentElement;
  doc.lang = c.lang;
  doc.dir = c.lang === 'ar' ? 'rtl' : 'ltr';

  // Remember focus so live-filtering inputs don't lose the caret on re-render.
  const active = document.activeElement;
  const fkey = active && active.dataset && active.dataset.field
    ? { field: active.dataset.field, key: active.dataset.key || '', sub: active.dataset.sub || '', pos: active.selectionStart }
    : null;

  appEl.innerHTML = screenHtml(c);
  tabbarEl.innerHTML = tabbarHtml(c);
  overlayEl.innerHTML = sheetHtml(c);

  if (fkey) {
    let sel = `[data-field="${fkey.field}"]`;
    if (fkey.key) sel += `[data-key="${fkey.key}"]`;
    if (fkey.sub) sel += `[data-sub="${fkey.sub}"]`;
    const el = document.querySelector(sel);
    if (el) {
      el.focus();
      try { el.setSelectionRange(fkey.pos, fkey.pos); } catch { /* not a text input */ }
    }
  }
}

function applyTheme() {
  const pref = S.S.themePref;
  if (pref === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', pref);
}

function toast(msg) {
  toastHost.innerHTML = `<div id="toast">${icon.check(18)}<span>${esc(msg)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastHost.innerHTML = ''; }, 1800);
}

function closeSheet() { state.sheet = null; state.qa = null; render(); }

/* ----------------------------- quick add ----------------------------- */

function newQuickAdd(seed) {
  if (seed) return seed;
  const unitId = S.S.lastUnitId && S.unitById(S.S.lastUnitId)
    ? S.S.lastUnitId
    : (S.unitsSorted()[0] || {}).id || null;
  const firstCat = unitId ? S.categoriesOf(unitId)[0] : null;
  return {
    id: null, digits: '', unitId, categoryId: firstCat ? firstCat.id : null, subcategoryId: null,
    method: 'cash', workerName: '', note: '', photo: null,
    showMore: false, pane: 'main', catSearch: '',
  };
}

function seedFromExpense(e) {
  const worker = e.workerId ? S.workerById(e.workerId) : null;
  return {
    id: e.id, digits: String(e.amount || ''), unitId: e.unitId,
    categoryId: e.categoryId, subcategoryId: e.subcategoryId,
    method: e.method, workerName: worker ? worker.name : '', note: e.note || '',
    photo: e.photo || null,
    showMore: Boolean(worker || e.note || e.photo), pane: 'main', catSearch: '',
  };
}

function openQuickAdd(seed) {
  if (!S.S.units.length) { newUnitDraft(); return; }
  state.qa = newQuickAdd(seed);
  state.sheet = { type: 'quickadd' };
  render();
}

async function saveExpense(another) {
  const q = state.qa;
  const { t } = ctx();
  const amount = parseInt(q.digits || '0', 10);
  if (!amount || !q.unitId) { toast(t('enterAmount')); return; }

  haptic(16);
  const worker = await S.findOrCreateWorker(q.workerName);
  await S.saveExpense({
    id: q.id, amount, unitId: q.unitId, categoryId: q.categoryId,
    subcategoryId: q.subcategoryId, workerId: worker ? worker.id : null,
    method: q.method, note: q.note, photo: q.photo,
  });

  toast(`${t('saved')} ${grouped(amount)} EGP`);

  if (another) {
    // Keep unit/category so repeated logging stays fast; reset the amount only.
    q.id = null; q.digits = ''; q.workerName = ''; q.note = ''; q.photo = null;
    render();
  } else {
    closeSheet();
  }
}

/* ----------------------------- unit edit ----------------------------- */

function draftFromUnit(unit) {
  if (!unit) {
    return { id: null, name: '', clientName: '', budgetText: '', cats: [], newCat: '', recolorKey: null };
  }
  return {
    id: unit.id,
    name: unit.name,
    clientName: unit.clientName || '',
    budgetText: unit.budget ? String(unit.budget) : '',
    newCat: '',
    recolorKey: null,
    cats: S.categoriesOf(unit.id).map((c) => ({
      key: c.id, existingId: c.id, name: c.name, colorHex: c.colorHex,
      expenseCount: S.S.expenses.filter((e) => e.categoryId === c.id).length,
      newSub: '', subsOpen: false,
      subs: S.subcategoriesOf(c.id).map((s) => ({
        key: s.id, existingId: s.id, name: s.name,
        expenseCount: S.S.expenses.filter((e) => e.subcategoryId === s.id).length,
      })),
    })),
  };
}

function newUnitDraft() {
  state.edit = draftFromUnit(null);
  state.sheet = null;
  state.tab = 'units';
  push({ name: 'unitEdit' });
}

function findCat(key) { return state.edit.cats.find((c) => c.key === key); }

function addCategory(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  const d = state.edit;
  if (d.cats.some((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase())) return;
  const reused = S.colorForName(trimmed, d.id);
  d.cats.push({
    key: uid(), existingId: null, name: trimmed,
    colorHex: reused || S.nextColor(d.cats.length),
    expenseCount: 0, subs: [], newSub: '', subsOpen: false,
  });
  d.newCat = '';
  render();
}

async function saveUnitDraft() {
  const d = state.edit;
  const { t } = ctx();
  const budget = parseInt(String(d.budgetText).replace(/[^0-9]/g, ''), 10);
  const wasNew = !d.id;
  const unit = await S.saveUnit({
    id: d.id, name: d.name, clientName: d.clientName,
    budget: Number.isFinite(budget) && budget > 0 ? budget : null,
    cats: d.cats,
  });
  haptic(16);
  state.edit = null;
  state.stacks[state.tab].pop();               // leave the editor
  if (wasNew) state.stacks.units.push({ name: 'unit', id: unit.id });
  toast(t('unitSaved'));
  render();
}

/* ----------------------------- photos ----------------------------- */

// Downscale before storing so receipt photos stay small in IndexedDB.
function readPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* ----------------------------- actions ----------------------------- */

const actions = {
  /* nav */
  tab: (el) => { state.tab = el.dataset.tab; render(); },
  back: () => back(),
  'open-unit': (el) => { state.tab = 'units'; push({ name: 'unit', id: el.dataset.id }); },
  'open-worker': (el) => { state.tab = 'workers'; state.workerFilter = null; push({ name: 'worker', id: el.dataset.id }); },
  'open-cat-history': (el) => {
    state.catFilter = 'all';
    push({ name: 'catHistory', unitId: el.dataset.unit, catId: el.dataset.cat || null });
  },
  'cat-filter': (el) => { state.catFilter = el.dataset.filter; render(); },
  'worker-filter': (el) => { state.workerFilter = el.dataset.unit || null; render(); },
  'report-range': (el) => { state.reportRange = el.dataset.range; render(); },

  /* sheets */
  'open-more': () => { state.sheet = { type: 'more' }; render(); },
  'close-sheet': () => closeSheet(),
  'open-quick-add': () => openQuickAdd(null),

  /* language / theme / data */
  'toggle-lang': () => { S.setLang(S.S.lang === 'ar' ? 'en' : 'ar'); state.sheet = null; render(); },
  'set-theme': (el) => { S.setThemePref(el.dataset.theme); applyTheme(); render(); },
  // Both of these destroy existing data, so confirm first — unless the store is
  // already empty, where there is nothing to lose.
  'load-sample': () => {
    const { t } = ctx();
    if (!S.S.units.length && !S.S.expenses.length) return actions['confirm-load-sample']();
    state.sheet = {
      type: 'confirm',
      title: t('sampleConfirmTitle'),
      body: t('sampleConfirmBody'),
      confirmLabel: t('sampleConfirmBtn'),
      act: 'confirm-load-sample',
    };
    render();
  },
  'confirm-load-sample': async () => {
    const { t } = ctx();
    await S.resetAll();
    await S.installSeed(buildSeed());
    state.sheet = null;
    state.stacks = { units: [], workers: [], reports: [] };
    toast(t('loadedSample'));
    render();
  },
  'reset-all': () => {
    const { t } = ctx();
    if (!S.S.units.length && !S.S.expenses.length) return actions['confirm-reset-all']();
    state.sheet = {
      type: 'confirm',
      title: t('resetConfirmTitle'),
      body: t('resetConfirmBody'),
      confirmLabel: t('resetConfirmBtn'),
      act: 'confirm-reset-all',
    };
    render();
  },
  'confirm-reset-all': async () => {
    const { t } = ctx();
    await S.resetAll();
    state.sheet = null;
    state.stacks = { units: [], workers: [], reports: [] };
    toast(t('resetDone'));
    render();
  },

  /* install */
  install: async () => {
    const e = state.installEvent;
    if (!e) return;
    state.installEvent = null;
    e.prompt();
    await e.userChoice.catch(() => null);
    render();
  },
  'dismiss-install': () => { state.installDismissed = true; render(); },

  /* quick add */
  key: (el) => {
    const q = state.qa;
    const d = el.dataset.key;
    haptic(10);
    let a = q.digits;
    if (d === 'b') a = a.slice(0, -1);
    else if (d === '000') { if (a && a !== '0') a += '000'; }
    else a = a === '0' ? d : a + d;
    q.digits = a.slice(0, 10);
    render();
  },
  method: (el) => { state.qa.method = el.dataset.method; haptic(8); render(); },
  'toggle-more': () => { state.qa.showMore = !state.qa.showMore; render(); },
  'qa-pane': (el) => { state.qa.pane = el.dataset.pane; state.qa.catSearch = ''; render(); },
  'pick-unit': (el) => {
    const q = state.qa;
    q.unitId = el.dataset.id;
    const cats = S.categoriesOf(q.unitId);
    if (!cats.some((c) => c.id === q.categoryId)) q.categoryId = cats[0] ? cats[0].id : null;
    q.subcategoryId = null;
    q.pane = 'main';
    render();
  },
  'pick-cat': (el) => {
    const q = state.qa;
    q.categoryId = el.dataset.id || null;
    q.subcategoryId = null;
    q.pane = 'main';
    render();
  },
  'pick-sub': (el) => {
    const q = state.qa;
    q.categoryId = el.dataset.id;
    q.subcategoryId = el.dataset.sub;
    q.pane = 'main';
    render();
  },
  'create-cat': async () => {
    const q = state.qa;
    const name = (q.catSearch || '').trim();
    if (!name || !q.unitId) return;
    const color = S.colorForName(name, null) || S.nextColor();
    const cat = await S.createCategory(q.unitId, name, color);
    q.categoryId = cat.id;
    q.subcategoryId = null;
    q.catSearch = '';
    q.pane = 'main';
    render();
  },
  'save-expense': () => saveExpense(false),
  'save-another': () => saveExpense(true),
  'edit-expense': (el) => {
    const e = S.S.expenses.find((x) => x.id === el.dataset.id);
    if (!e) return;
    openQuickAdd(seedFromExpense(e));
  },
  'delete-expense': async (el) => {
    const { t } = ctx();
    haptic(14);
    await S.deleteExpense(el.dataset.id);
    toast(t('deleted'));
    render();
  },

  /* unit edit */
  'new-unit': () => newUnitDraft(),
  'edit-unit': (el) => {
    state.edit = draftFromUnit(S.unitById(el.dataset.id));
    push({ name: 'unitEdit' });
  },
  'cancel-edit': () => { state.edit = null; back(); },
  'save-unit': () => saveUnitDraft(),
  'add-suggested': (el) => addCategory(el.dataset.name),
  'add-cat': () => addCategory(state.edit.newCat),
  'remove-cat': (el) => {
    const c = findCat(el.dataset.key);
    if (!c) return;
    const { t } = ctx();
    if (c.expenseCount > 0) {
      state.sheet = {
        type: 'confirm',
        title: t('deleteCatTitle') || `${t('delete')} — ${c.name}`,
        body: `${c.expenseCount} ${t('deleteCatBody')}`,
        confirmLabel: t('delete'),
        act: 'confirm-remove-cat',
        payload: { key: c.key },
      };
      render();
    } else {
      state.edit.cats = state.edit.cats.filter((x) => x.key !== c.key);
      render();
    }
  },
  'confirm-remove-cat': (el) => {
    state.edit.cats = state.edit.cats.filter((x) => x.key !== el.dataset.key);
    state.sheet = null;
    render();
  },
  'move-cat': (el) => {
    const d = state.edit;
    const i = d.cats.findIndex((c) => c.key === el.dataset.key);
    const j = i + Number(el.dataset.dir);
    if (i < 0 || j < 0 || j >= d.cats.length) return;
    [d.cats[i], d.cats[j]] = [d.cats[j], d.cats[i]];
    render();
  },
  'toggle-recolor': (el) => {
    state.edit.recolorKey = state.edit.recolorKey === el.dataset.key ? null : el.dataset.key;
    render();
  },
  'pick-color': (el) => {
    const c = findCat(el.dataset.key);
    if (c) c.colorHex = el.dataset.color;
    state.edit.recolorKey = null;
    render();
  },
  'toggle-subs': (el) => {
    const c = findCat(el.dataset.key);
    if (c) c.subsOpen = !c.subsOpen;
    render();
  },
  'add-sub': (el) => {
    const c = findCat(el.dataset.key);
    if (!c) return;
    const name = (c.newSub || '').trim();
    if (!name) return;
    if (c.subs.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) return;
    c.subs.push({ key: uid(), existingId: null, name, expenseCount: 0 });
    c.newSub = '';
    c.subsOpen = true;
    render();
  },
  'remove-sub': (el) => {
    const c = findCat(el.dataset.key);
    if (!c) return;
    c.subs = c.subs.filter((s) => s.key !== el.dataset.sub);
    render();
  },
  'move-sub': (el) => {
    const c = findCat(el.dataset.key);
    if (!c) return;
    const i = c.subs.findIndex((s) => s.key === el.dataset.sub);
    const j = i + Number(el.dataset.dir);
    if (i < 0 || j < 0 || j >= c.subs.length) return;
    [c.subs[i], c.subs[j]] = [c.subs[j], c.subs[i]];
    render();
  },
  'toggle-status': async () => {
    await S.toggleUnitStatus(state.edit.id);
    render();
  },
  'delete-unit': () => {
    const { t } = ctx();
    state.sheet = {
      type: 'confirm',
      title: t('deleteUnitConfirm'),
      body: t('deleteUnitBody'),
      confirmLabel: t('deleteUnit'),
      act: 'confirm-delete-unit',
      payload: {},
    };
    render();
  },
  'confirm-delete-unit': async () => {
    const id = state.edit.id;
    await S.deleteUnit(id);
    state.edit = null;
    state.sheet = null;
    state.stacks.units = [];
    state.tab = 'units';
    render();
  },

  /* statement */
  'open-statement': (el) => {
    state.stmtRange = 'all';
    state.sheet = { type: 'statement', unitId: el.dataset.id };
    render();
  },
  'stmt-range': (el) => { state.stmtRange = el.dataset.range; render(); },
  'share-statement': async () => {
    const c = ctx();
    const text = statementSummary(c, state.sheet.unitId, state.stmtRange);
    if (navigator.share) {
      try { await navigator.share({ title: 'Payment statement', text }); return; }
      catch (err) { if (err && err.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  },
  'print-statement': () => window.print(),
  'copy-statement': async () => {
    const c = ctx();
    const text = statementSummary(c, state.sheet.unitId, state.stmtRange);
    try {
      await navigator.clipboard.writeText(text);
      toast(c.t('copied'));
    } catch { /* clipboard unavailable */ }
  },
};

/* ----------------------------- events ----------------------------- */

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  // Ignore taps on a row that was just swiped open.
  const swipe = el.closest('.swipe');
  if (swipe && swipe.classList.contains('open') && el.classList.contains('swipe-body')) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  ev.preventDefault();
  fn(el);
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  const field = el.dataset && el.dataset.field;
  if (!field) return;

  switch (field) {
    /* unit edit */
    case 'name': state.edit.name = el.value; break;
    case 'clientName': state.edit.clientName = el.value; break;
    case 'budgetText': {
      const clean = el.value.replace(/[^0-9]/g, '');
      if (clean !== el.value) el.value = clean;
      state.edit.budgetText = clean;
      break;
    }
    case 'newCat': state.edit.newCat = el.value; render(); break;   // re-render for the hint
    case 'cat-name': {
      const c = findCat(el.dataset.key);
      if (c) c.name = el.value;
      break;
    }
    case 'new-sub': {
      const c = findCat(el.dataset.key);
      if (c) c.newSub = el.value;
      break;
    }
    case 'sub-name': {
      const c = findCat(el.dataset.key);
      const s = c && c.subs.find((x) => x.key === el.dataset.sub);
      if (s) s.name = el.value;
      break;
    }
    /* quick add */
    case 'qa-worker': state.qa.workerName = el.value; break;
    case 'qa-note': state.qa.note = el.value; break;
    case 'qa-cat-search': state.qa.catSearch = el.value; render(); break;  // re-render to filter
    default: break;
  }
});

document.addEventListener('change', async (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.field === 'qa-photo' && el.files && el.files[0]) {
    state.qa.photo = await readPhoto(el.files[0]);
    render();
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  const el = ev.target;
  const act = el.dataset && el.dataset.enter;
  if (!act) return;
  ev.preventDefault();
  if (act === 'add-cat') addCategory(state.edit.newCat);
  else if (act === 'add-sub') actions['add-sub'](el);
  else if (act === 'create-cat') actions['create-cat'](el);
});

/* Swipe-to-reveal on expense rows (mirrors the iOS swipe, RTL aware). */
let swipe = null;
document.addEventListener('pointerdown', (ev) => {
  const row = ev.target.closest('[data-swipe]');
  if (!row) return;
  if (ev.target.closest('.swipe-actions')) return;
  swipe = { row, x: ev.clientX, y: ev.clientY, moved: false };
});
document.addEventListener('pointermove', (ev) => {
  if (!swipe) return;
  const dx = ev.clientX - swipe.x;
  const dy = ev.clientY - swipe.y;
  if (Math.abs(dy) > Math.abs(dx)) { swipe = null; return; }  // vertical scroll wins
  const rtl = document.documentElement.dir === 'rtl';
  const reveal = rtl ? dx : -dx;
  if (Math.abs(reveal) > 8) swipe.moved = true;
  if (reveal > 46) swipe.row.classList.add('open');
  else if (reveal < -24) swipe.row.classList.remove('open');
});
document.addEventListener('pointerup', () => { swipe = null; });
document.addEventListener('pointercancel', () => { swipe = null; });

// Tapping elsewhere closes any open swipe row.
document.addEventListener('click', (ev) => {
  document.querySelectorAll('.swipe.open').forEach((row) => {
    if (!row.contains(ev.target)) row.classList.remove('open');
  });
});

// Android back button / browser back closes sheets, then pops the stack.
window.addEventListener('popstate', () => {
  if (state.sheet) { closeSheet(); }
  else if (state.stacks[state.tab].length) { back(); }
  history.pushState(null, '', location.href);
});

/* ----------------------------- boot ----------------------------- */

async function boot() {
  try {
    await S.load();
  } catch (err) {
    console.error('Storage unavailable', err);
  }
  applyTheme();
  render();

  history.pushState(null, '', location.href);

  // Deep link from the manifest shortcut: open quick add straight away.
  if (new URLSearchParams(location.search).get('action') === 'add' && S.S.units.length) {
    openQuickAdd(null);
  }

  registerServiceWorker();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const go = () => navigator.serviceWorker.register('sw.js')
    .catch((err) => console.warn('SW registration failed', err));
  // boot() is async, so `load` has usually already fired by the time we get here.
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installEvent = e;
  render();
});

boot();
