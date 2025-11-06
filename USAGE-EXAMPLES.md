# UI Configuration Usage Examples

## 🎨 How to Use Server-Driven UI Configs

### 1. Using Feature Flags

```typescript
import { useFeatureFlag } from './hooks/useUIConfig';

function VideoCallButton() {
  const videoCallEnabled = useFeatureFlag('videoCall');
  
  if (!videoCallEnabled) {
    return null; // Hide button if feature is disabled
  }
  
  return <button>Start Video Call</button>;
}
```

### 2. Using Theme Configuration

```typescript
import { useTheme } from './hooks/useUIConfig';

function ThemedButton() {
  const { theme, loading } = useTheme();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <button style={{
      backgroundColor: theme?.colors.primary,
      color: theme?.colors.text,
      borderRadius: theme?.borderRadius.md,
      padding: theme?.spacing.md
    }}>
      Click Me
    </button>
  );
}
```

### 3. Using Home Layout

```typescript
import { useHomeLayout } from './hooks/useUIConfig';

function HomePage() {
  const { layout, loading } = useHomeLayout();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {layout?.sections.map((section, index) => (
        <DynamicSection key={index} config={section} />
      ))}
    </div>
  );
}

function DynamicSection({ config }) {
  switch (config.type) {
    case 'hero':
      return <HeroSection {...config} />;
    case 'quick-actions':
      return <QuickActions items={config.items} />;
    case 'latest-sermon':
      return <LatestSermon />;
    default:
      return null;
  }
}
```

### 4. Using Banners

```typescript
import { useBanners } from './hooks/useUIConfig';

function BannerDisplay() {
  const { banners, loading } = useBanners();
  
  if (loading || !banners?.banners.length) return null;
  
  return (
    <div>
      {banners.banners.map(banner => (
        <div key={banner.id} className={`banner banner-${banner.type}`}>
          <h3>{banner.title}</h3>
          <p>{banner.message}</p>
          {banner.action && (
            <button onClick={() => navigate(banner.action.route)}>
              {banner.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 5. Using All Configs Together

```typescript
import { useUIConfig } from './hooks/useUIConfig';

function App() {
  const { theme, features, layout, banners, navigation, loading } = useUIConfig();
  
  if (loading) return <LoadingScreen />;
  
  // Apply theme globally
  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--primary', theme.colors.primary);
      document.documentElement.style.setProperty('--secondary', theme.colors.secondary);
    }
  }, [theme]);
  
  return (
    <div>
      {banners && <BannerDisplay banners={banners} />}
      {navigation && <Header config={navigation.header} />}
      <Routes>
        {/* Your routes */}
      </Routes>
      {navigation && <Footer config={navigation.footer} />}
    </div>
  );
}
```

### 6. Checking Feature Limits

```typescript
import { uiConfigService } from './services/uiConfigService';

async function handleVideoUpload(file: File) {
  const maxSize = await uiConfigService.getLimit('maxVideoUploadMB');
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > maxSize) {
    alert(`Video must be under ${maxSize}MB`);
    return;
  }
  
  // Proceed with upload
}
```

### 7. Conditional Rendering Based on Features

```typescript
import { useFeatures } from './hooks/useUIConfig';

function NavigationMenu() {
  const { features } = useFeatures();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/sermons">Sermons</Link>
      {features?.features.events && <Link to="/events">Events</Link>}
      {features?.features.chatEnabled && <Link to="/chat">Chat</Link>}
      {features?.features.aiPastor && <Link to="/pastor-ai">AI Pastor</Link>}
      {features?.features.giving && <Link to="/giving">Giving</Link>}
    </nav>
  );
}
```

### 8. Experimental Features

```typescript
import { useFeatures } from './hooks/useUIConfig';

function VideoPlayer({ videoUrl }) {
  const { features } = useFeatures();
  
  // Use new video player if experimental feature is enabled
  if (features?.experimental.newVideoPlayer) {
    return <NewVideoPlayer url={videoUrl} />;
  }
  
  return <LegacyVideoPlayer url={videoUrl} />;
}
```

## 🔄 Updating Configurations

### From Server (Render Dashboard)

1. Edit `server/index.js`
2. Update the configuration in the endpoint
3. Commit and push to GitHub
4. Render auto-deploys
5. App fetches new config on next launch

### Example: Disable a Feature

```javascript
// In server/index.js
app.get('/api/ui/features', (req, res) => {
  res.json({
    features: {
      videoCall: false, // ← Disable video call feature
      // ... other features
    }
  });
});
```

Push to GitHub → Render deploys → All apps get updated config!

### Example: Change Theme Colors

```javascript
// In server/index.js
app.get('/api/ui/theme', (req, res) => {
  res.json({
    colors: {
      primary: "#ff6b6b", // ← New red primary color
      secondary: "#4ecdc4", // ← New teal secondary
      // ... other colors
    }
  });
});
```

Push to GitHub → Render deploys → All apps get new theme!

## 🎯 Best Practices

1. **Always provide defaults** - Apps work offline with cached configs
2. **Version your configs** - Track changes with version numbers
3. **Test before deploying** - Use staging environment first
4. **Monitor usage** - Check Render logs for config fetches
5. **Cache wisely** - 5-minute cache reduces server load
6. **Gradual rollout** - Test experimental features before enabling for all

## 🚀 Benefits

- ✅ **No app rebuild** - Update UI instantly
- ✅ **A/B testing** - Test different layouts
- ✅ **Emergency fixes** - Quick disable broken features
- ✅ **Seasonal themes** - Change colors for holidays
- ✅ **Feature rollout** - Enable features gradually
- ✅ **Offline support** - Cached configs work offline

## 📊 Monitoring

Check Render logs to see:
```
[UIConfig] Fetching /ui/theme...
[UIConfig] ✅ Fetched ui-theme
```

Track which configs are being used and how often.
