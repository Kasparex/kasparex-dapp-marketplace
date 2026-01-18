/**
 * Cloudflare KV Caching Layer
 * 
 * Provides caching utilities for reward data to reduce database queries
 * and stay within free tier limits (100k reads/day)
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 600 = 10 minutes)
  tags?: string[]; // Cache tags for invalidation
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  rewardStatus: (rewardId: string) => `reward:${rewardId}`,
  userRewards: (userAddress: string) => `user:rewards:${userAddress}`,
  userSummary: (userAddress: string) => `user:summary:${userAddress}`,
  nodeAvailability: (cid: string) => `node:availability:${cid}`,
  dappMetadata: (dappId: string) => `dapp:metadata:${dappId}`,
} as const;

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,        // 1 minute - for frequently changing data
  MEDIUM: 600,      // 10 minutes - for reward status
  LONG: 3600,       // 1 hour - for user summaries, dApp metadata
  VERY_LONG: 86400, // 24 hours - for static data
} as const;

/**
 * Cache interface (works with Cloudflare KV or local storage)
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  put(key: string, value: unknown, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Local cache adapter (for development/testing)
 * Uses in-memory Map
 */
class LocalCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { value: unknown; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async put(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || CacheTTL.MEDIUM;
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

/**
 * Cloudflare KV adapter (for production)
 */
class CloudflareKVAdapter implements CacheAdapter {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async put(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || CacheTTL.MEDIUM;
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error('Cache put error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

/**
 * Get cache adapter based on environment
 */
export function getCacheAdapter(kv?: KVNamespace): CacheAdapter {
  if (kv) {
    return new CloudflareKVAdapter(kv);
  }
  // Fallback to local cache in development
  return new LocalCacheAdapter();
}

/**
 * Cache helper functions
 */
export class RewardCache {
  constructor(private adapter: CacheAdapter) {}

  /**
   * Get reward status from cache
   */
  async getRewardStatus(rewardId: string) {
    const key = CacheKeys.rewardStatus(rewardId);
    return this.adapter.get<{
      status: string;
      gridReward?: number;
      dAppTokenReward?: number;
      distributedAt?: string;
    }>(key);
  }

  /**
   * Cache reward status
   */
  async setRewardStatus(
    rewardId: string,
    data: {
      status: string;
      gridReward?: number;
      dAppTokenReward?: number;
      distributedAt?: string;
    },
    ttl: number = CacheTTL.MEDIUM
  ) {
    const key = CacheKeys.rewardStatus(rewardId);
    await this.adapter.put(key, data, { ttl });
  }

  /**
   * Invalidate reward status cache
   */
  async invalidateRewardStatus(rewardId: string) {
    const key = CacheKeys.rewardStatus(rewardId);
    await this.adapter.delete(key);
  }

  /**
   * Get user reward summary from cache
   */
  async getUserSummary(userAddress: string) {
    const key = CacheKeys.userSummary(userAddress);
    return this.adapter.get<{
      totalRewards: number;
      totalGridReward: number;
      totalDAppTokenReward: number;
      lastRewardAt?: number;
    }>(key);
  }

  /**
   * Cache user reward summary
   */
  async setUserSummary(
    userAddress: string,
    data: {
      totalRewards: number;
      totalGridReward: number;
      totalDAppTokenReward: number;
      lastRewardAt?: number;
    },
    ttl: number = CacheTTL.LONG
  ) {
    const key = CacheKeys.userSummary(userAddress);
    await this.adapter.put(key, data, { ttl });
  }
}
