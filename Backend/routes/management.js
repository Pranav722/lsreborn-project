const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const fetch = require('node-fetch');

const DISCORD_API_URL = 'https://discord.com/api/v10';
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || "1322660458888695818";
const MASTER_ADMIN_ID = "444043711094194200";

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
const isAdmin = async (req, res, next) => {
    if (req.user.isAdmin) return next();

    // Fallback: Check Discord directly in case JWT is stale
    try {
        const response = await fetch(`${DISCORD_API_URL}/guilds/${ACTIVE_GUILD_ID}/members/${req.user.id}`, {
            headers: { 'Authorization': `Bot ${process.env.ACTIVE_BOT_TOKEN}` }
        });

        if (response.ok) {
            const member = await response.json();
            const roles = member.roles || [];
            // Check if user has the Admin role (if env var is set) or is Master Admin
            const adminRole = process.env.LSR_ADMIN_ROLE_ID;
            const isRealAdmin = (adminRole && roles.includes(adminRole)) || req.user.id === MASTER_ADMIN_ID;

            if (isRealAdmin) {
                req.user.isAdmin = true; // Update req.user for subsequent handlers
                return next();
            }
        }
    } catch (e) {
        console.error("Admin check fallback failed:", e);
    }

    res.status(403).json({ message: "Admin Only Access Required" });
};


// Get Forms Status (Staff/Admin can view)
router.get('/settings', isAuthenticated, isStaff, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM form_settings");
    res.json(rows);
});

// Toggle Form Status (Admin or Department Lead)
router.post('/settings/toggle', isAuthenticated, async (req, res) => {
    const { formName, isOpen } = req.body;

    // Permission Check
    const isAdmin = req.user.isAdmin;
    const isPDLead = req.user.isPDLead;
    const isEMSLead = req.user.isEMSLead;

    const canToggle = isAdmin ||
        (formName === 'pd' && isPDLead) ||
        (formName === 'ems' && isEMSLead);

    if (!canToggle) {
        return res.status(403).json({ message: "Insufficient permissions to toggle this form." });
    }

    try {
        await db.query("UPDATE form_settings SET is_open = ? WHERE form_name = ?", [isOpen, formName]);
        res.json({ success: true, message: `Form ${formName} status updated to ${isOpen ? 'OPEN' : 'CLOSED'}` });
    } catch (e) {
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
    } catch (e) {
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