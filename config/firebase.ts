/**
 * Firebase Configuration
 * Used for video uploads to Firebase Storage
 * Database still uses Render PostgreSQL
 */

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase Configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
