# Church Camera Android App

A dedicated Android application for connecting mobile phones as camera sources to the Church of God Evening Light streaming system.

## Features

- **QR Code Connection**: Scan QR codes from the streaming system to connect instantly
- **HD Video Streaming**: High-quality camera streaming with front/back camera switching
- **Church Branding**: Professional UI designed specifically for church streaming
- **WebSocket Connection**: Direct connection to the church streaming system
- **Real-time Status**: Live connection status and quality indicators
- **Easy Setup**: Simple one-tap connection process

## Requirements

- **Android 5.0 (API 21)** or higher
- **Camera permission** for video streaming
- **Internet permission** for network connectivity
- **Same WiFi network** as the streaming computer

## Installation

### Option 1: Build from Source

1. **Install Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK and build tools

2. **Clone and Open Project**
   ```bash
   cd android-camera-app
   # Open in Android Studio
   ```

3. **Build APK**
   - In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be generated in `app/build/outputs/apk/debug/`

4. **Install on Phone**
   - Enable "Developer Options" and "USB Debugging" on Android phone
   - Connect phone to computer via USB
   - Run: `adb install app-debug.apk`

### Option 2: Direct APK Installation

1. **Download APK** (when available)
2. **Enable Unknown Sources** on Android phone
3. **Install APK** directly on the phone

## Usage

### For Church Volunteers

1. **Install the App** on your Android phone
2. **Connect to Church WiFi** (same network as streaming computer)
3. **Open Church Camera App**
4. **Tap "Scan QR Code"**
5. **Point camera at QR code** displayed on streaming computer
6. **Allow camera permissions** when prompted
7. **Your phone is now connected** as a camera source!

### For Technical Setup

1. **Ensure WebSocket Server** is running on port 8080
2. **Generate QR codes** from the streaming application
3. **QR codes contain connection data**:
   ```json
   {
     "server": "192.168.1.100",
     "port": "8080",
     "slot": "1",
     "key": "church-stream-123456",
     "appName": "Church of God Evening Light"
   }
   ```

## Technical Details

### Architecture

- **Frontend**: Android (Kotlin) with CameraX API
- **Backend**: WebSocket connection to streaming server
- **Video**: Real-time camera streaming via WebRTC
- **UI**: Material Design with church branding

### Dependencies

- **CameraX**: Modern camera API for Android
- **WebRTC**: Real-time video streaming
- **ZXing**: QR code scanning
- **OkHttp**: Network communication
- **Material Design**: UI components

### Network Requirements

- **Port 8080**: WebSocket server for camera connections
- **Same WiFi**: Phone and streaming computer must be on same network
- **Firewall**: Ensure port 8080 is not blocked

## Troubleshooting

### Connection Issues

1. **Check WiFi**: Ensure phone and computer are on same network
2. **Check Server**: Verify WebSocket server is running on port 8080
3. **Check Firewall**: Ensure port 8080 is not blocked
4. **Restart App**: Close and reopen the Church Camera app

### Camera Issues

1. **Permissions**: Ensure camera permission is granted
2. **Other Apps**: Close other apps that might be using the camera
3. **Restart Phone**: Sometimes helps with camera access issues

### QR Code Issues

1. **Lighting**: Ensure good lighting when scanning QR code
2. **Distance**: Hold phone 6-12 inches from QR code
3. **Focus**: Tap screen to focus camera on QR code
4. **Manual Entry**: Use "Manual Connection" if QR code fails

## Development

### Building for Production

1. **Generate Signed APK**
   - Build → Generate Signed Bundle / APK
   - Create or use existing keystore
   - Build release APK

2. **Optimize for Distribution**
   - Enable ProGuard for code obfuscation
   - Test on multiple Android devices
   - Verify all permissions work correctly

### Customization

- **Church Branding**: Update colors in `res/values/colors.xml`
- **App Name**: Change in `res/values/strings.xml`
- **Logo**: Replace `ic_church.xml` with church logo
- **Server Settings**: Modify connection defaults in `MainActivity.kt`

## Support

For technical support or questions about the Church Camera app:

- **Church IT Team**: Contact your local church IT support
- **Documentation**: Refer to the main streaming system documentation
- **Issues**: Report bugs or feature requests to the development team

## License

This application is developed specifically for Church of God Evening Light streaming services.

---

**Church of God Evening Light**  
*Mobile Camera for Live Streaming*  
Version 1.0
