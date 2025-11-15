# 🔴 Facebook Live Stream Auto-Detection Setup

This guide will help you set up automatic detection of your Facebook Live streams using the Facebook Graph API.

## 📋 Prerequisites

1. **Facebook Page** (not personal profile) - Your church's official Facebook page
2. **Facebook Developer Account** - To create apps and get API access
3. **Page Admin Access** - You must be an admin of the Facebook page

## 🚀 Step-by-Step Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Choose **"Business"** as app type
4. Fill in app details:
   - **App Name**: "Church Live Stream Detector" (or similar)
   - **Contact Email**: Your church email
   - **Business Account**: Select or create one

### Step 2: Configure App Permissions

1. In your app dashboard, go to **"App Review"** → **"Permissions and Features"**
2. Request these permissions:
   - `pages_read_engagement` - To read live video data
   - `pages_show_list` - To access page information
   - `public_profile` - Basic permission

### Step 3: Get Page Access Token

1. Go to **"Tools"** → **"Graph API Explorer"**
2. Select your app from dropdown
3. Click **"Generate Access Token"**
4. Select your Facebook page
5. Add permissions: `pages_read_engagement`, `pages_show_list`
6. Copy the **Page Access Token** (starts with `EAA...`)

### Step 4: Get Page ID

**Method 1: From Facebook Page**
1. Go to your Facebook page
2. Click **"About"** tab
3. Scroll down to find **"Page ID"**

**Method 2: Using Graph API Explorer**
1. In Graph API Explorer, use endpoint: `me/accounts`
2. Find your page in the response
3. Copy the `id` field

### Step 5: Test API Access

Test your setup using this URL in your browser:
```
https://graph.facebook.com/v18.0/{YOUR_PAGE_ID}/live_videos?access_token={YOUR_PAGE_ACCESS_TOKEN}
```

Replace `{YOUR_PAGE_ID}` and `{YOUR_PAGE_ACCESS_TOKEN}` with your actual values.

**Expected Response:**
```json
{
  "data": [
    // Array of live videos (empty if no current live streams)
  ],
  "paging": {
    // Pagination info
  }
}
```

### Step 6: Add to Environment Variables

Add these to your `.env.development` and `.env.production` files:

```env
# Facebook Graph API for Live Stream Detection
VITE_FACEBOOK_PAGE_ID=your_page_id_here
VITE_FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
```

## 🎯 How It Works

### Automatic Detection
- **Every 30 seconds**: App checks Facebook Graph API for live videos
- **Real-time Updates**: Automatically displays live streams when detected
- **Multi-platform**: Works alongside YouTube detection
- **Professional Display**: Shows viewer count, start time, and stream info

### API Endpoints Used

1. **Live Videos**: `/{page-id}/live_videos`
   - Gets current and recent live videos
   - Returns status: `LIVE`, `SCHEDULED`, `ENDED`

2. **Video Details**: `/{video-id}`
   - Gets detailed information about specific videos
   - Includes viewer count, description, embed URL

### Response Example
```json
{
  "data": [
    {
      "id": "123456789",
      "title": "Sunday Morning Worship",
      "description": "Join us for worship and the Word",
      "status": "LIVE",
      "creation_time": "2024-01-07T10:00:00+0000",
      "live_views": 45,
      "permalink_url": "https://www.facebook.com/yourpage/videos/123456789/"
    }
  ]
}
```

## 🔧 Advanced Configuration

### Custom Refresh Interval
```typescript
// In your component
liveStreamDetectionService.initialize({
  facebookPageId: 'your_page_id',
  facebookAccessToken: 'your_access_token',
  refreshInterval: 60000 // 1 minute instead of 30 seconds
});
```

### Multiple Pages
```typescript
// Monitor multiple church pages
const pages = [
  { id: 'main_church_page_id', token: 'main_page_token' },
  { id: 'youth_page_id', token: 'youth_page_token' }
];
```

## 🛡️ Security Best Practices

### Token Security
- **Never commit tokens** to version control
- **Use environment variables** for all sensitive data
- **Rotate tokens regularly** (Facebook tokens can expire)
- **Limit token permissions** to only what's needed

### Access Control
- **Page Admin Only**: Only page admins can generate page access tokens
- **App Review**: Submit for Facebook review for production use
- **Rate Limiting**: Facebook limits API calls (200 calls per hour per user)

## 🚨 Troubleshooting

### Common Issues

**1. "Invalid Access Token" Error**
- Check if token has expired
- Verify token has correct permissions
- Ensure you're using Page Access Token, not User Access Token

**2. "Insufficient Permissions" Error**
- Add `pages_read_engagement` permission
- Re-generate access token with new permissions
- Submit app for review if needed

**3. "Page Not Found" Error**
- Verify Page ID is correct
- Ensure you're admin of the page
- Check if page is published (not draft)

**4. No Live Videos Returned**
- Confirm you're actually live streaming
- Check if stream is public (not private/friends only)
- Verify API endpoint URL is correct

### Testing Without Live Stream
```javascript
// Test with scheduled or past videos
const testUrl = `https://graph.facebook.com/v18.0/${pageId}/videos?access_token=${token}&limit=5`;
```

## 📱 Mobile App Considerations

### CORS Issues
- Facebook Graph API supports CORS for browser requests
- No additional server-side proxy needed
- Works directly from React app

### Offline Handling
```typescript
// Handle network errors gracefully
try {
  const streams = await checkFacebookLiveStreams();
} catch (error) {
  console.log('Network error, using cached data');
  // Show last known stream status
}
```

## 🎉 Benefits

### For Church Members
- **Automatic Discovery**: No need to search for live streams
- **Real-time Status**: See exactly when church is live
- **Professional Experience**: Embedded video player with controls
- **Multi-platform**: Facebook and YouTube streams in one place

### For Church Staff
- **Zero Maintenance**: Automatically detects streams
- **Professional Appearance**: No manual updates needed
- **Analytics**: Track viewer engagement
- **Backup Options**: Multiple streaming platforms supported

## 📞 Support

If you encounter issues:

1. **Check Facebook Developer Docs**: [developers.facebook.com](https://developers.facebook.com/)
2. **Graph API Explorer**: Test API calls directly
3. **Facebook Community**: Developer community forums
4. **App Review Process**: For production deployment

---

**🔴 Ready to automatically detect and display your Facebook Live streams!**

Your church app will now professionally display live streams as soon as you go live on Facebook, creating a seamless experience for your online congregation.
