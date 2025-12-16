import { videoStorageService } from './videoStorageService';
import { chunkedVideoDownloader } from './chunkedVideoDownloader';

function resolveApiUrl(): string {
  try {
    const w: any = (typeof window !== 'undefined') ? window : {};
    const fromWindow = w.__APP_RUNTIME_CONFIG__?.apiUrl;
    const fromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('apiBaseUrl') : null;
    const fromEnv = (import.meta as any).env?.VITE_API_URL;
    const fallback = 'https://church-app-server.onrender.com/api';
    const url = (fromStorage || fromWindow || fromEnv || fallback) as string;
    return url.endsWith('/') ? url.replace(/\/$/, '') : url;
  } catch {
    return 'https://church-app-server.onrender.com/api';
  }
}

function isTokenizedFirebaseUrl(u: string): boolean {
  try {
    if (!u || !u.includes('firebasestorage.googleapis.com')) return false;
    const url = new URL(u);
    return !!url.searchParams.get('token');
  } catch {
    return false;
  }
}

async function resolveFirebaseDownloadUrlFromServer(storagePath: string, bucket?: string): Promise<string | null> {
  try {
    const base = resolveApiUrl();
    const qs = new URLSearchParams();
    qs.set('path', storagePath);
    if (bucket) qs.set('bucket', bucket);
    const resp = await fetch(`${base}/firebase-storage/download-url?${qs.toString()}`);
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const url = data && typeof data.url === 'string' ? data.url : '';
    return url || null;
  } catch {
    return null;
  }
}

interface BackgroundFetchConfig {
  enabled: boolean;
  lastFetchTime: number;
  downloadedSermons: string[];
  failedSermons: string[];
  queueIndex?: number;
  queueIds?: string[];
  currentId?: string | null;
}

class SafeBackgroundFetchService {
  private readonly CONFIG_KEY = 'backgroundFetchConfig';
  private readonly MIN_FETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private initialized = false;
  private running = false;

  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      if (document.readyState !== 'complete') {
        await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
      }
      await new Promise((r) => setTimeout(r, 2000));
      try { await videoStorageService.initialize(); } catch {}
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private getConfig(): BackgroundFetchConfig {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { enabled: true, lastFetchTime: 0, downloadedSermons: [], failedSermons: [], queueIndex: 0, queueIds: [], currentId: null };
    }

