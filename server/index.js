console.time('[Server] Startup');
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const facebookLiveRoutes = require('./routes/facebookLiveRoutes');
const youtubeLiveRoutes = require('./routes/youtubeLiveRoutes');

// Lazy load database
let database;
let useDatabase = false;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use('/api/facebook/live', facebookLiveRoutes);
app.use('/api/youtube/live', youtubeLiveRoutes);
// Increase JSON body size limit to handle sync payloads that may include media metadata
app.use(express.json({ limit: '5mb' }));

const serverPublicDir = path.join(__dirname, 'public');
const rootPublicDir = path.join(__dirname, '..', 'public');

if (fs.existsSync(serverPublicDir)) {
  app.use(express.static(serverPublicDir));
} else if (fs.existsSync(rootPublicDir)) {
  app.use(express.static(rootPublicDir));
}

// Explicit Bible JSON routes so they are always available in deployment,
// even if static middleware behaves differently on the host platform.
const bibleEnServerPath = path.join(serverPublicDir, 'bible', 'en.json');
const bibleEnRootPath = path.join(rootPublicDir, 'bible', 'en.json');
const bibleSwServerPath = path.join(serverPublicDir, 'bible', 'sw.json');
const bibleSwRootPath = path.join(rootPublicDir, 'bible', 'sw.json');

app.get('/bible/en.json', (req, res) => {
  const filePath = fs.existsSync(bibleEnServerPath)
    ? bibleEnServerPath
    : fs.existsSync(bibleEnRootPath)
      ? bibleEnRootPath
      : null;

  if (!filePath) {
    return res.status(404).send('Bible EN file not found');
  }

  res.sendFile(filePath);
});

app.get('/bible/sw.json', (req, res) => {
  const filePath = fs.existsSync(bibleSwServerPath)
    ? bibleSwServerPath
    : fs.existsSync(bibleSwRootPath)
      ? bibleSwRootPath
      : null;

  if (!filePath) {
    return res.status(404).send('Bible SW file not found');
  }

  res.sendFile(filePath);
});

// JWT Middleware
// Verify token - allows both admin and member roles
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth] Invalid token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify admin role only
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth] Invalid token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// In-memory data store (full default shape, including newer keys like posts/communityStories)
let dataStore = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  bibleStudies: [],
  chatMessages: [],
  users: [],
  posts: [],
  comments: [],
  communityStories: []
};

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file
async function loadDataFromFile() {
  try {
    // Always start from a full default shape so new keys (posts, communityStories, etc.) exist
    const defaultData = {
      sermons: [],
      announcements: [],
      events: [],
      siteContent: {},
      prayerRequests: [],
      bibleStudies: [],
      chatMessages: [],
      users: [],
      posts: [],
      comments: [],
      communityStories: []
    };

    if (fs.existsSync(DATA_FILE)) {
      const fileData = await fs.promises.readFile(DATA_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      // Merge file data over defaults so any missing keys are still present
      dataStore = { ...defaultData, ...parsed };
      console.log('[Server] Loaded existing data from file with defaults merged');
    } else {
      console.log('[Server] No existing data file, starting fresh with defaults');
      dataStore = defaultData;
      await saveDataToFile();
    }
  } catch (error) {
    console.error('[Server] Error loading data:', error);
    // Initialize with default data store if file can't be read
    dataStore = {
      sermons: [],
      announcements: [],
      events: [],
      siteContent: {},
      prayerRequests: [],
      bibleStudies: [],
      chatMessages: [],
      users: [],
      posts: [],
      comments: [],
      communityStories: []
    };
  }
}

// Save data to file
async function saveDataToFile() {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(dataStore, null, 2), 'utf8');
    console.log('[Server] Data saved to file');
  } catch (error) {
    console.error('[Server] Error saving data:', error);
    throw error; // Propagate error to caller
  }
}

