// The data layer. Records are held in memory for synchronous reads (the dataset
// is small) and written through to IndexedDB on every mutation.
//
// Money: `amount` is an INTEGER number of whole EGP. Never a float.

import * as db from './db.js';
import { uid, isWithin } from './format.js';

export const PALETTE = [
  '#0F766E', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#10B981', // Green
  '#EA580C', // Orange
  '#64748B', // Slate
];
export const UNCATEGORIZED_HEX = '#9CA3AF';

export const S = {
  units: [],
  categories: [],
  subcategories: [],
  workers: [],
  expenses: [],
  lang: 'en',
  themePref: 'system',   // system | light | dark
  lastUnitId: null,
};

export async function load() {
  if (!db.supported()) return;
  const [units, categories, subcategories, workers, expenses] = await Promise.all(
    db.STORES.map((s) => db.getAll(s))
  );
  S.units = units;
  S.categories = categories;
  S.subcategories = subcategories;
  S.workers = workers;
  S.expenses = expenses;
  S.lang = await db.getMeta('lang', 'en');
  S.themePref = await db.getMeta('theme', 'system');
  S.lastUnitId = await db.getMeta('lastUnitId', null);
}

export function setLang(lang) { S.lang = lang; db.setMeta('lang', lang); }
export function setThemePref(pref) { S.themePref = pref; db.setMeta('theme', pref); }
export function setLastUnit(id) { S.lastUnitId = id; db.setMeta('lastUnitId', id); }

/* ---------------- Queries ---------------- */

export const unitById = (id) => S.units.find((u) => u.id === id) || null;
export const categoryById = (id) => S.categories.find((c) => c.id === id) || null;
export const subcategoryById = (id) => S.subcategories.find((s) => s.id === id) || null;
export const workerById = (id) => S.workers.find((w) => w.id === id) || null;

export const unitsSorted = () => [...S.units].sort((a, b) => a.createdAt - b.createdAt);

export const categoriesOf = (unitId) =>
  S.categories.filter((c) => c.unitId === unitId).sort((a, b) => a.sortOrder - b.sortOrder);

export const subcategoriesOf = (categoryId) =>
  S.subcategories.filter((s) => s.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder);

export const expensesOf = (unitId) =>
  S.expenses.filter((e) => e.unitId === unitId).sort((a, b) => new Date(b.date) - new Date(a.date));

export const expensesOfWorker = (workerId) =>
  S.expenses.filter((e) => e.workerId === workerId).sort((a, b) => new Date(b.date) - new Date(a.date));

export const sum = (list) => list.reduce((acc, e) => acc + (e.amount || 0), 0);

export const unitTotal = (unitId) => sum(S.expenses.filter((e) => e.unitId === unitId));
export const workerTotal = (workerId) => sum(S.expenses.filter((e) => e.workerId === workerId));
export const grandTotal = () => sum(S.expenses);
export const rangeTotal = (range) => sum(S.expenses.filter((e) => isWithin(e.date, range)));

export function budgetFraction(unit) {
  if (!unit || !unit.budget || unit.budget <= 0) return null;
  return unitTotal(unit.id) / unit.budget;
}

export function workersOnUnit(unitId) {
  const map = new Map();
  for (const e of S.expenses) {
    if (e.unitId !== unitId || !e.workerId) continue;
    map.set(e.workerId, (map.get(e.workerId) || 0) + e.amount);
  }
  return [...map.entries()]
    .map(([workerId, total]) => ({ worker: workerById(workerId), total }))
    .filter((x) => x.worker)
    .sort((a, b) => b.total - a.total);
}

