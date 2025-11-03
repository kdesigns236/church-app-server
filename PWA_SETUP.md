# Progressive Web App (PWA) Setup

## Overview
The Church of God Evening Light app now supports offline functionality through Progressive Web App (PWA) technology.

## Features

### ✅ Offline Features (Work without internet)
- **Bible**: Read the complete Bible in English and Swahili
- **Sermons**: View previously loaded sermon videos
- **Events**: Browse church events
- **Announcements**: Read church announcements
- **Prayer Requests**: View prayer requests
- **Profile**: Access your profile information

### 🌐 Online-Only Features (Require internet connection)
- **GoLive Chat**: Real-time community chat
- **Pastor AI**: AI-powered spiritual guidance
- **Admin Panel**: Content management (requires authentication)
- **Sync**: Fetching new updates from admin

## How It Works

### Service Worker
The app uses a service worker (`public/service-worker.js`) that:
1. **Caches static assets** on first load (Bible JSON files, images, etc.)
2. **Implements caching strategies**:
   - **Cache-first**: For Bible content and static assets
   - **Network-first**: For API calls with cache fallback
   - **Network-only**: For GoLive chat and AI features

### Caching Strategy
- **Static Assets**: Cached immediately on install
- **Runtime Cache**: Dynamic content cached as you use the app
- **Automatic Updates**: New content is fetched when online and cached for offline use

## Installation

### Desktop (Chrome, Edge, Brave)
1. Visit the app in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install" to add to your desktop

### Mobile (Android/iOS)
1. Open the app in your mobile browser
2. Tap the browser menu (⋮ or share icon)
3. Select "Add to Home Screen" or "Install App"
4. The app will now work like a native app

## Testing Offline Mode

1. **Load the app** while online (this caches the content)
2. **Turn off your internet** or enable airplane mode
3. **Navigate** through Bible, Sermons, Events, etc.
4. **Try GoLive Chat or AI** - you'll see they require internet

## Updating Content

When the admin posts new content:
1. The app will fetch updates when you're online
2. New content is automatically cached
3. You'll see a notification when updates are available
4. Refresh the page to get the latest content

## Icon Requirements

For a complete PWA experience, add these icon sizes to `/public/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `favicon.svg` or `favicon.ico`

You can generate these from the provided `icon.svg` using an online tool like:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Samsung Internet
- ⚠️ Safari (Desktop) - Limited support

## Troubleshooting

### App not installing
- Make sure you're using HTTPS (or localhost for development)
- Check that `manifest.json` is accessible
- Clear browser cache and try again

### Offline mode not working
- Load the app at least once while online
- Check browser console for service worker errors
- Verify service worker is registered (DevTools > Application > Service Workers)

### Content not updating
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear the cache from browser settings
- Unregister the service worker and reload

## Development

### Testing Service Worker Locally
```bash
npm run dev
# Visit http://localhost:3004
# Open DevTools > Application > Service Workers
```

### Clearing Cache During Development
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

## Security Notes

- Service workers only work over HTTPS (except localhost)
- Cached content is stored locally on the user's device
- Sensitive data (passwords, tokens) should never be cached
- GoLive chat and AI features always require authentication

## Future Enhancements

- [ ] Background sync for offline actions
- [ ] Push notifications for new sermons/announcements
- [ ] Offline form submission queue
- [ ] Download sermons for offline viewing
- [ ] Periodic background sync for content updates
