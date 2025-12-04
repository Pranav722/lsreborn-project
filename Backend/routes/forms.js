const router = require('express').Router();
const db = require('../db');
const fetch = require('node-fetch');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api/v10';
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN;
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || "1322660458888695818";
const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID || "1322674155107127458";

const QUIZ_POOL = [
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
        console.log("Initializing Database Tables...");

        // 1. Create base table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS form_settings(
                form_name VARCHAR(50) PRIMARY KEY,
                is_open BOOLEAN DEFAULT true,
                type VARCHAR(50) DEFAULT 'quiz'
            )
        `);

        // 2. Ensure 'type' column exists (idempotent check)
        try {
            await db.query("SELECT type FROM form_settings LIMIT 1");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding 'type' column to form_settings...");
                await db.query("ALTER TABLE form_settings ADD COLUMN type VARCHAR(50) DEFAULT 'quiz'");
            }
        }

        // 3. Ensure applications table has new columns
        await db.query(`CREATE TABLE IF NOT EXISTS applications(id INT AUTO_INCREMENT PRIMARY KEY, discordId VARCHAR(255), characterName VARCHAR(255), characterAge INT, backstory TEXT, isPremium BOOLEAN, status VARCHAR(50), notified BOOLEAN, submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        try {
            await db.query("SELECT irlName FROM applications LIMIT 1");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding missing columns to 'applications' table...");
                await db.query(`ALTER TABLE applications 
                    ADD COLUMN irlName VARCHAR(255),
                    ADD COLUMN irlAge INT
                `);
            }
        }

        try {
            await db.query("SELECT questions FROM applications LIMIT 1");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding 'questions' column to 'applications' table...");
                await db.query("ALTER TABLE applications ADD COLUMN questions TEXT");
            }
        }

        // 4. Initialize default settings
        const forms = ['whitelist', 'pd', 'ems', 'staff'];
        for (const form of forms) {
            await db.query("INSERT IGNORE INTO form_settings (form_name, is_open, type) VALUES (?, true, 'quiz')", [form]);
        }

    } catch (e) {
        console.error("Table Init Error:", e);
    }
};

// Initialize on load
initializeTables();

// --- DISCORD UTILS ---
async function sendDiscordMessage(channelId, content, embed = null) {
    if (!channelId || !ACTIVE_BOT_TOKEN) return;
    try {
        const body = { content };
        if (embed) body.embeds = [embed];

        await fetch(`${DISCORD_API_URL}/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${ACTIVE_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.error("Discord Msg Error:", e);
    }
}

// --- API ENDPOINTS ---

router.get('/all-status', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT form_name, is_open, type FROM form_settings");
        const statusMap = {};
        rows.forEach(row => {
            statusMap[row.form_name] = { is_open: row.is_open, type: row.type };
        });
        res.json(statusMap);
    } catch (e) {
        console.error("All Status fetch error:", e);
        res.status(500).json({ error: "DB Error" });
    }
});

router.get('/quiz', isAuthenticated, async (req, res) => {
    // Check form status on every request
    try {
        const [settings] = await db.query("SELECT is_open, type FROM form_settings WHERE form_name = 'whitelist'");
        const isAdmin = req.user.isAdmin;

        // Handle case where settings might be empty initially
        const isOpen = settings.length > 0 ? settings[0].is_open : 1;
        const type = settings.length > 0 ? settings[0].type : 'quiz';

        if (!isOpen && !isAdmin) return res.status(403).json({ message: "Whitelist applications are currently disabled.", status: 'disabled' });
        if (type !== 'quiz' && !isAdmin) return res.status(403).json({ message: "Whitelist is currently open via the written application.", status: 'form_active' });

        const shuffled = QUIZ_POOL.sort(() => 0.5 - Math.random());
        res.json(shuffled.slice(0, 15).map(q => ({ question: q.q, options: [q.a, ...q.wrong].sort(() => 0.5 - Math.random()) })));
    } catch (e) {
        console.error("Quiz fetch error:", e);
        res.status(500).json({ message: "Server Error fetching quiz" });
    }
});

router.post('/submit/whitelist', isAuthenticated, async (req, res) => {
    const { answers } = req.body;

    let settings;
    try { [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'whitelist'"); }
    catch (err) { await initializeTables();[settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'whitelist'"); }

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

    // LOG TO DISCORD
    const logChannel = process.env.LOG_CHANNEL_ID; // Ensure this ENV is set
    const embed = {
        title: passed ? "✅ Whitelist Quiz Passed" : "❌ Whitelist Quiz Failed",
        color: passed ? 0x00ff00 : 0xff0000,
        fields: [
            { name: "User", value: `<@${req.user.id}> (${req.user.username})`, inline: true },
            { name: "Score", value: `${score}/${total}`, inline: true },
            { name: "Result", value: passed ? "Auto-Whitelisted" : "Cooldown Applied" }
        ],
        timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(logChannel, null, embed);

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

    // Check Status
    try {
        const [s] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'pd'");
        if (s.length > 0 && !s[0].is_open && !isAdmin) return res.status(403).json({ message: "PD Applications are closed." });
    } catch (e) { console.error(e); return res.status(500).json({ message: "DB Error" }); }

    const { irlName, irlAge, icName, experience, whyJoin, scenario } = req.body;

    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM pd_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending PD application." });
    }

    await db.query("INSERT INTO pd_applications (discord_id, character_name, irl_name, irl_age, experience, reason, scenario_cop, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, experience, whyJoin, scenario]);

    // Notify Staff
    await sendDiscordMessage(process.env.PD_LOG_CHANNEL_ID, `👮 **New PD Application** submitted by <@${req.user.id}>`);

    res.json({ success: true, message: "PD Application Submitted!" });
});

router.post('/submit/ems', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;

    // Check Status
    try {
        const [s] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'ems'");
        if (s.length > 0 && !s[0].is_open && !isAdmin) return res.status(403).json({ message: "EMS Applications are closed." });
    } catch (e) { console.error(e); return res.status(500).json({ message: "DB Error" }); }

    const { icName, irlName, irlAge, medicalKnowledge, scenarios } = req.body;

    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM ems_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending EMS application." });
    }

    await db.query("INSERT INTO ems_applications (discord_id, character_name, irl_name, irl_age, medical_knowledge, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, icName, irlName, irlAge, medicalKnowledge, scenarios]);

    // Notify Staff
    await sendDiscordMessage(process.env.EMS_LOG_CHANNEL_ID, `🚑 **New EMS Application** submitted by <@${req.user.id}>`);

    res.json({ success: true, message: "EMS Application Submitted!" });
});

router.post('/submit/staff', isAuthenticated, async (req, res) => {
    const isAdmin = req.user.isAdmin || req.user.isStaff;

    // Check Status
    try {
        const [s] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'");
        if (s.length > 0 && !s[0].is_open && !isAdmin) return res.status(403).json({ message: "Staff Applications are closed." });
    } catch (e) { console.error(e); return res.status(500).json({ message: "DB Error" }); }

    const { age, experience, hours, responsibilities, definitions, scenarios } = req.body;

    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM staff_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending Staff application." });
    }

    await db.query("INSERT INTO staff_applications (discord_id, irl_age, experience, weekly_hours, responsibilities, definitions, scenarios, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [req.user.id, age, experience, hours, responsibilities, definitions, scenarios]);

    // Notify Management
    await sendDiscordMessage(process.env.STAFF_LOG_CHANNEL_ID, `🛡️ **New Staff Application** submitted by <@${req.user.id}>`);

    res.json({ success: true, message: "Staff Application Submitted!" });
});

module.exports = router;