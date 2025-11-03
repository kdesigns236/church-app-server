# Storage Permission Guide

## Overview
Your app now requests device storage permission to ensure data isn't automatically cleared and to handle large files properly.

## What Storage Permission Does

### ✅ With Permission (Persistent Storage):
- **Protected Data**: Won't be cleared automatically by browser
- **Large Files**: Can store sermon videos (100MB+)
- **Offline Access**: All content available offline
- **Faster Loading**: Content cached permanently
- **Priority Storage**: Browser won't delete to free space

### ⚠️ Without Permission:
- **May Be Cleared**: Browser can delete data when low on space
- **Limited Size**: Smaller storage quota
- **Risk of Loss**: Data might disappear unexpectedly
- **Lower Priority**: Browser treats as temporary storage

## When Permission is Requested

The app asks for storage permission:
1. **2 seconds after app loads** (first time only)
2. **Before large file upload** (if not already granted)
3. **When storage is low** (to prevent data loss)

## User Experience

### First Visit:
```
1. App loads
2. Service worker registers
3. After 2 seconds: Permission dialog appears
4. User sees storage info and benefits
5. User clicks "Allow" or "Not Now"
```

### Permission Dialog Shows:
- Current storage usage
- Available space
- Benefits of allowing
- "Allow" and "Not Now" buttons

## Storage Information Displayed

```
📊 Storage Information:
   Used: 45.2 MB
   Available: 2.5 GB
   Usage: 1.77%
   Persistent: ✅ Yes
```

## Implementation Details

### Storage Service Features:

1. **Request Permission**:
   ```typescript
   await storageService.requestPersistentStorage();
   ```

2. **Check Storage**:
   ```typescript
   const estimate = await storageService.getStorageEstimate();
   console.log(`Used: ${estimate.usageFormatted}`);
   ```

3. **Check if Enough Space**:
   ```typescript
   const hasSpace = await storageService.hasEnoughSpace(fileSize);
   if (!hasSpace) {
     alert('Not enough storage space!');
   }
   ```

4. **Monitor Storage Health**:
   ```typescript
   await storageService.checkStorageHealth();
   // Warns if > 75% full
   ```

## Storage Warnings

### 75% Full:
```
⚠️ Storage usage is high
```

### 90% Full:
```
⚠️ Storage Warning

Your device storage is 92.3% full.

Used: 2.3 GB / 2.5 GB

Consider:
• Deleting old cached data
• Freeing up device space
• Clearing browser data for other sites
```

## Browser Support

| Browser | Persistent Storage | Storage Estimate |
|---------|-------------------|------------------|
| Chrome 55+ | ✅ Yes | ✅ Yes |
| Firefox 57+ | ✅ Yes | ✅ Yes |
| Safari 15.2+ | ✅ Yes | ✅ Yes |
| Edge 79+ | ✅ Yes | ✅ Yes |
| Opera 42+ | ✅ Yes | ✅ Yes |

## Storage Quotas by Browser

### Desktop:
- **Chrome**: Up to 60% of total disk space
- **Firefox**: Up to 50% of free disk space
- **Safari**: Up to 1GB (can request more)
- **Edge**: Up to 60% of total disk space

### Mobile:
- **Chrome Android**: Up to 50% of free space
- **Safari iOS**: Up to 1GB (can request more)
- **Firefox Android**: Up to 50% of free space

## Testing Storage Permission

### Test in Chrome DevTools:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Storage** in sidebar
4. See **Usage** and **Quota**
5. Check **Persistent** status

### Test Permission Request:

```javascript
// In browser console
await navigator.storage.persist();
// Returns: true (granted) or false (denied)

await navigator.storage.persisted();
// Returns: true (already persistent) or false (not persistent)

await navigator.storage.estimate();
// Returns: { usage: 12345, quota: 67890 }
```

## Handling Large Files

### Before Upload:

