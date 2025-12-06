import { Downloader } from '@capgo/capacitor-downloader';
import { Filesystem, Directory } from '@capacitor/filesystem';
import BackgroundFetch from '@transistorsoft/capacitor-background-fetch';
import { Capacitor } from '@capacitor/core';

export type MinimalSermon = { id: string | number; videoUrl?: string };

const FILE_MAP_KEY = 'videoFiles'; // { [sermonId]: filePath }
const VIDEO_DIR = 'videos';

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

export const backgroundDownloadService = {
  async init(config?: { intervalMinutes?: number; wifiOnly?: boolean }) {
    const minimumFetchInterval = Math.max(15, config?.intervalMinutes ?? 60);
    // Configure recurring background fetch
    await BackgroundFetch.configure(
      {
        minimumFetchInterval,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        requiredNetworkType: (config?.wifiOnly ? BackgroundFetch.NETWORK_TYPE_UNMETERED : BackgroundFetch.NETWORK_TYPE_ANY)
      },
      async (taskId: string) => {
        try {
          const sermonsRaw = localStorage.getItem('sermons');
          const sermons = sermonsRaw ? (JSON.parse(sermonsRaw) as MinimalSermon[]) : [];
          await this.scheduleForSermons(sermons);
        } finally {
          BackgroundFetch.finish(taskId);
        }
      },
      async (taskId: string) => {
        BackgroundFetch.finish(taskId);
      }
    );

    // Headless (Android terminated)
    BackgroundFetch.registerHeadlessTask(async (event: any) => {
      try {
        const sermonsRaw = localStorage.getItem('sermons');
        const sermons = sermonsRaw ? (JSON.parse(sermonsRaw) as MinimalSermon[]) : [];
        await backgroundDownloadService.scheduleForSermons(sermons);
      } catch {}
    });
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
        await Downloader.download({
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
