// File: backend/routes/auth.js
const router = require('express').Router();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fetch = require('node-fetch');
require('dotenv').config();

// Check if essential .env variables are set
if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.GUILD_ID) {
    console.error("ERROR: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and GUILD_ID must be set in your .env file.");
    process.exit(1);
}

// This function tells Passport what piece of user data to store in the session.
passport.serializeUser((user, done) => {
    console.log("Serializing User:", user.username);
    done(null, user);
});

// This function tells Passport how to get the full user details from the session.
passport.deserializeUser((obj, done) => {
    console.log("Deserializing User:", obj.username);
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/discord/callback`,
    scope: ['identify', 'guilds', 'guilds.members.read']
}, async (accessToken, refreshToken, profile, done) => {
    console.log("Discord callback successful for user:", profile.username);
    try {
        const guildMemberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${process.env.GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (guildMemberResponse.ok) {
            const memberData = await guildMemberResponse.json();
            profile.roles = memberData.roles || [];
            console.log(`Found ${profile.roles.length} roles for user.`);
        } else {
            profile.roles = [];
            console.warn(`Could not fetch member data for guild ${process.env.GUILD_ID}. User might not be in the server.`);
        }
        
        return done(null, profile);
    } catch (err) {
        console.error("Error in Discord strategy:", err);
        return done(err, null);
    }
}));

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', {
    failureRedirect: `${process.env.FRONTEND_URL}?login=failed`
}), (req, res) => {
    console.log("Authentication successful, redirecting to frontend.");
    res.redirect(process.env.FRONTEND_URL);
});

// A route for the frontend to check if the user is logged in
router.get('/me', (req, res) => {
    // --- NEW DEBUGGING LOGS ---
    console.log('--- /auth/me endpoint hit ---');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('Is authenticated:', req.isAuthenticated());
    console.log('User object from session:', req.user);
    // --- END DEBUGGING LOGS ---

    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { 
            console.error("Error during logout:", err);
            return next(err); 
        }
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
            }
            res.clearCookie('connect.sid');
            console.log("User logged out and session destroyed.");
            res.redirect(process.env.FRONTEND_URL);
        });
    });
});

module.exports = router;
