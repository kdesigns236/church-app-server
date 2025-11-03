# Android App Build & Publish Guide

## Overview
This guide will help you build your web app into a **real Android app** that can be published on Google Play Store.

## Prerequisites

### Required Software:
1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java JDK 17** - Comes with Android Studio
3. **Node.js** - Already installed ✅
4. **Capacitor** - Already installed ✅

## Step 1: Install Android Studio

1. **Download Android Studio**:
   - Go to https://developer.android.com/studio
   - Download the latest version
   - Install with default settings

2. **Install Android SDK**:
   - Open Android Studio
   - Go to **Tools > SDK Manager**
   - Install:
     - ✅ Android SDK Platform 34 (Android 14)
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android Emulator

3. **Set Environment Variables**:
   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
   
   # Add to Path:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

## Step 2: Build the App

### 1. Build Web App:
```bash
npm run build
```

### 2. Sync with Android:
```bash
npx cap sync android
```

### 3. Open in Android Studio:
```bash
npx cap open android
```

This will open your project in Android Studio!

## Step 3: Configure App in Android Studio

### Update App Icon:

1. In Android Studio, right-click `res` folder
2. Select **New > Image Asset**
3. Choose **Launcher Icons**
4. Upload your church logo (1024x1024 PNG)
5. Click **Next** then **Finish**

### Update App Name:

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">Church of God Evening Light</string>
    <string name="title_activity_main">Church of God Evening Light</string>
    <string name="package_name">com.churchofgodeveninglight.app</string>
    <string name="custom_url_scheme">com.churchofgodeveninglight.app</string>
</resources>
```

### Update Colors:

Edit `android/app/src/main/res/values/colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#1B365D</color>
    <color name="colorPrimaryDark">#0D1A2E</color>
    <color name="colorAccent">#FFD700</color>
</resources>
```

## Step 4: Test on Device/Emulator

### Option A: Test on Real Device

1. **Enable Developer Mode** on your Android phone:
   - Go to **Settings > About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings > Developer Options**
   - Enable **USB Debugging**

2. **Connect Phone** to computer via USB

3. **Run App**:
   ```bash
   npx cap run android
   ```

### Option B: Test on Emulator

1. In Android Studio, click **Device Manager**
2. Click **Create Device**
3. Select **Pixel 6** or similar
4. Download system image (Android 14)
5. Click **Finish**
6. Click **Play** button to run

## Step 5: Build Release APK

### 1. Generate Signing Key:

```bash
# In terminal (Git Bash or PowerShell)
cd android/app

# Generate keystore
keytool -genkey -v -keystore cogel-release-key.keystore -alias cogel-key -keyalg RSA -keysize 2048 -validity 10000

# Answer the questions:
# - Password: [Choose a strong password]
# - First and Last Name: Church of God Evening Light
# - Organization: Church of God Evening Light
# - City: [Your City]
# - State: [Your State]
# - Country Code: [Your Country, e.g., US]
```

**IMPORTANT**: Save this information securely! You'll need it for updates.

### 2. Configure Gradle:

Create `android/key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=cogel-key
storeFile=cogel-release-key.keystore
```

**IMPORTANT**: Add `key.properties` to `.gitignore`!

### 3. Update `android/app/build.gradle`:

Add before `android {`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android {`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 4. Build APK:

```bash
cd android
./gradlew assembleRelease

# On Windows:
gradlew.bat assembleRelease
```

Your APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Step 6: Test Release APK

1. **Install on Device**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Test Everything**:
   - ✅ App opens without Chrome
   - ✅ All features work
   - ✅ Offline mode works
   - ✅ Sermons play
   - ✅ Bible loads
   - ✅ No crashes

## Step 7: Prepare for Play Store

### 1. Create App Bundle (AAB):

```bash
cd android
./gradlew bundleRelease

# On Windows:
gradlew.bat bundleRelease
```

Your AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Note**: Google Play Store requires AAB format (not APK) for new apps.

### 2. Prepare Assets:

Create these images:

**App Icon**:
- 512x512 PNG (32-bit)
- No transparency
- Church logo

**Feature Graphic**:
- 1024x500 PNG
- Promotional banner

**Screenshots** (at least 2):
- 1080x1920 PNG or JPG
- Show app features
- Different screens (Home, Bible, Sermons, etc.)

**Promo Video** (optional):
- YouTube link
- 30 seconds to 2 minutes
- Show app features

### 3. Write Store Listing:

**App Title** (max 50 characters):
```
Church of God Evening Light
```

**Short Description** (max 80 characters):
```
Connect with COGEL community. Bible, sermons, events, and more.
```

**Full Description** (max 4000 characters):
```
Church of God Evening Light - Your Spiritual Companion

Stay connected with the Church of God Evening Light community through our official mobile app.

FEATURES:

📖 HOLY BIBLE
• Complete Bible in English and Swahili
• Easy navigation by book and chapter
• Offline access
• Beautiful reading experience

🎥 SERMONS
• Watch latest sermons
• Swipe through sermon reels
• Like, comment, and share
• Save favorites for later

📅 EVENTS
• View upcoming church events
• Get event details and locations
• Never miss important gatherings

📢 ANNOUNCEMENTS
• Stay updated with church news
• Receive important notifications
• Filter by priority

🙏 PRAYER REQUESTS
• Submit prayer requests
• Pray for others
• Community support

💬 GOLIVE CHAT
• Connect with church members
• Real-time messaging
• Share media and messages

🤖 PASTOR AI
• Get spiritual guidance
• Ask questions about faith
• 24/7 availability

✨ OFFLINE MODE
• Access content without internet
• Automatic sync when online
• Fast and reliable

ABOUT US:
Church of God Evening Light is committed to spreading the Gospel and building a strong community of believers. This app helps you stay connected, grow in faith, and engage with our church family.

Download now and join our community!
```

**Category**:
- Lifestyle

**Tags**:
- church
- bible
- christian
- sermons
- prayer
- faith
- gospel

**Content Rating**:
- Everyone

**Privacy Policy**:
- Required! Create one at: https://app-privacy-policy-generator.firebaseapp.com/

## Step 8: Create Google Play Console Account

1. **Go to**: https://play.google.com/console
2. **Sign in** with Google account
3. **Pay $25** one-time registration fee
4. **Complete account setup**

## Step 9: Upload to Play Store

### 1. Create New App:

1. Click **Create App**
2. Fill in:
   - App name: Church of God Evening Light
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. Accept declarations
4. Click **Create app**

### 2. Complete Store Listing:

1. Go to **Store presence > Main store listing**
2. Upload:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)
3. Fill in:
   - App name
   - Short description
   - Full description
