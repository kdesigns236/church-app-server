/**
 * Firebase Configuration
 * Used for video uploads to Firebase Storage
 * Database still uses Render PostgreSQL
 */

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase Configuration from environment variables
// IMPORTANT: In some deployments the build environment may not inject VITE_* variables.
// These fallback values keep uploads working in production.
const rawStorageBucket = (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET || 'church-app-35f50.appspot.com';
const firebaseConfig = {
  apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY || 'AIzaSyDer6BoUDdL738WsLFl30dXg_D4qYsGy5k',
  authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN || 'church-app-35f50.firebaseapp.com',
  projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID || 'church-app-35f50',
  storageBucket: String(rawStorageBucket || 'church-app-35f50.appspot.com').replace('.firebasestorage.app', '.appspot.com'),
  messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '181002070231',
  appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID || '1:181002070231:web:599db5e8f6907fc406a892',
  measurementId: (import.meta as any)?.env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-GPXT3MVGSW'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance
export const auth = getAuth(app);

// Get Firebase Storage instance
export const storage = getStorage(app);

// Sign in anonymously (required for uploads)
signInAnonymously(auth)
  .then(() => {
    console.log('[Firebase] ✅ Signed in anonymously');
  })
  .catch((error) => {
    console.error('[Firebase] ❌ Anonymous sign-in failed:', error);
  });

export default app;
