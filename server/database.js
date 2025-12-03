// PostgreSQL database layer for persistent storage
const { Pool } = require('pg');
const useFirebase = String(process.env.USE_FIREBASE_DB || '').toLowerCase() === 'true' || process.env.USE_FIREBASE_DB === '1';
let admin;
let firestore;
let firebaseInitialized = false;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  if (useFirebase) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
      if (!projectId || !clientEmail || !privateKeyRaw) {
        console.warn('[Database] USE_FIREBASE_DB is set but Firebase env vars are missing');
        return false;
      }
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      admin = require('firebase-admin');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firestore = admin.firestore();
      firebaseInitialized = true;
      console.log('[Database] ✅ Firebase Firestore initialized');
      // Ensure collection/doc existence lazily on writes; just return true here
      return true;
    } catch (err) {
      console.error('[Database] ❌ Failed to initialize Firebase:', err.message || err);
      return false;
    }
  }

  if (!process.env.DATABASE_URL) {
    console.log('[Database] No DATABASE_URL found, using data.json fallback');
    return false;
  }

  try {
    const client = await pool.connect();
    
    // Create data table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize default data if empty
    const result = await client.query('SELECT COUNT(*) FROM app_data');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('[Database] Initializing default data...');
      
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

      for (const [key, value] of Object.entries(defaultData)) {
        await client.query(
          'INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
          [key, JSON.stringify(value)]
        );
      }
    }

    client.release();
    console.log('[Database] ✅ PostgreSQL connected and initialized');
    return true;
  } catch (error) {
    console.error('[Database] ❌ Connection failed:', error.message);
    console.log('[Database] Falling back to data.json');
    return false;
  }
}

// Get data from database
async function getData(key) {
  try {
    if (useFirebase && firebaseInitialized && firestore) {
      const doc = await firestore.collection('app_data').doc(key).get();
      if (!doc.exists) return [];
      const data = doc.data();
      return data && data.value !== undefined ? data.value : [];
    }

    const result = await pool.query('SELECT value FROM app_data WHERE key = $1', [key]);
    if (result.rows.length > 0) {
      return JSON.parse(result.rows[0].value);
    }
    return [];
  } catch (error) {
    console.error(`[Database] Error getting ${key}:`, error.message);
    return [];
  }
}

// Set data in database
async function setData(key, value) {
  try {
    if (useFirebase && firebaseInitialized && firestore) {
      await firestore.collection('app_data').doc(key).set({
        value,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      return true;
    }

    await pool.query(
      `INSERT INTO app_data (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value)]
    );
    return true;
  } catch (error) {
    console.error(`[Database] Error setting ${key}:`, error.message);
    return false;
  }
}

// Get all data
async function getAllData() {
  try {
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

    if (useFirebase && firebaseInitialized && firestore) {
      const snap = await firestore.collection('app_data').get();
      const data = { ...defaultData };
      snap.forEach(doc => {
        const d = doc.data();
        data[doc.id] = d && d.value !== undefined ? d.value : d;
      });
      return data;
    }

    const result = await pool.query('SELECT key, value FROM app_data');
    const data = { ...defaultData };
    result.rows.forEach(row => {
      try {
        data[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      } catch (e) {
        console.error(`[Database] Error parsing ${row.key}:`, e.message);
        data[row.key] = [];
      }
    });
    return data;
  } catch (error) {
    console.error('[Database] Error getting all data:', error.message);
    return {
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

// Close database connection
async function closeDatabase() {
  if (useFirebase && firebaseInitialized) {
    console.log('[Database] Firebase connection closed');
    return;
  }
  await pool.end();
  console.log('[Database] Connection closed');
}

function getStorageName() {
  if (useFirebase && firebaseInitialized) return 'Firebase Firestore';
  if (process.env.DATABASE_URL) return 'PostgreSQL';
  return 'File storage';
}

module.exports = {
  initDatabase,
  getData,
  setData,
  getAllData,
  closeDatabase,
  isConnected: () => (useFirebase && firebaseInitialized) || !!process.env.DATABASE_URL,
  getStorageName
};