4. Click **Save**

### 3. Set Up App Content:

1. **Privacy Policy**: Add your privacy policy URL
2. **App Access**: Describe any special access requirements
3. **Ads**: Select if app contains ads (No)
4. **Content Rating**: Complete questionnaire
5. **Target Audience**: Select age groups
6. **News App**: No
7. **COVID-19**: No
8. **Data Safety**: Complete form

### 4. Select Countries:

1. Go to **Production > Countries/regions**
2. Select countries where app will be available
3. Click **Save**

### 5. Upload App Bundle:

1. Go to **Production > Releases**
2. Click **Create new release**
3. Upload `app-release.aab`
4. Fill in **Release name**: `1.0.0`
5. Fill in **Release notes**:
   ```
   Initial release:
   • Complete Bible in English and Swahili
   • Watch sermons
   • View events and announcements
   • Submit prayer requests
   • GoLive chat
   • Pastor AI assistant
   • Offline mode
   ```
6. Click **Save**
7. Click **Review release**
8. Click **Start rollout to Production**

## Step 10: Wait for Review

- **Review time**: 1-7 days
- **Status**: Check in Play Console
- **Notifications**: Via email

## Step 11: After Approval

### Your app is live! 🎉

**Share the link**:
```
https://play.google.com/store/apps/details?id=com.churchofgodeveninglight.app
```

## Updating the App

### 1. Make Changes to Code

### 2. Update Version:

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2  // Increment by 1
        versionName "1.0.1"  // Update version
    }
}
```

### 3. Build New Release:

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

### 4. Upload to Play Console:

1. Go to **Production > Releases**
2. Click **Create new release**
3. Upload new AAB
4. Add release notes
5. Submit for review

## Troubleshooting

### Build Fails:

**Check:**
- Java JDK 17 installed
- Android SDK installed
- Environment variables set
- Gradle sync successful

### App Crashes:

**Check:**
- Test on real device
- Check Android Studio Logcat
- Verify all permissions in AndroidManifest.xml

### Upload Rejected:

**Common reasons:**
- Missing privacy policy
- Incomplete content rating
- Missing screenshots
- Invalid app bundle

## App Size Optimization

### Current size: ~20MB

**To reduce**:
1. **Compress images**
2. **Remove unused code**
3. **Enable ProGuard**:
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
       }
   }
   ```

## Monitoring

### After Launch:

1. **Play Console Dashboard**:
   - Downloads
   - Ratings
   - Reviews
   - Crashes

2. **Respond to Reviews**:
   - Thank users
   - Address issues
   - Build community

3. **Regular Updates**:
   - Fix bugs
   - Add features
   - Improve performance

## Cost Summary

| Item | Cost |
|------|------|
| Google Play Developer Account | $25 (one-time) |
| App Development | Free (DIY) |
| Domain (optional) | ~$10/year |
| Server Hosting (optional) | $5-10/month |
| **Total Initial** | **$25** |

## Next Steps

1. ✅ Install Android Studio
2. ✅ Build APK
3. ✅ Test on device
4. ✅ Create signing key
5. ✅ Build release AAB
6. ✅ Create Play Console account
7. ✅ Prepare store listing
8. ✅ Upload to Play Store
9. ✅ Wait for approval
10. ✅ Launch! 🚀

Your app will be a **real Android app** that:
- Opens directly (not in Chrome)
- Appears in app drawer
- Can be shared via Play Store link
- Works offline
- Receives updates automatically
- Looks professional

Congratulations on building your church app! 🎉