  private saveConfig(cfg: BackgroundFetchConfig) {
    try { localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  }

  shouldFetch(): boolean {
    const cfg = this.getConfig();
    if (!cfg.enabled) return false;
    // If we have an incomplete queue, allow immediate resume
    if (Array.isArray(cfg.queueIds) && typeof cfg.queueIndex === 'number') {
      if (cfg.queueIds.length > 0 && cfg.queueIndex < cfg.queueIds.length) return true;
    }
    const now = Date.now();
    return now - (cfg.lastFetchTime || 0) >= this.MIN_FETCH_INTERVAL;
  }

  async scheduleBackgroundFetch(sermons: any[]): Promise<boolean> {
    try {
      if (this.running) return true;
      this.running = true;
      if (!this.initialized) {
        const ok = await this.initialize();
        if (!ok) { this.running = false; return false; }
      }

      const cfg = this.getConfig();
      if (!cfg.enabled) { this.running = false; return false; }

      // If offline cache is unavailable (IndexedDB blocked), skip background fetch gracefully
      try {
        if (videoStorageService && typeof (videoStorageService as any).isEnabled === 'function' && !(videoStorageService as any).isEnabled()) {
          this.running = false;
          return false;
        }
      } catch {}

      const connection: any = (navigator as any).connection;
      const effective: string | undefined = connection?.effectiveType;
      if (effective && /(2g|3g)/i.test(effective)) return false;

      const list = Array.isArray(sermons) ? sermons : [];
      const ids = list.map((s) => String(s?.id || ''));
      cfg.queueIds = ids;
      if (typeof cfg.queueIndex !== 'number' || cfg.queueIndex < 0) cfg.queueIndex = 0;
      if (cfg.queueIndex >= ids.length) cfg.queueIndex = 0;
      this.saveConfig(cfg);

      for (let i = cfg.queueIndex; i < ids.length; i++) {
        const s = list[i];
        const id = String(s?.id || '');
        const rawUrl = String(s?.videoUrl || '');
        if (!id || !rawUrl) continue;
        if (!/^https?:\/\//i.test(rawUrl)) { cfg.queueIndex = i + 1; this.saveConfig(cfg); continue; }

        let effUrl = rawUrl;
        let resolvedFresh = false;
        try {
          if (isTokenizedFirebaseUrl(rawUrl)) {
            resolvedFresh = true;
          }
          const p: any = (s as any)?.firebaseStoragePath;
          const bucket: any = (s as any)?.firebaseBucket;
          if (!resolvedFresh && typeof p === 'string' && p) {
            const r = await resolveFirebaseDownloadUrlFromServer(p, (typeof bucket === 'string' ? bucket : undefined));
            if (r) { effUrl = r; resolvedFresh = true; }
            else if (isTokenizedFirebaseUrl(rawUrl)) { resolvedFresh = true; }
          }
        } catch {}

        if (!resolvedFresh && (s as any)?.firebaseStoragePath) {
          if (!cfg.failedSermons.includes(id)) cfg.failedSermons.push(id);
          cfg.queueIndex = i + 1;
          cfg.currentId = null;
          this.saveConfig(cfg);
          continue;
        }

        // Sanitize legacy Firebase URL params
        try {
          if (effUrl.includes('firebasestorage.googleapis.com')) {
            const u = new URL(effUrl);
            u.searchParams.delete('cors');
            const tok = u.searchParams.get('token');
            if (tok) { u.searchParams.delete('token'); u.searchParams.append('token', tok); }
            u.searchParams.set('alt', 'media');
            effUrl = u.toString();
          }
        } catch {}

        try {
          const already = await videoStorageService.hasVideo(id);
          if (already) { if (!cfg.downloadedSermons.includes(id)) cfg.downloadedSermons.push(id); cfg.queueIndex = i + 1; this.saveConfig(cfg); continue; }

          cfg.currentId = id;
          this.saveConfig(cfg);
          // Use chunked downloader with HTTP Range support and resume
          await chunkedVideoDownloader.download(id, effUrl);
          if (!cfg.downloadedSermons.includes(id)) cfg.downloadedSermons.push(id);
          cfg.queueIndex = i + 1;
          cfg.currentId = null;
          this.saveConfig(cfg);
          await new Promise((r) => setTimeout(r, 1500));
        } catch {
          if (!cfg.failedSermons.includes(id)) cfg.failedSermons.push(id);
          cfg.currentId = id;
          this.saveConfig(cfg);
          break;
        }
      }

      cfg.lastFetchTime = Date.now();
      this.saveConfig(cfg);
      this.running = false;
      return true;
    } catch {
      this.running = false;
      return false;
    }
  }

  enable(): void {
    const cfg = this.getConfig();
    cfg.enabled = true;
    this.saveConfig(cfg);
  }

  disable(): void {
    const cfg = this.getConfig();
    cfg.enabled = false;
    this.saveConfig(cfg);
  }

  clearDownloadedRecords(): void {
    const cfg = this.getConfig();
    cfg.downloadedSermons = [];
    cfg.failedSermons = [];
    this.saveConfig(cfg);
  }

  getStats(): { downloaded: number; failed: number; enabled: boolean } {
    const cfg = this.getConfig();
    return { downloaded: cfg.downloadedSermons.length, failed: cfg.failedSermons.length, enabled: cfg.enabled };
  }
}

export const safeBackgroundFetchService = new SafeBackgroundFetchService();
