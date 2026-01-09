// File upload service for handling media uploads to the server

interface UploadResponse {
  success: boolean;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  error?: string;
}

class UploadService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  // Upload a file to the server
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken') || '';
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Prefer XHR to support upload progress events (especially important on mobile)
      if (typeof XMLHttpRequest !== 'undefined') {
        return await new Promise<string>((resolve, reject) => {
          const setT: any = (globalThis as any)?.setTimeout ? (globalThis as any).setTimeout.bind(globalThis) : setTimeout;
          const clearT: any = (globalThis as any)?.clearTimeout ? (globalThis as any).clearTimeout.bind(globalThis) : clearTimeout;

          const xhr = new XMLHttpRequest();
          const q = token ? `?token=${encodeURIComponent(token)}` : '';
          const url = `${this.apiUrl}/upload${q}`;
          let settled = false;
          let lastLoaded = 0;
          let stallTimer: any = null;

          const clearStall = () => {
            if (!stallTimer) return;
            try { clearT(stallTimer); } catch {}
            stallTimer = null;
          };

          const armStall = (ms: number) => {
            clearStall();
            stallTimer = setT(() => {
              if (settled) return;
              settled = true;
              try { xhr.abort(); } catch {}
              reject(new Error('Upload stalled'));
            }, ms);
          };

          // If we don't see any upload progress for 60s, assume it's stuck.
          // After first progress, allow longer gaps.
          armStall(60000);
          try { if (onProgress) onProgress(0); } catch {}

          xhr.open('POST', url, true);
          try { xhr.responseType = 'json'; } catch {}

          // Fallback via fetch without custom headers to avoid preflight issues on some mobile webviews
          const tryFetchFallback = async (): Promise<boolean> => {
            try {
              // First try absolute API URL we were targeting
              let res = await fetch(url, { method: 'POST', body: formData, mode: 'cors' as RequestMode });
              if (res && res.ok) {
                const data: any = await res.json().catch(() => null);
                const u = data?.url;
                if (u) { try { if (onProgress) onProgress(100); } catch {} resolve(String(u)); return true; }
              }
              // If app origin differs, try same-origin /api as a last resort
              try {
                const { origin } = window.location as any;
                const abs = new URL(url);
                if (origin && abs.origin !== origin) {
                  const rel = `${origin}/api/upload${q}`;
                  res = await fetch(rel, { method: 'POST', body: formData, mode: 'cors' as RequestMode });
                  if (res && res.ok) {
                    const data: any = await res.json().catch(() => null);
                    const u = data?.url;
                    if (u) { try { if (onProgress) onProgress(100); } catch {} resolve(String(u)); return true; }
                  }
                }
              } catch {}
            } catch {}
            return false;
          };

          xhr.upload.onprogress = (evt) => {
            try {
              if (!evt) return;
              const totalRaw = Number((evt as any).total) || 0;
              const loaded = Number((evt as any).loaded) || 0;
              const total = totalRaw > 0 ? totalRaw : (Number((file as any)?.size) || 0);
              const pct = total > 0 ? (loaded / total) * 100 : 0;
              if (onProgress) onProgress(Math.max(0, Math.min(100, pct)));
              if (loaded > lastLoaded) {
                lastLoaded = loaded;
                armStall(180000);
              }
            } catch {}
          };

          xhr.onerror = () => {
            (async () => {
              clearStall();
              if (settled) return;
              const ok = await tryFetchFallback();
              if (ok) { settled = true; return; }
              settled = true;
              reject(new Error('Upload failed'));
            })();
          };

          xhr.onabort = () => {
            (async () => {
              clearStall();
              if (settled) return;
              const ok = await tryFetchFallback();
              if (ok) { settled = true; return; }
              settled = true;
              reject(new Error('Upload aborted'));
            })();
          };

          xhr.onload = () => {
            clearStall();
            if (settled) return;
            try {
              const status = Number(xhr.status) || 0;
              const ok = status >= 200 && status < 300;
              const data: any = (xhr as any).response || (() => {
                try { return JSON.parse(xhr.responseText || '{}'); } catch { return null; }
              })();
              if (!ok) {
                (async () => {
                  const fetched = await tryFetchFallback();
                  if (fetched) { settled = true; return; }
                  const msg = (data && (data.error || data.message)) || `Upload failed (${status})`;
                  settled = true;
                  reject(new Error(msg));
                })();
                return;
              }
              if (!data || !data.success || !data.url) {
                const msg = (data && (data.error || data.message)) || 'Upload failed';
                settled = true;
                reject(new Error(msg));
                return;
              }
              try { if (onProgress) onProgress(100); } catch {}
              settled = true;
              console.log('[Upload] File uploaded successfully:', data.filename);
              resolve(String(data.url));
            } catch (e: any) {
              settled = true;
              reject(e);
            }
          };

          xhr.send(formData);
        });
      }

      // Fallback to fetch (no progress events)
      const qs = token ? `?token=${encodeURIComponent(token)}` : '';
      const response = await fetch(`${this.apiUrl}/upload${qs}`, {
        method: 'POST',
        // Avoid custom headers to prevent preflight issues on some mobile webviews
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: UploadResponse = await response.json();
      console.log('[Upload] File uploaded successfully:', data.filename);

      return data.url;
    } catch (error) {
      console.error('[Upload] Error uploading file:', error);
      throw error;
    }
  }

  // Delete a file from the server
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('authToken') || 'admin-token';

      const response = await fetch(`${this.apiUrl}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      console.log('[Upload] File deleted successfully:', filename);
      return true;
    } catch (error) {
      console.error('[Upload] Error deleting file:', error);
      return false;
    }
  }

  // Extract filename from URL
  getFilenameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }
}

// Create singleton instance
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
export const uploadService = new UploadService(apiUrl);
