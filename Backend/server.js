const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL, // Allow requests from your React app
    credentials: true
}));
app.use(express.json());
// This tells Express to trust the information from Render's proxy
app.set('trust proxy', 1);

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // MUST be true for cross-site cookies
        httpOnly: true,
        sameSite: 'none', // This is the magic setting that allows the cookie to be sent
        maxAge: 1000 * 60 * 60 * 24 // Cookie lasts for 1 day
    }
}));

// ... (the rest of your server.js file) ...

// Passport Middleware (for authentication)
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