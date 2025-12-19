/**
 * Firebase Upload Service
 * Handles video uploads to Firebase Storage
 * Then saves video URL to Render database
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../config/firebase';
import { keepAwakeService } from './keepAwakeService';
import { signInAnonymously } from 'firebase/auth';

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const setT: any = (globalThis as any)?.setTimeout ? (globalThis as any).setTimeout.bind(globalThis) : setTimeout;
  const clearT: any = (globalThis as any)?.clearTimeout ? (globalThis as any).clearTimeout.bind(globalThis) : clearTimeout;
  return await new Promise<T>((resolve, reject) => {
    let done = false;
    const t = setT(() => {
      if (done) return;
      done = true;
      reject(new Error('timeout'));
    }, Math.max(0, Number(timeoutMs) || 0));
    promise
      .then((v) => {
        if (done) return;
        done = true;
        try { clearT(t); } catch {}
        resolve(v);
      })
      .catch((e) => {
        if (done) return;
        done = true;
        try { clearT(t); } catch {}
        reject(e);
      });
  });
};

// --- Upload guard rails for mobile ---
const STALL_TIMEOUT = 30000; // 30s stall window before cancel

// Ensure Firebase anonymous auth (counts as authenticated for Storage rules)
const ensureAuth = async () => {
  try {
    if (auth.currentUser) {
      try { console.log('[Firebase Auth] Authenticated as:', (auth.currentUser as any)?.uid || 'unknown'); } catch {}
      return auth.currentUser;
    }
    console.log('[Firebase Auth] Signing in anonymously...');
    const cred = await signInAnonymously(auth);
    try { console.log('[Firebase Auth] Success:', (cred?.user as any)?.uid || 'unknown'); } catch {}
    return cred.user;
  } catch (e: any) {
    console.error('[Firebase Auth] Failed:', e?.code, e?.message);
    throw new Error(`Auth failed: ${e?.message || 'unknown error'}`);
  }
};

interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

interface UploadResult {
  success: boolean;
  videoUrl?: string;
  storagePath?: string;
  bucket?: string;
  error?: string;
}

interface UploadMediaProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

interface UploadMediaResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  bucket?: string;
  error?: string;
}

export async function uploadMediaToFirebase(
  folder: 'posts' | 'stories',
  file: File,
  onProgress?: (progress: UploadMediaProgress) => void
): Promise<UploadMediaResult> {
  try {
    try {
      if (!auth.currentUser) {
        await withTimeout(signInAnonymously(auth), 8000);
      }
    } catch {}
    const ts = Date.now();
    // Derive extension from file name or MIME type
    const namePart = (file.name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
    const nameExtMatch = namePart.match(/\.([a-zA-Z0-9]+)$/);
    const mimeExt = (file.type && file.type.split('/')[1]) || 'bin';
    const ext = (nameExtMatch && nameExtMatch[1]) ? nameExtMatch[1] : mimeExt;
    const base = namePart.replace(/\.[a-zA-Z0-9]+$/, '');
    const safeName = `${folder}/${ts}_${base}.${ext}`;
    const storageRef = ref(storage, safeName);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000',
      customMetadata: {
        uploadedBy: 'member',
        uploadDate: new Date().toISOString(),
      },
    });

    return await new Promise<UploadMediaResult>(async (resolve, reject) => {
      // Prevent device sleep during upload (mobile)
      try { await withTimeout(keepAwakeService.request('media-upload'), 2000); } catch {}

      let settled = false;
      let lastTransferred = 0;
      let stallTimer: number | null = null;
      const clearStall = () => { if (stallTimer) { try { window.clearTimeout(stallTimer); } catch {} stallTimer = null; } };
      const armStall = (ms: number) => {
        clearStall();
        stallTimer = window.setTimeout(() => {
          if (settled) return;
          try { uploadTask.cancel(); } catch {}
          settled = true;
          try { keepAwakeService.release('media-upload'); } catch {}
          reject({ success: false, error: 'Upload stalled' });
        }, ms) as any;
      };

      // Arm initial stall guard: if bytesTransferred stays at 0 for 15s, abort & fallback
      armStall(15000);
      try { if (onProgress) onProgress({ progress: 0, bytesTransferred: 0, totalBytes: file.size || 0 }); } catch {}
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          }
          // Only reset stall guard when we see forward progress
          if (snapshot.bytesTransferred > lastTransferred) {
            lastTransferred = snapshot.bytesTransferred;
            // After first byte moves, allow a longer window (45s) for mobile networks
            armStall(45000);
          }
        },
        (error) => {
          clearStall();
          if (!settled) {
            settled = true;
            try { keepAwakeService.release('media-upload'); } catch {}
            reject({ success: false, error: error?.message || 'Upload failed' });
          }
        },
        async () => {
          try {
            clearStall();
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const rawBucket = (uploadTask.snapshot.ref as any).bucket || (storage as any)?.app?.options?.storageBucket || '';
            const optimizedURL = downloadURL;
            if (!settled) {
              settled = true;
              try { keepAwakeService.release('media-upload'); } catch {}
              resolve({ success: true, url: (typeof optimizedURL === 'string' ? optimizedURL : String(optimizedURL)), storagePath: uploadTask.snapshot.ref.fullPath, bucket: rawBucket });
            }
          } catch (e: any) {
            if (!settled) {
              settled = true;
              try { keepAwakeService.release('media-upload'); } catch {}
              reject({ success: false, error: e?.message || 'Failed to get URL' });
            }
          }
        }
      );
    });
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown upload error' };
  }
}

/**
 * Upload video to Firebase Storage
 * @param videoFile - The video file to upload
 * @param sermonTitle - Title for the sermon (used in filename)
 * @param onProgress - Callback for upload progress updates
 * @returns Promise with upload result
 */
