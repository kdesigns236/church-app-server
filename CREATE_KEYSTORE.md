# Create Keystore for Signing APK

## 🔑 Method 1: Use Android Studio (Easiest!)

1. **Open Android Studio**
2. **Build** → **Generate Signed Bundle / APK**
3. **Select**: APK
4. **Click**: "Create new..."
5. **Fill in**:
   - **Key store path**: `d:\church-of-god-evening-light\church-app-keystore.jks`
   - **Password**: `church123`
   - **Confirm**: `church123`
   - **Alias**: `church-app-key`
   - **Password**: `church123`
   - **Confirm**: `church123`
   - **Validity**: `25` years
   - **First and Last Name**: `Church of God Evening Light`
   - **Organization**: `COGEL`
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country code (e.g., US)
6. **Click**: "OK"
7. **Continue** with APK build

---

## 🔑 Method 2: Use Command Line

**If you have Java JDK installed:**

1. **Open Command Prompt** (not PowerShell)
2. **Run**:
   ```cmd
   cd d:\church-of-god-evening-light
   
   keytool -genkey -v -keystore church-app-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias church-app-key
   ```

3. **Answer the prompts**:
   - Enter keystore password: `church123`
   - Re-enter password: `church123`
   - What is your first and last name?: `Church of God Evening Light`
   - What is the name of your organizational unit?: `Church`
   - What is the name of your organization?: `COGEL`
   - What is the name of your City or Locality?: `Your City`
   - What is the name of your State or Province?: `Your State`
   - What is the two-letter country code?: `US` (or your country)
   - Is this correct?: `yes`
   - Enter key password: `church123`
   - Re-enter password: `church123`

---

## 📝 Save These Details:

**IMPORTANT - Save this information:**

```
Keystore Path: d:\church-of-god-evening-light\church-app-keystore.jks
Keystore Password: church123
Key Alias: church-app-key
Key Password: church123
```

**Keep this safe! You'll need it every time you build an APK!**

---

## ✅ After Creating Keystore:

### In Android Studio:

1. **Build** → **Generate Signed Bundle / APK**
2. **Select**: APK
3. **Choose**: `d:\church-of-god-evening-light\church-app-keystore.jks`
4. **Enter**:
   - Key store password: `church123`
   - Key alias: `church-app-key`
   - Key password: `church123`
5. **Select**: `release`
6. **Click**: "Finish"

---

## 📍 Where to Find Your APK:

After building, find your APK at:
```
d:\church-of-god-evening-light\android\app\release\app-release.apk
```

---

## 🚀 Install on Phone:

1. Copy `app-release.apk` to your phone
2. Open it on phone
3. Allow "Install from unknown sources"
4. Install!

---

**Use Method 1 (Android Studio) - It's the easiest!** 🎯
