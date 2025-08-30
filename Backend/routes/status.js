const router = require('express').Router();
const fetch = require('node-fetch');

const TXADMIN_URL = 'http://104.234.180.52:20059/players.json';

router.get('/', async (req, res) => {
    try {
        const response = await fetch(TXADMIN_URL);
        if (!response.ok) {
            throw new Error(`txAdmin returned an error: ${response.statusText}`);
        }
        const players = await response.json();
        const maxPlayers = 269; 

        res.json({
            online: true,
            players: players.length,
            maxPlayers: maxPlayers 
        });
    } catch (error) {
        res.json({
            online: false,
            players: 0,
            maxPlayers: 0
        });
    }
});

module.exports = router;