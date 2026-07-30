// Sample dataset, ported from the iOS app's SeedData — same units, categories,
// subcategories, workers, amounts and day-offsets. Only installed on explicit
// user action ("Load sample data") so a genuine first run shows the empty states.

import { uid } from './format.js';

const UNITS = [
  { key: 'u1', name: 'Sha2et Zamalek', client: 'Nadia Hosny', type: 'Apartment', budget: 400000, accent: '#8B5CF6',
    cats: [
      { name: 'Ne2asha', color: '#8B5CF6', subs: ['First coat', 'Putty', 'Final coat'] },
      { name: 'Materials', color: '#3B82F6', subs: ['Tiles', 'Paint', 'Cement'] },
      { name: 'Naggara', color: '#F59E0B', subs: ['Kitchen', 'Doors'] },
      { name: 'Sabaka', color: '#0F766E', subs: [] },
      { name: 'Kahraba', color: '#F43F5E', subs: [] },
    ] },
  { key: 'u2', name: 'Villa Sheikh Zayed', client: 'Karim Adel', type: 'Villa', budget: 1500000, accent: '#0F766E',
    cats: [
      { name: 'Labor', color: '#0F766E', subs: ['Weekly team', 'Overtime'] },
      { name: 'Materials', color: '#3B82F6', subs: ['Marble', 'Cement'] },
      { name: 'Gypsum', color: '#8B5CF6', subs: [] },
      { name: 'Marble', color: '#F59E0B', subs: [] },
    ] },
  { key: 'u3', name: 'Office — New Cairo', client: 'Delta Group', type: 'Office', budget: 300000, accent: '#3B82F6',
    cats: [
      { name: 'Ne2asha', color: '#8B5CF6', subs: [] },
      { name: 'Kahraba', color: '#F43F5E', subs: ['Wiring', 'Fixtures'] },
      { name: 'Furniture', color: '#F59E0B', subs: [] },
    ] },
  { key: 'u4', name: 'Apt Maadi', client: 'Youssef Mansour', type: 'Apartment', budget: null, accent: '#F59E0B',
    cats: [
      { name: 'Materials', color: '#3B82F6', subs: [] },
      { name: 'Labor', color: '#0F766E', subs: [] },
    ] },
  { key: 'u5', name: 'Duplex 6 October', client: 'Salma Farouk', type: 'Duplex', budget: 800000, accent: '#F43F5E',
    cats: [
      { name: 'Ne2asha', color: '#8B5CF6', subs: [] },
      { name: 'Sabaka', color: '#0F766E', subs: [] },
      { name: 'Materials', color: '#3B82F6', subs: [] },
    ] },
];

// [unitKey, catIndex, subIndex(-1 none), amount, worker, method, note, daysAgo]
const EXPENSES = [
  ['u1', 0, 0, 3500, 'Osta Reda', 'cash', '2 rooms first coat', 0],
  ['u1', 1, 1, 8200, null, 'cash', 'Paint + primer', 0],
  ['u1', 3, -1, 1800, 'Hassan Sabbak', 'cash', 'Bathroom pipes', 1],
  ['u1', 4, -1, 2400, 'Ashraf', 'cash', null, 2],
  ['u1', 2, 0, 5600, 'Am Sayed', 'cash', 'Kitchen cabinets deposit', 3],
  ['u1', 0, 2, 2800, 'Osta Reda', 'cash', null, 4],
  ['u1', 1, 0, 3200, null, 'transfer', 'Tiles', 6],
  ['u2', 0, 0, 12000, 'Sabry', 'cash', 'Team weekly', 1],
  ['u2', 3, -1, 24000, null, 'transfer', 'Marble slabs', 2],
  ['u2', 1, 0, 9800, null, 'cash', null, 3],
  ['u2', 2, -1, 6500, 'Mahmoud Gypsum', 'cash', 'Ceiling gypsum', 5],
  ['u2', 0, 0, 12000, 'Sabry', 'cash', 'Team weekly', 8],
  ['u3', 0, -1, 4200, 'Osta Reda', 'cash', null, 1],
  ['u3', 1, 0, 3100, 'Ashraf', 'cash', 'Wiring', 4],
  ['u3', 2, -1, 7400, null, 'transfer', 'Desks', 7],
  ['u4', 0, -1, 5200, null, 'cash', 'Cement + sand', 2],
  ['u4', 1, -1, 3000, 'Sabry', 'cash', null, 5],
  ['u5', 0, -1, 4800, 'Osta Reda', 'cash', 'Living room', 0],
  ['u5', 1, -1, 2600, 'Hassan Sabbak', 'cash', null, 3],
  ['u5', 2, -1, 6100, null, 'cash', 'Bathroom fixtures', 6],
];

const TRADES = {
  'Osta Reda': 'painter',
  'Am Sayed': 'carpenter',
  'Hassan Sabbak': 'plumber',
  Ashraf: 'electrician',
  'Mahmoud Gypsum': 'gypsum',
  Sabry: 'other',
};
const TRADE_OTHER = { Sabry: 'Laborer' };

export function buildSeed() {
  const units = [], categories = [], subcategories = [], workers = [], expenses = [];
  const unitMap = {}, catMap = {}, subMap = {}, workerMap = {};
  const now = Date.now();

  UNITS.forEach((su, ui) => {
    const unit = {
      id: uid(), name: su.name, clientName: su.client, address: su.type,
      status: 'active', budget: su.budget, accentHex: su.accent, createdAt: now + ui,
    };
    units.push(unit);
    unitMap[su.key] = unit;
    catMap[su.key] = [];
    subMap[su.key] = [];

    su.cats.forEach((sc, ci) => {
      const cat = {
        id: uid(), unitId: unit.id, name: sc.name, colorHex: sc.color,
        sortOrder: ci, createdAt: now,
      };
      categories.push(cat);
      catMap[su.key].push(cat);
      const subs = sc.subs.map((name, si) => {
        const sub = { id: uid(), categoryId: cat.id, name, sortOrder: si, createdAt: now };
        subcategories.push(sub);
        return sub;
      });
      subMap[su.key].push(subs);
    });
  });

  const workerFor = (name) => {
    if (!name) return null;
    if (workerMap[name]) return workerMap[name];
    const w = {
      id: uid(), name, trade: TRADES[name] || null,
      tradeOther: TRADE_OTHER[name] || null, phone: null, createdAt: now,
    };
    workers.push(w);
    workerMap[name] = w;
    return w;
  };

  for (const [uk, ci, si, amount, workerName, method, note, daysAgo] of EXPENSES) {
    const unit = unitMap[uk];
    const cat = ci >= 0 ? catMap[uk][ci] : null;
    const sub = ci >= 0 && si >= 0 ? subMap[uk][ci][si] : null;
    const worker = workerFor(workerName);
    expenses.push({
      id: uid(),
      unitId: unit.id,
      categoryId: cat ? cat.id : null,
      subcategoryId: sub ? sub.id : null,
      workerId: worker ? worker.id : null,
      amount,                                  // integer EGP
      method,
      note,
      photo: null,
      date: new Date(now - daysAgo * 86400000).toISOString(),
    });
  }

  return { units, categories, subcategories, workers, expenses };
}
