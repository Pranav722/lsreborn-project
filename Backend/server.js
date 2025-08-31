// File: backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session'); // Moved up to be available for RedisStore
const passport = require('passport');
const db = require('./db');
require('dotenv').config();

// --- NEW IMPORTS FOR REDIS SESSION STORE ---
const redis = require('redis');
// This is the corrected import pattern for connect-redis v6
const RedisStore = require('connect-redis')(session); 
// --- END NEW IMPORTS ---


const app = express();
const PORT = process.env.PORT || 3001;

// --- UPSTASH REDIS CLIENT SETUP ---
// Initialize client.
const redisClient = redis.createClient({
    url: process.env.UPSTASH_REDIS_URL // This now comes from your Upstash .env variable on Render
});
redisClient.connect().catch(console.error);

redisClient.on('connect', () => console.log('Connected to Upstash Redis successfully!'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Initialize store.
const redisStore = new RedisStore({
    client: redisClient,
    prefix: "lsreborn:", // Optional prefix for session keys
});
// --- END UPSTASH SETUP ---


// Trust the proxy (essential for Render)
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

// --- UPDATED SESSION SETUP ---
// We are now using the stable Redis store from Upstash
app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));
// --- END OF UPDATE ---


// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/status', require('./routes/status'));

app.get('/', (req, res) => {
    res.send('LSReborn Backend is running!');
});

// Test DB connection
app.get('/db-test', async (req, res) => {
    try {
        const [results] = await db.query('SELECT 1');
        res.json({ message: 'Database connection successful!', results });
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({ message: 'Database connection failed.', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});