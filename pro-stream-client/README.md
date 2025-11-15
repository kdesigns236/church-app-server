# Pro Stream Client - Standalone Professional Streaming Controller

A completely **separate, independent application** for controlling church streaming with professional features.

## 🚀 Quick Start

### Installation

```bash
cd pro-stream-client
npm install
```

### Development

```bash
npm run dev
```

This will start the app on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📋 Project Structure

```
pro-stream-client/
├── src/
│   ├── components/
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── icons.tsx                # SVG icons
│   │   ├── Connect.tsx              # Role selection
│   │   ├── Scanner.tsx              # QR code scanner
│   │   ├── CameraClient.tsx         # Camera source
│   │   ├── RemoteControl.tsx        # Controller dashboard
│   │   ├── Display.tsx              # Display screen
│   │   ├── VideoPreview.tsx         # Video with overlays
│   │   ├── ProfessionalLowerThird.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ui/Accordion.tsx
│   │   └── sections/
│   │       ├── StreamControls.tsx
│   │       ├── CameraControls.tsx
│   │       ├── LowerThirds.tsx
│   │       ├── Announcements.tsx
│   │       ├── LyricsDisplay.tsx
│   │       ├── BibleVerses.tsx
│   │       ├── RecordingControls.tsx
│   │       ├── StreamStats.tsx
│   │       └── LiveChat.tsx
│   ├── App.tsx                      # Main app router
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind CSS
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 Three Operational Modes

### 1. **Controller Mode**
- Full streaming dashboard
- Camera management
- Overlay controls (lower thirds, lyrics, announcements)
- Stream platform selection (YouTube, Facebook)
- Recording and statistics

**Access:** Select "Continue as Controller" on home screen

### 2. **Camera Mode**
- Scan QR code from controller
- Stream camera feed via WebRTC
- Mute/unmute audio
- Flip camera (front/back)
- Professional UI overlay

**Access:** Select "Continue as Camera" → Scan QR code

### 3. **Display Mode**
- Full-screen projection display
- Receives state updates from controller
- Shows all overlays in real-time
- Professional lower third graphics

**Access:** Open in new tab with `?role=display&session=SESSION_ID`

## ✨ Features

### Professional Lower Third
- 3D diamond logo animation
- Gradient backgrounds
- Shine effects
- Slide-in animations
- Customizable colors and text

### Multi-Camera System
- USB camera detection
- Mobile camera via QR code + WebRTC
- Real-time switching
- Transition effects (cut, fade, dissolve)

### Overlay System
- **Lyrics**: Song library with verse navigation
- **Announcements**: Full styling (font, color, animation)
- **Bible Verses**: Scripture with reference
- All with positioning and animation options

### Real-Time Synchronization
- BroadcastChannel for same-device communication
- WebRTC for remote camera streaming
- Instant state updates to display

## 🔧 Technical Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **WebRTC** for video streaming
- **BroadcastChannel API** for inter-tab communication
- **Tailwind CSS** for styling
- **SVG Icons** for professional UI

## 📱 Workflow

```
1. Open Pro Stream Client (http://localhost:5173)
   ↓
2. Select "Continue as Controller"
   ↓
3. Connect USB cameras or wait for mobile cameras
   ↓
4. Generate QR codes for mobile cameras
   ↓
5. Open Display in separate window/tab
   ↓
6. Control all overlays and streaming from dashboard
   ↓
7. Display updates in real-time
```

## 🎬 Usage Examples

### Start Controller
```
http://localhost:5173
→ Select "Continue as Controller"
```

### Start Display
```
http://localhost:5173?role=display&session=abc123def
```

### Start Camera
```
http://localhost:5173
→ Select "Continue as Camera"
→ Scan QR code from controller
```

## 🚀 Deployment

### Deploy to Netlify
```bash
npm run build
# Upload the 'dist' folder to Netlify
```

### Deploy to Vercel
```bash
npm run build
# Connect GitHub repo to Vercel
```

### Deploy to Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📝 Environment Variables

Create a `.env` file (optional):
```
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=ws://localhost:3000
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use a different port
npm run dev -- --port 5174
```

### Cache Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

## 📚 Documentation

- [Professional App Setup](../PROFESSIONAL_APP_SETUP.md)
- [WebRTC Guide](../LIVE_STREAMING_SETUP.md)
- [Component Architecture](./ARCHITECTURE.md)

## 🤝 Contributing

This is a standalone professional streaming application. For issues or improvements, please refer to the main church app repository.

## 📄 License

Same as main church app

---

**Pro Stream Client v1.0** - Professional Streaming Controller
**Status**: ✅ Ready for Development and Deployment
