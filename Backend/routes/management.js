const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// Middleware for PD High Command (PDLead or Admin)
const isPDLead = (req, res, next) => {
    if (req.user.isPDLead || req.user.isAdmin) return next();
    res.status(403).json({ message: "PD High Command Access Required" });
};

// Middleware for EMS High Command (EMSLead or Admin)
const isEMSLead = (req, res, next) => {
    if (req.user.isEMSLead || req.user.isAdmin) return next();
    res.status(403).json({ message: "EMS High Command Access Required" });
};

// Middleware for Staff (Admin/Staff role, not just Admin)
const isStaff = (req, res, next) => {
    if (req.user.isStaff || req.user.isAdmin) return next();
    res.status(403).json({ message: "Staff Access Required" });
};

// Middleware for Admin (Admin Only)
const isAdmin = (req, res, next) => {
    if (req.user.isAdmin) return next();
    res.status(403).json({ message: "Admin Only Access Required" });
};


// Get Forms Status (Staff/Admin can view)
router.get('/settings', isAuthenticated, isStaff, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM form_settings");
    res.json(rows);
});

// Toggle Form Status (Admin Only)
router.post('/settings/toggle', isAuthenticated, isAdmin, async (req, res) => {
    const { formName, isOpen } = req.body;
    try {
        await db.query("UPDATE form_settings SET is_open = ? WHERE form_name = ?", [isOpen, formName]);
        res.json({ success: true, message: `Form ${formName} status updated to ${isOpen ? 'OPEN' : 'CLOSED'}` });
    } catch(e) {
        console.error("Error toggling form:", e);
        res.status(500).json({ success: false, message: "Database Error on toggle." });
    }
});

// Switch Whitelist Type (Quiz/Form) (Admin Only)
router.post('/settings/whitelist/switch', isAuthenticated, isAdmin, async (req, res) => {
    const { type } = req.body; // 'quiz' or 'form'
    if (type !== 'quiz' && type !== 'form') {
        return res.status(400).json({ message: "Invalid type specified." });
    }
    try {
        await db.query("UPDATE form_settings SET type = ? WHERE form_name = 'whitelist'", [type]);
        res.json({ success: true, message: `Whitelist type switched to ${type.toUpperCase()}` });
    } catch(e) {
         console.error("Error switching whitelist type:", e);
        res.status(500).json({ success: false, message: "Database Error on switch." });
    }
});


// --- APPLICATION MANAGEMENT ENDPOINTS (Admin/Leads) ---

// PD Management
router.get('/pd', isAuthenticated, isPDLead, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM pd_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/pd/:id', isAuthenticated, isPDLead, async (req, res) => {
    const { status, reason } = req.body;
    await db.query("UPDATE pd_applications SET status = ?, reason = ? WHERE id = ?", [status, reason || null, req.params.id]);
    res.json({ success: true });
});

// EMS Management
router.get('/ems', isAuthenticated, isEMSLead, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM ems_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/ems/:id', isAuthenticated, isEMSLead, async (req, res) => {
    const { status, reason } = req.body;
    await db.query("UPDATE ems_applications SET status = ?, reason = ? WHERE id = ?", [status, reason || null, req.params.id]);
    res.json({ success: true });
});

// Staff Management (Admin Only)
router.get('/staff', isAuthenticated, isAdmin, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM staff_applications ORDER BY submitted_at DESC");
    res.json(rows);
});

router.put('/staff/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { status, reason } = req.body;
    await db.query("UPDATE staff_applications SET status = ?, reason = ? WHERE id = ?", [status, reason || null, req.params.id]);
    res.json({ success: true });
});

module.exports = router;