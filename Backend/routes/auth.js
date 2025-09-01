const router = require('express').Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

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
        if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            roles = memberData.roles || [];
        }

        // Create a payload for our JWT
        const userPayload = {
            id: userProfile.id,
            username: userProfile.username,
            avatar: userProfile.avatar,
            discriminator: userProfile.discriminator,
            roles: roles,
            isStaff: roles.includes(process.env.STAFF_ROLE_ID),
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

// A protected route for the frontend to check who is logged in
router.get('/me', require('../middleware/auth').isAuthenticated, (req, res) => {
    res.json(req.user);
});

// The logout route
router.post('/logout', (req, res) => {
    // With JWT, logout is handled entirely on the frontend by deleting the token.
    // This endpoint is here to provide a formal logout mechanism.
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;