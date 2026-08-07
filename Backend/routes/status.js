const router = require('express').Router();
const fetch = require('node-fetch');

// Make sure this is the correct, direct URL to your JSON file
const SERVER_STATUS_JSON_URL = process.env.FIVEM_SERVER_URL || 'http://15.235.128.114:32120/players.json';
const DYNAMIC_JSON_URL = process.env.FIVEM_DYNAMIC_URL || 'http://15.235.128.114:32120/dynamic.json';

router.get('/', async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(SERVER_STATUS_JSON_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch status file: ${response.statusText}`);
        }
        const data = await response.json();
        const playerCount = Array.isArray(data) ? data.length : (data.players ? data.players.length : 0);

        let maxPlayers = 128;
        try {
            const dynamicController = new AbortController();
            const dynTimeoutId = setTimeout(() => dynamicController.abort(), 3000);
            const dynRes = await fetch(DYNAMIC_JSON_URL, { signal: dynamicController.signal });
            clearTimeout(dynTimeoutId);

            if (dynRes.ok) {
                const dynData = await dynRes.json();
                if (dynData.sv_maxclients) {
                    maxPlayers = parseInt(dynData.sv_maxclients, 10) || 128;
                }
            }
        } catch(dErr) {
            // Non-critical if dynamic.json fails
        }

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