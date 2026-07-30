// IndexedDB persistence. All data lives on-device in the browser — no backend,
// no network. IndexedDB (rather than localStorage) because receipt photos would
// blow past localStorage's ~5MB cap.

const DB_NAME = 'site-ledger';
const DB_VERSION = 1;

export const STORES = ['units', 'categories', 'subcategories', 'workers', 'expenses'];

let _db = null;

export function open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(storeNames, mode) {
  return open().then((db) => db.transaction(storeNames, mode));
}

function done(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function getAll(store) {
  return tx([store], 'readonly').then((t) => new Promise((resolve, reject) => {
    const req = t.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

export function put(store, value) {
  return tx([store], 'readwrite').then((t) => {
    t.objectStore(store).put(value);
    return done(t);
  });
}

export function putMany(store, values) {
  if (!values.length) return Promise.resolve();
  return tx([store], 'readwrite').then((t) => {
    const os = t.objectStore(store);
    values.forEach((v) => os.put(v));
    return done(t);
  });
}

export function remove(store, id) {
  return tx([store], 'readwrite').then((t) => {
    t.objectStore(store).delete(id);
    return done(t);
  });
}

export function removeMany(store, ids) {
  if (!ids.length) return Promise.resolve();
  return tx([store], 'readwrite').then((t) => {
    const os = t.objectStore(store);
    ids.forEach((id) => os.delete(id));
    return done(t);
  });
}

export function clearAll() {
  const all = STORES.concat(['meta']);
  return tx(all, 'readwrite').then((t) => {
    all.forEach((s) => t.objectStore(s).clear());
    return done(t);
  });
}

export function clearData() {
  return tx(STORES, 'readwrite').then((t) => {
    STORES.forEach((s) => t.objectStore(s).clear());
    return done(t);
  });
}

export function getMeta(key, fallback = null) {
  return tx(['meta'], 'readonly').then((t) => new Promise((resolve, reject) => {
    const req = t.objectStore('meta').get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : fallback);
    req.onerror = () => reject(req.error);
  }));
}

export function setMeta(key, value) {
  return tx(['meta'], 'readwrite').then((t) => {
    t.objectStore('meta').put({ key, value });
    return done(t);
  });
}

/** True when IndexedDB is unavailable (private mode in some browsers). */
export function supported() {
  try { return typeof indexedDB !== 'undefined' && indexedDB !== null; }
  catch { return false; }
}
