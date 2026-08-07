const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    let token = null;

    // 1. Check Authorization Header (Bearer TOKEN)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HTTP-only Cookie
    if ((!token || token === 'null' || token === 'undefined') && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Clean up quotes or whitespace if present
    if (token) {
        token = token.trim().replace(/^["']|["']$/g, '');
    }

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'Not authenticated: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '943BAB4844654');
        req.user = decoded.user || decoded; // Add user payload to request object
        next();
    } catch (err) {
        console.error("[AUTH] JWT Verification Error:", err.message);
        return res.status(401).json({ message: 'Not authenticated: Invalid token' });
    }
};

module.exports = { isAuthenticated };