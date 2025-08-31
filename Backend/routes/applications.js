const router = require('express').Router();
const db = require('../db');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// Middleware to check if the user has Staff or Admin roles
const isStaff = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.isStaff || req.user.isAdmin)) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden: Staff access required' });
};

// Middleware to check if the user has Admin role
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden: Admin access required' });
};


router.get('/', isStaff, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM applications ORDER BY isPremium DESC, submittedAt DESC');
        res.json(rows);
    } catch (err) {
        console.error("Error fetching applications:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    const { characterName, characterAge, backstory } = req.body;
    const discordId = req.user.id;
    const userRoles = req.user.roles || [];

    // Check if the user has the premium applicant role
    const isPremium = userRoles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID);

    try {
        const query = 'INSERT INTO applications (discordId, characterName, characterAge, backstory, isPremium) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [discordId, characterName, characterAge, backstory, isPremium]);
        res.status(201).json({ message: 'Application submitted' });
    } catch (err) {
        console.error("Error submitting application:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/:id', isStaff, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
        const query = 'UPDATE applications SET status = ?, reason = ?, notified = 0 WHERE id = ?';
        const [result] = await db.query(query, [status, reason, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json({ message: 'Application status updated' });
    } catch (err) {
        console.error("Error updating application status:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;