export async function uploadVideoToFirebase(
  videoFile: File,
  sermonTitle: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Basic validations for clearer user errors
    if (!videoFile) {
      return { success: false, error: 'No file selected' };
    }
    const type = String(videoFile.type || '').toLowerCase();
    const namePart = (videoFile.name || '').toLowerCase();
    const ext = (namePart.match(/\.([a-z0-9]+)$/)?.[1]) || '';
    const videoExts = new Set(['mp4','m4v','mov','3gp','3gpp','webm','mkv','avi']);
    const isVideo = type.startsWith('video/') || videoExts.has(ext);
    if (!isVideo) {
      return { success: false, error: `Invalid file type: ${videoFile.type || ext || 'unknown'}` };
    }

    // Ensure auth and extend retry time for mobile networks
    await ensureAuth();
    // Extend retry time for flaky mobile networks if supported by this SDK
    try { (storage as any).maxUploadRetryTime = 10 * 60 * 1000; } catch {}
    console.log('[Firebase] Starting upload:', videoFile.name);
    console.log('[Firebase] File size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedTitle = sermonTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const safeNamePart = (videoFile.name || 'video').replace(/[^a-zA-Z0-9._-]/g, '_');
    const nameExtMatch = safeNamePart.match(/\.([a-zA-Z0-9]+)$/);
    const mimeExt = (videoFile.type && videoFile.type.split('/')[1]) || ext || 'mp4';
    const finalExt = (nameExtMatch && nameExtMatch[1]) ? nameExtMatch[1] : mimeExt;
    const fileName = `sermons/${timestamp}_${sanitizedTitle}.${finalExt}`;
    
    console.log('[Firebase] Upload path:', fileName);

    // Create storage reference
    const storageRef = ref(storage, fileName);

    // Upload with progress tracking and metadata
    // Firebase automatically uses resumable uploads for files > 256KB
    // with optimal chunk sizes for best performance
    const uploadTask = uploadBytesResumable(storageRef, videoFile, {
      contentType: videoFile.type || 'video/mp4',
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
      customMetadata: {
        uploadedBy: 'admin',
        sermonTitle: sermonTitle,
        uploadDate: new Date().toISOString()
      }
    });

    // Return promise that resolves when upload completes
    return new Promise(async (resolve, reject) => {
      // Keep device awake during potentially long sermon upload
      try { await withTimeout(keepAwakeService.request('sermon-upload'), 2000); } catch {}
      let settled = false;
      let lastTransferred = 0;
      let stallTimer: number | null = null;
      let startTimer: number | null = null;
      let started = false;
      let lastProgressTs = Date.now();
      const clearStall = () => { if (stallTimer) { try { window.clearTimeout(stallTimer); } catch {} stallTimer = null; } };
      const clearStart = () => { if (startTimer) { try { window.clearTimeout(startTimer); } catch {} startTimer = null; } };
      const armStall = (ms: number) => {
        clearStall();
        stallTimer = window.setTimeout(() => {
          if (settled) return;
          try { uploadTask.cancel(); } catch {}
          settled = true;
          try { keepAwakeService.release('sermon-upload'); } catch {}
          reject({ success: false, error: 'Upload stalled' } as any);
        }, ms) as any;
      };
      // If we don't see any bytes, assume stall after 30s; after first progress, allow 60s gaps
      armStall(STALL_TIMEOUT);
      // Quick-start watchdog: if upload doesn't begin within 8s, cancel and fallback fast
      try { startTimer = window.setTimeout(() => {
        if (!started && !settled) {
          try { uploadTask.cancel(); } catch {}
          settled = true;
          try { keepAwakeService.release('sermon-upload'); } catch {}
          reject({ success: false, error: 'Firebase upload did not start (timeout)' } as any);
        }
      }, 8000) as any; } catch {}
      try { if (onProgress) onProgress({ progress: 0, bytesTransferred: 0, totalBytes: videoFile.size || 0 }); } catch {}
      uploadTask.on(
        'state_changed',
        // Progress callback
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          console.log(`[Firebase] Upload progress: ${progress.toFixed(1)}%`);
          
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            });
          }
          if (snapshot.bytesTransferred > lastTransferred) {
            lastTransferred = snapshot.bytesTransferred;
            lastProgressTs = Date.now();
            started = started || snapshot.bytesTransferred > 0;
            if (started) { clearStart(); }
            armStall(60000);
          }
        },
        // Error callback
        (error) => {
          clearStart();
          console.error('[Firebase] Upload error:', error);
          console.error('[Firebase] Error code:', error.code);
          console.error('[Firebase] Error message:', error.message);
          
          let errorMessage = 'Upload failed';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'Unauthorized - Check Firebase Storage rules';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload canceled';
              break;
            case 'storage/unknown':
              errorMessage = 'Unknown error - Check internet connection';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Storage quota exceeded';
              break;
            default:
              errorMessage = error.message;
          }
          
          clearStall();
          if (!settled) {
            settled = true;
            try { keepAwakeService.release('sermon-upload'); } catch {}
            reject({ success: false, error: errorMessage });
          }
        },
        // Success callback
        async () => {
          try {
            clearStall();
            clearStart();
            // Get signed download URL with custom metadata
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Prefer the appspot.com bucket form to avoid an extra redirect in some environments
            const rawBucket = (uploadTask.snapshot.ref as any).bucket || (storage as any)?.app?.options?.storageBucket || '';
            const optimizedURL = downloadURL;

            console.log('[Firebase] ✅ Upload successful!');
            console.log('[Firebase] Video URL:', (typeof optimizedURL === 'string' ? optimizedURL : String(optimizedURL)));
            
            if (!settled) {
              settled = true;
              try { keepAwakeService.release('sermon-upload'); } catch {}
              resolve({
                success: true,
                videoUrl: (typeof optimizedURL === 'string' ? optimizedURL : String(optimizedURL)),
                storagePath: uploadTask.snapshot.ref.fullPath,
                bucket: rawBucket
              });
            }
          } catch (error: any) {
            console.error('[Firebase] Error getting download URL:', error);
            if (!settled) {
              settled = true;
              try { keepAwakeService.release('sermon-upload'); } catch {}
              reject({
                success: false,
                error: 'Upload succeeded but failed to get URL: ' + error.message
              });
            }
          }
        }
      );
    });

  } catch (error: any) {
    console.error('[Firebase] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Upload video and save to database
 * @param sermonData - Sermon information
 * @param videoFile - Video file to upload
 * @param onProgress - Progress callback
 * @returns Promise with result
 */
export async function uploadSermonWithVideo(
  sermonData: {
    title: string;
    pastor: string;
    scripture: string;
    date?: string;
  },
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure Firebase auth for mobile/webview environments
    try {
      if (!auth.currentUser) {
        await withTimeout(signInAnonymously(auth), 8000);
      }
    } catch {}
    // Basic validations
    if (!videoFile) {
      return { success: false, error: 'No file selected' };
    }
    if (!(videoFile.type || '').startsWith('video/')) {
      return { success: false, error: `Invalid file type: ${videoFile.type || 'unknown'}` };
    }
    console.log('[Firebase] Uploading sermon:', sermonData.title);

    // 1. Upload video to Firebase
    const uploadResult = await uploadVideoToFirebase(
      videoFile,
      sermonData.title,
      (progressData) => {
        if (onProgress) {
          // Map to 0..90 to leave room for DB save
          const pct = Math.max(0, Math.min(90, progressData.progress));
          onProgress(pct);
        }
      }
    );

    if (!uploadResult.success || !uploadResult.videoUrl) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    console.log('[Firebase] Video uploaded, saving to database...');
    if (onProgress) onProgress(95);

    // 2. Save sermon data with Firebase video URL to database
    // Use the shared API base URL; fall back to the Render API if not set so
    // production/mobile builds never point at localhost:3000.
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('[Firebase] Auth token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${apiUrl}/sermons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: sermonData.title,
        pastor: sermonData.pastor,
        scripture: sermonData.scripture,
        date: sermonData.date || new Date().toISOString(),
        videoUrl: uploadResult.videoUrl, // Firebase URL!
        firebaseStoragePath: uploadResult.storagePath,
        firebaseBucket: uploadResult.bucket,
        uploadedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Firebase] Server response:', text);
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to save to database');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }

    const result = await response.json();
    console.log('[Firebase] ✅ Sermon saved to database:', result);
    if (onProgress) onProgress(100);

    return { success: true };

  } catch (error: any) {
    console.error('[Firebase] Error uploading sermon:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Direct backend upload with XHR progress (fallback path)
 */
export async function uploadToBackendDirectly(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  return await new Promise<string>((resolve, reject) => {
    try {
      const formData = new FormData();
      // Some backends expect 'file', others 'video' – send both safely
      formData.append('file', file);
      try { formData.append('video', file); } catch {}

      const xhr = new XMLHttpRequest();
      // Avoid preflight on mobile by passing token in query (server accepts '?token=')
      const uploadUrl = `${apiUrl}/upload?token=${encodeURIComponent(token)}`;
      const relUrl = (() => {
        try {
          const { origin } = window.location;
          const abs = new URL(uploadUrl);
          if (origin && abs.origin !== origin) {
            return `${origin}/api/upload?token=${encodeURIComponent(token)}`;
          }
        } catch {}
        return '';
      })();
      const tryFetchFallback = async (): Promise<boolean> => {
        try {
          // First try absolute URL
          let res = await fetch(uploadUrl, { method: 'POST', body: formData, mode: 'cors' as RequestMode });
          if (res && res.ok) {
            const data: any = await res.json().catch(() => null);
            const url = data?.url || data?.videoUrl;
            if (url) { try { onProgress?.(100); } catch {} resolve(String(url)); return true; }
          }
          // Then try relative same-origin URL if different
          if (relUrl) {
            res = await fetch(relUrl, { method: 'POST', body: formData, mode: 'cors' as RequestMode });
            if (res && res.ok) {
              const data: any = await res.json().catch(() => null);
              const url = data?.url || data?.videoUrl;
              if (url) { try { onProgress?.(100); } catch {} resolve(String(url)); return true; }
            }
          }
        } catch {}
        return false;
      };
      xhr.open('POST', uploadUrl, true);
      try { xhr.withCredentials = false; } catch {}
      try { xhr.responseType = 'json'; } catch {}
      xhr.timeout = 300000; // 5 minutes

      let settled = false;
      let lastLoaded = 0;
      let stallTimer: any = null;
      const clearStall = () => { if (stallTimer) { try { clearTimeout(stallTimer); } catch {} stallTimer = null; } };
      const armStall = (ms: number) => {
        clearStall();
        stallTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try { xhr.abort(); } catch {}
          reject(new Error('Upload stalled'));
        }, ms);
      };
      // Arm stall: 60s initially; after first progress extend to 180s
      armStall(60000);
      try { onProgress?.(0); } catch {}

      xhr.upload.onprogress = (evt: ProgressEvent) => {
        try {
          const total = (evt.lengthComputable ? evt.total : (file.size || 0)) || 0;
          const loaded = evt.loaded || 0;
          const pct = total > 0 ? (loaded / total) * 100 : 0;
          onProgress?.(Math.max(0, Math.min(100, pct)));
          if (loaded > lastLoaded) { lastLoaded = loaded; armStall(180000); }
        } catch {}
      };

      xhr.onerror = () => {
        (async () => {
          clearStall();
          if (settled) return;
          const ok = await tryFetchFallback();
          if (ok) { settled = true; return; }
          settled = true; reject(new Error('Network error during upload'));
        })();
      };
      xhr.ontimeout = () => {
        (async () => {
          clearStall();
          if (settled) return;
          const ok = await tryFetchFallback();
          if (ok) { settled = true; return; }
          settled = true; reject(new Error('Upload timed out'));
        })();
      };
      xhr.onabort = () => {
        (async () => {
          clearStall();
          if (settled) return;
          const ok = await tryFetchFallback();
          if (ok) { settled = true; return; }
          settled = true; reject(new Error('Upload aborted'));
        })();
      };

      xhr.onload = () => {
        clearStall();
        if (settled) return; settled = true;
        const status = Number(xhr.status) || 0;
        const ok = status >= 200 && status < 300;
        let data: any = null;
        try { data = (xhr as any).response || JSON.parse(xhr.responseText || '{}'); } catch {}
        if (!ok) {
          const text = (xhr.responseText || '');
          reject(new Error(`Upload failed (${status}): ${text.substring(0,120)}...`));
          return;
        }
        const url = data?.url || data?.videoUrl;
        if (!url) {
          reject(new Error('Invalid server response'));
          return;
        }
        try { onProgress?.(100); } catch {}
        resolve(String(url));
      };

      xhr.send(formData);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Chunked upload to backend to improve reliability on mobile networks
 */
export async function uploadToBackendChunked(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found. Please log in again.');

  const chunkSize = 8 * 1024 * 1024; // 8MB (matches server limit)
  const total = Math.max(1, Math.ceil((file.size || 0) / chunkSize));

  const initUrl = `${apiUrl}/upload/init?token=${encodeURIComponent(token)}&name=${encodeURIComponent(file.name || 'video.mp4')}&size=${file.size || 0}`;
  const initResp = await fetch(initUrl, { method: 'POST' });
  if (!initResp.ok) throw new Error(`Init failed (${initResp.status})`);
  const initData = await initResp.json();
  const uploadId = initData?.uploadId;
  if (!uploadId) throw new Error('No uploadId returned');

  let uploadedBytes = 0;

  for (let index = 0; index < total; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size || 0);
    const blob = file.slice(start, end);

    await new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', new Blob([blob], { type: file.type || 'application/octet-stream' }), `${file.name}.part${index}`);

      const xhr = new XMLHttpRequest();
      const url = `${apiUrl}/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&index=${index}&total=${total}&token=${encodeURIComponent(token)}`;
      xhr.open('POST', url, true);
      try { xhr.responseType = 'json'; } catch {}
      xhr.timeout = 300000; // 5 minutes per chunk

      let stallTimer: any = null;
      const clearStall = () => { if (stallTimer) { try { clearTimeout(stallTimer); } catch {} stallTimer = null; } };
      const armStall = (ms: number) => { clearStall(); stallTimer = setTimeout(() => { try { xhr.abort(); } catch {}; reject(new Error('Chunk stalled')); }, ms); };
      armStall(60000);

      xhr.upload.onprogress = (evt: ProgressEvent) => {
        try {
          const loaded = (evt.loaded || 0);
          const totalThis = Math.max(1, (end - start));
          const overallLoaded = uploadedBytes + Math.min(loaded, totalThis);
          const pct = Math.max(0, Math.min(100, (overallLoaded / (file.size || 1)) * 100));
          onProgress?.(pct);
          if (loaded > 0) armStall(180000);
        } catch {}
      };

      xhr.onerror = () => { clearStall(); reject(new Error('Chunk network error')); };
      xhr.ontimeout = () => { clearStall(); reject(new Error('Chunk timeout')); };
      xhr.onabort = () => { clearStall(); reject(new Error('Chunk aborted')); };
      xhr.onload = () => {
        clearStall();
        const status = Number(xhr.status) || 0;
        if (status < 200 || status >= 300) {
          return reject(new Error(`Chunk failed (${status})`));
        }
        uploadedBytes += (end - start);
        const pct = Math.max(0, Math.min(100, (uploadedBytes / (file.size || 1)) * 100));
        try { onProgress?.(pct); } catch {}
        resolve();
      };

      xhr.send(formData);
    });
  }

  const finishUrl = `${apiUrl}/upload/finish?uploadId=${encodeURIComponent(uploadId)}&token=${encodeURIComponent(token)}`;
  const finResp = await fetch(finishUrl, { method: 'POST' });
  if (!finResp.ok) throw new Error(`Finalize failed (${finResp.status})`);
  const data = await finResp.json();
  const url = data?.url || data?.videoUrl;
  if (!url) throw new Error('No URL returned');
  try { onProgress?.(100); } catch {}
  return String(url);
}
