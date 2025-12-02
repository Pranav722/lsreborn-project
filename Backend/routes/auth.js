const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();
const db = require('../db');

const DISCORD_API_URL = 'https://discord.com/api/v10';

// --- CONFIGURATION: USE ENVIRONMENT VARIABLES ---
// REPLACED HARDCODED TOKEN WITH ENV VARIABLE TO FIX GITHUB PUSH ERROR
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN;
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || "1322660458888695818";
const MASTER_ADMIN_ID = process.env.MASTER_ADMIN_ID || "444043711094194200"; 

// Helper to get member data using the BOT TOKEN
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
            // If 404, the user is NOT in the server.
            // If 401/403, the bot token is wrong or bot is not in the server.
            if (response.status !== 404) {
                console.warn(`[AUTH] Guild check failed for ${userId}: ${response.status} ${response.statusText}`);
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
        // 1. Exchange Code for User Token (Standard OAuth flow for identity)
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

        // 2. Get User ID (Using User Token)
        const userRes = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userProfile = await userRes.json();

        // 3. Verify Membership (Using RESPONSE BOT Token)
        // This is the critical fix: The bot asks Discord "Is this user in the server?"
        const memberData = await getGuildMember(userProfile.id);
        
        const inGuild = !!memberData;
        const roles = memberData ? memberData.roles : [];

        // 4. DB Cooldown Check
        let cooldownExpiry = null;
        if (inGuild) {
            try {
                const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [userProfile.id]);
                if (rows.length > 0) cooldownExpiry = rows[0].cooldown_expiry;
            } catch(dbErr) { console.error("DB Error:", dbErr); }
        }

        // 5. Assign Permissions
        let isStaff = roles.includes(process.env.STAFF_ROLE_ID) || roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        let isAdmin = roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        let isPDLead = roles.includes(process.env.PD_HIGH_COMMAND_ROLE_ID);
        let isEMSLead = roles.includes(process.env.EMS_HIGH_COMMAND_ROLE_ID);

        // --- MASTER ADMIN OVERRIDE ---
        if (userProfile.id === MASTER_ADMIN_ID) {
            isStaff = true; isAdmin = true; isPDLead = true; isEMSLead = true;
            // Also force inGuild to true for master admin to prevent lockout during testing
            if (!inGuild) console.log("[AUTH] Master Admin is bypassing guild check.");
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
    // 1. Refresh membership using Response Bot Token
    const memberData = await getGuildMember(req.user.id);
    
    // 2. Update session
    if (memberData) {
        req.user.roles = memberData.roles;
        req.user.inGuild = true;
        
        req.user.isStaff = memberData.roles.includes(process.env.STAFF_ROLE_ID) || memberData.roles.includes(process.env.LSR_ADMIN_ROLE_ID);
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

    // 3. Master Admin Override (Refresh)
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