# File Storage Guide

## Overview
Your server now supports permanent file storage for uploaded media (videos, images, audio).

## What Gets Stored

### ✅ Permanently Stored on Server:
- **Sermon videos** (up to 100MB each)
- **Profile pictures**
- **Chat media** (images, videos, audio)
- **Event images**
- **Any uploaded files**

### 📁 Storage Location:
- **Server**: `server/uploads/` folder
- **Accessible via**: `http://localhost:3000/uploads/filename`

## How It Works

### For Admin (Uploading):

```javascript
import { uploadService } from './services/uploadService';

// When admin uploads a sermon video
const handleVideoUpload = async (file: File) => {
  try {
    // Upload to server
    const videoUrl = await uploadService.uploadFile(file);
    
    // Now use this URL in your sermon
    const sermon = {
      title: "Sunday Service",
      videoUrl: videoUrl, // This is now a permanent server URL
      // ... other fields
    };
    
    // Save sermon (videoUrl will be synced to all users)
    await syncService.pushUpdate({
      type: 'sermons',
      action: 'add',
      data: sermon
    });
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### For Users (Viewing):

```javascript
// Users automatically get the server URL
// Video plays from: http://localhost:3000/uploads/1234567890-video.mp4
<video src={sermon.videoUrl} />
```

## Integration Example

### Update AdminPage.tsx:

```typescript
import { uploadService } from '../services/uploadService';

const handleSermonSubmit = async (formData) => {
  try {
    // If there's a video file, upload it first
    let videoUrl = formData.videoUrl;
    
    if (formData.videoUrl instanceof File) {
      console.log('Uploading video to server...');
      videoUrl = await uploadService.uploadFile(formData.videoUrl);
      console.log('Video uploaded:', videoUrl);
    }
    
    // Create sermon with server URL
    const sermon = {
      ...formData,
      videoUrl: videoUrl, // Server URL, not File object
      id: Date.now().toString(),
      date: new Date().toISOString(),
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false
    };
    
    // Push to sync service (will broadcast to all users)
    await syncService.pushUpdate({
      type: 'sermons',
      action: 'add',
      data: sermon
    });
    
    // Update local state
    addSermon(sermon);
  } catch (error) {
    console.error('Error adding sermon:', error);
    alert('Failed to upload sermon');
  }
};
```

### Update SermonReel.tsx:

```typescript
// Remove the File object handling
// Videos now come as URLs from the server

export const SermonReel: React.FC<SermonReelProps> = ({ sermon, ... }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Video source is now always a URL
  const videoSrc = sermon.videoUrl; // No need to create blob URLs

  return (
    <div className="relative w-full h-full snap-start bg-black">
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
        />
      ) : (
        <div className="text-white">Loading...</div>
      )}
      {/* ... rest of component */}
    </div>
  );
};
```

## File Size Limits

- **Maximum file size**: 100MB per file
- **Supported formats**: 
  - Videos: mp4, webm, mov, avi
  - Images: jpg, png, gif, webp
  - Audio: mp3, wav, ogg

## Storage Management

### Check Storage Usage:

```bash
# On Windows
cd server/uploads
dir

# On Linux/Mac
cd server/uploads
du -sh .
```

### Clean Up Old Files:

```javascript
// Delete a file when sermon is deleted
const deleteSermon = async (sermonId) => {
  const sermon = sermons.find(s => s.id === sermonId);
  
  if (sermon && sermon.videoUrl) {
    // Extract filename from URL
    const filename = uploadService.getFilenameFromUrl(sermon.videoUrl);
    
    // Delete from server
    await uploadService.deleteFile(filename);
  }
  
  // Delete sermon data
  await syncService.pushUpdate({
    type: 'sermons',
    action: 'delete',
    data: { id: sermonId }
  });
};
```

## Benefits

### ✅ Before (File objects in localStorage):
- ❌ Not synced to other users
- ❌ Lost when browser data cleared
- ❌ Can't access from other devices
- ❌ Limited by browser storage (usually 5-10MB)

### ✅ Now (Files on server):
- ✅ Synced to all users automatically
- ✅ Permanent storage
- ✅ Access from any device
- ✅ Up to 100MB per file
- ✅ Faster loading (served from server)

## Production Deployment

### Option 1: Use Cloud Storage (Recommended)

For production, consider using cloud storage:

#### AWS S3:
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

// Upload to S3
const uploadToS3 = async (file) => {
  const params = {
    Bucket: 'cogel-uploads',
    Key: file.filename,
    Body: file.buffer
  };
  
  const result = await s3.upload(params).promise();
  return result.Location; // Public URL
};
```

#### Cloudinary (Easiest):
```bash
npm install cloudinary
```

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Upload
const result = await cloudinary.uploader.upload(file.path);
return result.secure_url;
```

### Option 2: Keep Local Storage

If using your own server:

1. **Backup regularly**:
   ```bash
   # Backup uploads folder
   tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
   ```

2. **Set up automatic backups**:
   ```bash
   # Add to crontab (Linux)
   0 2 * * * cd /path/to/server && tar -czf backups/uploads-$(date +\%Y\%m\%d).tar.gz uploads/
   ```

3. **Monitor disk space**:
   ```bash
   df -h
   ```

## Security Considerations

### 1. File Type Validation:

```javascript
const allowedTypes = ['video/mp4', 'video/webm', 'image/jpeg', 'image/png'];

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 2. Virus Scanning:

```bash
npm install clamscan
```

```javascript
const NodeClam = require('clamscan');

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const clamscan = await new NodeClam().init();
  const { isInfected } = await clamscan.isInfected(req.file.path);
  
  if (isInfected) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File is infected' });
  }
  
  // Continue with upload
});
```

### 3. Rate Limiting:

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 uploads per windowMs
});

app.post('/api/upload', uploadLimiter, upload.single('file'), ...);
```

## Troubleshooting

### Issue: Upload fails

**Check:**
- File size (must be < 100MB)
- File type (must be allowed)
- Disk space on server
- Network connection

### Issue: Files not accessible

**Check:**
- Server is running
- Uploads folder exists
- File permissions (chmod 755 uploads/)
- Correct URL (http://localhost:3000/uploads/filename)

### Issue: Slow uploads

**Solutions:**
- Compress videos before upload
- Use cloud storage (CDN)
- Increase server bandwidth
- Implement chunked uploads

## Cost Estimation

### Local Storage (Current):
- **Cost**: Free
- **Limit**: Server disk space
- **Bandwidth**: Your internet connection

### Cloud Storage:

#### Cloudinary (Free Tier):
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Cost**: Free

#### AWS S3:
- **Storage**: $0.023/GB/month
- **Bandwidth**: $0.09/GB
- **Example**: 100GB storage + 500GB bandwidth = ~$50/month

#### Backblaze B2:
- **Storage**: $0.005/GB/month
- **Bandwidth**: Free (first 3x storage)
- **Example**: 100GB storage = $0.50/month

## Next Steps

1. ✅ Server configured for file uploads
2. ⬜ Update AdminPage to use uploadService
3. ⬜ Update SermonReel to use server URLs
4. ⬜ Test file upload and playback
5. ⬜ Consider cloud storage for production
6. ⬜ Set up automatic backups
