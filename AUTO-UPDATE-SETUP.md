# Automatic App Updates Without Rebuilding APK

## 🎯 The Problem
Currently, every code change requires:
1. `npm run build`
2. `npx cap sync android`
3. `.\gradlew.bat assembleDebug`
4. Transfer APK to phone
5. Install APK

This takes 5-10 minutes per update!

## ✅ The Solution: Server-Driven Updates

Your app already has the infrastructure! Here's what's working:

### 1. **Content Updates (Already Working!)**
✅ Sermons, events, announcements update instantly via Socket.io
✅ No rebuild needed
✅ Real-time sync

### 2. **UI Configuration (Just Added!)**
✅ Theme colors, fonts, spacing
✅ Feature flags (enable/disable features)
✅ Home layout sections
✅ Banner messages
✅ Navigation menu

**These update automatically without APK rebuild!**

### 3. **Code Updates (Requires Setup)**

For JavaScript/TypeScript code changes, you have 3 options:

## Option A: Use Your Render Server (Recommended)

### How It Works:
```
Build → Upload to Render → App downloads on launch → Updates automatically
```

### Setup:

1. **Add update endpoint to server:**

```javascript
// In server/index.js
const fs = require('fs');
const path = require('path');

// Serve the latest app bundle
app.get('/app/latest', (req, res) => {
  res.json({
    version: '2.2.0',
    buildNumber: Date.now(),
    downloadUrl: 'https://church-app-server.onrender.com/app/bundle.zip',
    mandatory: false,
    changelog: 'Camera flip fixes, video call improvements'
  });
});

// Serve the bundle file
app.use('/app', express.static(path.join(__dirname, 'app-bundles')));
```

2. **Upload your dist folder to server:**

```bash
# After building
npm run build

# Zip the dist folder
# Upload to server/app-bundles/bundle.zip
```

3. **App checks and downloads on launch**

## Option B: Use GitHub Pages (Free!)

### Setup:

1. **Enable GitHub Pages in your repo**
2. **Deploy dist folder to gh-pages branch**
3. **App loads from GitHub Pages**

```bash
npm run build
npx gh-pages -d dist
```

## Option C: Capacitor Live Reload (Development Only)

### For Development:

1. **Uncomment in capacitor.config.ts:**

```typescript
server: {
  url: 'http://192.168.0.102:3000',  // Your PC IP
  hostname: '192.168.0.102'
}
```

2. **Run dev server:**
```bash
npm run dev
```

3. **Install APK once**
4. **All changes appear instantly on phone!**

## 🚀 Recommended Workflow

### Development (Live Reload):
```bash
# One-time setup
npm run dev  # Keep running
# Install APK once
# All changes appear instantly!
```

### Production (Server Updates):
```bash
# When ready to release
npm run build
# Upload dist to Render
# Users get update on next app launch
```

## 📊 What Updates Automatically vs Needs Rebuild

### ✅ Updates Automatically (No Rebuild):
- Content (sermons, events, etc.)
- UI config (colors, fonts, layouts)
- Feature flags
- Banner messages
- JavaScript/HTML/CSS (with server setup)

### ❌ Needs APK Rebuild:
- Native plugin changes
- Capacitor config changes
- Android permissions
- App icon/splash screen
- Package.json dependencies

## 🎯 Best Approach for You

**For now, use Development Live Reload:**

1. Uncomment live reload in `capacitor.config.ts`
2. Run `npm run dev` on PC
3. Install APK once
4. All changes appear instantly!

**For production:**
- Use UI config endpoints (already working!)
- Content updates via API (already working!)
- Code updates: Upload dist to Render

## 🔥 Quick Win: Enable Live Reload Now

Edit `capacitor.config.ts`:

```typescript
server: {
  androidScheme: 'https',
  cleartext: true,
  url: 'http://YOUR_PC_IP:3000',  // ← Uncomment and add your IP
  hostname: 'YOUR_PC_IP'           // ← Uncomment and add your IP
}
```

Then:
```bash
npm run dev  # Keep running
# Install APK once
# Changes appear instantly! 🎉
```

## 💡 Summary

You already have automatic updates for:
- ✅ All content (sermons, events, etc.)
- ✅ UI configuration (theme, features, layouts)

For code changes during development:
- ✅ Use live reload (instant updates!)

For production code updates:
- 🎯 Upload dist to Render
- 🎯 App downloads on launch
