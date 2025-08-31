const router = require('express').Router();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fetch = require('node-fetch');
require('dotenv').config();

if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.GUILD_ID) {
    console.error("ERROR: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and GUILD_ID must be set in your .env file.");
    process.exit(1);
}

passport.serializeUser((user, done) => {
    console.log("Serializing User:", user.username);
    done(null, user);
});

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

            // Add staff/admin flags to the user's session profile
            profile.isStaff = profile.roles.includes(process.env.STAFF_ROLE_ID);
            profile.isAdmin = profile.roles.includes(process.env.LSR_ADMIN_ROLE_ID);

            // An admin is also considered staff
            if (profile.isAdmin) {
                profile.isStaff = true;
            }

        } else {
            profile.roles = [];
            profile.isStaff = false;
            profile.isAdmin = false;
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

router.get('/me', (req, res) => {
    console.log("--- /auth/me endpoint hit ---");
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("User object from session:", req.user);

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