import { videoStorageService } from './videoStorageService';

type PartialMeta = {
  id: string;
  url: string;
  mime: string;
  totalBytes: number;
  chunkSize: number;
  lastUpdated: number;
};

type ChunkRecord = {
  key: string; // `${id}:${index}`
  id: string;
  index: number;
  size: number;
  data: Blob;
};

class ChunkedVideoDownloader {
  private dbName = 'ChurchVideoChunksDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private async init(): Promise<void> {
    if (this.db) return;
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('partials')) {
          db.createObjectStore('partials', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chunks')) {
          const store = db.createObjectStore('chunks', { keyPath: 'key' });
          store.createIndex('byId', 'id', { unique: false });
        }
      };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  }

  private tx(storeNames: string[], mode: IDBTransactionMode): IDBTransaction {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.transaction(storeNames, mode);
  }

  private async getPartial(id: string): Promise<PartialMeta | undefined> {
    await this.init();
    return new Promise((resolve, reject) => {
      const t = this.tx(['partials'], 'readonly');
      const req = t.objectStore('partials').get(id);
      req.onsuccess = () => resolve(req.result as PartialMeta | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  private async putPartial(meta: PartialMeta): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const t = this.tx(['partials'], 'readwrite');
      const req = t.objectStore('partials').put(meta);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async deletePartial(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const t = this.tx(['partials'], 'readwrite');
      const req = t.objectStore('partials').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async getChunkIndices(id: string): Promise<Set<number>> {
    await this.init();
    return new Promise((resolve, reject) => {
      const indices = new Set<number>();
      const t = this.tx(['chunks'], 'readonly');
      const idx = t.objectStore('chunks').index('byId');
      const req = idx.openCursor(IDBKeyRange.only(id));
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null;
        if (cursor) {
          const rec = cursor.value as ChunkRecord;
          indices.add(rec.index);
          cursor.continue();
        } else {
          resolve(indices);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  private async putChunk(id: string, index: number, data: Blob): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const rec: ChunkRecord = { key: `${id}:${index}`, id, index, size: data.size, data };
      const t = this.tx(['chunks'], 'readwrite');
      const req = t.objectStore('chunks').put(rec);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async readChunksAsBlob(id: string, totalChunks: number): Promise<Blob> {
    await this.init();
    const parts: Blob[] = [];
    await new Promise<void>((resolve, reject) => {
      const t = this.tx(['chunks'], 'readonly');
      const idx = t.objectStore('chunks').index('byId');
      const req = idx.openCursor(IDBKeyRange.only(id));
      const byIndex = new Map<number, Blob>();
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null;
        if (cursor) {
          const rec = cursor.value as ChunkRecord;
          byIndex.set(rec.index, rec.data);
          cursor.continue();
        } else {
          for (let i = 0; i < totalChunks; i++) {
            const b = byIndex.get(i);
            if (!b) { reject(new Error('Missing chunk ' + i)); return; }
            parts.push(b);
          }
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
    return new Blob(parts);
  }

  private async clearChunks(id: string): Promise<void> {
    await this.init();
    await new Promise<void>((resolve, reject) => {
      const t = this.tx(['chunks'], 'readwrite');
      const idx = t.objectStore('chunks').index('byId');
      const req = idx.openCursor(IDBKeyRange.only(id));
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null;
        if (cursor) {
          const store = (cursor.source as IDBIndex).objectStore;
          store.delete(cursor.primaryKey as IDBValidKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async download(id: string, url: string, preferredChunkSize = 2 * 1024 * 1024): Promise<void> {
    await this.init();

    // Discover metadata via HEAD
    let total = 0;
    let mime = 'video/mp4';
    const head = await fetch(url, { method: 'HEAD' as any });
    const cl = head.headers.get('content-length');
    const ct = head.headers.get('content-type');
    if (cl) total = parseInt(cl, 10) || 0;
    if (ct) mime = ct;
    if (!total || Number.isNaN(total)) {
      // Fallback to GET once to learn total (not ideal, but necessary on some hosts)
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('Initial GET failed');
      const blob = await res.blob();
      total = blob.size;
      // Save whole file at once if small
      const file = new File([blob], `sermon-${id}.mp4`, { type: mime });
      await videoStorageService.saveVideo(id, file);
      return;
    }

    const chunkSize = preferredChunkSize;
    const totalChunks = Math.ceil(total / chunkSize);

    const existing = await this.getPartial(id);
    const meta: PartialMeta = existing || { id, url, mime, totalBytes: total, chunkSize, lastUpdated: Date.now() };
    await this.putPartial(meta);

    const have = await this.getChunkIndices(id);

    for (let index = 0; index < totalChunks; index++) {
      if (have.has(index)) continue;
      const start = index * chunkSize;
      const end = Math.min(total - 1, start + chunkSize - 1);

      const res = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        cache: 'no-store' as RequestCache
      });
      if (!(res.status === 206 || res.status === 200)) {
        throw new Error(`Range request failed: ${res.status}`);
      }
      const blob = await res.blob();
      // If server ignored Range and returned full content, handle once and finish
      if (res.status === 200 && index === 0 && blob.size === total) {
        const ext = (mime.split('/') [1] || 'mp4');
        const file = new File([blob], `sermon-${id}.${ext}`, { type: mime });
        await videoStorageService.saveVideo(id, file);
        await this.clearChunks(id);
        await this.deletePartial(id);
        return;
      }
      await this.putChunk(id, index, blob);
      await this.putPartial({ ...meta, lastUpdated: Date.now() });
      // Yield a little between chunks
      await new Promise((r) => setTimeout(r, 250));
    }

    // Assemble and save
    const finalBlob = await this.readChunksAsBlob(id, totalChunks);
    const ext = (mime.split('/')[1] || 'mp4');
    const file = new File([finalBlob], `sermon-${id}.${ext}`, { type: mime });
    await videoStorageService.saveVideo(id, file);

    // Cleanup partials
    await this.clearChunks(id);
    await this.deletePartial(id);
  }
}

export const chunkedVideoDownloader = new ChunkedVideoDownloader();
