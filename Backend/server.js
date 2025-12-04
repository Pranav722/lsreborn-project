const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Trust the proxy (essential for Render)
app.set('trust proxy', 1);

// CORS Configuration to allow requests from your live frontend
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Middleware to parse JSON bodies and cookies
app.use(express.json());
app.use(cookieParser());


// --- API Routes ---
app.use('/auth', require('./routes/auth'));
app.use('/api/forms', require('./routes/forms')); // New Forms & Quiz Route
app.use('/api/management', require('./routes/management')); // New Management Dashboard
app.use('/api/queue', require('./routes/queue'));
app.use('/api/status', require('./routes/status'));
app.use('/api/applications', require('./routes/applications')); // Written Applications

// --- Root and DB Test Routes ---
app.get('/', (req, res) => {
    res.send('LSReborn Backend (JWT Edition) is running!');
});

const db = require('./db'); // Import the database connection
app.get('/db-test', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ message: 'Database connection successful!' });
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({ message: 'Database connection failed.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});