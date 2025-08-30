const router = require('express').Router();
require('dotenv').config();

// In-memory queue storage (replace with a database or Redis in production)
let queues = { staff: [], police: [], ems: [], premium: [], prime: [], elite: [], pro: [], starter: [], rookie: [], normal: [] };

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

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
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Define role IDs from .env
    const roleIds = {
        staff: process.env.STAFF_ROLE_ID,
        police: process.env.SALE_ROLE_ID,
        ems: process.env.EMS_ROLE_ID,
        premium: process.env.PREMIUM_ROLE_ID,
        prime: process.env.PRIME_ROLE_ID,
        elite: process.env.ELITE_ROLE_ID,
        pro: process.env.PRO_ROLE_ID,
        starter: process.env.STARTER_ROLE_ID,
        rookie: process.env.ROOKIE_ROLE_ID,
        normal: process.env.WHITELISTED_ROLE_ID
    };
    
    const priorityOrder = ['staff', 'police', 'ems', 'premium', 'prime', 'elite', 'pro', 'starter', 'rookie', 'normal'];
    
    let assignedQueue = null;
    for (const queueType of priorityOrder) {
        if (userRoles.includes(roleIds[queueType])) {
            assignedQueue = queueType;
            break; // Found the highest priority queue
        }
    }

    if (!assignedQueue) {
        return res.status(403).json({ message: 'You are not whitelisted and cannot join the queue.' });
    }
    
    // Remove user from any existing queue
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }

    // Add to the determined queue
    if (queues[assignedQueue] && !queues[assignedQueue].includes(userId)) {
        queues[assignedQueue].push(userId);
    }
    
    res.status(200).json({ success: true, joinedQueue: assignedQueue });
});

router.post('/leave', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    for (const type in queues) {
        queues[type] = queues[type].filter(id => id !== userId);
    }
    res.status(200).json({ success: true });
});

module.exports = router;