```typescript
import { storageService } from './services/storageService';

const handleFileUpload = async (file: File) => {
  // Check if enough space
  const hasSpace = await storageService.hasEnoughSpace(file.size);
  
  if (!hasSpace) {
    alert(`Not enough storage space for this ${(file.size / 1024 / 1024).toFixed(2)}MB file!`);
    return;
  }
  
  // Request permission if not already granted
  const isPersisted = await storageService.isPersisted();
  if (!isPersisted) {
    const granted = await storageService.requestStoragePermissionWithDialog();
    if (!granted) {
      alert('Storage permission is recommended for large files');
    }
  }
  
  // Proceed with upload
  await uploadService.uploadFile(file);
};
```

## Storage Management

### Clear Old Cache:

```typescript
await storageService.clearOldCache();
// Removes old service worker caches
```

### Show Storage Info:

```typescript
await storageService.showStorageInfo();
// Logs storage details to console
```

### Monitor Health:

```typescript
await storageService.checkStorageHealth();
// Warns if storage is running low
```

## User Settings

### Allow Users to Manage Storage:

```typescript
// In Settings page
const StorageSettings = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [isPersisted, setIsPersisted] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await storageService.getStorageEstimate();
    const persisted = await storageService.isPersisted();
    setStorageInfo(info);
    setIsPersisted(persisted);
  };

  const handleRequestPermission = async () => {
    const granted = await storageService.requestPersistentStorage();
    if (granted) {
      setIsPersisted(true);
      alert('Storage permission granted!');
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear cached data? You\'ll need to redownload content.')) {
      await storageService.clearOldCache();
      alert('Cache cleared!');
      loadStorageInfo();
    }
  };

  return (
    <div>
      <h2>Storage Settings</h2>
      {storageInfo && (
        <div>
          <p>Used: {storageInfo.usageFormatted}</p>
          <p>Available: {storageInfo.quotaFormatted}</p>
          <p>Persistent: {isPersisted ? '✅ Yes' : '❌ No'}</p>
        </div>
      )}
      {!isPersisted && (
        <button onClick={handleRequestPermission}>
          Request Storage Permission
        </button>
      )}
      <button onClick={handleClearCache}>
        Clear Cache
      </button>
    </div>
  );
};
```

## Best Practices

### 1. Request Permission at Right Time:
- ✅ After user interacts with app
- ✅ Before uploading large files
- ✅ When user saves content for offline
- ❌ Immediately on page load (annoying)

### 2. Explain Benefits:
- Show what user gets
- Display storage usage
- Be transparent

### 3. Handle Rejection Gracefully:
- App still works without permission
- Warn about potential data loss
- Allow requesting again later

### 4. Monitor Storage:
- Check before large operations
- Warn when running low
- Offer to clear old data

### 5. Respect User Choice:
- Don't repeatedly ask if denied
- Provide settings to change later
- Work offline even without permission

## Troubleshooting

### Permission Not Working:

**Check:**
- Browser supports API (Chrome 55+, Firefox 57+, Safari 15.2+)
- HTTPS or localhost (required)
- User hasn't disabled storage in browser settings

### Storage Full:

**Solutions:**
- Clear old service worker caches
- Delete old localStorage data
- Ask user to free device space
- Compress files before storing

### Data Still Being Cleared:

**Possible Causes:**
- Permission not actually granted
- Browser in incognito mode
- User manually clearing data
- Device critically low on space

## Security & Privacy

### What's Stored:
- ✅ Bible content (public)
- ✅ Sermon videos (public)
- ✅ User preferences (local)
- ✅ Cached data (temporary)

### What's NOT Stored:
- ❌ Passwords (use secure authentication)
- ❌ Payment info (never store locally)
- ❌ Sensitive personal data

### Privacy:
- All data stored locally on user's device
- User can clear anytime
- No data sent to third parties
- Transparent about what's stored

## Summary

Your app now:
- ✅ Requests storage permission properly
- ✅ Shows storage usage to users
- ✅ Handles large files safely
- ✅ Monitors storage health
- ✅ Warns when running low
- ✅ Protects user data from automatic deletion

Users benefit from:
- 🚀 Faster loading
- 📱 Offline access
- 🔒 Protected data
- 💾 Large file support
- ⚡ Better performance
