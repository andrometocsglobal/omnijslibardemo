/**
 * Promise-based IndexedDB key/value store with an in-memory fallback
 * (Node.js, private windows, blocked storage).
 */

export class MemoryStore {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    return this.map.get(key);
  }
  async set(key, value) {
    this.map.set(key, value);
  }
  async delete(key) {
    this.map.delete(key);
  }
  async keys() {
    return [...this.map.keys()];
  }
  async clear() {
    this.map.clear();
  }
}

const req = (r) =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

export class IndexedDBStore {
  constructor(dbName = "omnidim", storeName = "kv") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbp = null;
  }
  static available() {
    try {
      return typeof indexedDB !== "undefined" && indexedDB !== null;
    } catch {
      return false;
    }
  }
  /**
   * Open the database; if this store does not exist yet (several stores can
   * share one database), reopen with version + 1 to create it.
   */
  _db() {
    const open = (version) =>
      new Promise((resolve, reject) => {
        const r = version ? indexedDB.open(this.dbName, version) : indexedDB.open(this.dbName);
        r.onupgradeneeded = () => {
          if (!r.result.objectStoreNames.contains(this.storeName)) r.result.createObjectStore(this.storeName);
        };
        r.onsuccess = () => {
          const db = r.result;
          // let other connections upgrade the schema; reconnect lazily afterwards
          db.onversionchange = () => {
            db.close();
            this.dbp = null;
          };
          resolve(db);
        };
        r.onerror = () => reject(r.error);
        r.onblocked = () => reject(new Error(`IndexedDB upgrade of "${this.dbName}" blocked by another tab`));
      });
    this.dbp ??= open().then((db) => {
      if (db.objectStoreNames.contains(this.storeName)) return db;
      const next = db.version + 1;
      db.close();
      return open(next);
    }).catch((e) => {
      this.dbp = null;
      throw e;
    });
    return this.dbp;
  }
  async _tx(mode) {
    return (await this._db()).transaction(this.storeName, mode).objectStore(this.storeName);
  }
  async get(key) {
    return req((await this._tx("readonly")).get(key));
  }
  async set(key, value) {
    await req((await this._tx("readwrite")).put(value, key));
  }
  async delete(key) {
    await req((await this._tx("readwrite")).delete(key));
  }
  async keys() {
    return (await req((await this._tx("readonly")).getAllKeys())).map(String);
  }
  async clear() {
    await req((await this._tx("readwrite")).clear());
  }
}

/** IndexedDB when available, otherwise memory. */
export function createStore(dbName = "omnidim", storeName = "kv") {
  return IndexedDBStore.available() ? new IndexedDBStore(dbName, storeName) : new MemoryStore();
}

/** Delete a whole IndexedDB database ("Delete Persona Data"). */
export async function deleteDatabase(dbName) {
  if (!IndexedDBStore.available()) return;
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(dbName);
    r.onsuccess = r.onerror = r.onblocked = () => resolve();
  });
}

/** Encrypted local storage: AES-GCM with a non-extractable key kept in IndexedDB. */
export class EncryptedStore {
  constructor(store = createStore("omnidim-secure", "kv")) {
    this.store = store;
    this.key = null;
  }
  async _key() {
    if (this.key) return this.key;
    this.key = await this.store.get("__aes_key__");
    if (!this.key) {
      this.key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      await this.store.set("__aes_key__", this.key);
    }
    return this.key;
  }
  async set(name, value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(value));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await this._key(), data);
    await this.store.set(name, { iv, ct });
  }
  async get(name) {
    const rec = await this.store.get(name);
    if (!rec) return undefined;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: rec.iv }, await this._key(), rec.ct);
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async delete(name) {
    await this.store.delete(name);
  }
}
