# Live Streaming Setup Guide

## Overview

Your Church app now has a professional live streaming feature that can broadcast simultaneously to Facebook Live and YouTube Live. This guide will help you set up the necessary API credentials and configure the streaming functionality.

## Features

✅ **Multi-Platform Streaming**: Stream to Facebook and YouTube simultaneously  
✅ **Professional UI**: Full-featured streaming studio interface  
✅ **Device Management**: Switch between cameras and microphones  
✅ **Real-time Stats**: Monitor viewers, duration, and stream quality  
✅ **Admin Only**: Restricted to admin users for security  
✅ **WebRTC Integration**: High-quality video/audio capture  

## Prerequisites

1. **Admin Access**: Only users with admin role can access live streaming
2. **HTTPS**: Live streaming requires HTTPS (works in development)
3. **Camera/Microphone**: Physical devices for video/audio capture
4. **API Credentials**: Facebook and YouTube developer accounts

## Setup Instructions

### 1. Facebook Live API Setup

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Business" → "Continue"
3. Enter app name: "Church Live Streaming"
4. Add your email and select app purpose

#### Step 2: Configure Facebook Login
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" platform
4. Add your domain: `https://yourdomain.com`

#### Step 3: Get Access Token
1. Go to Graph API Explorer
2. Select your app from dropdown
3. Add permissions: `publish_video`, `pages_manage_posts`
4. Generate access token
5. **Important**: Convert to long-lived token for production

#### Step 4: Add to Environment
```bash
# Add to .env.production
VITE_FACEBOOK_APP_ID=your_app_id
VITE_FACEBOOK_ACCESS_TOKEN=your_access_token
```

### 2. YouTube Live API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Church Streaming"
3. Enable YouTube Data API v3
4. Enable YouTube Live Streaming API

#### Step 2: Create OAuth Credentials
1. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: "Web application"
3. Add authorized origins: `https://yourdomain.com`
4. Add redirect URIs: `https://yourdomain.com/auth/youtube/callback`

#### Step 3: Configure OAuth Consent
1. Go to "OAuth consent screen"
2. Add app information and logo
3. Add scopes: `youtube.force-ssl`, `youtube.readonly`
4. Add test users (for development)

#### Step 4: Add to Environment
```bash
# Add to .env.production
VITE_YOUTUBE_CLIENT_ID=your_client_id
VITE_YOUTUBE_CLIENT_SECRET=your_client_secret
```

### 3. Server Configuration

#### Update Server Environment
Add these variables to your server's `.env` file:

```bash
# Facebook Live
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# YouTube Live
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Streaming Configuration
RTMP_SERVER_URL=rtmp://your-streaming-server.com/live
STREAM_KEY_PREFIX=church_stream_
```

#### Add Server Routes
The server needs additional routes for OAuth handling:

```javascript
// Add to server/index.js

// Facebook OAuth
app.get('/auth/facebook', (req, res) => {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&scope=publish_video,pages_manage_posts`;
  res.redirect(authUrl);
});

