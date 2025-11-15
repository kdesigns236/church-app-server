// Simple Express server for real-time data synchronization
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const dataStore = {
  'site-content': {},
  'bible-studies': [],
  'events': [],
  'sermons': [],
  'announcements': [],
  'prayer-requests': [],
  'chat-messages': []
};

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hardcoded admin credentials for testing
    if (email === 'admin@church.com' && password === 'admin123') {
      res.json({
        token: 'test-token',
        user: {
          id: 'admin-user-001',
          name: 'Admin',
          email: 'admin@church.com',
          role: 'admin',
          profilePicture: 'https://res.cloudinary.com/de0zuglgd/image/upload/v1761829850/church-profiles/x3thqajc5samerpfacyq.png'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Data endpoints
app.get('/api/site-content', (req, res) => {
  res.json(dataStore['site-content']);
});

app.get('/api/bible-studies', (req, res) => {
  res.json(dataStore['bible-studies']);
});

app.get('/api/events', (req, res) => {
  res.json(dataStore['events']);
});

app.get('/api/sermons', (req, res) => {
  res.json(dataStore['sermons']);
});

app.get('/api/announcements', (req, res) => {
  res.json(dataStore['announcements']);
});

app.get('/api/prayer-requests', (req, res) => {
  res.json(dataStore['prayer-requests']);
});

app.get('/api/chat-messages', (req, res) => {
  res.json(dataStore['chat-messages']);
});

// Sync endpoints
app.get('/api/sync/data', (req, res) => {
  res.json(dataStore);
});

// Push sync data endpoint
app.post('/api/sync/push', (req, res) => {
  try {
    const { type, action, data } = req.body;
    console.log(`[Sync] Received push: ${type} - ${action}`);
    
    // Update dataStore based on type and action
    if (dataStore.hasOwnProperty(type)) {
      if (action === 'create' || action === 'update') {
        if (Array.isArray(dataStore[type])) {
          // For arrays, add or update item
          const existingIndex = dataStore[type].findIndex(item => item.id === data.id);
          if (existingIndex >= 0) {
            dataStore[type][existingIndex] = data;
          } else {
            dataStore[type].push(data);
          }
        } else {
          // For objects, merge data
          dataStore[type] = { ...dataStore[type], ...data };
        }
      } else if (action === 'delete') {
        if (Array.isArray(dataStore[type])) {
          dataStore[type] = dataStore[type].filter(item => item.id !== data.id);
        }
      }
      
      // Broadcast update to all connected clients
      io.emit('sync_update', { type, action, data });
      
      res.json({ success: true, message: 'Data synced successfully' });
    } else {
      res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error('[Sync] Push error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Camera connection endpoints
const cameraConnections = new Map();

// Accept camera connection
app.post('/api/camera/connect', (req, res) => {
  try {
    const { sessionId, offer, deviceInfo } = req.body;
    
    console.log(`[Camera] Connection request from session: ${sessionId}`);
    console.log(`[Camera] Device info:`, deviceInfo);
    
    // Store the connection request
    cameraConnections.set(sessionId, {
      offer,
      deviceInfo,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    // Notify streaming clients about new camera
    io.emit('camera_connection_request', {
      sessionId,
      deviceInfo,
      timestamp: Date.now()
    });
    
    // For now, create a mock answer (in production, this would be handled by WebRTC)
    const mockAnswer = {
      type: 'answer',
      sdp: 'mock-answer-sdp'
    };
    
    res.json({ 
      success: true, 
      answer: mockAnswer,
      message: 'Connection accepted' 
    });
    
  } catch (error) {
    console.error('[Camera] Connection error:', error);
    res.status(500).json({ error: 'Failed to accept camera connection' });
  }
});

// Handle camera signaling
app.post('/api/camera/signal', (req, res) => {
  try {
    const { sessionId, type, candidate } = req.body;
    
    console.log(`[Camera] Signaling message from ${sessionId}: ${type}`);
    
    // Forward signaling message to streaming clients
    io.emit('camera_signaling', {
      sessionId,
      type,
      candidate,
      timestamp: Date.now()
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('[Camera] Signaling error:', error);
    res.status(500).json({ error: 'Signaling failed' });
  }
});

// Get camera status
app.get('/api/camera/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const connection = cameraConnections.get(sessionId);
    
    if (!connection) {
      return res.status(404).json({ error: 'Camera session not found' });
    }
    
    res.json({
      sessionId,
      status: connection.status,
      deviceInfo: connection.deviceInfo,
      timestamp: connection.timestamp
    });
    
  } catch (error) {
    console.error('[Camera] Status check error:', error);
    res.status(500).json({ error: 'Failed to get camera status' });
  }
});

// Disconnect camera
app.delete('/api/camera/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (cameraConnections.has(sessionId)) {
      cameraConnections.delete(sessionId);
      
      // Notify clients about disconnection
      io.emit('camera_disconnected', { sessionId });
      
      console.log(`[Camera] Session disconnected: ${sessionId}`);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('[Camera] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect camera' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  // Send initial connection confirmation
  socket.emit('connected', { message: 'Connected to sync server' });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Sync server running on port ${PORT}`);
  console.log(`[Server] Socket.io endpoint: http://localhost:${PORT}`);
  console.log(`[Server] WebSocket support enabled`);
});