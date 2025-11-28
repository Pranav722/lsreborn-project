const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    // We are now getting the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add user payload to the request object
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ message: 'Not authenticated: Invalid token' });
    }
};

module.exports = { isAuthenticated };