// YouTube OAuth
app.get('/auth/youtube', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&scope=https://www.googleapis.com/auth/youtube.force-ssl&response_type=code`;
  res.redirect(authUrl);
});
```

## Usage Instructions

### 1. Accessing Live Streaming
1. Login as admin user
2. Navigate to "Go Live" page
3. Grant camera/microphone permissions when prompted

### 2. Setting Up a Stream
1. **Configure Stream Settings**:
   - Enter stream title
   - Add description
   - Set privacy level (Public/Unlisted/Private)

2. **Connect Platforms**:
   - Click "Connect" on Facebook Live card
   - Complete OAuth flow in popup
   - Repeat for YouTube Live

3. **Test Your Setup**:
   - Check camera preview
   - Test microphone levels
   - Switch devices if needed

### 3. Going Live
1. Ensure at least one platform is connected
2. Click "Go Live" button
3. Monitor stream statistics
4. Click "Stop Stream" when finished

## Technical Architecture

### Frontend Components
- **GoLivePage.tsx**: Main streaming interface
- **liveStreamService.ts**: Core streaming logic
- **Platform Cards**: Facebook/YouTube connection status
- **Stream Stats**: Real-time viewer metrics

### Streaming Flow
1. **Media Capture**: WebRTC getUserMedia API
2. **Stream Processing**: MediaRecorder with optimized settings
3. **Platform Distribution**: Simultaneous broadcast to APIs
4. **Real-time Updates**: WebSocket for live statistics

### API Integration
- **Facebook Live**: Graph API v18.0 with live video endpoints
- **YouTube Live**: YouTube Data API v3 with live streaming
- **RTMP Fallback**: Direct RTMP streaming for advanced users

## Troubleshooting

### Common Issues

#### Camera/Microphone Access Denied
- **Solution**: Ensure HTTPS and grant browser permissions
- **Chrome**: Settings → Privacy → Site Settings → Camera/Microphone
- **Firefox**: Address bar → Shield icon → Permissions

#### Platform Connection Failed
- **Facebook**: Check app permissions and access token validity
- **YouTube**: Verify OAuth credentials and API quotas
- **Solution**: Regenerate tokens and check API limits

#### Stream Quality Issues
- **Low Bitrate**: Check internet connection (minimum 5 Mbps upload)
- **Frame Drops**: Reduce resolution or frame rate in settings
- **Audio Sync**: Restart browser and clear cache

#### API Quota Exceeded
- **YouTube**: Default quota is 10,000 units/day
- **Facebook**: Rate limits vary by app verification status
- **Solution**: Request quota increase or implement caching

### Debug Mode
Enable debug logging by adding to console:
```javascript
localStorage.setItem('liveStreamDebug', 'true');
```

## Security Considerations

### Access Control
- ✅ Admin-only access enforced
- ✅ Token validation on server
- ✅ HTTPS required for production
- ✅ OAuth state parameter validation

### API Security
- 🔒 Store secrets server-side only
- 🔒 Use short-lived access tokens
- 🔒 Implement token refresh logic
- 🔒 Rate limit API calls

### Privacy
- 📋 Inform users about live streaming
- 📋 Respect platform community guidelines
- 📋 Implement content moderation
- 📋 Provide stream recording options

## Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
NODE_ENV=production
VITE_API_URL=https://your-api-domain.com/api
FACEBOOK_APP_ID=prod_facebook_app_id
YOUTUBE_CLIENT_ID=prod_youtube_client_id
```

### 2. SSL Certificate
- Required for camera/microphone access
- Use Let's Encrypt or commercial SSL
- Configure HTTPS redirects

### 3. Performance Optimization
- Enable gzip compression
- Implement CDN for static assets
- Use HTTP/2 for better streaming
- Monitor server resources

### 4. Monitoring
- Set up stream health checks
- Monitor API usage and quotas
- Track viewer engagement metrics
- Implement error alerting

## Advanced Features (Future Enhancements)

### Planned Features
- 🚀 **Stream Recording**: Save broadcasts automatically
- 🚀 **Multi-Camera Setup**: Switch between multiple cameras
- 🚀 **Screen Sharing**: Broadcast presentations/slides
- 🚀 **Chat Integration**: Real-time viewer comments
- 🚀 **Stream Scheduling**: Pre-schedule live events
- 🚀 **Analytics Dashboard**: Detailed streaming metrics

### Custom RTMP Server
For advanced users, consider setting up a custom RTMP server:
```bash
# Using nginx-rtmp
docker run -d -p 1935:1935 -p 8080:8080 tiangolo/nginx-rtmp
```

## Support

### Documentation
- [Facebook Live API Docs](https://developers.facebook.com/docs/live-video-api/)
- [YouTube Live API Docs](https://developers.google.com/youtube/v3/live/)
- [WebRTC Documentation](https://webrtc.org/getting-started/)

### Community
- Join the Church App Discord for support
- Check GitHub issues for known problems
- Submit feature requests via GitHub

---

**🎥 Your church is now ready to reach the world with professional live streaming!**

*Last updated: November 2025*
