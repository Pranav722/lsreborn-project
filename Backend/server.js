const express = require('express');
const cors = require('cors');
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

// This tells Express to trust the first proxy in front of it (important for hosting)
app.set('trust proxy', 1);

// Session Setup
// This creates a cookie that keeps the user logged in
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Crucial for cross-site cookies
        maxAge: 1000 * 60 * 60 * 24 // Cookie lasts for 1 day
    }
}));

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