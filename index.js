// Simple Express server for real-time data synchronization
// This server broadcasts admin changes to all connected clients

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('./config/cloudinary');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 files
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create temp directory for Cloudinary uploads
const TEMP_DIR = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Multer config for Cloudinary (temp storage)
const cloudinaryUpload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file or create default
let dataStore = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  bibleStudies: [],
  chatMessages: [],
  users: []
};

// Load existing data on startup
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      dataStore = JSON.parse(fileData);
      console.log('[Server] Loaded existing data from file');
    } else {
      console.log('[Server] No existing data file, starting fresh');
      saveData(); // Create the file
    }
  } catch (error) {
    console.error('[Server] Error loading data:', error);
  }
  return dataStore;
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2), 'utf8');
    console.log('[Server] Data saved to file');
  } catch (error) {
    console.error('[Server] Error saving data:', error);
  }
}

// Load data on startup
loadData();

// Make dataStore and saveData available to routes
app.locals.dataStore = dataStore;
app.locals.saveData = saveData;

// Mount auth routes
app.use('/api/auth', authRoutes);

// Store active Socket.io connections
const connectedClients = new Map(); // socket.id -> socket

// Middleware to verify admin (simple token check)
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // In production, verify JWT token
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Socket.io connection handling for real-time updates
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}. Total clients: ${connectedClients.size + 1}`);
  connectedClients.set(socket.id, socket);

  // Send initial connection confirmation
  socket.emit('connected', { message: 'Connected to sync server' });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`[Socket.io] Client disconnected: ${socket.id}. Total clients: ${connectedClients.size}`);
  });
});

// Broadcast update to all connected clients via Socket.io
function broadcastUpdate(syncData) {
  // Emit to all connected clients
  io.emit('sync_update', syncData);
  
  console.log(`[Socket.io] Broadcasted ${syncData.type} ${syncData.action} to ${connectedClients.size} clients`);
}

// Push update endpoint (called by admin)
app.post('/api/sync/push', verifyAdmin, (req, res) => {
  const syncData = req.body;
  
  // Validate sync data
  if (!syncData.type || !syncData.action) {
    return res.status(400).json({ error: 'Invalid sync data' });
  }

  // Apply update to in-memory store
  applyUpdate(syncData);

  // Broadcast to all connected clients
  broadcastUpdate(syncData);

  res.json({ success: true, timestamp: syncData.timestamp });
});

// Apply update to in-memory store and save to file
function applyUpdate(syncData) {
  const { type, action, data } = syncData;

  if (action === 'clear') {
    if (type === 'siteContent') {
      dataStore[type] = {};
    } else {
      dataStore[type] = [];
    }
    saveData(); // Save to file
    return;
  }

  switch (action) {
    case 'add':
      if (Array.isArray(dataStore[type])) {
        dataStore[type].push(data);
      } else {
        dataStore[type] = data;
      }
      break;
    case 'update':
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type][index] = data;
        }
      } else {
        dataStore[type] = { ...dataStore[type], ...data };
      }
      break;
    case 'delete':
      if (Array.isArray(dataStore[type])) {
        dataStore[type] = dataStore[type].filter(item => item.id !== data.id);
      }
      break;
  }
  
  // Save to file after every change
  saveData();
}

// Get all data endpoint (for initial sync)
app.get('/api/sync/data', (req, res) => {
  console.log('[Server] Fetching all data for sync');
  res.json(dataStore);
});

// Get latest data endpoint
app.get('/api/sync/:type', (req, res) => {
  const { type } = req.params;
  
  if (!dataStore.hasOwnProperty(type)) {
    return res.status(404).json({ error: 'Data type not found' });
  }

  res.json(dataStore[type]);
});

// Get all sermons (for initial data load)
app.get('/api/sermons', (req, res) => {
  console.log('[Server] Fetching all sermons:', dataStore.sermons.length);
  res.json(dataStore.sermons || []);
});

// Get all announcements (for initial data load)
app.get('/api/announcements', (req, res) => {
  console.log('[Server] Fetching all announcements:', dataStore.announcements.length);
  res.json(dataStore.announcements || []);
});

// Get all events (for initial data load)
app.get('/api/events', (req, res) => {
  console.log('[Server] Fetching all events:', dataStore.events.length);
  res.json(dataStore.events || []);
});

// Get all site content (for initial data load)
app.get('/api/site-content', (req, res) => {
  console.log('[Server] Fetching site content');
  res.json(dataStore.siteContent || {});
});

// Get all prayer requests (for initial data load)
app.get('/api/prayer-requests', (req, res) => {
  console.log('[Server] Fetching all prayer requests:', dataStore.prayerRequests.length);
  res.json(dataStore.prayerRequests || []);
});

// Get all bible studies (for initial data load)
app.get('/api/bible-studies', (req, res) => {
  console.log('[Server] Fetching all bible studies:', dataStore.bibleStudies?.length || 0);
  res.json(dataStore.bibleStudies || []);
});

// Get all chat messages (for initial data load)
app.get('/api/chat-messages', (req, res) => {
  console.log('[Server] Fetching all chat messages:', dataStore.chatMessages.length);
  res.json(dataStore.chatMessages || []);
});

// File upload endpoint
app.post('/api/upload', verifyAdmin, upload.single('file'), (req, res) => {
  try {
    console.log('[Server] Upload request received');
    console.log('[Server] File:', req.file);
    
    if (!req.file) {
      console.error('[Server] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    console.log(`[Server] File uploaded successfully: ${req.file.filename}`);
    console.log(`[Server] File URL: ${fileUrl}`);

    res.json({
      success: true,
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('[Server] Upload error:', error);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete file endpoint
app.delete('/api/upload/:filename', verifyAdmin, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Server] File deleted: ${filename}`);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('[Server] Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Sync endpoint - Get all data
app.get('/api/sync/data', (req, res) => {
  try {
    const data = loadData();
    console.log('[Server] Sync data requested');
    res.json(data);
  } catch (error) {
    console.error('[Server] Sync data error:', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// Push data endpoint - Admin updates
app.post('/api/sync/push', verifyAdmin, (req, res) => {
  try {
    const { type, data: newData } = req.body;
    const currentData = loadData();
    
    // Update the specific data type
    if (type && currentData[type]) {
      currentData[type] = newData;
      saveData(currentData);
      
      // Broadcast update to all connected clients
      broadcast({ type, data: newData });
      
      console.log(`[Server] Data pushed: ${type}`);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error('[Server] Push error:', error);
    res.status(500).json({ error: 'Push failed' });
  }
});

// Cloudinary video upload endpoint
app.post('/api/sermons/upload-video', cloudinaryUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    console.log('[Cloudinary] Uploading video:', req.file.originalname);
    console.log('[Cloudinary] File saved to:', req.file.path);
    console.log('[Cloudinary] File size:', req.file.size, 'bytes');

    // Ensure the file exists before uploading
    if (!fs.existsSync(req.file.path)) {
      console.error('[Cloudinary] ❌ File not found at path:', req.file.path);
      return res.status(500).json({ error: 'File not found after upload' });
    }

    console.log('[Cloudinary] ✅ File exists, starting Cloudinary upload...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'church-sermons',
      public_id: `sermon-${Date.now()}`,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
    });

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    console.log('[Cloudinary] ✅ Video uploaded successfully:', result.secure_url);

    res.json({ 
      success: true,
      videoUrl: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
    });

  } catch (error) {
    console.error('[Cloudinary] ❌ Upload error:', error);
    console.error('[Cloudinary] ❌ Error details:', error.message);
    console.error('[Cloudinary] ❌ Error stack:', error.stack);
    
    // Clean up temp file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('[Cloudinary] Cleaned up temp file');
      } catch (cleanupError) {
        console.error('[Cloudinary] Failed to cleanup temp file:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Video upload failed',
      details: error.message 
    });
  }
});

// Delete video from Cloudinary
app.delete('/api/sermons/delete-video', async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID required' });
    }

    await cloudinary.uploader.destroy(publicId, { 
      resource_type: 'video' 
    });

    console.log('[Cloudinary] ✅ Video deleted:', publicId);

    res.json({ success: true });
  } catch (error) {
    console.error('[Cloudinary] ❌ Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: connectedClients.size,
    timestamp: Date.now()
  });
});

// Start server with Socket.io
server.listen(PORT, () => {
  console.log(`[Server] Sync server running on port ${PORT}`);
  console.log(`[Server] Socket.io endpoint: http://localhost:${PORT}`);
  console.log(`[Server] WebSocket support enabled`);
});

// Remove server timeout - let uploads take as long as needed (only size limit: 100MB)
server.timeout = 0; // No timeout
server.keepAliveTimeout = 0;
server.headersTimeout = 0;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  io.close(() => {
    console.log('[Server] Socket.io connections closed');
  });
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});
