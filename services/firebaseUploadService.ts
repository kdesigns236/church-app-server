/**
 * Firebase Upload Service
 * Handles video uploads to Firebase Storage
 * Then saves video URL to Render database
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';

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
    try { await signInAnonymously(auth); } catch {}
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

    return await new Promise<UploadMediaResult>((resolve, reject) => {
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
        },
        (error) => {
          reject({ success: false, error: error?.message || 'Upload failed' });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const rawBucket = (uploadTask.snapshot.ref as any).bucket || (storage as any)?.app?.options?.storageBucket || '';
            const appspotBucket = typeof rawBucket === 'string' ? rawBucket.replace('.firebasestorage.app', '.appspot.com') : rawBucket;
            const optimizedURL = typeof downloadURL === 'string'
              ? downloadURL.replace(`/b/${rawBucket}/o/`, `/b/${appspotBucket}/o/`)
              : downloadURL;
            const urlWithAlt = new URL(optimizedURL);
            urlWithAlt.searchParams.set('alt', 'media');
            urlWithAlt.searchParams.set('cors', '*');
            resolve({ success: true, url: urlWithAlt.toString(), storagePath: uploadTask.snapshot.ref.fullPath, bucket: appspotBucket });
          } catch (e: any) {
            reject({ success: false, error: e?.message || 'Failed to get URL' });
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
    try { await signInAnonymously(auth); } catch {}
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
    return new Promise((resolve, reject) => {
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
          
          reject({ success: false, error: errorMessage });
        },
        // Success callback
        async () => {
          try {
            // Get signed download URL with custom metadata
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Prefer the appspot.com bucket form to avoid an extra redirect in some environments
            const rawBucket = (uploadTask.snapshot.ref as any).bucket || (storage as any)?.app?.options?.storageBucket || '';
            const appspotBucket = typeof rawBucket === 'string' ? rawBucket.replace('.firebasestorage.app', '.appspot.com') : rawBucket;
            const optimizedURL = typeof downloadURL === 'string'
              ? downloadURL.replace(`/b/${rawBucket}/o/`, `/b/${appspotBucket}/o/`)
              : downloadURL;

            // Add CORS query parameter to URL
            const urlWithCors = new URL(optimizedURL);
            urlWithCors.searchParams.append('alt', 'media');
            urlWithCors.searchParams.append('cors', '*');
            
            console.log('[Firebase] ✅ Upload successful!');
            console.log('[Firebase] Video URL:', urlWithCors.toString());
            
            resolve({
              success: true,
              videoUrl: urlWithCors.toString(),
              storagePath: uploadTask.snapshot.ref.fullPath,
              bucket: appspotBucket
            });
          } catch (error: any) {
            console.error('[Firebase] Error getting download URL:', error);
            reject({
              success: false,
              error: 'Upload succeeded but failed to get URL: ' + error.message
            });
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
    console.log('[Firebase] Uploading sermon:', sermonData.title);

    // 1. Upload video to Firebase
    const uploadResult = await uploadVideoToFirebase(
      videoFile,
      sermonData.title,
      (progressData) => {
        if (onProgress) {
          onProgress(progressData.progress);
        }
      }
    );

    if (!uploadResult.success || !uploadResult.videoUrl) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    console.log('[Firebase] Video uploaded, saving to database...');

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

    return { success: true };

  } catch (error: any) {
    console.error('[Firebase] Error uploading sermon:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}
