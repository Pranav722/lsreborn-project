const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// --- QUIZ QUESTIONS ---
// (Keeping the pool concise for brevity, assumes full pool exists)
const QUIZ_POOL = [
    { q: "What does 'NVL' (No Value of Life) mean?", a: "Not fearing for your life in a dangerous situation", wrong: ["Not Valuing Loot", "New Vehicle License", "No Valid License"] },
    { q: "You are held at gunpoint. What do you do?", a: "Comply with demands to save my life", wrong: ["Pull out my own gun", "Run away", "Call the police on radio"] },
    // ... (All other questions remain as per your original file)
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

// Get Random Quiz
router.get('/quiz', isAuthenticated, (req, res) => {
    const shuffled = QUIZ_POOL.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15).map(q => ({
        question: q.q,
        options: [q.a, ...q.wrong].sort(() => 0.5 - Math.random()) 
    }));
    res.json(selected);
});

// Submit Quiz (Whitelist Application)
router.post('/submit/whitelist', isAuthenticated, async (req, res) => {
    const { answers } = req.body; 
    
    // Check Settings
    const [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'whitelist'");
    
    // Admin Override for Closed Forms
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    if (!settings[0].is_open && !isAdmin) return res.status(403).json({ message: "Whitelist applications are currently closed." });

    // Verify User Roles (Admins bypass this check too)
    const { roles } = req.user;
    const hasAccess = roles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID) || roles.includes(process.env.APPLICATION_ROLE_ID) || isAdmin;
    
    if (!hasAccess) return res.status(403).json({ message: "Missing Application Pass." });

    // Grade Quiz
    let score = 0;
    answers.forEach(ans => {
        const correctQ = QUIZ_POOL.find(q => q.q === ans.question);
        if (correctQ && correctQ.a === ans.answer) score++;
    });

    if (score < 12) { 
        return res.status(400).json({ message: `You scored ${score}/15. You need 12 to pass. Please try again.` });
    }

    // Check if user already has an app (Admin Bypass here)
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM applications WHERE discordId = ? AND status IN ('pending', 'approved')", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have an active application." });
    }

    // Pass!
    await db.query(
        "INSERT INTO applications (discordId, characterName, characterAge, backstory, status, notified) VALUES (?, 'Quiz User', 0, 'Passed Whitelist Quiz', 'pending', 0)", 
        [req.user.id]
    );
    
    res.json({ success: true, message: "Quiz Passed! Application submitted for processing." });
});

// Submit PD Application
router.post('/submit/pd', isAuthenticated, async (req, res) => {
    const [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'pd'");
    const isAdmin = req.user.isAdmin || req.user.isStaff;
    
    if (!settings[0].is_open && !isAdmin) return res.status(403).json({ message: "PD applications are closed." });

    const { irlName, irlAge, icName, experience, whyJoin, scenario } = req.body;
    
    // Allow admins to submit multiple times
    if (!isAdmin) {
        const [existing] = await db.query("SELECT * FROM pd_applications WHERE discord_id = ? AND status = 'pending'", [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ message: "You already have a pending PD application." });
    }

    try {
        await db.query(
            "INSERT INTO pd_applications (discord_id, character_name, irl_name, irl_age, experience, reason, scenario_cop, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
            [req.user.id, icName, irlName, irlAge, experience, whyJoin, scenario]
        );
        res.json({ success: true, message: "PD Application Submitted!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server Error" });
    }
});

// Submit EMS Application
router.post('/submit/ems', isAuthenticated, async (req, res) => {
    const [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'ems'");
    const isAdmin = req.user.isAdmin || req.user.isStaff;

    if (!settings[0].is_open && !isAdmin) return res.status(403).json({ message: "EMS applications are closed." });

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
    const [settings] = await db.query("SELECT is_open FROM form_settings WHERE form_name = 'staff'");
    const isAdmin = req.user.isAdmin || req.user.isStaff;

    if (!settings[0].is_open && !isAdmin) return res.status(403).json({ message: "Staff applications are closed." });

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