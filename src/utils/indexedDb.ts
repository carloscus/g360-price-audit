import * as Interfaces from "../interfaces";
import { debugWarn } from './config';

const DB_NAME = "inventory_manager_db";
const STORE_NAME = "cache_store";
const DB_VERSION = 2;

const CATALOG_CACHE_TTL = 24 * 60 * 60 * 1000;
const COMPARISON_STATE_TTL = 60 * 60 * 1000;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      dbPromise = null;
      reject("Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error);
    };
  });
}

function ensureDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB();
  }
  return dbPromise;
}

async function cleanupExpiredEntries(): Promise<void> {
  const database = await ensureDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index("timestamp");

  const now = Date.now();
  const range = IDBKeyRange.upperBound(now - 1000);

  const request = index.openCursor(range);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const entry = cursor.value;
        if (entry.timestamp && now - entry.timestamp > CATALOG_CACHE_TTL) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = (event) => {
      reject("Error cleaning up expired entries: " + (event.target as IDBRequest).error);
    };
  });
}

async function getDataWithTTL<T>(id: string, ttl: number): Promise<T | null> {
  try {
    const database = await ensureDB();
    await cleanupExpiredEntries();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const now = Date.now();
        if (result.timestamp && now - result.timestamp > ttl) {
          const deleteTransaction = database.transaction([STORE_NAME], "readwrite");
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(id);
          resolve(null);
        } else {
          resolve(result.data);
        }
      };

      request.onerror = (event) => {
        reject("Error getting data from IndexedDB: " + (event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    debugWarn("Error accessing IndexedDB, falling back to memory:", error);
    return null;
  }
}

async function saveDataWithTTL<T>(id: string, data: T, type: string): Promise<void> {
  try {
    const database = await ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        id,
        data,
        timestamp: Date.now(),
        type
      });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject("Error saving data to IndexedDB: " + (event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    debugWarn("Error saving to IndexedDB:", error);
  }
}

async function getCatalogFromIndexedDB(): Promise<Interfaces.IProducto[] | null> {
  return getDataWithTTL<Interfaces.IProducto[]>("catalog", CATALOG_CACHE_TTL);
}

export async function saveCatalogToIndexedDB(catalog: Interfaces.IProducto[]): Promise<void> {
  return saveDataWithTTL("catalog", catalog, "catalog");
}

interface ComparisonState {
  productos: Interfaces.IProductoEditado[];
  competidores: string[];
  formData: Record<string, unknown>;
  timestamp: number;
}

async function getComparisonState(): Promise<ComparisonState | null> {
  return getDataWithTTL<ComparisonState>("comparison_state", COMPARISON_STATE_TTL);
}

async function saveComparisonState(state: Omit<ComparisonState, 'timestamp'>): Promise<void> {
  return saveDataWithTTL("comparison_state", { ...state, timestamp: Date.now() }, "comparison");
}

async function clearComparisonState(): Promise<void> {
  const database = await ensureDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.delete("comparison_state");

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      reject("Error clearing comparison state: " + (event.target as IDBRequest).error);
    };
  });
}

async function getCacheStats(): Promise<{ catalogSize?: number; hasComparisonState: boolean }> {
  try {
    const catalog = await getCatalogFromIndexedDB();
    const comparison = await getComparisonState();

    return {
      catalogSize: catalog?.length,
      hasComparisonState: !!comparison
    };
  } catch (error) {
    debugWarn("Error getting cache stats:", error);
    return { hasComparisonState: false };
  }
}

async function clearIndexedDB(): Promise<void> {
  const database = await ensureDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject("Error clearing IndexedDB: " + (event.target as IDBRequest).error);
    };
  });
}
