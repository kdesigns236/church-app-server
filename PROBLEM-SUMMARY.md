# Video Upload Problem - Church of God Evening Light App

## 🚨 CRITICAL ISSUE
Video uploads fail with error: **"serverUrl is not defined"** on Android mobile app, despite multiple fix attempts.

---

## 📱 APP DETAILS

**Technology Stack:**
- Frontend: React + TypeScript + Vite
- Mobile: Capacitor (Android)
- Backend: Node.js + Express (hosted on Render.com free tier)
- Video Storage: Cloudinary
- Database: PostgreSQL

**Repository:**
- Frontend: Local development at `d:\church-of-god-evening-light`
- Backend: https://github.com/kdesigns236/church-app-server
- Server URL: https://church-app-server.onrender.com/api

---

## 🐛 THE PROBLEM

### Symptom:
When trying to upload a video from the Android app, it shows:
```
❌ FAILED TO SAVE
Error: serverUrl is not defined

Possible causes:
1. Server connection issue
2. Video upload failed
3. Invalid data format
4. Network timeout
```

### Current Behavior:
- ✅ Small videos (under 1 minute) sometimes work
- ❌ Larger videos (over 1 minute) always fail
- ✅ Works perfectly in local development (npm run dev)
- ❌ Fails in production APK build

### Error Location:
File: `pages/AdminPage.tsx` around line 363
```typescript
const serverUrl = (import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api';
```

---

## 🔧 WHAT WE'VE TRIED

### Attempt 1: Fix Environment Variable
**Problem:** `import.meta.env.VITE_API_URL` is undefined in mobile build
**Solution Attempted:** Added fallback URL
```typescript
const serverUrl = (import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api';
```
**Result:** Still shows "serverUrl is not defined"

### Attempt 2: Direct Cloudinary Upload
**Problem:** Render free tier has 30-second timeout
**Solution Attempted:** Upload directly to Cloudinary, bypassing Render
- Added `/api/cloudinary/signature` endpoint on server
- Modified client to get signature first, then upload directly
**Result:** Upload progresses to 100%, then fails with same error

### Attempt 3: Add Timeouts
**Problem:** App hangs on startup waiting for server
**Solution Attempted:** Added 10-second timeout to all fetch calls
**Result:** App loads faster, but upload still fails

### Attempt 4: Multiple Clean Rebuilds
**Actions Taken:**
1. `npm run build` (multiple times)
2. `npx cap sync android` (multiple times)
3. `.\gradlew.bat clean assembleDebug` (multiple times)
4. Uninstalled and reinstalled APK (multiple times)
**Result:** Same error persists

---

## 📂 KEY FILES

### 1. AdminPage.tsx (Upload Logic)
Location: `d:\church-of-god-evening-light\pages\AdminPage.tsx`

**Current Implementation (lines 358-443):**
```typescript
// Get server URL - use production URL as fallback for mobile builds
const serverUrl = (import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api';
console.log('[Admin] Using server URL:', serverUrl);

// Step 1: Get upload signature from server (fast, no timeout issues)
console.log('[Admin] Getting Cloudinary signature...');
const signatureRes = await fetch(`${serverUrl}/cloudinary/signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
});

if (!signatureRes.ok) {
    throw new Error('Failed to get upload signature from server');
}

const signatureData = await signatureRes.json();
console.log('[Admin] Got signature, uploading directly to Cloudinary...');

// Step 2: Upload directly to Cloudinary (bypasses Render timeout!)
const formData = new FormData();
formData.append('file', data.videoUrl);
formData.append('api_key', signatureData.apiKey);
formData.append('timestamp', signatureData.timestamp.toString());
formData.append('signature', signatureData.signature);
formData.append('folder', signatureData.folder);
formData.append('public_id', signatureData.publicId);
formData.append('resource_type', 'video');

// Use XMLHttpRequest for upload progress
const result: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // No timeout - let it take as long as needed!
    xhr.timeout = 0;
    
    // ... progress tracking code ...
    
    // Send directly to Cloudinary (no Render server involved!)
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`);
    xhr.send(formData);
});
```

### 2. Server Signature Endpoint
Location: `d:\church-of-god-evening-light\server\index.js` (lines 417-448)

```javascript
// Generate Cloudinary upload signature for direct client uploads
app.post('/api/cloudinary/signature', (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'church-sermons';
    const publicId = `sermon-${timestamp}`;
    
    // Generate signature for upload
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        public_id: publicId,
        upload_preset: 'unsigned_preset'
      },
      process.env.CLOUDINARY_API_SECRET
    );
    
    res.json({
      signature: signature,
      timestamp: timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: folder,
      publicId: publicId
    });
  } catch (error) {
    console.error('[Cloudinary] Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});
```

### 3. Environment Variables
Location: `d:\church-of-god-evening-light\.env`

```env
VITE_API_URL=https://church-app-server.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME=de0zuglgd
VITE_CLOUDINARY_API_KEY=548664513886978
```

