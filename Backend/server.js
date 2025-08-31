const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const db = require('./db');
require('dotenv').config();

// --- MODERN IMPORTS FOR REDIS v4 and connect-redis v7 ---
const { createClient } = require('redis');
// This is the correct syntax for modern versions of connect-redis
const RedisStore = require("connect-redis").default;
// --- END MODERN IMPORTS ---


const app = express();
const PORT = process.env.PORT || 3001;

// --- MODERN UPSTASH REDIS CLIENT SETUP ---
// Initialize client.
const redisClient = createClient({
    url: process.env.UPSTASH_REDIS_URL
});
redisClient.connect().catch(console.error);

redisClient.on('connect', () => console.log('Connected to Upstash Redis successfully!'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Initialize store.
const redisStore = new RedisStore({
    client: redisClient,
    prefix: "lsreborn:",
});
// --- END MODERN SETUP ---


// Trust the proxy (essential for Render)
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

// --- UPDATED SESSION SETUP ---
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