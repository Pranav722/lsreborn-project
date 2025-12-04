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

// POST submit application
router.post('/', isAuthenticated, async (req, res) => {
    const { characterName, characterAge, backstory, irlName, irlAge, questions } = req.body;
    const discordId = req.user.id;
    const isPremium = req.user && req.user.roles && req.user.roles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID);

    if (!characterName || !characterAge || !backstory || !irlName || !irlAge) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Word count validation
    const wordCount = backstory.trim().split(/\s+/).length;
    if (wordCount < 200) {
        return res.status(400).json({ message: `Backstory is too short (${wordCount}/200 words).` });
    }

    try {
        // Check for existing pending application
        const [existing] = await db.query('SELECT id FROM applications WHERE discordId = ? AND status = "pending"', [discordId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "You already have a pending application." });
        }

        const query = 'INSERT INTO applications (discordId, characterName, characterAge, backstory, irlName, irlAge, questions, isPremium, status, notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await db.query(query, [discordId, characterName, characterAge, backstory, irlName, irlAge, JSON.stringify(questions), isPremium, 'pending', 0]);

        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (err) {
        console.error("Error submitting application:", err);
        res.status(500).json({ message: "Database error." });
    }
});

// PUT update application status
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