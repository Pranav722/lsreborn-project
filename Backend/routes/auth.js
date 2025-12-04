const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();
const db = require('../db');

const DISCORD_API_URL = 'https://discord.com/api/v10';

// --- SECURE CONFIGURATION: READ FROM ENV ---
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN; 
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || "1322660458888695818";
const MASTER_ADMIN_ID = "444043711094194200"; 

async function getGuildMember(userId) {
    try {
        if (!ACTIVE_BOT_TOKEN) {
            console.error("[AUTH] Missing ACTIVE_BOT_TOKEN in environment variables.");
            return null;
        }

        const response = await fetch(`${DISCORD_API_URL}/guilds/${ACTIVE_GUILD_ID}/members/${userId}`, {
            headers: { 'Authorization': `Bot ${ACTIVE_BOT_TOKEN}` }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            if (response.status !== 404) {
                console.warn(`[AUTH] Guild check warning for ${userId}: ${response.status} ${response.statusText}`);
            }
            return null;
        }
    } catch (e) {
        console.error("[AUTH] Connection error during guild check:", e);
        return null;
    }
}

router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: `${process.env.BACKEND_URL}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify' 
    });
    res.redirect(`${DISCORD_API_URL}/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}?login=failed`);

    try {
        const tokenRes = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.BACKEND_URL}/auth/discord/callback`,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            console.error("[AUTH] Failed to get access token:", tokenData);
            return res.redirect(`${process.env.FRONTEND_URL}?login=failed`);
        }

        const userRes = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userProfile = await userRes.json();

        const memberData = await getGuildMember(userProfile.id);
        
        const inGuild = !!memberData;
        const roles = memberData ? memberData.roles : [];

        let cooldownExpiry = null;
        if (inGuild) {
            try {
                const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [userProfile.id]);
                if (rows.length > 0) cooldownExpiry = rows[0].cooldown_expiry;
            } catch(dbErr) { console.error("DB Error:", dbErr); }
        }

        let isStaff = roles.includes(process.env.STAFF_ROLE_ID);
        let isAdmin = roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        let isPDLead = roles.includes(process.env.PD_HIGH_COMMAND_ROLE_ID);
        let isEMSLead = roles.includes(process.env.EMS_HIGH_COMMAND_ROLE_ID);

        if (userProfile.id === MASTER_ADMIN_ID) {
            isStaff = true; isAdmin = true; isPDLead = true; isEMSLead = true;
        }

        const userPayload = {
            id: userProfile.id,
            username: userProfile.username,
            avatar: userProfile.avatar,
            roles,
            inGuild: inGuild || userProfile.id === MASTER_ADMIN_ID,
            cooldownExpiry,
            isStaff, isAdmin, isPDLead, isEMSLead
        };

        const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);

    } catch (error) {
        console.error("[AUTH] Callback Error:", error);
        res.redirect(`${process.env.FRONTEND_URL}?login=error`);
    }
});

router.get('/me', require('../middleware/auth').isAuthenticated, async (req, res) => {
    const memberData = await getGuildMember(req.user.id);
    
    if (memberData) {
        req.user.roles = memberData.roles;
        req.user.inGuild = true;
        
        req.user.isStaff = memberData.roles.includes(process.env.STAFF_ROLE_ID);
        req.user.isAdmin = memberData.roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        req.user.isPDLead = memberData.roles.includes(process.env.PD_HIGH_COMMAND_ROLE_ID);
        req.user.isEMSLead = memberData.roles.includes(process.env.EMS_HIGH_COMMAND_ROLE_ID);
        
        try {
            const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [req.user.id]);
            req.user.cooldownExpiry = rows.length > 0 ? rows[0].cooldown_expiry : null;
        } catch(err) {}
    } else {
        req.user.inGuild = false;
    }

    if (req.user.id === MASTER_ADMIN_ID) {
        req.user.isStaff = true;
        req.user.isAdmin = true;
        req.user.isPDLead = true;
        req.user.isEMSLead = true;
        req.user.inGuild = true; 
    }
    
    res.json(req.user);
});

router.post('/logout', (req, res) => res.status(200).json({ message: 'Logged out' }));

module.exports = router;