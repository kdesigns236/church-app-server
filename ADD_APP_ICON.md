# Add Custom App Icon

## 🎨 Quick Fix: Use Icon Generator

### Method 1: Use Android Asset Studio (Easiest!)

1. **Go to**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. **Upload your icon image** (church logo, cross, etc.)
   - Should be square (512x512px or larger)
   - PNG format preferred
   - Simple design works best

3. **Customize**:
   - Name: `ic_launcher`
   - Shape: Choose your preferred shape
   - Background: Choose color or transparent

4. **Click**: "Download"

5. **Extract the ZIP file**

6. **Copy folders** to:
   ```
   d:\church-of-god-evening-light\android\app\src\main\res\
   ```
   
   Replace these folders:
   - `mipmap-hdpi`
   - `mipmap-mdpi`
   - `mipmap-xhdpi`
   - `mipmap-xxhdpi`
   - `mipmap-xxxhdpi`

7. **Rebuild APK**

---

### Method 2: Use Capacitor Assets (Automatic!)

1. **Create icon file**:
   - Name: `icon.png`
   - Size: 1024x1024px
   - Location: `d:\church-of-god-evening-light\`

2. **Install Capacitor Assets**:
   ```bash
   npm install @capacitor/assets --save-dev
   ```

3. **Generate icons**:
   ```bash
   npx capacitor-assets generate --android
   ```

4. **Rebuild**:
   ```bash
   npx cap sync android
   ```

---

### Method 3: Manual (If you have icons ready)

If you already have icon files in different sizes:

**Copy to these locations:**

- **48x48**: `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- **72x72**: `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- **96x96**: `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- **144x144**: `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- **192x192**: `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

---

## 🎨 Icon Design Tips:

### Good Icon:
- ✅ Simple and recognizable
- ✅ Works at small sizes
- ✅ Clear contrast
- ✅ Represents church/faith

### Examples:
- Cross symbol
- Church building
- Bible
- Dove
- Light/candle
- Your church logo

### Avoid:
- ❌ Too much detail
- ❌ Small text
- ❌ Complex images
- ❌ Low contrast

---

## 🚀 Quick Start (Recommended):

**Use Method 1 (Android Asset Studio):**

1. Find or create a simple church icon (512x512px)
2. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
3. Upload your icon
4. Download ZIP
5. Extract and copy to `android/app/src/main/res/`
6. Rebuild APK

**Done!** Your app will have a custom icon! 🎉

---

## 📝 Icon Sizes Reference:

| Density | Size | Folder |
|---------|------|--------|
| MDPI | 48x48 | mipmap-mdpi |
| HDPI | 72x72 | mipmap-hdpi |
| XHDPI | 96x96 | mipmap-xhdpi |
| XXHDPI | 144x144 | mipmap-xxhdpi |
| XXXHDPI | 192x192 | mipmap-xxxhdpi |

---

## ✅ After Adding Icon:

1. **Rebuild APK** in Android Studio
2. **Install on phone**
3. **Check home screen** - should see new icon!

**Your app will look professional!** 🎨