export function workersRanked() {
  return S.workers
    .map((w) => ({ worker: w, total: workerTotal(w.id), count: expensesOfWorker(w.id).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.total - a.total);
}

/** Spend grouped by category for a unit (nil category = Uncategorized bucket). */
export function categoryBreakdown(unitId) {
  const buckets = new Map();
  for (const e of expensesOf(unitId)) {
    const key = e.categoryId || '_uncat';
    if (!buckets.has(key)) {
      const cat = e.categoryId ? categoryById(e.categoryId) : null;
      buckets.set(key, {
        key,
        categoryId: e.categoryId || null,
        name: cat ? cat.name : null,       // null => caller substitutes "Uncategorized"
        colorHex: cat ? cat.colorHex : UNCATEGORIZED_HEX,
        amount: 0,
      });
    }
    buckets.get(key).amount += e.amount;
  }
  return [...buckets.values()].sort((a, b) => b.amount - a.amount);
}

/** Next palette color, round-robin over how many categories exist globally. */
export function nextColor(index = S.categories.length) {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/** Reuse the color of a same-named category on another unit, for visual consistency. */
export function colorForName(name, excludeUnitId = null) {
  const match = S.categories.find(
    (c) => c.unitId !== excludeUnitId && c.name.toLowerCase() === String(name).toLowerCase()
  );
  return match ? match.colorHex : null;
}

export function categoryNamesElsewhere(query, excludeUnitId) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const here = new Set(categoriesOf(excludeUnitId).map((c) => c.name.toLowerCase()));
  const names = new Set(
    S.categories
      .filter((c) => c.unitId !== excludeUnitId)
      .map((c) => c.name)
      .filter((n) => n.toLowerCase().includes(q) && !here.has(n.toLowerCase()))
  );
  return [...names].sort().slice(0, 3);
}

/* ---------------- Mutations ---------------- */

export async function saveUnit(draft) {
  const isNew = !draft.id;
  const unit = isNew
    ? { id: uid(), createdAt: Date.now(), status: 'active' }
    : { ...unitById(draft.id) };

  unit.name = (draft.name || '').trim() || 'Untitled unit';
  unit.clientName = (draft.clientName || '').trim();
  unit.address = draft.address || null;
  unit.budget = draft.budget || null;
  unit.accentHex = (draft.cats && draft.cats[0] && draft.cats[0].colorHex) || unit.accentHex || PALETTE[0];

  if (isNew) S.units.push(unit);
  else S.units = S.units.map((u) => (u.id === unit.id ? unit : u));
  await db.put('units', unit);

  if (draft.cats) await reconcileCategories(unit.id, draft.cats);
  return unit;
}

async function reconcileCategories(unitId, drafts) {
  const existing = categoriesOf(unitId);
  const keep = new Set(drafts.filter((d) => d.existingId).map((d) => d.existingId));

  // Removed categories: their expenses fall back to Uncategorized (never orphaned).
  for (const cat of existing) {
    if (!keep.has(cat.id)) await deleteCategory(cat.id, { silent: true });
  }

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const name = (d.name || '').trim();
    let cat;
    if (d.existingId && categoryById(d.existingId)) {
      cat = { ...categoryById(d.existingId) };
      if (name) cat.name = name;
      cat.colorHex = d.colorHex;
      cat.sortOrder = i;
      S.categories = S.categories.map((c) => (c.id === cat.id ? cat : c));
    } else {
      if (!name) continue;
      cat = { id: uid(), unitId, name, colorHex: d.colorHex, sortOrder: i, createdAt: Date.now() };
      S.categories.push(cat);
    }
    await db.put('categories', cat);
    await reconcileSubcategories(cat.id, d.subs || []);
  }
}

async function reconcileSubcategories(categoryId, drafts) {
  const existing = subcategoriesOf(categoryId);
  const keep = new Set(drafts.filter((d) => d.existingId).map((d) => d.existingId));

  for (const sub of existing) {
    if (!keep.has(sub.id)) await deleteSubcategory(sub.id);
  }

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const name = (d.name || '').trim();
    let sub;
    if (d.existingId && subcategoryById(d.existingId)) {
      sub = { ...subcategoryById(d.existingId) };
      if (name) sub.name = name;
      sub.sortOrder = i;
      S.subcategories = S.subcategories.map((s) => (s.id === sub.id ? sub : s));
    } else {
      if (!name) continue;
      sub = { id: uid(), categoryId, name, sortOrder: i, createdAt: Date.now() };
      S.subcategories.push(sub);
    }
    await db.put('subcategories', sub);
  }
}

/** Inline category creation during quick-add. */
export async function createCategory(unitId, name, colorHex) {
  const order = categoriesOf(unitId).reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;
  const cat = { id: uid(), unitId, name: name.trim(), colorHex, sortOrder: order, createdAt: Date.now() };
  S.categories.push(cat);
  await db.put('categories', cat);
  return cat;
}

