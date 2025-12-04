const router = require('express').Router();
const db = require('../db');
const fetch = require('node-fetch');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api/v10';
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN; 
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || "1322660458888695818";
const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID || "1322674155107127458"; 

async function addDiscordRole(userId, roleId) {
    try {
        if (!ACTIVE_BOT_TOKEN) return console.error("Missing ACTIVE_BOT_TOKEN env var");
        await fetch(`${DISCORD_API_URL}/guilds/${ACTIVE_GUILD_ID}/members/${userId}/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${ACTIVE_BOT_TOKEN}` }
        });
    } catch (e) {
        console.error("Failed to add role:", e);
    }
}

const initializeTables = async () => {
    try {
        console.log("Checking database tables...");
        
        // 1. CREATE form_settings table (with 'type' column)
        await db.query(`
            CREATE TABLE IF NOT EXISTS form_settings (
                form_name VARCHAR(50) PRIMARY KEY, 
                is_open BOOLEAN DEFAULT true, 
                type VARCHAR(10) DEFAULT 'quiz'
            )
        `);
        
        // 2. ALTER TABLE: Add 'type' column if it was missing (Fixing the crash)
        try {
             await db.query(`ALTER TABLE form_settings ADD COLUMN type VARCHAR(10) DEFAULT 'quiz'`);
             console.log("Added 'type' column to form_settings.");
        } catch (e) {
            // ER_DUP_FIELDNAME means column already exists, which is fine.
            if (e.code !== 'ER_DUP_FIELDNAME') {
                 console.warn("ALTER TABLE warning:", e.sqlMessage);
            }
        }

        await db.query(`INSERT IGNORE INTO form_settings (form_name, is_open, type) VALUES 
            ('whitelist', 1, 'quiz'), ('pd', 1, 'form'), ('ems', 1, 'form'), ('staff', 1, 'form')`);
        await db.query(`CREATE TABLE IF NOT EXISTS pd_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), character_name VARCHAR(255), irl_name VARCHAR(255), irl_age INT, experience TEXT, reason TEXT, scenario_cop TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS ems_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), character_name VARCHAR(255), irl_name VARCHAR(255), irl_age INT, medical_knowledge TEXT, scenarios TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS staff_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), irl_age INT, experience TEXT, weekly_hours VARCHAR(50), responsibilities TEXT, definitions TEXT, scenarios TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    } catch (e) { console.error("DB Init Error:", e); }
};
initializeTables();

router.get('/whitelist/status', isAuthenticated, async (req, res) => {
    const [settings] = await db.query("SELECT is_open, type FROM form_settings WHERE form_name = 'whitelist'");
    res.json(settings[0]);
});

// ... (QUIZ_POOL remains the same) ...

router.post('/submit/whitelist', isAuthenticated, async (req, res) => {
    const { answers } = req.body; 
    let settings;
    try { [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'whitelist'"); } 
    catch (err) { await initializeTables(); [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'whitelist'"); }
    
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    if (settings && settings[0] && !settings[0].is_open && !isAdmin) {
        return res.status(403).json({ message: "Whitelist applications are currently closed." });
    }

    const { roles } = req.user;
    const hasAccess = roles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID) || roles.includes(process.env.APPLICATION_ROLE_ID) || isAdmin;
    if (!hasAccess) return res.status(403).json({ message: "Missing Application Pass." });

    let score = 0;
    answers.forEach(ans => {
        const correctQ = QUIZ_POOL.find(q => q.q === ans.question);
        if (correctQ && correctQ.a === ans.answer) score++;
    });

    const passed = score >= 12;
    const total = 15;

    if (passed) {
        await addDiscordRole(req.user.id, WHITELISTED_ROLE_ID);
        await db.query("INSERT INTO applications (discordId, characterName, characterAge, backstory, status, notified) VALUES (?, 'Quiz User', 0, 'Passed Whitelist Quiz', 'approved', 1)", [req.user.id]);
        return res.json({ passed: true, score, total, message: "Congratulations! You have been automatically whitelisted." });
    } else {
        if (!isAdmin) {
            const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db.query("INSERT INTO discord_users (discord_id, cooldown_expiry) VALUES (?, ?) ON DUPLICATE KEY UPDATE cooldown_expiry = ?", [req.user.id, expiryTime, expiryTime]);
        }
        return res.json({ passed: false, score, total, message: "You did not pass. Please review the rules." });
    }
});

// PD Submission Logic
router.post('/submit/pd', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    let settings;
    try { [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'pd'"); }
    catch (err) { await initializeTables(); [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'pd'"); }

    if (settings && settings[0] && !settings[0].is_open && !isAdmin) {
        return res.status(403).json({ message: "PD applications are closed." });
    }

    const { irlName, irlAge, icName, experience, whyJoin, scenario } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM pd_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending PD application." });
    }

    await db.query("INSERT INTO pd_applications (discord_id, character_name, irl_name, irl_age, experience, reason, scenario_cop, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, experience, whyJoin, scenario]);
    res.json({ success: true, message: "PD Application Submitted!" });
});

// EMS Submission Logic
router.post('/submit/ems', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    let settings;
    try { [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'ems'"); }
    catch (err) { await initializeTables(); [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'ems'"); }

    if (settings && settings[0] && !settings[0].is_open && !isAdmin) {
        return res.status(403).json({ message: "EMS applications are closed." });
    }

    const { icName, irlName, irlAge, medicalKnowledge, scenarios } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM ems_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending EMS application." });
    }

    try {
        await db.query(
            "INSERT INTO ems_applications (discord_id, character_name, irl_name, irl_age, medical_knowledge, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
            [req.user.id, icName, irlName, irlAge, medicalKnowledge, scenarios]
        );
        res.json({ success: true, message: "EMS Application Submitted!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server Error" });
    }
});

// Submit Staff Application
router.post('/submit/staff', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    let settings;
    try {
        [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'");
    } catch (err) { await initializeTables(); [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'"); }

    if (settings && settings[0] && !settings[0].is_open && !isAdmin) {
        return res.status(403).json({ message: "Staff applications are closed." });
    }

    const { age, experience, hours, responsibilities, definitions, scenarios } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM staff_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending Staff application." });
    }

     try {
        await db.query(
            "INSERT INTO staff_applications (discord_id, irl_age, experience, weekly_hours, responsibilities, definitions, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
            [req.user.id, age, experience, hours, responsibilities, definitions, scenarios]
        );
        res.json({ success: true, message: "Staff Application Submitted!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;