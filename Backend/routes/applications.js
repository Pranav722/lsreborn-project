const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const fetch = require('node-fetch');
require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api/v10';
const getBotToken = () => (process.env.ACTIVE_BOT_TOKEN || process.env.DISCORD_BOT_TOKEN || "").trim().replace(/^["']|["']$/g, '');

// --- DISCORD UTILS ---
async function addDiscordRole(userId, roleId) {
    const token = getBotToken();
    if (!token || !userId || !roleId) return;
    const guildId = process.env.ACTIVE_GUILD_ID || process.env.GUILD_ID || "1322660458888695818";
    try {
        const res = await fetch(`${DISCORD_API_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${token}` }
        });
        if (res.status === 401) {
            console.error(`[CRITICAL DISCORD BOT ERROR] ACTIVE_BOT_TOKEN returned 401 Unauthorized for user ${userId}. The bot token configured in Render environment is invalid or revoked! Please reset bot token in Discord Developer Portal and update ACTIVE_BOT_TOKEN in Render.`);
        } else if (!res.ok) {
            const errText = await res.text();
            console.warn(`[APPLICATIONS] addDiscordRole status ${res.status}: ${errText}`);
        } else {
            console.log(`[APPLICATIONS] Successfully added Whitelisted role (${roleId}) to user ${userId}`);
        }
    } catch(e) {
        console.error("[APPLICATIONS] Error in addDiscordRole:", e);
    }
}

async function sendDiscordMessage(channelId, content, embed = null) {
    const token = getBotToken();
    if (!channelId || !token) return;
    try {
        const body = { content };
        if (embed) body.embeds = [embed];

        const res = await fetch(`${DISCORD_API_URL}/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (res.status === 401) {
            console.error(`[CRITICAL DISCORD BOT ERROR] ACTIVE_BOT_TOKEN returned 401 Unauthorized when sending message to channel ${channelId}. Please update ACTIVE_BOT_TOKEN in Render.`);
        } else if (!res.ok) {
            const errText = await res.text();
            console.warn(`[APPLICATIONS] sendDiscordMessage status ${res.status}: ${errText}`);
        } else {
            console.log(`[APPLICATIONS] Successfully sent Discord embed notification to channel ${channelId}`);
        }
    } catch (e) {
        console.error("Discord Msg Error:", e);
    }
}

// Middleware to check if the user is staff or admin
const isStaff = (req, res, next) => {
    if (req.user && (req.user.isStaff || req.user.isAdmin)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Staff access required' });
};

// GET all applications (for staff/admin)
router.get('/', isAuthenticated, isStaff, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT *, (isPremium = 1) AS isPremium FROM applications ORDER BY isPremium DESC, submittedAt DESC');
        res.json(rows);
    } catch (err) {
        console.error("Error fetching applications:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST submit application
router.post('/', isAuthenticated, async (req, res) => {
    const { characterName, characterAge, backstory, irlName, irlAge, questions } = req.body;
    const discordId = req.user.id;
    const isPremium = req.user && req.user.roles && req.user.roles.includes(process.env.PREMIUM_APPLICANT_ROLE_ID);

    if (!characterName || !characterAge || !backstory || !irlName || !irlAge) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Check if Whitelist Form is OPEN and is the active method
    try {
        const [settings] = await db.query("SELECT is_open, type FROM form_settings WHERE form_name = 'whitelist'");
        const adminBypass = req.user.isAdmin;

        if (settings.length > 0) {
            if (!settings[0].is_open && !adminBypass) {
                return res.status(403).json({ message: "Whitelist applications are currently closed." });
            }
            if (settings[0].type !== 'form' && !adminBypass) {
                return res.status(403).json({ message: "Written applications are currently disabled (Quiz Mode Active)." });
            }
        }
    } catch (e) {
        console.error("Settings Check Error:", e);
        return res.status(500).json({ message: "Database Error checking status." });
    }

    // Word count validation
    const wordCount = backstory.trim().split(/\s+/).length;
    if (wordCount < 200) {
        return res.status(400).json({ message: `Backstory is too short (${wordCount}/200 words).` });
    }

    try {
        // Check for existing pending application
        const [existing] = await db.query('SELECT id FROM applications WHERE discordId = ? AND status = \'pending\'', [discordId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "You already have a pending application." });
        }

        const query = 'INSERT INTO applications (discordId, characterName, characterAge, backstory, irlName, irlAge, questions, isPremium, status, notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await db.query(query, [discordId, characterName, characterAge, backstory, irlName, irlAge, JSON.stringify(questions), isPremium, 'pending', 0]);

        // Notify Staff via Discord
        const logChannel = process.env.LOG_CHANNEL_ID;
        const embed = {
            title: "📝 New Written Application",
            color: 0x3498db,
            fields: [
                { name: "User", value: `<@${discordId}>`, inline: true },
                { name: "Character", value: characterName, inline: true },
                { name: "Status", value: "Pending Review", inline: true }
            ],
            timestamp: new Date().toISOString()
        };
        await sendDiscordMessage(logChannel, null, embed);

        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (err) {
        console.error("Error submitting application:", err);
        res.status(500).json({ message: `Database error: ${err.message}` });
    }
});

// PUT update application status
router.put('/:id', isAuthenticated, isStaff, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }
        const app = rows[0];

        await db.query('UPDATE applications SET status = ?, reason = ?, notified = 1 WHERE id = ?', [status, reason || null, id]);

        const discordId = app.discordId;
        const targetChannelId = process.env.TARGET_CHANNEL_ID || process.env.LOG_CHANNEL_ID || "1411033400541708339";
        const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID || "1322674155107127458";

        if (status === 'approved') {
            // 1. Grant Discord Whitelisted Role directly
            await addDiscordRole(discordId, WHITELISTED_ROLE_ID);

            // 2. Post Approval Embed to Discord Channel directly
            const embed = {
                title: "🎉 Application Approved",
                description: `Congratulations <@${discordId}>, your application for **LSReborn** has been approved! Welcome to the server!`,
                color: 0x00FF00,
                fields: [
                    { name: "Applicant", value: `<@${discordId}>`, inline: true },
                    { name: "Character", value: app.characterName || 'N/A', inline: true },
                    { name: "Status", value: "Approved", inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await sendDiscordMessage(targetChannelId, null, embed);

        } else if (status === 'rejected') {
            // Post Rejection Embed to Discord Channel directly
            const embed = {
                title: "🚫 Application Rejected",
                description: `Hello <@${discordId}>, your application was reviewed and rejected.`,
                color: 0xFF0000,
                fields: [
                    { name: "Applicant", value: `<@${discordId}>`, inline: true },
                    { name: "Reason", value: reason || "Does not meet guidelines", inline: false }
                ],
                timestamp: new Date().toISOString()
            };
            await sendDiscordMessage(targetChannelId, null, embed);
        }

        res.json({ success: true, message: `Application ${status} successfully and Discord updated!` });
    } catch (err) {
        console.error("Error updating application:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;