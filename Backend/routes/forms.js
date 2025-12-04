const router = require('express').Router();
const db = require('../db');
const fetch = require('node-fetch');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api/v10';
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN; 
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID ;
const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID ; 

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
        await db.query(`CREATE TABLE IF NOT EXISTS form_settings (form_name VARCHAR(50) PRIMARY KEY, is_open BOOLEAN DEFAULT true)`);
        await db.query(`INSERT IGNORE INTO form_settings (form_name, is_open) VALUES ('whitelist', 1), ('pd', 1), ('ems', 1), ('staff', 1)`);
        await db.query(`CREATE TABLE IF NOT EXISTS pd_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), character_name VARCHAR(255), irl_name VARCHAR(255), irl_age INT, experience TEXT, reason TEXT, scenario_cop TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS ems_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), character_name VARCHAR(255), irl_name VARCHAR(255), irl_age INT, medical_knowledge TEXT, scenarios TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await db.query(`CREATE TABLE IF NOT EXISTS staff_applications (id INT AUTO_INCREMENT PRIMARY KEY, discord_id VARCHAR(255), irl_age INT, experience TEXT, weekly_hours VARCHAR(50), responsibilities TEXT, definitions TEXT, scenarios TEXT, status VARCHAR(50) DEFAULT 'pending', submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    } catch (e) { console.error("DB Init Error:", e); }
};
initializeTables();

const QUIZ_POOL = [
    { q: "What does 'NVL' mean?", a: "Not fearing for your life in a dangerous situation", wrong: ["Not Valuing Loot", "New Vehicle License"] },
    { q: "You are held at gunpoint. What do you do?", a: "Comply with demands to save my life", wrong: ["Pull out my own gun", "Run away", "Call the police on radio"] },
    // ... (Add full questions here)
];

router.get('/quiz', isAuthenticated, (req, res) => {
    const shuffled = QUIZ_POOL.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, 15).map(q => ({ question: q.q, options: [q.a, ...q.wrong].sort(() => 0.5 - Math.random()) })));
});

router.post('/submit/whitelist', isAuthenticated, async (req, res) => {
    const { answers } = req.body; 
    const isAdmin = req.user.isAdmin || req.user.isStaff;

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

router.post('/submit/pd', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    const { irlName, irlAge, icName, experience, whyJoin, scenario } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM pd_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending PD application." });
    }

    await db.query("INSERT INTO pd_applications (discord_id, character_name, irl_name, irl_age, experience, reason, scenario_cop, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, experience, whyJoin, scenario]);
    res.json({ success: true, message: "PD Application Submitted!" });
});

router.post('/submit/ems', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    const { icName, irlName, irlAge, medicalKnowledge, scenarios } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM ems_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending EMS application." });
    }

    await db.query("INSERT INTO ems_applications (discord_id, character_name, irl_name, irl_age, medical_knowledge, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, medicalKnowledge, scenarios]);
    res.json({ success: true, message: "EMS Application Submitted!" });
});

router.post('/submit/staff', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    const { age, experience, hours, responsibilities, definitions, scenarios } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM staff_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending Staff application." });
    }

     await db.query("INSERT INTO staff_applications (discord_id, irl_age, experience, weekly_hours, responsibilities, definitions, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, age, experience, hours, responsibilities, definitions, scenarios]);
    res.json({ success: true, message: "Staff Application Submitted!" });
});

module.exports = router;