const router = require('express').Router();
const db = require('../db');
const fetch = require('node-fetch');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

// --- CONFIG FOR AUTO-WHITELIST ---
const DISCORD_API_URL = 'https://discord.com/api/v10';
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN; 
const ACTIVE_GUILD_ID = process.env.GUILD_ID ;
const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID ; 
// Helper to Add Role
async function addDiscordRole(userId, roleId) {
    try {
        await fetch(`${DISCORD_API_URL}/guilds/${ACTIVE_GUILD_ID}/members/${userId}/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${ACTIVE_BOT_TOKEN}` }
        });
    } catch (e) {
        console.error("Failed to add role:", e);
    }
}

// ... (initializeTables function remains same as previous) ...
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
    { q: "What does 'NVL' (No Value of Life) mean?", a: "Not fearing for your life in a dangerous situation", wrong: ["Not Valuing Loot", "New Vehicle License", "No Valid License"] },
    { q: "You are held at gunpoint. What do you do?", a: "Comply with demands to save my life", wrong: ["Pull out my own gun", "Run away", "Call the police on radio"] },
    { q: "What is 'Metagaming'?", a: "Using OOC info in IC", wrong: ["Playing the game efficiently", "Using glitches", "Playing with friends"] },
    { q: "What is 'RDM'?", a: "Random Death Match", wrong: ["Real Drift Mode", "Rapid Deployment Method", "Roleplay Death Mode"] },
    { q: "What is 'VDM'?", a: "Vehicle Death Match", wrong: ["Virtual Death Match", "Vehicle Drift Mode", "Visual Damage Mod"] },
    { q: "Can you remember your past life (after respawning)?", a: "No, that is New Life Rule (NLR)", wrong: ["Yes, revenge is allowed", "Only if I want to", "Yes, but only specific details"] },
    { q: "You crash your car at 120mph. What do you do?", a: "Roleplay injuries and call EMS", wrong: ["Drive away immediately", "Fix it and go", "Ignore it"] },
    { q: "Is OOC toxicity allowed?", a: "Never", wrong: ["Sometimes", "If they started it", "Only in text chat"] },
    { q: "What is 'Powergaming'?", a: "Forcing RP on others without chance", wrong: ["Being powerful in game", "Having lots of money", "Winning every fight"] },
    { q: "Can you steal a police car?", a: "Only with high-tier RP reason", wrong: ["Yes, for fun", "No never", "Yes, to escape"] },
    { q: "How do you initiate a robbery?", a: "Make verbal demands visibly", wrong: ["Just shoot them", "Type in chat", "Run at them"] },
    { q: "What is a 'Safe Zone'?", a: "Area where crime is restricted", wrong: ["Place to hide from cops", "My house", "Bank vault"] },
    { q: "Can you use a mod menu?", a: "No, instant ban", wrong: ["Yes for visuals", "Only for money", "If no one sees"] },
    { q: "What is 'Fail RP'?", a: "Unrealistic behavior", wrong: ["Failing a mission", "Losing a fight", "Crashing a car"] },
    { q: "How to identify an admin in RP?", a: "You don't, treat them as players", wrong: ["By their name tag", "Ask them", "They fly"] },
    { q: "Can you combat log?", a: "No, it is prohibited", wrong: ["Yes if losing", "Yes if needed IRL", "Yes to save items"] },
    { q: "What is 'Fear RP'?", a: "Fearing for your character's safety", wrong: ["Scaring others", "Being a horror character", "Fearing admins"] },
    { q: "Can you rob an EMS on duty?", a: "No", wrong: ["Yes", "Only if they have money", "If no cops are around"] },
    { q: "What do you do if you see a bug?", a: "Report to staff", wrong: ["Use it", "Tell friends", "Ignore it"] },
    { q: "Can you drive off road in a supercar?", a: "No, that is NVL/Powergaming", wrong: ["Yes", "Slowly", "If escaping"] }
];

router.get('/quiz', isAuthenticated, (req, res) => {
    const shuffled = QUIZ_POOL.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, 15).map(q => ({ question: q.q, options: [q.a, ...q.wrong].sort(() => 0.5 - Math.random()) })));
});

router.post('/submit/whitelist', isAuthenticated, async (req, res) => {
    const { answers } = req.body; 
    const isAdmin = req.user.isAdmin || req.user.isStaff;

    // Grade Quiz
    let score = 0;
    answers.forEach(ans => {
        const correctQ = QUIZ_POOL.find(q => q.q === ans.question);
        if (correctQ && correctQ.a === ans.answer) score++;
    });

    const passed = score >= 12;
    const total = 15;

    // PASS LOGIC
    if (passed) {
        // Auto-assign Discord Role
        await addDiscordRole(req.user.id, WHITELISTED_ROLE_ID);
        
        // Log in DB
        await db.query("INSERT INTO applications (discordId, characterName, characterAge, backstory, status, notified) VALUES (?, 'Quiz User', 0, 'Passed Whitelist Quiz', 'approved', 1)", [req.user.id]);
        
        return res.json({ 
            passed: true, 
            score, total, 
            message: "Congratulations! You have demonstrated sufficient knowledge of our server rules. You have been automatically whitelisted. You can now connect to the server!" 
        });
    } 
    
    // FAIL LOGIC
    else {
        // Apply 24h Cooldown (skip if Admin)
        if (!isAdmin) {
            const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db.query("INSERT INTO discord_users (discord_id, cooldown_expiry) VALUES (?, ?) ON DUPLICATE KEY UPDATE cooldown_expiry = ?", [req.user.id, expiryTime, expiryTime]);
        }

        return res.json({ 
            passed: false, 
            score, total, 
            message: "Unfortunately, you did not meet the required score. We recommend reviewing the Server Rules page carefully, focusing on definitions of NVL, RDM, and Powergaming." 
        });
    }
});

// ... (Other PD/EMS/Staff routes remain same) ...
// Submit PD Application
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

    try {
        await db.query("INSERT INTO pd_applications (discord_id, character_name, irl_name, irl_age, experience, reason, scenario_cop, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, experience, whyJoin, scenario]);
        res.json({ success: true, message: "PD Application Submitted!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server Error" });
    }
});

// Submit EMS Application
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
        await db.query("INSERT INTO ems_applications (discord_id, character_name, irl_name, irl_age, medical_knowledge, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, medicalKnowledge, scenarios]);
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
    try { [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'"); }
    catch (err) { await initializeTables(); [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'"); }

    if (settings && settings[0] && !settings[0].is_open && !isAdmin) {
        return res.status(403).json({ message: "Staff applications are closed." });
    }

    const { age, experience, hours, responsibilities, definitions, scenarios } = req.body;
    
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM staff_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending Staff application." });
    }

     try {
        await db.query("INSERT INTO staff_applications (discord_id, irl_age, experience, weekly_hours, responsibilities, definitions, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, age, experience, hours, responsibilities, definitions, scenarios]);
        res.json({ success: true, message: "Staff Application Submitted!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;