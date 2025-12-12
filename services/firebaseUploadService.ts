/**
 * Firebase Upload Service
 * Handles video uploads to Firebase Storage
 * Then saves video URL to Render database
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

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
            
            // Add CORS query parameter to URL
            const urlWithCors = new URL(downloadURL);
            urlWithCors.searchParams.append('alt', 'media');
            urlWithCors.searchParams.append('cors', '*');
            
            console.log('[Firebase] ✅ Upload successful!');
            console.log('[Firebase] Video URL:', urlWithCors.toString());
            
            resolve({
              success: true,
              videoUrl: downloadURL,
              storagePath: uploadTask.snapshot.ref.fullPath,
              bucket: (uploadTask.snapshot.ref as any).bucket || (storage as any)?.app?.options?.storageBucket
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
