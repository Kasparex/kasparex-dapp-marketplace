/**
 * IndexedDB Cache Service for NFT Data
 * Provides persistent client-side caching for metadata, rarity scores, and trait stats
 */

const DB_NAME = 'kasparex-nft-cache';
const DB_VERSION = 1;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class NFTCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not available, caching disabled');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('rarity')) {
          db.createObjectStore('rarity', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('traitStats')) {
          db.createObjectStore('traitStats', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }

  /**
   * Get data from cache
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        if (this.isValid(entry)) {
          resolve(entry.data);
        } else {
          // Entry expired or doesn't exist, delete it
          if (entry) {
            this.delete(storeName, key).catch(console.error);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`Failed to get ${key} from ${storeName}:`, request.error);
        resolve(null);
      };
    });
  }

  /**
   * Set data in cache
   */
  async set<T>(storeName: string, key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };

      const request = store.put({ key, ...entry });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Failed to set ${key} in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete data from cache
   */
  async delete(storeName: string, key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Failed to delete ${key} from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if key exists and is valid
   */
  async has(storeName: string, key: string): Promise<boolean> {
    const data = await this.get(storeName, key);
    return data !== null;
  }

  /**
   * Clear all entries from a store
   */
  async clear(storeName: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all expired entries from a store
   */
  async clearExpired(storeName: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      const now = Date.now();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<unknown>;
          if (entry.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`Cleared ${deletedCount} expired entries from ${storeName}`);
          }
          resolve();
        }
      };

      request.onerror = () => {
        console.error(`Failed to clear expired entries from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all keys from a store
   */
  async getAllKeys(storeName: string): Promise<string[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error(`Failed to get keys from ${storeName}:`, request.error);
        resolve([]);
      };
    });
  }
}

// Singleton instance
const cache = new NFTCache();

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  collectionMetadata: (collectionId: string) => `collection-metadata-${collectionId}`,
  nftMetadata: (collectionId: string, tokenId: number) => `nft-metadata-${collectionId}-${tokenId}`,
  rarityScore: (collectionId: string, tokenId: number) => `rarity-${collectionId}-${tokenId}`,
  collectionRarity: (collectionId: string) => `collection-rarity-${collectionId}`,
  traitStats: (collectionId: string) => `trait-stats-${collectionId}`,
  imageUrl: (ipfsHash: string) => `image-url-${ipfsHash}`,
};

/**
 * Get collection metadata from cache
 */
export async function getCachedCollectionMetadata<T>(collectionId: string): Promise<T | null> {
  return cache.get<T>('metadata', CacheKeys.collectionMetadata(collectionId));
}

/**
 * Set collection metadata in cache
 */
export async function setCachedCollectionMetadata<T>(
  collectionId: string,
  data: T,
  ttl?: number
): Promise<void> {
  return cache.set('metadata', CacheKeys.collectionMetadata(collectionId), data, ttl);
}

/**
 * Get NFT metadata from cache
 */
export async function getCachedNFTMetadata<T>(
  collectionId: string,
  tokenId: number
): Promise<T | null> {
  return cache.get<T>('metadata', CacheKeys.nftMetadata(collectionId, tokenId));
}

/**
 * Set NFT metadata in cache
 */
export async function setCachedNFTMetadata<T>(
  collectionId: string,
  tokenId: number,
  data: T,
  ttl?: number
): Promise<void> {
  return cache.set('metadata', CacheKeys.nftMetadata(collectionId, tokenId), data, ttl);
}

/**
 * Get rarity score from cache
 */
export async function getCachedRarityScore<T>(
  collectionId: string,
  tokenId: number
): Promise<T | null> {
  return cache.get<T>('rarity', CacheKeys.rarityScore(collectionId, tokenId));
}

/**
 * Set rarity score in cache
 */
export async function setCachedRarityScore<T>(
  collectionId: string,
  tokenId: number,
  data: T,
  ttl?: number
): Promise<void> {
  return cache.set('rarity', CacheKeys.rarityScore(collectionId, tokenId), data, ttl);
}

/**
 * Get collection rarity data from cache
 */
export async function getCachedCollectionRarity<T>(collectionId: string): Promise<T | null> {
  return cache.get<T>('rarity', CacheKeys.collectionRarity(collectionId));
}

/**
 * Set collection rarity data in cache
 */
export async function setCachedCollectionRarity<T>(
  collectionId: string,
  data: T,
  ttl?: number
): Promise<void> {
  return cache.set('rarity', CacheKeys.collectionRarity(collectionId), data, ttl);
}

/**
 * Get trait stats from cache
 */
export async function getCachedTraitStats<T>(collectionId: string): Promise<T | null> {
  return cache.get<T>('traitStats', CacheKeys.traitStats(collectionId));
}

/**
 * Set trait stats in cache
 */
export async function setCachedTraitStats<T>(
  collectionId: string,
  data: T,
  ttl?: number
): Promise<void> {
  return cache.set('traitStats', CacheKeys.traitStats(collectionId), data, ttl);
}

/**
 * Get cached image URL
 */
export async function getCachedImageUrl(ipfsHash: string): Promise<string | null> {
  return cache.get<string>('images', CacheKeys.imageUrl(ipfsHash));
}

/**
 * Set cached image URL
 */
export async function setCachedImageUrl(
  ipfsHash: string,
  url: string,
  ttl?: number
): Promise<void> {
  return cache.set('images', CacheKeys.imageUrl(ipfsHash), url, ttl);
}

/**
 * Clear collection cache
 */
export async function clearCollectionCache(collectionId: string): Promise<void> {
  const keys = [
    CacheKeys.collectionMetadata(collectionId),
    CacheKeys.collectionRarity(collectionId),
    CacheKeys.traitStats(collectionId),
  ];

  await Promise.all([
    ...keys.map((key) => cache.delete('metadata', key)),
    ...keys.map((key) => cache.delete('rarity', key)),
    ...keys.map((key) => cache.delete('traitStats', key)),
  ]);
}

/**
 * Clear all NFT caches
 */
export async function clearAllCaches(): Promise<void> {
  await Promise.all([
    cache.clear('metadata'),
    cache.clear('rarity'),
    cache.clear('traitStats'),
    cache.clear('images'),
  ]);
}

/**
 * Clean up expired entries
 */
export async function cleanupExpiredEntries(): Promise<void> {
  await Promise.all([
    cache.clearExpired('metadata'),
    cache.clearExpired('rarity'),
    cache.clearExpired('traitStats'),
    cache.clearExpired('images'),
  ]);
}

