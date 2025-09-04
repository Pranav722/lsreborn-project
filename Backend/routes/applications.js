const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// Middleware to check if the user is staff or admin
const isStaff = (req, res, next) => {
    if (req.user && (req.user.isStaff || req.user.isAdmin)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Staff access required' });
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
};


// GET all applications (for staff/admin)
router.get('/', isAuthenticated, isStaff, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT *, (isPremium = 1) AS isPremium FROM applications ORDER BY isPremium DESC, submittedAt DESC');
        res.json(rows);
    } catch (err) {
        console.error("Error fetching applications:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new application
router.post('/', isAuthenticated, async (req, res) => {
    const { characterName, characterAge, backstory } = req.body;
    
    // Basic validation on the backend for security
    if (!characterName || !characterAge || !backstory) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const wordCount = backstory.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 200) {
        return res.status(400).json({ message: "Backstory must be at least 200 words." });
    }

    const discordId = req.user.id;
    const userRoles = req.user.roles || [];
    
    // Check if the user has a premium applicant role
    const isPremium = userRoles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID);

    try {
        const query = 'INSERT INTO applications (discordId, characterName, characterAge, backstory, isPremium, status, notified) VALUES (?, ?, ?, ?, ?, ?, ?)';
        // Set status to pending and notified to 0 so the bot can process it
        await db.query(query, [discordId, characterName, characterAge, backstory, isPremium, 'pending', 0]); 
        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        console.error("Error submitting application:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT to update an application's status (approve/reject)
router.put('/:id', isAuthenticated, isStaff, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
        const query = 'UPDATE applications SET status = ?, reason = ?, notified = 0 WHERE id = ?';
        const [result] = await db.query(query, [status, reason || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json({ message: 'Application status updated successfully' });
    } catch (err) {
        console.error("Error updating application:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;