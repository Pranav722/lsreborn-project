const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();
const db = require('../db');

const DISCORD_API_URL = 'https://discord.com/api/v10';

// --- SECURE CONFIGURATION: READ FROM ENV ---
const ACTIVE_BOT_TOKEN = process.env.ACTIVE_BOT_TOKEN || process.env.DISCORD_BOT_TOKEN; 
const ACTIVE_GUILD_ID = process.env.ACTIVE_GUILD_ID || process.env.GUILD_ID || "1322660458888695818";
const MASTER_ADMIN_ID = process.env.MASTER_ADMIN_ID || "444043711094194200"; 

async function getGuildMember(userId) {
    try {
        if (!ACTIVE_BOT_TOKEN) {
            console.error("[AUTH] Missing ACTIVE_BOT_TOKEN / DISCORD_BOT_TOKEN in environment variables.");
            return null;
        }

        const response = await fetch(`${DISCORD_API_URL}/guilds/${ACTIVE_GUILD_ID}/members/${userId}`, {
            headers: { 'Authorization': `Bot ${ACTIVE_BOT_TOKEN}` }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.warn(`[AUTH] Guild member check failed for user ${userId}: status ${response.status} ${response.statusText}`);
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
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify guilds guilds.members.read' 
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
                redirect_uri: `${process.env.BACKEND_URL}/api/auth/discord/callback`,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            console.error("[AUTH] Failed to get access token:", tokenData);
            return res.redirect(`${process.env.FRONTEND_URL}?login=failed`);
        }

        // 1. Fetch User Profile
        const userRes = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userProfile = await userRes.json();

        // 2. Direct User Member & Roles Check via User OAuth Token (Primary Fail-safe)
        let rolesFromOAuth = [];
        let inGuildOAuthMember = false;
        try {
            const userMemberRes = await fetch(`${DISCORD_API_URL}/users/@me/guilds/${ACTIVE_GUILD_ID}/member`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            if (userMemberRes.ok) {
                const memberOAuthData = await userMemberRes.json();
                if (memberOAuthData && Array.isArray(memberOAuthData.roles)) {
                    rolesFromOAuth = memberOAuthData.roles;
                    inGuildOAuthMember = true;
                    console.log(`[AUTH] Successfully retrieved ${rolesFromOAuth.length} roles via OAuth token for ${userProfile.username}`);
                }
            } else {
                console.warn(`[AUTH] OAuth member fetch returned status ${userMemberRes.status}`);
            }
        } catch (mErr) {
            console.warn("[AUTH] Error fetching member via OAuth token:", mErr);
        }

        // 3. User Guild List Check via OAuth Token (Secondary Fail-safe for inGuild)
        let inGuildUserOAuth = false;
        if (!inGuildOAuthMember) {
            try {
                const userGuildsRes = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                if (userGuildsRes.ok) {
                    const guilds = await userGuildsRes.json();
                    inGuildUserOAuth = Array.isArray(guilds) && guilds.some(g => g.id === ACTIVE_GUILD_ID);
                }
            } catch (gErr) {
                console.warn("[AUTH] Error checking user guilds via OAuth token:", gErr);
            }
        }

        // 4. Bot Token Member Check (Tertiary Fallback)
        const memberData = await getGuildMember(userProfile.id);
        const inGuildBot = !!memberData;
        const rolesFromBot = memberData ? memberData.roles : [];

        // Combine roles from OAuth and Bot
        const rolesSet = new Set([...rolesFromOAuth, ...rolesFromBot]);
        const roles = Array.from(rolesSet);

        const inGuild = inGuildOAuthMember || inGuildUserOAuth || inGuildBot || userProfile.id === MASTER_ADMIN_ID;

        let cooldownExpiry = null;
        if (inGuild) {
            try {
                const [rows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [userProfile.id]);
                if (rows.length > 0) cooldownExpiry = rows[0].cooldown_expiry;
            } catch(dbErr) { console.error("DB Error:", dbErr); }
        }

        const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID || "1322674155107127458";
        const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || "1330603132094386238";
        const LSR_ADMIN_ROLE_ID = process.env.LSR_ADMIN_ROLE_ID || "1323071939476066344";
        const PD_HIGH_COMMAND_ROLE_ID = process.env.PD_HIGH_COMMAND_ROLE_ID || "1333342119569522729";
        const EMS_HIGH_COMMAND_ROLE_ID = process.env.EMS_HIGH_COMMAND_ROLE_ID || "1415224352986759231";

        let isWhitelisted = roles.includes(WHITELISTED_ROLE_ID);
        let isStaff = roles.includes(STAFF_ROLE_ID);
        let isAdmin = roles.includes(LSR_ADMIN_ROLE_ID);
        let isPDLead = roles.includes(PD_HIGH_COMMAND_ROLE_ID);
        let isEMSLead = roles.includes(EMS_HIGH_COMMAND_ROLE_ID);

        // 5. Database Approved Application Check Fallback
        if (!isWhitelisted && inGuild) {
            try {
                const [appRows] = await db.query(
                    "SELECT id FROM applications WHERE discordId = ? AND status = 'approved'", 
                    [userProfile.id]
                );
                if (appRows.length > 0) {
                    isWhitelisted = true;
                    console.log(`[AUTH] User ${userProfile.username} verified as Whitelisted via Approved DB Application.`);
                }
            } catch(dbErr) {}
        }

        if (userProfile.id === MASTER_ADMIN_ID) {
            isWhitelisted = true; isStaff = true; isAdmin = true; isPDLead = true; isEMSLead = true;
        }

        const userPayload = {
            id: userProfile.id,
            username: userProfile.username,
            avatar: userProfile.avatar,
            roles,
            inGuild,
            cooldownExpiry,
            isWhitelisted, isStaff, isAdmin, isPDLead, isEMSLead
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
    
    const WHITELISTED_ROLE_ID = process.env.WHITELISTED_ROLE_ID || "1322674155107127458";
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || "1330603132094386238";
    const LSR_ADMIN_ROLE_ID = process.env.LSR_ADMIN_ROLE_ID || "1323071939476066344";
    const PD_HIGH_COMMAND_ROLE_ID = process.env.PD_HIGH_COMMAND_ROLE_ID || "1333342119569522729";
    const EMS_HIGH_COMMAND_ROLE_ID = process.env.EMS_HIGH_COMMAND_ROLE_ID || "1415224352986759231";

    if (memberData && Array.isArray(memberData.roles)) {
        const combinedRoles = new Set([...(req.user.roles || []), ...memberData.roles]);
        req.user.roles = Array.from(combinedRoles);
        req.user.inGuild = true;
        
        req.user.isWhitelisted = req.user.isWhitelisted || req.user.roles.includes(WHITELISTED_ROLE_ID);
        req.user.isStaff = req.user.isStaff || req.user.roles.includes(STAFF_ROLE_ID);
        req.user.isAdmin = req.user.isAdmin || req.user.roles.includes(LSR_ADMIN_ROLE_ID);
        req.user.isPDLead = req.user.isPDLead || req.user.roles.includes(PD_HIGH_COMMAND_ROLE_ID);
        req.user.isEMSLead = req.user.isEMSLead || req.user.roles.includes(EMS_HIGH_COMMAND_ROLE_ID);
    }

    // Database Approved Application Check Fallback
    if (!req.user.isWhitelisted && req.user.inGuild) {
        try {
            const [appRows] = await db.query(
                "SELECT id FROM applications WHERE discordId = ? AND status = 'approved'", 
                [req.user.id]
            );
            if (appRows.length > 0) {
                req.user.isWhitelisted = true;
            }
        } catch(dbErr) {}
    }

    if (req.user.id === MASTER_ADMIN_ID) {
        req.user.isWhitelisted = true;
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