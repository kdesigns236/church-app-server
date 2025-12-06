import { CapacitorDownloader } from '@capgo/capacitor-downloader';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export type MinimalSermon = { id: string | number; videoUrl?: string };

const FILE_MAP_KEY = 'videoFiles'; // { [sermonId]: filePath }
const VIDEO_DIR = 'videos';
let bfInitStarted = false;
let bfConfigured = false;
let fgTimer: any = null;

function getFileMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FILE_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function setFileMap(map: Record<string, string>) {
  try { localStorage.setItem(FILE_MAP_KEY, JSON.stringify(map)); } catch {}
}

async function ensureDir() {
  try {
    await Filesystem.mkdir({ directory: Directory.Data, path: VIDEO_DIR, recursive: true });
  } catch (_) {
    // ignore if exists
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await Filesystem.stat({ directory: Directory.Data, path: filePath });
    return true;
  } catch {
    return false;
  }
}

async function guessExtFromUrl(url: string): Promise<string> {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').pop() || '';
    const m = last.match(/\.(mp4|webm|mov|m4v)$/i);
    return m ? m[1].toLowerCase() : 'mp4';
  } catch {
    return 'mp4';
  }
}

async function toWebPath(filePath: string): Promise<string> {
  try {
    // Build native URI then convert to webview src
    const full = await Filesystem.getUri({ directory: Directory.Data, path: filePath });
    return Capacitor.convertFileSrc(full.uri);
  } catch {
    return '';
  }
}

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

async function serverLog(level: string, tag: string, message: string, data?: any) {
  try {
    const url = resolveApiUrl() + '/mobile-log';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ts: Date.now(), level, tag, message, data })
    });
  } catch {}
}

export const backgroundDownloadService = {
  async init(config?: { intervalMinutes?: number; wifiOnly?: boolean }) {
    try {
      const plat = (Capacitor as any)?.getPlatform?.() || 'web';
      const isNative = (Capacitor as any)?.isNativePlatform?.() || false;
      if (!isNative || plat !== 'android') return;
      if (bfConfigured || bfInitStarted) return;
      bfInitStarted = true;
      serverLog('INFO','BGFetch','init start');
    } catch {}
    const minimumFetchInterval = Math.max(1, config?.intervalMinutes ?? 60);
    // Configure recurring background fetch
    try {
      const ENABLE_BF = false;
      if (ENABLE_BF) {
        await new Promise((r) => setTimeout(r, 5000));
        const mod = await import('@transistorsoft/capacitor-background-fetch');
        const BF: any = (mod as any).BackgroundFetch;
        if (!BF) return;
        try { await BF.status(); } catch {}
        serverLog('INFO','BGFetch','configuring');
        await BF.configure(
          {
            minimumFetchInterval,
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: false,
            requiredNetworkType: (config?.wifiOnly ? BF.NETWORK_TYPE_UNMETERED : BF.NETWORK_TYPE_ANY)
          },
          async (taskId: string) => {
            try {
              const sermonsRaw = localStorage.getItem('sermons');
              const sermons = sermonsRaw ? (JSON.parse(sermonsRaw) as MinimalSermon[]) : [];
              await this.scheduleForSermons(sermons);
            } finally {
              try { await BF.finish(taskId); } catch {}
            }
          },
          async (taskId: string) => {
            try { await BF.finish(taskId); } catch {}
          }
        );
        serverLog('INFO','BGFetch','configured ok');
        bfConfigured = true;
        bfInitStarted = false;
      }
    } catch (e) {
      bfInitStarted = false;
      try { serverLog('ERROR','BGFetch','configure failed', (e && (e as any).message) ? (e as any).message : String(e)); } catch {}
    }

    try {
      const intervalMs = Math.max(1, minimumFetchInterval) * 60 * 1000;
      if (fgTimer) { clearInterval(fgTimer); fgTimer = null; }
      const run = async () => {
        try {
          const sermonsRaw = localStorage.getItem('sermons');
          const sermons = sermonsRaw ? (JSON.parse(sermonsRaw) as MinimalSermon[]) : [];
          await this.scheduleForSermons(sermons);
          try { serverLog('INFO','FGFetch','tick ok'); } catch {}
        } catch (err) {
          try { serverLog('ERROR','FGFetch','tick failed', (err && (err as any).message) ? (err as any).message : String(err)); } catch {}
        }
      };
      await run();
      fgTimer = setInterval(run, intervalMs);
      try { serverLog('INFO','FGFetch','timer started', { intervalMinutes: intervalMs / 60000 }); } catch {}
    } catch {}

    // Headless (Android terminated) - optional on some versions
    try {
      const ENABLE_BF = false;
      if (ENABLE_BF) {
        const mod = await import('@transistorsoft/capacitor-background-fetch');
        const anyBF: any = (mod as any).BackgroundFetch as any;
        if (false && anyBF.registerHeadlessTask) {
          anyBF.registerHeadlessTask(async (_event: any) => {
            try {
              const sermonsRaw = localStorage.getItem('sermons');
              const sermons = sermonsRaw ? (JSON.parse(sermonsRaw) as MinimalSermon[]) : [];
              await backgroundDownloadService.scheduleForSermons(sermons);
            } catch {}
          });
        }
      }
    } catch {}
  },

  async scheduleForSermons(sermons: MinimalSermon[]) {
    if (!Array.isArray(sermons) || sermons.length === 0) return;
    await ensureDir();
    const map = getFileMap();

    for (const s of sermons) {
      const id = String(s?.id || '');
      if (!id) continue;
      const url = s?.videoUrl || '';
      if (!url || !/^https?:\/\//i.test(url)) continue;
      const existing = map[id];
      if (existing && (await fileExists(existing))) continue;

      const ext = await guessExtFromUrl(url);
      const relPath = `${VIDEO_DIR}/sermon-${id}.${ext}`;

      try {
        // Skip if file path already exists
        if (await fileExists(relPath)) {
          map[id] = relPath;
          continue;
        }

        // Build absolute destination URI in app data dir
        const uri = await Filesystem.getUri({ directory: Directory.Data, path: relPath });
        await CapacitorDownloader.download({
          id: `sermon-${id}`,
          url,
          destination: uri.uri,
          network: 'cellular',
          priority: 'high'
        });
        map[id] = relPath;
        setFileMap(map);
      } catch (e) {
        // Continue with next
        console.warn('[BackgroundDownloader] Failed to download', id, e);
        try { serverLog('WARN','Downloader','download failed', { id, error: (e && (e as any).message) ? (e as any).message : String(e) }); } catch {}
      }
    }

    setFileMap(map);
  },

  async getWebSrcIfDownloaded(sermonId: string | number): Promise<string | null> {
    try {
      const map = getFileMap();
      const id = String(sermonId);
      const filePath = map[id];
      if (filePath && (await fileExists(filePath))) {
        const web = await toWebPath(filePath);
        return web || null;
      }
      return null;
    } catch {
      return null;
    }
  }
};
