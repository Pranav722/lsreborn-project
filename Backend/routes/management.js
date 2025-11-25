const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// Middleware for PD High Command
const isPDLead = (req, res, next) => {
    if (req.user.isPDLead || req.user.isAdmin) return next();
    res.status(403).json({ message: "PD High Command Access Required" });
};

// Middleware for EMS High Command
const isEMSLead = (req, res, next) => {
    if (req.user.isEMSLead || req.user.isAdmin) return next();
    res.status(403).json({ message: "EMS High Command Access Required" });
};

// Get Forms Status
router.get('/settings', isAuthenticated, async (req, res) => {
    if (!req.user.isStaff) return res.status(403).json({ message: "Forbidden" });
    const [rows] = await db.query("SELECT * FROM form_settings");
    res.json(rows);
});

// Toggle Form Status (Admin Only)
router.post('/settings/toggle', isAuthenticated, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin Only" });
    const { formName, isOpen } = req.body;
    await db.query("UPDATE form_settings SET is_open = ? WHERE form_name = ?", [isOpen, formName]);
    res.json({ success: true });
});

// --- PD MANAGEMENT ---
router.get('/pd', isAuthenticated, isPDLead, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM pd_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/pd/:id', isAuthenticated, isPDLead, async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    await db.query("UPDATE pd_applications SET status = ? WHERE id = ?", [status, req.params.id]);
    // Note: In a real production app, trigger a Discord Webhook here manually or let the bot watch this table too.
    res.json({ success: true });
});

// --- EMS MANAGEMENT ---
router.get('/ems', isAuthenticated, isEMSLead, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM ems_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/ems/:id', isAuthenticated, isEMSLead, async (req, res) => {
    const { status } = req.body;
    await db.query("UPDATE ems_applications SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
});

// --- STAFF MANAGEMENT (Admin Only) ---
router.get('/staff', isAuthenticated, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin Only" });
    const [rows] = await db.query("SELECT * FROM staff_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/staff/:id', isAuthenticated, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin Only" });
    const { status } = req.body;
    await db.query("UPDATE staff_applications SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
});

module.exports = router;