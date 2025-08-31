// File: backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const db = require('./db'); // Ensure db is imported
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CRUCIAL FIXES FOR LIVE DEPLOYMENT ---

// 1. Trust the proxy: Render sits behind a proxy. This is essential for secure cookies.
app.set('trust proxy', 1);

// 2. CORS Configuration: This tells your backend to trust your frontend.
app.use(cors({
    origin: process.env.FRONTEND_URL, // This MUST be your Netlify URL (e.g., https://lsreborn-project.netlify.app)
    credentials: true // This allows the browser to send the login cookie
}));

// --- END OF FIXES ---

app.use(express.json());

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // MUST be true for cross-site cookies to work (HTTPS)
        httpOnly: true,
        sameSite: 'none', // This is the key setting that allows the cookie to be sent across domains
        maxAge: 1000 * 60 * 60 * 24 // Cookie lasts for 1 day
    }
}));

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

