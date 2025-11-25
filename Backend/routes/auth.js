const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();
const db = require('../db');

const DISCORD_API_URL = 'https://discord.com/api/v10';

// FIX: We now use the BOT TOKEN to check guild membership.
// This is 100x more reliable than the user token.
async function getGuildMember(userId) {
    try {
        const response = await fetch(`${DISCORD_API_URL}/guilds/${process.env.GUILD_ID}/members/${userId}`, {
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` }
        });
        if (response.ok) return await response.json();
        return null;
    } catch (e) {
        console.error("Bot fetch error:", e);
        return null;
    }
}

router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: `${process.env.BACKEND_URL}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify' // We only need identify now, bot handles the rest
    });
    res.redirect(`${DISCORD_API_URL}/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}?login=failed`);

    try {
        // 1. Get User Token
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
        
        // 2. Get Basic Profile
        const userRes = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userProfile = await userRes.json();

        // 3. SUPER FIX: Use Bot Token to fetch Guild Member Data
        // This fixes the "Not in server" bug permanently.
        const memberData = await getGuildMember(userProfile.id);
        
        const inGuild = !!memberData;
        const roles = memberData ? memberData.roles : [];

        // 4. Check DB for Cooldowns
        let cooldownExpiry = null;
        if (inGuild) {
            const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [userProfile.id]);
            if (rows.length > 0) cooldownExpiry = rows[0].cooldown_expiry;
        }

        // 5. Identify Permissions
        const isStaff = roles.includes(process.env.STAFF_ROLE_ID) || roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        const isAdmin = roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        const isPDLead = roles.includes(process.env.PD_HIGH_COMMAND_ROLE_ID); // Add to .env
        const isEMSLead = roles.includes(process.env.EMS_HIGH_COMMAND_ROLE_ID); // Add to .env

        const userPayload = {
            id: userProfile.id,
            username: userProfile.username,
            avatar: userProfile.avatar,
            roles,
            inGuild,
            cooldownExpiry,
            isStaff, isAdmin, isPDLead, isEMSLead
        };

        const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);

    } catch (error) {
        console.error("Login Error:", error);
        res.redirect(`${process.env.FRONTEND_URL}?login=error`);
    }
});

router.get('/me', require('../middleware/auth').isAuthenticated, async (req, res) => {
    // Refresh data on every page load using Bot Token
    const memberData = await getGuildMember(req.user.id);
    
    if (memberData) {
        req.user.roles = memberData.roles;
        req.user.inGuild = true;
        req.user.isStaff = memberData.roles.includes(process.env.STAFF_ROLE_ID) || memberData.roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        req.user.isAdmin = memberData.roles.includes(process.env.LSR_ADMIN_ROLE_ID);
        req.user.isPDLead = memberData.roles.includes(process.env.PD_HIGH_COMMAND_ROLE_ID);
        req.user.isEMSLead = memberData.roles.includes(process.env.EMS_HIGH_COMMAND_ROLE_ID);
        
        // Refresh Cooldown
        const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [req.user.id]);
        req.user.cooldownExpiry = rows.length > 0 ? rows[0].cooldown_expiry : null;
    } else {
        req.user.inGuild = false;
        req.user.roles = [];
    }
    
    res.json(req.user);
});

router.post('/logout', (req, res) => res.status(200).json({ message: 'Logged out' }));

module.exports = router;