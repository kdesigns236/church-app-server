# 🚀 App Update Deployment Guide

## ✅ What's New in Version 2.1.0

1. **Data Persistence Fixed** - Content never disappears (PostgreSQL)
2. **Video Upload Fixed** - No more timeout errors
3. **Offline CSS Support** - App looks perfect even without internet
4. **Auto-Update Notifications** - Users get notified about new versions

---

## 📝 Step-by-Step Deployment

### Step 1: Build the New APK

```bash
# Make sure you're in the project root
cd d:\church-of-god-evening-light

# Build the app
npm run build

# Sync to Android
npx cap sync android
```

### Step 2: Open Android Studio

1. Open Android Studio
2. Open project: `d:\church-of-god-evening-light\android`
3. Wait for Gradle sync to complete

### Step 3: Build Release APK

1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete (~2-5 minutes)
3. Click "locate" when build finishes
4. APK location: `android/app/release/app-release.apk`

### Step 4: Upload to Your Lime Link

1. Go to your lime link sharing platform
2. Upload the new `app-release.apk`
3. Copy the download link (e.g., `https://your-lime-link.com/church-app-v2.1.0.apk`)

### Step 5: Update Server with Download Link

1. Open: `d:\church-of-god-evening-light\server\index.js`
2. Find line 489: `downloadUrl: 'YOUR_LIME_LINK_HERE'`
3. Replace with your actual lime link
4. Save the file

```javascript
downloadUrl: 'https://your-lime-link.com/church-app-v2.1.0.apk',
```

5. Commit and push:
```bash
cd d:\church-of-god-evening-light\server
git add .
git commit -m "Update download link for v2.1.0"
git push
```

### Step 6: Wait for Render to Deploy

1. Go to Render Dashboard
2. Watch the deployment logs
3. Wait for "Your service is live 🎉"

---

## 🎉 What Happens Next

### For Current Users (Old App):

1. ✅ They open the app
2. ✅ App checks server for updates
3. ✅ Beautiful notification appears:
   - "Update Available - Version 2.1.0"
   - Shows what's new
   - "Update Now" button
4. ✅ They click "Update Now"
5. ✅ Opens your lime link in browser
6. ✅ They download and install new APK
7. ✅ Done! They have the latest version

### For New Users:

- Just share your lime link
- They download and install
- No update notification (they already have latest)

---

## 🔄 For Future Updates

When you want to release version 2.2.0:

1. Update version in `services/updateService.ts`:
```typescript
const CURRENT_APP_VERSION = '2.2.0';
```

2. Update version in `server/index.js`:
```javascript
version: '2.2.0',
downloadUrl: 'https://your-lime-link.com/church-app-v2.2.0.apk',
releaseNotes: `✅ New feature 1\n✅ New feature 2`,
```

3. Build new APK
4. Upload to lime link
5. Push server changes
6. All users get notified automatically!

---

## ⚠️ Force Update (Emergency)

If you need to force everyone to update (old app stops working):

In `server/index.js`, change:
```javascript
forceUpdate: true // Old versions won't work
```

Users will see "Update Required" and can't dismiss it.

---

## 📱 Testing

Before sharing with members:

1. Install new APK on your phone
2. Open app - should NOT show update notification
3. Change server version to "2.2.0"
4. Reopen app - should show update notification
5. Change back to "2.1.0"
6. Share with members!

---

## 🆘 Troubleshooting

**Update notification not showing?**
- Check server is deployed
- Check `https://church-app-server.onrender.com/api/app-version`
- Should return JSON with version info

**Download link not working?**
- Make sure lime link is public
- Test link in browser first
- Update `downloadUrl` in server

**Users can't install APK?**
- They need to enable "Install from Unknown Sources"
- Android Settings → Security → Unknown Sources

---

## ✅ Summary

1. Build APK
2. Upload to lime link
3. Update server with link
4. Push to Render
5. Users get notified automatically!

No more manual messaging - the app handles it! 🎉
