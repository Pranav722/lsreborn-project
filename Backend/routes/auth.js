const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();
const db = require('../db');

const DISCORD_API_URL = 'https://discord.com/api/v10';

// This is the first step of the login process
router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: `${process.env.BACKEND_URL}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify guilds guilds.members.read'
    });
    res.redirect(`${DISCORD_API_URL}/oauth2/authorize?${params}`);
});

// This is where Discord sends the user back to after they authorize
router.get('/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?login=failed`);
    }

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
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

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            throw new Error('Failed to get access token.');
        }

        // Use the access token to get the user's profile
        const userResponse = await fetch(`${DISCORD_API_URL}/users/@me`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userProfile = await userResponse.json();
        
        // Get the user's roles from your specific server
        const memberResponse = await fetch(`${DISCORD_API_URL}/users/@me/guilds/${process.env.GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        let roles = [];
        let inGuild = false;
        if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            roles = memberData.roles || [];
            inGuild = true;
        }

        // Get cooldown expiry from our database
        let cooldownExpiry = null;
        try {
            const [userRows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [userProfile.id]);
            if (userRows.length > 0) {
                cooldownExpiry = userRows[0].cooldown_expiry;
            }
        } catch (dbError) {
            console.error("DB Error fetching cooldown:", dbError);
        }

        // Create a payload for our JWT
        const userPayload = {
            id: userProfile.id,
            username: userProfile.username,
            avatar: userProfile.avatar,
            discriminator: userProfile.discriminator,
            roles: roles,
            inGuild: inGuild,
            cooldownExpiry: cooldownExpiry,
            isStaff: roles.includes(process.env.STAFF_ROLE_ID) || roles.includes(process.env.LSR_ADMIN_ROLE_ID),
            isAdmin: roles.includes(process.env.LSR_ADMIN_ROLE_ID)
        };

        // Sign the JWT
        const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Redirect back to the frontend with the token in the URL query
        res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);

    } catch (error) {
        console.error("Discord callback error:", error);
        res.redirect(`${process.env.FRONTEND_URL}?login=error`);
    }
});

// A protected route for the frontend to check who is logged in and get fresh data
router.get('/me', require('../middleware/auth').isAuthenticated, async (req, res) => {
    // Re-fetch roles and dynamic data to ensure it's always up-to-date
    try {
        const memberResponse = await fetch(`${DISCORD_API_URL}/guilds/${process.env.GUILD_ID}/members/${req.user.id}`, {
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` },
        });

        let roles = req.user.roles; // Default to old roles if fetch fails
        if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            roles = memberData.roles || [];
        }

        let cooldownExpiry = null;
        try {
            const [userRows] = await db.query('SELECT cooldown_expiry FROM discord_users WHERE discord_id = ?', [req.user.id]);
            if (userRows.length > 0) {
                cooldownExpiry = userRows[0].cooldown_expiry;
            }
        } catch (dbError) {
            console.error("DB Error re-fetching cooldown:", dbError);
        }
        
        const refreshedUserPayload = {
            ...req.user,
            roles: roles,
            cooldownExpiry: cooldownExpiry,
            isStaff: roles.includes(process.env.STAFF_ROLE_ID) || roles.includes(process.env.LSR_ADMIN_ROLE_ID),
            isAdmin: roles.includes(process.env.LSR_ADMIN_ROLE_ID)
        };

        res.json(refreshedUserPayload);

    } catch(error) {
        console.error("Error refreshing user data:", error);
        res.status(500).json({ message: "Error refreshing user data" });
    }
});

module.exports = router;