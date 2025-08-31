const router = require('express').Router();
const fetch = require('node-fetch');

const SERVER_STATUS_JSON_URL = 'YOUR_PUBLIC_JSON_URL_HERE'; // Replace with your actual URL

router.get('/', async (req, res) => {
    console.log('--- /api/status endpoint was hit ---');
    try {
        const response = await fetch(SERVER_STATUS_JSON_URL);
        if (!response.ok) {
            console.error(`Failed to fetch status file, status: ${response.status}`);
            throw new Error(`Failed to fetch status file: ${response.statusText}`);
        }
        const data = await response.json();

        // Adjust these lines to match your JSON file's structure
        const playerCount = Array.isArray(data) ? data.length : (data.players ? data.players.length : 0);
        const maxPlayers = data.sv_maxclients || 128; 
        
        res.json({
            online: true,
            players: playerCount,
            maxPlayers: maxPlayers 
        });
    } catch (error) {
        console.error("Error in /api/status route:", error);
        res.json({
            online: false,
            players: 0,
            maxPlayers: 0
        });
    }
});

module.exports = router;