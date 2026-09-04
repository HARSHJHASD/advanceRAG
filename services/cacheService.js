import { createHash } from "node:crypto";

const caches = new Map();

function getCache(name, maxEntries = 500) {
  if (!caches.has(name)) {
    caches.set(name, { entries: new Map(), maxEntries });
  }

  return caches.get(name);
}

export function cacheKey(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function getCached(name, key) {
  const cache = getCache(name);
  const entry = cache.entries.get(key);

  if (!entry || entry.expiresAt <= Date.now()) {
    cache.entries.delete(key);
    return undefined;
  }

  // Refresh insertion order for simple LRU eviction.
  cache.entries.delete(key);
  cache.entries.set(key, entry);
  return entry.value;
}

export function setCached(name, key, value, ttlMs) {
  const cache = getCache(name);

  cache.entries.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  while (cache.entries.size > cache.maxEntries) {
    cache.entries.delete(cache.entries.keys().next().value);
  }
}
