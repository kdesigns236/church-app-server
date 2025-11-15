# Standalone Pro Stream Client - Setup Guide

## 🎯 What You Have

A **completely separate, independent streaming controller app** that runs completely independently from the church app.

### Two Separate Applications:

1. **Church of God Evening Light** (Main App)
   - Location: `d:\church-of-god-evening-light\`
   - Port: `3003`
   - Command: `npm run dev`

2. **Pro Stream Client** (Standalone Controller)
   - Location: `d:\church-of-god-evening-light\pro-stream-client\`
   - Port: `5173`
   - Command: `npm run dev`

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd d:\church-of-god-evening-light\pro-stream-client
npm install
```

### Step 2: Start the Standalone App

```bash
npm run dev
```

This will:
- Start on `http://localhost:5173`
- Open automatically in your browser
- Show the Pro Stream Client home screen

### Step 3: Choose Your Mode

**Option A: Controller Mode**
- Click "Continue as Controller"
- Full streaming dashboard opens
- You can now control cameras, overlays, etc.

**Option B: Camera Mode**
- Click "Continue as Camera"
- Scan QR code from controller
- Camera feed streams to controller

**Option C: Display Mode**
- Open in new tab: `http://localhost:5173?role=display&session=abc123`
- Full-screen display for projection
- Receives updates from controller in real-time

---

## 📁 Project Structure

```
pro-stream-client/
├── src/
│   ├── App.tsx                      # Main router
│   ├── components/
│   │   ├── types.ts                 # TypeScript types
│   │   ├── Connect.tsx              # Role selection
│   │   ├── Scanner.tsx              # QR scanner
│   │   ├── CameraClient.tsx         # Camera source
│   │   ├── RemoteControl.tsx        # Controller
│   │   ├── Display.tsx              # Display screen
│   │   └── ... (more components)
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind CSS
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🎬 Complete Workflow

### Scenario: Church Streaming Service

**Device 1 (Controller):**
```
1. Open http://localhost:5173
2. Select "Continue as Controller"
3. Connect USB camera
4. Generate QR code for mobile camera
```

**Device 2 (Mobile Camera):**
```
1. Open http://localhost:5173
2. Select "Continue as Camera"
3. Scan QR code from controller
4. Camera feed streams to controller
```

**Device 3 (Display/Projection):**
```
1. Open http://localhost:5173?role=display&session=SESSION_ID
2. Full-screen display shows:
   - Live video from active camera
   - Lower thirds
   - Lyrics
   - Announcements
   - Bible verses
```

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🌐 Access Points

| Mode | URL | Purpose |
|------|-----|---------|
| Controller | `http://localhost:5173` | Full streaming dashboard |
| Camera | `http://localhost:5173` | Mobile camera source |
| Display | `http://localhost:5173?role=display&session=abc123` | Projection display |

---

## 📊 Features Available

### Professional Lower Third
- 3D diamond logo
- Gradient backgrounds
- Animations
- Customizable colors

### Camera Management
- USB camera detection
- Mobile camera via QR + WebRTC
- Real-time switching
- Transition effects

### Overlays
- Lyrics with song library
- Announcements
- Bible verses
- All with animations

### Real-Time Sync
- BroadcastChannel (same device)
- WebRTC (remote cameras)
- Instant updates

---

## 🚀 Deployment Options

### Option 1: Netlify
```bash
npm run build
# Upload 'dist' folder to Netlify
```

### Option 2: Vercel
```bash
npm run build
# Connect GitHub repo to Vercel
```

### Option 3: Firebase Hosting
```bash
npm run build
firebase deploy
```

### Option 4: Your Own Server
```bash
npm run build
# Copy 'dist' folder to your server
```

---

## 🐛 Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Restart TS server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Cache Issues
```bash
# Clear browser cache
# Or use Ctrl+Shift+Delete in browser
```

---

## 📝 Important Notes

1. **Completely Independent**: This app runs separately from the church app
2. **No Integration Needed**: You don't need to modify the main church app
3. **Full Features**: All professional streaming features are included
4. **Production Ready**: Can be deployed immediately
5. **Scalable**: Can be deployed to any hosting platform

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Test all three modes
4. ✅ Build for production: `npm run build`
5. ✅ Deploy to your hosting platform

---

## 📞 Support

For issues or questions:
- Check the README.md in pro-stream-client folder
- Review component documentation
- Check browser console for errors

---

**Pro Stream Client - Standalone Professional Streaming Controller**
**Status**: ✅ Ready to Use
**Version**: 1.0
