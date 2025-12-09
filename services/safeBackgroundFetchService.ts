import { videoStorageService } from './videoStorageService';
import { chunkedVideoDownloader } from './chunkedVideoDownloader';

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
        const url = String(s?.videoUrl || '');
        if (!id || !url) continue;
        if (!/^https?:\/\//i.test(url)) { cfg.queueIndex = i + 1; this.saveConfig(cfg); continue; }

        try {
          const already = await videoStorageService.hasVideo(id);
          if (already) { if (!cfg.downloadedSermons.includes(id)) cfg.downloadedSermons.push(id); cfg.queueIndex = i + 1; this.saveConfig(cfg); continue; }

          cfg.currentId = id;
          this.saveConfig(cfg);
          // Use chunked downloader with HTTP Range support and resume
          await chunkedVideoDownloader.download(id, url);
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
