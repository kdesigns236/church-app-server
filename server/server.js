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

// Sync endpoint
app.get('/api/sync/data', (req, res) => {
  res.json(dataStore);
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