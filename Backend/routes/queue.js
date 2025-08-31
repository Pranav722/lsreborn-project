const router = require('express').Router();
const db = require('../db');
require('dotenv').config();

// In-memory queue storage (replace with Redis in production for scalability)
let queues = { 
    staff: [], 
    pd: [], 
    ems: [], 
    premium: [], 
    prime: [], 
    elite: [], 
    pro: [], 
    starter: [], 
    rookie: [], 
    normal: [] 
};

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// The order of priority, from highest to lowest
const PRIORITY_ORDER = [
    { name: 'staff', roleId: process.env.STAFF_ROLE_ID },
    { name: 'pd', roleId: process.env.SALE_ROLE_ID },
    { name: 'ems', roleId: process.env.EMS_ROLE_ID },
    { name: 'premium', roleId: process.env.PREMIUM_ROLE_ID },
    { name: 'prime', roleId: process.env.PRIME_ROLE_ID },
    { name: 'elite', roleId: process.env.ELITE_ROLE_ID },
    { name: 'pro', roleId: process.env.PRO_ROLE_ID },
    { name: 'starter', roleId: process.env.STARTER_ROLE_ID },
    { name: 'rookie', roleId: process.env.ROOKIE_ROLE_ID },
    { name: 'normal', roleId: process.env.WHITELISTED_ROLE_ID },
];

router.get('/status', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    for (const type in queues) {
        const position = queues[type].indexOf(userId);
        if (position !== -1) {
            return res.json({ inQueue: true, type, position: position + 1, total: queues[type].length });
        }
    }
    res.json({ inQueue: false, type: null, position: 0, total: 0 });
});

router.post('/join', isAuthenticated, (req, res) => {
    const { queueType } = req.body;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    const queueInfo = PRIORITY_ORDER.find(q => q.name === queueType);

    if (!queueInfo) {
        return res.status(400).json({ message: 'Invalid queue type' });
    }

    // Admins and staff can join any queue they want
    const isStaffOrAdmin = userRoles.includes(process.env.STAFF_ROLE_ID) || userRoles.includes(process.env.LSR_ADMIN_ROLE_ID);
    
    // Check eligibility
    if (!userRoles.includes(queueInfo.roleId) && !isStaffOrAdmin) {
        return res.status(403).json({ message: `You are not eligible to join the ${queueType} queue.` });
    }
    
    // Remove from any other queue first
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }

    // Add to the assigned queue
    if (!queues[queueType].includes(userId)) {
        queues[queueType].push(userId);
    }
    
    res.status(200).json({ message: `Joined ${queueType} queue` });
});

router.post('/leave', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }
    res.status(200).json({ message: 'Left the queue' });
});

// Simulate processing the queue
setInterval(async () => {
    for (const queue of PRIORITY_ORDER) {
        if (queues[queue.name].length > 0) {
            const userId = queues[queue.name].shift(); // Remove the first person
            console.log(`Processing user ${userId} from ${queue.name} queue.`);
            
            // Add user to the database priority list with a 5-minute expiry
            const expiryTimestamp = Date.now() + (5 * 60 * 1000);
            try {
                await db.query(
                    'INSERT INTO priority_queue (discord_id, expiry_timestamp) VALUES (?, ?) ON DUPLICATE KEY UPDATE expiry_timestamp = ?',
                    [userId, expiryTimestamp, expiryTimestamp]
                );
                console.log(`User ${userId} added to database priority list.`);
            } catch (error) {
                console.error("Error adding user to priority_queue table:", error);
            }
            return; // Only process one person per interval
        }
    }
}, 30000); // Process one person every 30 seconds

module.exports = router;