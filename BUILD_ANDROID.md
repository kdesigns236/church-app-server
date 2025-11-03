# Quick Android Build Guide

## Prerequisites
- ✅ Android Studio installed
- ✅ Java JDK 17
- ✅ Android SDK

## Quick Build Commands

### 1. Build Web App
```bash
npm run build
```

### 2. Sync with Android
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Run on Device
```bash
npx cap run android
```

## Build Release APK

### First Time Setup:
```bash
cd android/app
keytool -genkey -v -keystore cogel-release-key.keystore -alias cogel-key -keyalg RSA -keysize 2048 -validity 10000
```

### Build:
```bash
cd android
gradlew assembleRelease
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

## Build for Play Store (AAB)

```bash
cd android
gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

## Test APK

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Update Version

Edit `android/app/build.gradle`:
```gradle
versionCode 2  // Increment
versionName "1.0.1"  // Update
```

## Common Issues

### Gradle Build Failed
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### App Not Installing
```bash
adb uninstall com.churchofgodeveninglight.app
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Check Connected Devices
```bash
adb devices
```

## Full Guide
See `ANDROID_APP_BUILD_GUIDE.md` for complete instructions.