/** Deleting a category reassigns its expenses to Uncategorized and drops its subs. */
export async function deleteCategory(categoryId) {
  const subs = subcategoriesOf(categoryId).map((s) => s.id);
  const touched = S.expenses.filter((e) => e.categoryId === categoryId);
  for (const e of touched) { e.categoryId = null; e.subcategoryId = null; }
  await db.putMany('expenses', touched);

  S.subcategories = S.subcategories.filter((s) => s.categoryId !== categoryId);
  await db.removeMany('subcategories', subs);

  S.categories = S.categories.filter((c) => c.id !== categoryId);
  await db.remove('categories', categoryId);
}

/** Deleting a subcategory keeps its expenses on the parent category. */
export async function deleteSubcategory(subId) {
  const touched = S.expenses.filter((e) => e.subcategoryId === subId);
  for (const e of touched) e.subcategoryId = null;
  await db.putMany('expenses', touched);

  S.subcategories = S.subcategories.filter((s) => s.id !== subId);
  await db.remove('subcategories', subId);
}

export async function deleteUnit(unitId) {
  const expIds = S.expenses.filter((e) => e.unitId === unitId).map((e) => e.id);
  const catIds = categoriesOf(unitId).map((c) => c.id);
  const subIds = S.subcategories.filter((s) => catIds.includes(s.categoryId)).map((s) => s.id);

  S.expenses = S.expenses.filter((e) => e.unitId !== unitId);
  S.subcategories = S.subcategories.filter((s) => !subIds.includes(s.id));
  S.categories = S.categories.filter((c) => c.unitId !== unitId);
  S.units = S.units.filter((u) => u.id !== unitId);

  await db.removeMany('expenses', expIds);
  await db.removeMany('subcategories', subIds);
  await db.removeMany('categories', catIds);
  await db.remove('units', unitId);
}

export async function toggleUnitStatus(unitId) {
  const unit = unitById(unitId);
  if (!unit) return;
  unit.status = unit.status === 'active' ? 'done' : 'active';
  await db.put('units', unit);
}

export async function findOrCreateWorker(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const found = S.workers.find((w) => w.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  const worker = { id: uid(), name: trimmed, trade: null, tradeOther: null, phone: null, createdAt: Date.now() };
  S.workers.push(worker);
  await db.put('workers', worker);
  return worker;
}

export async function saveExpense(draft) {
  const isNew = !draft.id;
  const expense = isNew
    ? { id: uid(), date: draft.date || new Date().toISOString() }
    : { ...S.expenses.find((e) => e.id === draft.id) };

  expense.amount = Math.round(draft.amount) || 0;
  expense.unitId = draft.unitId;
  expense.categoryId = draft.categoryId || null;
  expense.subcategoryId = draft.subcategoryId || null;
  expense.workerId = draft.workerId || null;
  expense.method = draft.method || 'cash';
  expense.note = (draft.note || '').trim() || null;
  expense.photo = draft.photo || null;

  if (isNew) S.expenses.unshift(expense);
  else S.expenses = S.expenses.map((e) => (e.id === expense.id ? expense : e));
  await db.put('expenses', expense);
  setLastUnit(expense.unitId);
  return expense;
}

export async function deleteExpense(id) {
  S.expenses = S.expenses.filter((e) => e.id !== id);
  await db.remove('expenses', id);
}

export async function resetAll() {
  S.units = []; S.categories = []; S.subcategories = []; S.workers = []; S.expenses = [];
  S.lastUnitId = null;
  await db.clearData();
  await db.setMeta('lastUnitId', null);
}

/** Bulk insert (used by the sample-data seeder). */
export async function installSeed(data) {
  S.units = data.units;
  S.categories = data.categories;
  S.subcategories = data.subcategories;
  S.workers = data.workers;
  S.expenses = data.expenses;
  await Promise.all([
    db.putMany('units', data.units),
    db.putMany('categories', data.categories),
    db.putMany('subcategories', data.subcategories),
    db.putMany('workers', data.workers),
    db.putMany('expenses', data.expenses),
  ]);
  if (data.units[0]) setLastUnit(data.units[0].id);
}
