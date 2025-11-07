/**
 * Firebase Configuration
 * Used for video uploads to Firebase Storage
 * Database still uses Render PostgreSQL
 */

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase Configuration - Church App
// Project: church-app-35f50
const firebaseConfig = {
  apiKey: "AIzaSyDer6BoUDdL738WsLFl30dXg_D4qYsGy5k",
  authDomain: "church-app-35f50.firebaseapp.com",
  projectId: "church-app-35f50",
  storageBucket: "church-app-35f50.firebasestorage.app",
  messagingSenderId: "181002070231",
  appId: "1:181002070231:web:599db5e8f6907fc406a892",
  measurementId: "G-GPXT3MVGSW"
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
