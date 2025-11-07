# 🔥 Firebase Setup Guide for Church App

## ✅ What We Changed

Your app now uses **Firebase Storage** for video uploads instead of Cloudinary!

### **Benefits:**
- ✅ **5GB free storage** (vs 1GB Cloudinary)
- ✅ **Unlimited file size** (no 100MB limit!)
- ✅ **Faster uploads** (Google's CDN)
- ✅ **More reliable** (Google infrastructure)
- ✅ **Same database** (still uses Render PostgreSQL)

---

## 🚀 Step-by-Step Setup

### **Step 1: Create Firebase Project** (5 minutes)

1. Go to **https://console.firebase.google.com**
2. Click **"Add Project"**
3. Enter project name: `church-sermons-app`
4. **Disable Google Analytics** (not needed)
5. Click **"Create Project"**
6. Wait for project to be created
7. Click **"Continue"**

---

### **Step 2: Enable Firebase Storage** (2 minutes)

1. In the left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get Started"**
3. **Start in production mode** (we'll set rules next)
4. Choose storage location: **Select closest to you**
   - US: `us-central1`
   - Europe: `europe-west1`
   - Asia: `asia-southeast1`
5. Click **"Done"**

---

### **Step 3: Set Storage Rules** (3 minutes)

1. In Storage page, click **"Rules"** tab
2. **Replace** the existing rules with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Sermons folder - anyone can read, only authenticated can write
    match /sermons/{allPaths=**} {
      allow read: if true;  // Anyone can watch videos
      allow write: if request.auth != null  // Only authenticated users can upload
                   && request.resource.size < 500 * 1024 * 1024  // Max 500MB per video
                   && request.resource.contentType.matches('video/.*');  // Only videos
    }
  }
}
```

3. Click **"Publish"**

---

### **Step 4: Get Firebase Configuration** (3 minutes)

1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **Web icon** (`</>`)
5. Register app:
   - App nickname: `Church Sermons App`
   - **Don't** check "Firebase Hosting"
   - Click **"Register app"**
6. **Copy the config object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXX",
  authDomain: "church-sermons-app.firebaseapp.com",
  projectId: "church-sermons-app",
  storageBucket: "church-sermons-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

7. Click **"Continue to console"**

---

### **Step 5: Add Config to Your App** (2 minutes)

1. Open file: `config/firebase.ts`
2. **Replace** the placeholder config with your actual config:

```typescript
// BEFORE (placeholder):
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  // ...
};

// AFTER (your actual config):
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXX",  // ← Your actual values!
  authDomain: "church-sermons-app.firebaseapp.com",
  projectId: "church-sermons-app",
  storageBucket: "church-sermons-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

3. **Save the file**

---

### **Step 6: Enable Anonymous Authentication** (2 minutes)

This allows uploads without requiring users to sign in:

1. In Firebase Console, go to **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click **"Anonymous"**
5. Toggle **"Enable"**
6. Click **"Save"**

---

### **Step 7: Build and Install App** (5 minutes)

Now build the app with Firebase integrated:

```bash
# Build the app
npm run build

# Sync with Android
npx cap sync android

# Build APK
cd android
.\gradlew.bat assembleDebug
```

The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## ✅ Testing Firebase Upload

### **Test 1: Upload a Video**

1. Install the new APK on your phone
2. Open app → Admin → Add Sermon
3. Fill in details and select a video
4. Click "Save"
5. Watch the progress bar (should show real-time progress!)
6. Video should upload successfully

### **Test 2: Verify in Firebase Console**

1. Go to Firebase Console → Storage
2. Click **"Files"** tab
3. You should see `sermons/` folder
4. Click into it - your video should be there!
5. Click the video → Copy the download URL
6. Paste URL in browser - video should play!

### **Test 3: Verify in App**

1. Go to Sermons page in app
2. Your new sermon should appear
3. Click to play - video should stream from Firebase!

---

## 🎯 How It Works

### **Upload Flow:**

```
1. Admin selects video in app
   ↓
2. Video uploads directly to Firebase Storage
   ↓
3. Firebase returns video URL
   ↓
4. App saves sermon data + Firebase URL to Render database
   ↓
5. All members see new sermon instantly!
```

### **Playback Flow:**

```
1. Member opens sermon
   ↓
2. App fetches sermon data from Render database
   ↓
3. Video streams from Firebase Storage
   ↓
4. Fast playback with Google's CDN!
```

---

## 📊 Firebase Free Tier Limits

### **What You Get Free:**

- ✅ **5GB storage** (~300 videos at 15MB each)
- ✅ **1GB download/day** (~70 video views/day)
- ✅ **50,000 reads/day**
- ✅ **20,000 writes/day**
- ✅ **Unlimited uploads** (no count limit!)

### **When You Need to Upgrade:**

If you exceed free tier, Firebase Blaze (pay-as-you-go):

**Storage:** $0.026/GB/month
- 50GB = $1.30/month
- 100GB = $2.60/month

**Bandwidth:** $0.12/GB
- 10GB = $1.20/month
- 50GB = $6/month

**Total for 100GB storage + 50GB bandwidth:**
- ~$9/month (vs $99/month for Cloudinary!)

---

## 🔧 Troubleshooting

### **Error: "Unauthorized"**

**Solution:**
1. Check Firebase Storage rules (Step 3)
2. Make sure Anonymous Auth is enabled (Step 6)
3. Verify `firebase.ts` config is correct (Step 5)

### **Error: "Network error"**

**Solution:**
1. Check internet connection
2. Verify Firebase project is active
3. Check if storage bucket exists

### **Error: "Quota exceeded"**

**Solution:**
1. Go to Firebase Console → Storage → Usage
2. Check if you've exceeded 5GB
3. Either delete old videos or upgrade to Blaze plan

### **Video uploads but doesn't save to database**

**Solution:**
1. Check Render server logs
2. Verify `/api/sermons` endpoint is working
3. Check network tab in browser for errors

---

## 🎉 Success Checklist

After setup, verify:

- ✅ Firebase project created
- ✅ Storage enabled with rules set
- ✅ Anonymous auth enabled
- ✅ Config added to `config/firebase.ts`
- ✅ App rebuilt and installed
- ✅ Test video uploaded successfully
- ✅ Video appears in Firebase Console
- ✅ Video plays in app
- ✅ Sermon saved to database

---

## 💡 Next Steps

### **For Members:**

**One-time update:**
1. Uninstall old app
2. Install new app (with Firebase)
3. Done! No more updates needed!

**After this:**
- New sermons appear automatically
- No app reinstall needed
- Everything updates from server

### **For You (Admin):**

**Upload videos:**
1. Open app → Admin
2. Add sermon with video
3. Upload happens automatically
4. Members see it instantly!

**No more:**
- ❌ Cloudinary limits
- ❌ 100MB file size limit
- ❌ Upload failures
- ❌ Expensive pricing

---

## 🚀 You're All Set!

Your app now has:
- ✅ Firebase Storage (5GB free, unlimited file size)
- ✅ Render Database (existing data preserved)
- ✅ Automatic updates (members never reinstall)
- ✅ Real-time sync (new sermons appear instantly)

**Members only need to install this update ONCE!**

After this, all future changes update automatically! 🎉

---

## 📞 Need Help?

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all setup steps completed
3. Check Firebase Console for errors
4. Check Render server logs
5. Share error messages for specific help

---

**Happy uploading! 🙏**