### 4. Capacitor Config
Location: `d:\church-of-god-evening-light\capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'com.churchofgodeveninglight.app',
  appName: 'Church of God Evening Light',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  // ... plugins config ...
};
```

---

## 🤔 SUSPECTED ROOT CAUSES

### Theory 1: Vite Environment Variables Not Bundled
- `.env` file is not included in APK build
- `import.meta.env.VITE_API_URL` returns `undefined` in mobile app
- Fallback URL should work, but somehow `serverUrl` is still undefined

### Theory 2: Build Process Issue
- TypeScript compilation might be stripping the fallback
- Vite build might be optimizing away the variable
- Capacitor sync might not be copying the latest build

### Theory 3: Scope/Timing Issue
- Variable is defined in try block but error occurs in catch block
- Variable might be getting garbage collected
- Async/await timing issue

### Theory 4: Mobile-Specific Issue
- Works in browser but not in Capacitor WebView
- Android WebView has different JavaScript engine
- CORS or security policy blocking the request

---

## 📊 DIAGNOSTIC DATA

### Build Process:
```bash
# Frontend build
npm run build  # ✅ Completes successfully
# Output: dist/assets/index-[hash].js (768 KB)

# Capacitor sync
npx cap sync android  # ✅ Completes successfully
# Copies dist/ to android/app/src/main/assets/public

# Android build
cd android
.\gradlew.bat assembleDebug  # ✅ Completes successfully
# Output: app-debug.apk (9.2 MB)
```

### APK Details:
- **Size:** 9,195,433 bytes (9.2 MB)
- **Last Build:** Nov 5, 2025 12:17 PM
- **Location:** `android\app\build\outputs\apk\debug\app-debug.apk`

### Server Status:
- ✅ Server is running on Render
- ✅ Health endpoint responds: https://church-app-server.onrender.com/api/health
- ✅ Signature endpoint exists and works
- ⚠️ Free tier has 30-second timeout (reason for direct upload approach)
- ✅ Cron-job.org pings every 15 minutes to keep server awake

---

## 🎯 WHAT WE NEED

### Primary Question:
**Why does `serverUrl` remain undefined in the mobile APK despite having a fallback value?**

### Secondary Questions:
1. How can we properly pass environment variables to Capacitor Android builds?
2. Is there a better way to handle API URLs in mobile builds?
3. Why does the error say "serverUrl is not defined" when there's a fallback?
4. Could this be a Vite build configuration issue?

### Desired Outcome:
- Video uploads work for ALL video sizes (under 100MB)
- No "serverUrl is not defined" error
- Reliable uploads on mobile app

---

## 🔍 DEBUGGING ATTEMPTS

### What We've Checked:
- ✅ Source code has the fallback URL
- ✅ Build completes without errors
- ✅ APK is installed correctly
- ✅ Server endpoints are accessible
- ✅ Cloudinary credentials are valid
- ❌ Cannot debug on device (no Chrome DevTools access yet)

### What We Haven't Tried:
- Using Capacitor's native storage for config
- Hardcoding the URL (removing import.meta.env entirely)
- Using a different build tool (Vite alternatives)
- Testing with Android Studio debugger
- Checking if it's a catch block scope issue

---

## 💡 POSSIBLE SOLUTIONS TO EXPLORE

### Option 1: Hardcode URL Completely
Remove all environment variable logic:
```typescript
const serverUrl = 'https://church-app-server.onrender.com/api';
```

### Option 2: Use Capacitor Config
Store URL in `capacitor.config.ts` and read it at runtime:
```typescript
import { CapacitorConfig } from '@capacitor/cli';
const config = await Capacitor.getConfig();
const serverUrl = config.server.url;
```

### Option 3: Use Native Storage
Store URL in native storage during app initialization:
```typescript
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'apiUrl', value: 'https://...' });
```

### Option 4: Check Error Scope
The error might be coming from the catch block where `serverUrl` is out of scope:
```typescript
catch (error) {
    console.error('[Admin] Server URL:', serverUrl); // <-- Is this line causing it?
}
```

---

## 📞 CONTACT & RESOURCES

**Developer:** User (via Cascade AI)
**Project:** Church of God Evening Light Mobile App
**Urgency:** High (production app not working)
**Budget:** Free tier (Render, Cloudinary, Cron-job.org)

**Relevant Links:**
- Backend Repo: https://github.com/kdesigns236/church-app-server
- Server: https://church-app-server.onrender.com
- Cloudinary: https://cloudinary.com/console

---

## 🙏 REQUEST

Please help us identify:
1. **Why** `serverUrl` is undefined despite the fallback
2. **How** to properly configure API URLs for Capacitor Android builds
3. **What** the best approach is for video uploads in this scenario

Any guidance, code examples, or debugging steps would be greatly appreciated!

---

**Last Updated:** November 5, 2025
**Status:** UNRESOLVED - Seeking Expert Help
