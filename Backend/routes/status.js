const router = require('express').Router();
const fetch = require('node-fetch');

// Make sure this is the correct, direct URL to your JSON file
const SERVER_STATUS_JSON_URL = 'http://104.234.180.52:20059/players.json'; // Replace with your actual URL

router.get('/', async (req, res) => {
    try {
        const response = await fetch(SERVER_STATUS_JSON_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch status file: ${response.statusText}`);
        }
        const data = await response.json();

        // Adjust these lines to match your JSON file's structure
        const playerCount = Array.isArray(data) ? data.length : (data.players ? data.players.length : 0);
        const maxPlayers = data.sv_maxclients || data.maxPlayers || 128; // Look for common keys, default to 128
        
        res.json({
            online: true,
            players: playerCount,
            maxPlayers: maxPlayers
        });
    } catch (error) {
        console.error("Error fetching server status:", error.message);
        res.json({
            online: false,
            players: 0,
            maxPlayers: 0
        });
    }
});

module.exports = router;