const router = require('express').Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');
require('dotenv').config();

// In-memory queue storage.
let queues = {
    staff: [], police: [], ems: [], premium: [], prime: [], elite: [],
    pro: [], starter: [], rookie: [], normal: []
};

const roleToQueueMap = {
    [process.env.STAFF_ROLE_ID]: 'staff',
    [process.env.SALE_ROLE_ID]: 'police',
    [process.env.EMS_ROLE_ID]: 'ems',
    [process.env.PREMIUM_ROLE_ID]: 'premium',
    [process.env.PRIME_ROLE_ID]: 'prime',
    [process.env.ELITE_ROLE_ID]: 'elite',
    [process.env.PRO_ROLE_ID]: 'pro',
    [process.env.STARTER_ROLE_ID]: 'starter',
    [process.env.ROOKIE_ROLE_ID]: 'rookie',
    [process.env.WHITELISTED_ROLE_ID]: 'normal'
};

const priorityOrder = ['staff', 'police', 'ems', 'premium', 'prime', 'elite', 'pro', 'starter', 'rookie', 'normal'];

// This function simulates processing the queue
setInterval(async () => {
    for (const type of priorityOrder) {
        if (queues[type].length > 0) {
            const userId = queues[type].shift(); // Remove the first person
            console.log(`Processing user ${userId} from ${type} queue.`);
            
            // Add to priority_queue table with a 5-minute expiry
            try {
                const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now
                await db.query(
                    'INSERT INTO priority_queue (discord_id, expiry_timestamp) VALUES (?, ?) ON DUPLICATE KEY UPDATE expiry_timestamp = ?',
                    [userId, expiryTime, expiryTime]
                );
                console.log(`User ${userId} granted 5-minute server access.`);
            } catch (error) {
                console.error(`Failed to grant priority access to user ${userId}:`, error);
            }
            return; // Only process one user per interval
        }
    }
}, 30 * 1000); // Process one person every 30 seconds

router.get('/status', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    for (const type of priorityOrder) {
        const position = queues[type].indexOf(userId);
        if (position !== -1) {
            return res.json({
                inQueue: true,
                type: type,
                position: position + 1,
                total: queues[type].length
            });
        }
    }
    res.json({ inQueue: false });
});

router.post('/join', isAuthenticated, (req, res) => {
    const userRoles = req.user.roles || [];
    const userId = req.user.id;

    // Determine the user's highest priority queue
    let highestQueue = 'normal'; // Default queue
    for (const type of priorityOrder) {
        const roleId = Object.keys(roleToQueueMap).find(key => roleToQueueMap[key] === type);
        if (roleId && userRoles.includes(roleId)) {
            highestQueue = type;
            break; // Stop at the first (highest priority) match
        }
    }
    
    // Remove from any other queue first
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }
    
    // Add to the highest priority queue
    if (!queues[highestQueue].includes(userId)) {
        queues[highestQueue].push(userId);
    }
    
    res.status(200).json({ message: `Joined ${highestQueue} queue.` });
});


router.post('/leave', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }
    res.status(200).json({ message: 'Left all queues.' });
});

module.exports = router;