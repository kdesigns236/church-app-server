/**
 * Firebase Configuration
 * Used for video uploads to Firebase Storage
 * Database still uses Render PostgreSQL
 */

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const envObj: any = (import.meta as any)?.env || {};
const projectId = envObj?.VITE_FIREBASE_PROJECT_ID || 'church-app-35f50';
const rawBucket = envObj?.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
const coerceBucket = (pid: string, candidate: string) => {
  const c = String(candidate || '').trim();
  if (!c) return `${pid}.appspot.com`;
  if (c.startsWith('gs://')) return c.replace(/^gs:\/\//, '');
  if (c.includes('firebasestorage.app') || c.includes('firebasestorage.googleapis.com')) return `${pid}.appspot.com`;
  if (c.endsWith('.appspot.com')) return c;
  return `${pid}.appspot.com`;
};
const storageBucket = coerceBucket(projectId, rawBucket);
const firebaseConfig = {
  apiKey: envObj?.VITE_FIREBASE_API_KEY || 'AIzaSyDer6BoUDdL738WsLFl30dXg_D4qYsGy5k',
  authDomain: envObj?.VITE_FIREBASE_AUTH_DOMAIN || 'church-app-35f50.firebaseapp.com',
  projectId,
  storageBucket,
  messagingSenderId: envObj?.VITE_FIREBASE_MESSAGING_SENDER_ID || '181002070231',
  appId: envObj?.VITE_FIREBASE_APP_ID || '1:181002070231:web:599db5e8f6907fc406a892',
  measurementId: envObj?.VITE_FIREBASE_MEASUREMENT_ID || 'G-GPXT3MVGSW'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance
export const auth = getAuth(app);

// Get Firebase Storage instance
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// Sign in anonymously (required for uploads)
signInAnonymously(auth)
  .then(() => {
    console.log('[Firebase] ✅ Signed in anonymously');
  })
  .catch((error) => {
    console.error('[Firebase] ❌ Anonymous sign-in failed:', error);
  });

export default app;
