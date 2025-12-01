// PostgreSQL database layer for persistent storage
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
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
        users: []
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
    const result = await pool.query('SELECT key, value FROM app_data');
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
    
    const data = { ...defaultData };
    
    result.rows.forEach(row => {
      try {
        // value is already JSONB, no need to parse if it's an object
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
      users: []
    };
  }
}

// Close database connection
async function closeDatabase() {
  await pool.end();
  console.log('[Database] Connection closed');
}

module.exports = {
  initDatabase,
  getData,
  setData,
  getAllData,
  closeDatabase,
  isConnected: () => !!process.env.DATABASE_URL
};