// Save data to database (if configured) or file
async function saveData() {
  if (useDatabase) {
    if (!database) {
      database = require('./database');
    }

    for (const [key, value] of Object.entries(dataStore)) {
      try {
        await database.setData(key, value);
      } catch (err) {
        console.error(`[Server] Error saving ${key} to database:`, err.message || err);
      }
    }
  } else {
    await saveDataToFile();
  }
}

// Initialize data store
async function initializeData() {
  try {
    if (!database) {
      database = require('./database');
    }

    useDatabase = await database.initDatabase();

    if (useDatabase) {
      dataStore = await database.getAllData();
      console.log('[Server] Using PostgreSQL for data storage');
    } else {
      await loadDataFromFile();
      console.log('[Server] Using data.json for data storage');
    }

    return true;
  } catch (error) {
    console.error('[Server] Error initializing data:', error);
    throw error;
  }
}

// Create or repair admin user in background
async function ensureAdminUser() {
  const bcrypt = require('bcrypt');

  const users = dataStore.users || [];
  const adminIndex = users.findIndex(
    (u) => u.id === 'user-admin-default' || u.role === 'admin',
  );

  if (adminIndex === -1) {
    // No admin user at all: create the default admin
    console.log('[Server] Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 4);
    const adminUser = {
      id: 'user-admin-default',
      name: 'Admin',
      email: 'admin@church.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    dataStore.users = users.concat(adminUser);
    await saveData();

    console.log('[Server] Default admin user created');
  } else {
    // Admin exists but may be missing a password (e.g. overwritten by a sync update)
    const adminUser = users[adminIndex];
    if (!adminUser.password) {
      console.log(
        '[Server] Admin user found without password, re-seeding default admin password',
      );
      const hashedPassword = await bcrypt.hash('admin123', 4);
      dataStore.users[adminIndex] = { ...adminUser, password: hashedPassword };
      await saveData();
    }
  }
}

// Store active Socket.io connections
const connectedClients = new Map();

// Video call rooms and user data (for /video-call meetings)
const videoCallRooms = new Map(); // roomId -> Set of socket IDs
const socketUserData = new Map(); // socketId -> { roomId, userName }

// Authenticated user presence mapping (socket.id -> userId)
const presenceUserMap = new Map();

// Socket.io connection handling (real-time updates, ProStream, and video calls)
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}. Total clients: ${connectedClients.size + 1}`);
  connectedClients.set(socket.id, socket);

  // Send initial connection confirmation
  socket.emit('connected', { message: 'Connected to sync server' });

  // =============== USER PRESENCE HANDLERS ===============
  // Mark user online when app connects and sends JWT token
  socket.on('user-online', ({ token }) => {
    try {
      if (!token) return;

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      const userId = decoded.id;
      if (!userId) return;

      presenceUserMap.set(socket.id, userId);

      const users = dataStore.users || [];
      const index = users.findIndex(u => u.id === userId);
      if (index === -1) {
        console.warn('[Presence] User not found for user-online:', userId);
        return;
      }

      if (!users[index].isOnline) {
        users[index].isOnline = true;
        saveData().catch(err => console.error('[Presence] Error saving data on user-online:', err));

        const { password, ...safeUser } = users[index];
        broadcastUpdate({ type: 'users', action: 'update', data: safeUser });
        console.log(`[Presence] Marked user ${userId} online`);
      }
    } catch (err) {
      console.error('[Presence] Error handling user-online:', err.message || err);
    }
  });

  // Explicit offline event from client (logout / app close)
  socket.on('user-offline', ({ token }) => {
    try {
      if (!token) return;

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      const userId = decoded.id;
      if (!userId) return;

      presenceUserMap.delete(socket.id);

      const users = dataStore.users || [];
      const index = users.findIndex(u => u.id === userId);
      if (index === -1) {
        console.warn('[Presence] User not found for user-offline:', userId);
        return;
      }

      if (users[index].isOnline) {
        users[index].isOnline = false;
        saveData().catch(err => console.error('[Presence] Error saving data on user-offline:', err));

        const { password, ...safeUser } = users[index];
        broadcastUpdate({ type: 'users', action: 'update', data: safeUser });
        console.log(`[Presence] Marked user ${userId} offline (explicit)`);
      }
    } catch (err) {
      console.error('[Presence] Error handling user-offline:', err.message || err);
    }
  });

  // ==================== VIDEO CALL HANDLERS ====================
  // Join a video call room
  socket.on('join-room', ({ roomId, userName }) => {
    try {
      console.log(`[VideoCall] ${userName} (${socket.id}) joining room: ${roomId}`);

      // Create room if it doesn't exist
      if (!videoCallRooms.has(roomId)) {
        videoCallRooms.set(roomId, new Set());
        console.log(`[VideoCall] Created new room: ${roomId}`);
      }

      const room = videoCallRooms.get(roomId);
      console.log('[VideoCall] Current participants in room before join:', room.size);

      // Send list of existing participants to new user FIRST
      const existingParticipants = Array.from(room)
        .filter(id => id !== socket.id)
        .map(id => ({
          userId: id,
          userName: socketUserData.get(id)?.userName || 'Unknown',
        }));

      console.log(`[VideoCall] Sending ${existingParticipants.length} existing participants to ${userName}`);
      socket.emit('existing-participants', existingParticipants);

      // Notify existing participants about new user
      room.forEach(participantId => {
        console.log(`[VideoCall] Notifying ${participantId} about new user ${userName}`);
        io.to(participantId).emit('user-joined', {
          userId: socket.id,
          userName,
        });
      });

      // Add user to room
      room.add(socket.id);
      socket.join(roomId);
      socketUserData.set(socket.id, { roomId, userName });

      console.log(`[VideoCall] Room ${roomId} now has ${room.size} participants`);
    } catch (err) {
      console.error('[VideoCall] Error handling join-room:', err);
    }
  });

  // WebRTC signaling: offer
  socket.on('offer', ({ offer, targetUserId }) => {
    try {
      console.log(`[VideoCall] Forwarding offer from ${socket.id} to ${targetUserId}`);
      io.to(targetUserId).emit('offer', {
        offer,
        fromUserId: socket.id,
        fromUserName: socketUserData.get(socket.id)?.userName || 'Unknown',
      });
    } catch (err) {
      console.error('[VideoCall] Error forwarding offer:', err);
    }
  });

  // WebRTC signaling: answer
  socket.on('answer', ({ answer, targetUserId }) => {
    try {
      console.log(`[VideoCall] Forwarding answer from ${socket.id} to ${targetUserId}`);
      io.to(targetUserId).emit('answer', {
        answer,
        fromUserId: socket.id,
      });
    } catch (err) {
      console.error('[VideoCall] Error forwarding answer:', err);
    }
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', ({ candidate, targetUserId }) => {
    try {
      if (!candidate) return;
      console.log(`[VideoCall] Forwarding ICE candidate from ${socket.id} to ${targetUserId}`);
      io.to(targetUserId).emit('ice-candidate', {
        candidate,
        fromUserId: socket.id,
      });
    } catch (err) {
      console.error('[VideoCall] Error forwarding ICE candidate:', err);
    }
  });

  // Meeting started notification
  socket.on('meeting-started', ({ userName, roomId }) => {
    try {
      console.log(`[VideoCall] ${userName} started a meeting in ${roomId}`);

      // Broadcast to all connected clients except sender
      socket.broadcast.emit('meeting-notification', {
        userName,
        roomId,
        message: `${userName} is in a meeting. Join now!`,
      });

      // Optional hook for native notifications
      socket.broadcast.emit('native-push-notification', {
        title: 'Meeting Started',
        body: `${userName} is in a meeting. Join now!`,
        data: {
          type: 'meeting',
          roomId,
          userName,
          route: '/video-call',
        },
      });
    } catch (err) {
      console.error('[VideoCall] Error broadcasting meeting-started:', err);
    }
  });

  // Explicit leave-room from client
  socket.on('leave-room', () => {
    handleUserLeave(socket);
  });

  // --- Pro Stream signaling support (controller / camera / display) ---
  socket.on('prostream:join', ({ sessionId, role, slotId }) => {
    try {
      if (!sessionId) return;
      const room = `prostream:${sessionId}`;
      socket.join(room);
      socket.data.proStream = { sessionId, role, slotId };
      console.log(`[ProStream] ${role || 'client'} joined session ${sessionId} (slot ${slotId ?? 'n/a'})`);
    } catch (err) {
      console.error('[ProStream] Error joining session:', err);
    }
  });

  socket.on('prostream:signal', (message) => {
    try {
      if (!message || !message.sessionId) return;
      const room = `prostream:${message.sessionId}`;
      // Relay to all other sockets in the same Pro Stream session
      socket.to(room).emit('prostream:signal', message);
    } catch (err) {
      console.error('[ProStream] Error relaying signal:', err);
    }
  });
  // --- End Pro Stream signaling support ---

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`[Socket.io] Client disconnected: ${socket.id}. Total clients: ${connectedClients.size}`);

    // Mark presence offline on disconnect if this socket was associated with a user
    const userId = presenceUserMap.get(socket.id);
    if (userId) {
      const users = dataStore.users || [];
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1 && users[index].isOnline) {
        users[index].isOnline = false;
        saveData().catch(err => console.error('[Presence] Error saving data on disconnect:', err));

        const { password, ...safeUser } = users[index];
        broadcastUpdate({ type: 'users', action: 'update', data: safeUser });
        console.log(`[Presence] Marked user ${userId} offline (disconnect)`);
      }
      presenceUserMap.delete(socket.id);
    }

    handleUserLeave(socket);
  });
});

// Broadcast update to all connected clients via Socket.io
function broadcastUpdate(syncData) {
  // Emit to all connected clients
  io.emit('sync_update', syncData);
  console.log(`[Socket.io] Broadcasted ${syncData.type} ${syncData.action} to ${connectedClients.size} clients`);
}

// Handle cleanup when a user leaves a video call room
function handleUserLeave(socket) {
  const userData = socketUserData.get(socket.id);
  if (userData) {
    const { roomId } = userData;
    if (roomId && videoCallRooms.has(roomId)) {
      const room = videoCallRooms.get(roomId);
      room.delete(socket.id);

      // Notify others in the room
      socket.to(roomId).emit('user-left', {
        userId: socket.id,
      });

      console.log(`[VideoCall] ${socket.id} left room ${roomId}. ${room.size} participants remaining`);

      // Clean up empty rooms
      if (room.size === 0) {
        videoCallRooms.delete(roomId);
        console.log(`[VideoCall] Room ${roomId} deleted (empty)`);
      }
    }

    // Clean up user data
    socketUserData.delete(socket.id);
  }
}

// API Routes

// Auth: login existing user (admin or member)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = dataStore.users || [];
    const user = users.find(u => u.email === email);

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    // Do not expose password hash to client
    const { password: _password, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Auth: register new member user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, profilePicture } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const users = dataStore.users || [];
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 8);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role: 'member',
      profilePicture,
      createdAt: new Date().toISOString()
    };

    dataStore.users = users.concat(newUser);
    await saveData();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    const { password: _password, ...safeUser } = newUser;

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Sync endpoint - receive updates from clients
app.post('/api/sync/push', verifyToken, async (req, res) => {
  try {
    const syncData = req.body;
    const { type, action, data } = syncData;

    console.log(`[Server] Received sync update: ${type} ${action}`);

    // Validate data type
    if (!type || !dataStore.hasOwnProperty(type)) {
      return res.status(400).json({ error: `Invalid data type: ${type}` });
    }

    // Process based on action
    if (action === 'add') {
      // Add new item
      if (!Array.isArray(dataStore[type])) {
        return res.status(400).json({ error: `${type} is not an array` });
      }
      dataStore[type].unshift(data);
      console.log(`[Server] ✅ Added ${type}: ${data.id}`);
    } else if (action === 'update') {
      // Update existing item
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type][index] = data;
          console.log(`[Server] ✅ Updated ${type}: ${data.id}`);
        } else {
          console.warn(`[Server] Item not found for update: ${type} ${data.id}`);
        }
      }
    } else if (action === 'delete') {
      // Delete item
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type].splice(index, 1);
          console.log(`[Server] ✅ Deleted ${type}: ${data.id}`);
        }
      }
    }

    // Save to file
    await saveData();

    // Broadcast update to all connected clients
    broadcastUpdate(syncData);

    res.json({ success: true, message: `${action} ${type} completed` });
  } catch (error) {
    console.error('[Server] Error processing sync update:', error);
    res.status(500).json({ error: 'Failed to process sync update', details: error.message });
  }
});

app.get('/api/sync/data', (req, res) => {
  console.log('[Server] Fetching all data for sync');
  res.json(dataStore);
});

app.get('/api/sermons', (req, res) => {
  console.log('[Server] Fetching all sermons');
  res.json(dataStore.sermons || []);
});

// Create sermon endpoint
app.post('/api/sermons', verifyAdmin, async (req, res) => {
  try {
    console.log('[Server] Creating sermon:', req.body);
    
    const { title, pastor, scripture, videoUrl } = req.body;
    
    // Create new sermon
    const newSermon = {
      id: Date.now().toString(),
      title,
      pastor,
      scripture: scripture || '',
      date: new Date().toISOString().split('T')[0],
      videoUrl,
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString()
    };
    
    // Add to sermons array
    dataStore.sermons.unshift(newSermon);
    
    // Save to file
    await saveData();
    
    // Broadcast update
    broadcastUpdate({ type: 'sermons', action: 'add', data: newSermon });
    
    console.log('[Server] ✅ Sermon created:', newSermon.id);
    res.json({ success: true, sermon: newSermon });
  } catch (error) {
    console.error('[Server] Error creating sermon:', error);
    res.status(500).json({ error: 'Failed to create sermon', details: error.message });
  }
});

app.get('/api/announcements', (req, res) => {
  console.log('[Server] Fetching all announcements');
  res.json(dataStore.announcements || []);
});

app.get('/api/events', (req, res) => {
  console.log('[Server] Fetching all events');
  res.json(dataStore.events || []);
});

app.get('/api/site-content', (req, res) => {
  console.log('[Server] Fetching site content');
  res.json(dataStore.siteContent || {});
});

app.get('/api/prayer-requests', (req, res) => {
  console.log('[Server] Fetching all prayer requests');
  res.json(dataStore.prayerRequests || []);
});

app.get('/api/bible-studies', (req, res) => {
  console.log('[Server] Fetching all bible studies');
  res.json(dataStore.bibleStudies || []);
});

app.get('/api/chat-messages', (req, res) => {
  console.log('[Server] Fetching all chat messages');
  res.json(dataStore.chatMessages || []);
});

app.get('/api/community-posts', (req, res) => {
  console.log('[Server] Fetching all community posts');
  res.json(dataStore.posts || []);
});

app.get('/api/community-comments', (req, res) => {
  console.log('[Server] Fetching all community comments');
  res.json(dataStore.comments || []);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: connectedClients.size,
    timestamp: Date.now()
  });
});

// App version endpoint - for update notifications
app.get('/api/app-version', (req, res) => {
  res.json({
    version: '2.1.0', // UPDATE THIS when you release new version
    downloadUrl: 'https://your-lime-link-here.com', // Replace with actual download link
    releaseNotes: `✅ JWT authentication enabled\n✅ Socket.io real-time sync\n✅ Health checks working`,
    forceUpdate: false // Set to true if old versions shouldn't work
  });
});

// Start server
(async () => {
  try {
    // Start server immediately
    server.listen(PORT, () => {
      console.timeEnd('[Server] Startup');
      console.log(`[Server] Server running on port ${PORT}`);
      console.log(`[Server] Socket.io endpoint: http://localhost:${PORT}`);
      
      // Initialize data and create admin user in background
      initializeData()
        .then(() => ensureAdminUser())
        .catch(err => {
          console.error('[Server] Background initialization error:', err);
        });
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
})();