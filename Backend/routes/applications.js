const router = require('express').Router();
const db = require('../db');
require('dotenv').config();

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

const isStaff = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isStaff) return next();
    res.status(403).json({ message: 'Forbidden: Staff access required' });
};

// GET all applications (for staff)
router.get('/', isStaff, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM applications ORDER BY isPremium DESC, submittedAt ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new application
router.post('/', isAuthenticated, async (req, res) => {
    const { characterName, characterAge, backstory, discord } = req.body;
    const discordId = req.user.id;
    const isPremium = req.user.roles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID);

    try {
        const query = 'INSERT INTO applications (discordId, characterName, characterAge, backstory, isPremium) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [discordId, characterName, characterAge, backstory, isPremium]);
        res.status(201).json({ message: 'Application submitted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT to update an application status (approve/reject)
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
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;