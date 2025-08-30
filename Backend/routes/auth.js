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
    done(null, user);
});

// This function tells Passport how to get the full user details from the session.
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/discord/callback`,
    scope: ['identify', 'guilds', 'guilds.members.read'] // guilds.members.read is crucial for getting roles
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Use the access token to get the user's roles for YOUR specific server
        const guildMemberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${process.env.GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (guildMemberResponse.ok) {
            const memberData = await guildMemberResponse.json();
            profile.roles = memberData.roles || [];
            
            // Check for Admin and Staff roles
            profile.isAdmin = profile.roles.includes(process.env.LSR_ADMIN_ROLE_ID);
            // An admin is always considered staff
            profile.isStaff = profile.roles.includes(process.env.STAFF_ROLE_ID) || profile.isAdmin;

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

// The route the user clicks on to start the login process
router.get('/discord', passport.authenticate('discord'));

// The route Discord redirects the user back to after they approve the login
router.get('/discord/callback', passport.authenticate('discord', {
    failureRedirect: `${process.env.FRONTEND_URL}?login=failed` // If they cancel, send them back
}), (req, res) => {
    res.redirect(process.env.FRONTEND_URL);
});

// A route for the frontend to check if the user is logged in
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// The logout route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect(process.env.FRONTEND_URL);
        });
    });
});

module.exports = router;