"use client";

import type { Database } from "@/lib/types/database.types";

type Band = Database['public']['Tables']['bands']['Row'];

const DB_NAME = 'hybridized-music-cache';
const DB_VERSION = 1;
const STORE_NAME = 'bands';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Initialize IndexedDB for music caching
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Cache bands data in IndexedDB
 */
export async function cacheBands(bands: Band[]): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const timestamp = Date.now();
    
    for (const band of bands) {
      store.put({ ...band, timestamp });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error caching bands:', error);
  }
}

/**
 * Get cached bands from IndexedDB
 */
export async function getCachedBands(): Promise<Band[] | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const bands = request.result;
        
        if (bands.length === 0) {
          resolve(null);
          return;
        }

        // Check if cache is still valid
        const firstBand = bands[0];
        const isExpired = Date.now() - firstBand.timestamp > CACHE_DURATION;
        
        if (isExpired) {
          resolve(null);
          return;
        }

        // Remove timestamp before returning
        const cleanBands = bands.map(({ timestamp, ...band }) => band);
        resolve(cleanBands as Band[]);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached bands:', error);
    return null;
  }
}

/**
 * Get cached bands by artist name
 */
export async function getCachedArtistBands(artistName: string): Promise<Band[] | null> {
  try {
    const allBands = await getCachedBands();
    
    if (!allBands) return null;

    return allBands.filter(band => 
      band.name?.toLowerCase() === artistName.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting cached artist bands:', error);
    return null;
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const cutoffTime = Date.now() - CACHE_DURATION;
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
