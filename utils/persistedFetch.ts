// Simple persisted fetch helpers with TTL and offline fallback
// Stores data in localStorage and optionally uses Cache Storage for redundancy

export type PersistedOptions = {
  ttlMs?: number;
  headers?: Record<string, string>;
  timeoutMs?: number; // default 10000
  cacheName?: string; // default 'app-persist-cache-v1'
};

function keyData(url: string) {
  return `pf_data:${url}`;
}
function keyTs(url: string) {
  return `pf_ts:${url}`;
}

async function fetchWithTimeout(url: string, opts: PersistedOptions = {}): Promise<Response> {
  const { timeoutMs = 10000, headers = {} } = opts || {};
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function persistedFetchJSON<T = any>(url: string, opts: PersistedOptions = {}): Promise<T> {
  const ttl = typeof opts.ttlMs === 'number' ? opts.ttlMs : 15 * 60 * 1000;
  try {
    const tsRaw = localStorage.getItem(keyTs(url));
    const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
    const isFresh = Number.isFinite(ts) && ts > 0 && (Date.now() - ts) < ttl;
    const stored = localStorage.getItem(keyData(url));
    if (isFresh && stored) {
      try { return JSON.parse(stored) as T; } catch {}
    }
  } catch {}

  // Not fresh or missing: try network
  try {
    const res = await fetchWithTimeout(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const clone = res.clone();
    const data = await res.json();
    try {
      localStorage.setItem(keyData(url), JSON.stringify(data));
      localStorage.setItem(keyTs(url), Date.now().toString());
    } catch {}

    // Best-effort: also put in Cache Storage
    try {
      const cacheName = opts.cacheName || 'app-persist-cache-v1';
      if (typeof caches !== 'undefined' && caches.open) {
        const cache = await caches.open(cacheName);
        await cache.put(url, clone);
      }
    } catch {}

    return data as T;
  } catch (e) {
    // Fallback to stored if present
    try {
      const stored = localStorage.getItem(keyData(url));
      if (stored) return JSON.parse(stored) as T;
    } catch {}
    throw e;
  }
}

export async function persistedFetchText(url: string, opts: PersistedOptions = {}): Promise<string> {
  const ttl = typeof opts.ttlMs === 'number' ? opts.ttlMs : 24 * 60 * 60 * 1000; // default 1 day
  try {
    const tsRaw = localStorage.getItem(keyTs(url));
    const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
    const isFresh = Number.isFinite(ts) && ts > 0 && (Date.now() - ts) < ttl;
    const stored = localStorage.getItem(keyData(url));
    if (isFresh && typeof stored === 'string') {
      return stored;
    }
  } catch {}

  try {
    const res = await fetchWithTimeout(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const clone = res.clone();
    const text = await res.text();
    try {
      localStorage.setItem(keyData(url), text);
      localStorage.setItem(keyTs(url), Date.now().toString());
    } catch {}
    try {
      const cacheName = opts.cacheName || 'app-persist-cache-v1';
      if (typeof caches !== 'undefined' && caches.open) {
        const cache = await caches.open(cacheName);
        await cache.put(url, clone);
      }
    } catch {}
    return text;
  } catch (e) {
    try {
      const stored = localStorage.getItem(keyData(url));
      if (typeof stored === 'string') return stored;
    } catch {}
    throw e;
  }
}
