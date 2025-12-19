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
    try {
      if (!auth.currentUser) {
        await withTimeout(signInAnonymously(auth), 8000);
      }
    } catch {}
    console.log('[Firebase] Starting upload:', videoFile.name);
    console.log('[Firebase] File size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedTitle = sermonTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `sermons/${timestamp}_${sanitizedTitle}.mp4`;
    
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
      const clearStall = () => { if (stallTimer) { try { window.clearTimeout(stallTimer); } catch {} stallTimer = null; } };
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
      // If we don't see any bytes for 20s, assume stall; after first progress, allow 60s gaps
      armStall(20000);
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
            armStall(60000);
          }
        },
        // Error callback
        (error) => {
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
