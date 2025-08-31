// File: backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const FileStore = require('session-file-store')(session); // Import the new session store
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the proxy (essential for Render)
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

// --- UPDATED SESSION SETUP ---
// We are now using a file-based store for stability
app.use(session({
    store: new FileStore({
        path: './sessions', // This will create a 'sessions' folder to store login data
        logFn: function() {} // Disables verbose logging
    }),
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