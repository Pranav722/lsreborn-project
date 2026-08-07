const router = require('express').Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// Middleware to verify admin permissions
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.id === "444043711094194200")) {
        return next();
    }
    return res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Initialize Table
const initializeCatalogTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS catalog_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price_coins INT NOT NULL DEFAULT 0,
                image_url VARCHAR(500) NOT NULL,
                category VARCHAR(50) DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("[CATALOG] Table catalog_items initialized successfully.");
    } catch (e) {
        console.error("[CATALOG] Table Init Error:", e);
    }
};

initializeCatalogTable();

const fetch = require('node-fetch');
const crypto = require('crypto');

// POST upload image directly to Cloudinary API (Admin only)
router.post('/upload', isAuthenticated, isAdmin, async (req, res) => {
    const { image, upload_preset } = req.body;
    if (!image) {
        return res.status(400).json({ message: "Image data is required." });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "n8ql5bui";
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const preset = upload_preset || process.env.CLOUDINARY_UPLOAD_PRESET;
    const folder = process.env.CLOUDINARY_FOLDER || "LSR";

    try {
        const formData = new URLSearchParams();
        formData.append('file', image);
        formData.append('folder', folder);

        if (preset) {
            formData.append('upload_preset', preset);
        } else if (apiKey && apiSecret) {
            const timestamp = Math.floor(Date.now() / 1000);
            // Cloudinary signature requires parameters in alphabetical order: folder, timestamp
            const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
        } else {
            console.warn("[CLOUDINARY] Missing CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET. Please add Cloudinary credentials in Render environment variables!");
            formData.append('upload_preset', 'ml_default');
        }

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const cloudData = await cloudRes.json();

        if (cloudRes.ok && cloudData.secure_url) {
            console.log(`[CLOUDINARY] Image successfully uploaded to Cloudinary: ${cloudData.secure_url}`);
            return res.json({
                success: true,
                url: cloudData.secure_url,
                public_id: cloudData.public_id
            });
        } else {
            console.error("[CLOUDINARY] Upload Error Response:", cloudData);
            return res.status(cloudRes.status || 500).json({
                message: cloudData.error ? cloudData.error.message : "Cloudinary upload failed. Check your Cloudinary API keys on Render.",
                details: cloudData
            });
        }
    } catch (err) {
        console.error("[CLOUDINARY] Server Error during Cloudinary upload:", err);
        res.status(500).json({ message: "Server error uploading image to Cloudinary." });
    }
});

// GET all catalog items (Public / Authenticated)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM catalog_items ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error("[CATALOG] Error fetching items:", err);
        res.status(500).json({ message: "Server Error fetching catalog items" });
    }
});

// POST add new catalog item (Admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { name, description, price_coins, image_url, category } = req.body;

    if (!name || !image_url || price_coins === undefined) {
        return res.status(400).json({ message: "Item name, image URL, and price in LSR Coins are required." });
    }

    try {
        const itemCategory = category && category.trim() !== '' ? category.trim() : 'General';
        const parsedPrice = parseInt(price_coins, 10) || 0;

        const query = 'INSERT INTO catalog_items (name, description, price_coins, image_url, category) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [name.trim(), description ? description.trim() : '', parsedPrice, image_url.trim(), itemCategory]);

        res.status(201).json({
            success: true,
            message: "Catalog item added successfully!",
            item: {
                id: result.insertId,
                name: name.trim(),
                description: description ? description.trim() : '',
                price_coins: parsedPrice,
                image_url: image_url.trim(),
                category: itemCategory
            }
        });
    } catch (err) {
        console.error("[CATALOG] Error adding item:", err);
        res.status(500).json({ message: "Database Error adding item" });
    }
});

// PUT update catalog item (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, price_coins, image_url, category } = req.body;

    if (!name || !image_url || price_coins === undefined) {
        return res.status(400).json({ message: "Item name, image URL, and price in LSR Coins are required." });
    }

    try {
        const itemCategory = category && category.trim() !== '' ? category.trim() : 'General';
        const parsedPrice = parseInt(price_coins, 10) || 0;

        const query = 'UPDATE catalog_items SET name = ?, description = ?, price_coins = ?, image_url = ?, category = ? WHERE id = ?';
        const [result] = await db.query(query, [name.trim(), description ? description.trim() : '', parsedPrice, image_url.trim(), itemCategory, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Catalog item not found" });
        }

        res.json({ success: true, message: "Catalog item updated successfully!" });
    } catch (err) {
        console.error("[CATALOG] Error updating item:", err);
        res.status(500).json({ message: "Database Error updating item" });
    }
});

// DELETE catalog item (Admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM catalog_items WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Catalog item not found" });
        }
        res.json({ success: true, message: "Catalog item deleted successfully!" });
    } catch (err) {
        console.error("[CATALOG] Error deleting item:", err);
        res.status(500).json({ message: "Database Error deleting item" });
    }
});

module.exports = router;
