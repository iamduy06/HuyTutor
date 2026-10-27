interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  /**
   * Retrieves an item from cache if not expired.
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value as T;
  }

  /**
   * Sets an item in cache with TTL in seconds (default: 300s = 5m).
   */
  set<T>(key: string, value: T, ttlSeconds = 300): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Deletes a specific cache key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys starting with a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
