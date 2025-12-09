import { videoStorageService } from './videoStorageService';

interface BackgroundFetchConfig {
  enabled: boolean;
  lastFetchTime: number;
  downloadedSermons: string[];
  failedSermons: string[];
}

class SafeBackgroundFetchService {
  private readonly CONFIG_KEY = 'backgroundFetchConfig';
  private readonly MIN_FETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private initialized = false;

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
    return { enabled: true, lastFetchTime: 0, downloadedSermons: [], failedSermons: [] };
    }

  private saveConfig(cfg: BackgroundFetchConfig) {
    try { localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  }

  shouldFetch(): boolean {
    const cfg = this.getConfig();
    if (!cfg.enabled) return false;
    const now = Date.now();
    return now - (cfg.lastFetchTime || 0) >= this.MIN_FETCH_INTERVAL;
  }

  async scheduleBackgroundFetch(sermons: any[]): Promise<boolean> {
    try {
      if (!this.initialized) {
        const ok = await this.initialize();
        if (!ok) return false;
      }

      const cfg = this.getConfig();

      const connection: any = (navigator as any).connection;
      const effective: string | undefined = connection?.effectiveType;
      if (effective && /(2g|3g)/i.test(effective)) return false;

      const toDownload = (Array.isArray(sermons) ? sermons : []).filter((s) => {
        const id = String(s?.id || '');
        const url = String(s?.videoUrl || '');
        if (!id || !url) return false;
        if (!/^https?:\/\//i.test(url)) return false;
        if (cfg.downloadedSermons.includes(id)) return false;
        if (cfg.failedSermons.includes(id)) return false;
        return true;
      });

      for (const s of toDownload) {
        const id = String(s.id);
        try {
          const already = await videoStorageService.hasVideo(id);
          if (already) { if (!cfg.downloadedSermons.includes(id)) cfg.downloadedSermons.push(id); continue; }

          const url: string = s.videoUrl;

          try {
            const head = await fetch(url, { method: 'HEAD' as any });
            const len = head.headers?.get('content-length');
            if (!len || isNaN(parseInt(len, 10))) {
              // Unknown size: skip to avoid huge downloads
              cfg.failedSermons.push(id);
              continue;
            }
            const size = parseInt(len, 10);
            const max = 120 * 1024 * 1024;
            if (size > max) { cfg.failedSermons.push(id); continue; }
          } catch {}

          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 30000);
          const res = await fetch(url, { signal: controller.signal, cache: 'default' });
          clearTimeout(t);
          if (!res.ok) { cfg.failedSermons.push(id); continue; }
          const blob = await res.blob();
          const mime = blob.type || 'video/mp4';
          const ext = mime.split('/')[1] || 'mp4';
          const file = new File([blob], `sermon-${id}.${ext}`, { type: mime });
          await videoStorageService.saveVideo(id, file);
          if (!cfg.downloadedSermons.includes(id)) cfg.downloadedSermons.push(id);
          this.saveConfig(cfg);
          await new Promise((r) => setTimeout(r, 1500));
        } catch {
          if (!cfg.failedSermons.includes(id)) cfg.failedSermons.push(id);
        }
      }

      cfg.lastFetchTime = Date.now();
      this.saveConfig(cfg);
      return true;
    } catch {
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
