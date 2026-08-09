const router = require('express').Router();
const fetch = require('node-fetch');
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// Admin middleware check
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.id === "444043711094194200")) {
        return next();
    }
    return res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Initialize active_streams DB table for manual staff pinning
const initStreamsTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS active_streams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                video_id VARCHAR(100) NOT NULL UNIQUE,
                title VARCHAR(255),
                channel_title VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        console.error("[STREAMS DB] Init error:", e);
    }
};
initStreamsTable();

// Cache in memory for 15 seconds
let streamCache = {
    timestamp: 0,
    data: []
};

// Strict Hashtag Checker: Stream MUST contain literal #lsr or #lsreborn hashtag
function containsRequiredHashtag(title = '', desc = '') {
    const text = (title + ' ' + desc).toLowerCase();
    return text.includes('#lsr') || text.includes('#lsreborn');
}

// GET /api/streams - Fetch currently active live streams containing #lsr or #lsreborn hashtag
router.get('/', async (req, res) => {
    const now = Date.now();

    // Cache check (15 seconds)
    if (streamCache.data && (now - streamCache.timestamp) < 15000) {
        return res.json({
            success: true,
            cached: true,
            count: streamCache.data.length,
            streams: streamCache.data
        });
    }

    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        let streams = [];
        const seenIds = new Set();

        // 1. Fetch manually pinned streams from DB first (Admin approved)
        try {
            const [dbRows] = await db.query('SELECT * FROM active_streams ORDER BY id DESC');
            for (const row of dbRows) {
                const info = await fetchYouTubeVideoDetails(row.video_id);
                if (info) {
                    seenIds.add(row.video_id);
                    streams.push(info);
                }
            }
        } catch (dbErr) {
            console.error("[STREAMS DB] Error fetching pinned streams:", dbErr);
        }

        // 2. Official YouTube Data API v3 (if YOUTUBE_API_KEY present)
        if (apiKey) {
            const apiStreams = await fetchYouTubeApiLive(apiKey, seenIds);
            streams = streams.concat(apiStreams);
        }

        // 3. Robust YouTube Search Scraper with Strict Hashtag Verification
        const scrapedStreams = await scrapeYouTubeLiveRecursive(seenIds);
        streams = streams.concat(scrapedStreams);

        // Update cache
        streamCache = {
            timestamp: now,
            data: streams
        };

        return res.json({
            success: true,
            cached: false,
            count: streams.length,
            streams: streams
        });

    } catch (err) {
        console.error("[STREAMS] Global fetch error:", err);
        return res.json({
            success: true,
            count: 0,
            streams: []
        });
    }
});

// Admin endpoint: POST /api/streams/pin
router.post('/pin', isAuthenticated, isAdmin, async (req, res) => {
    const { video_url } = req.body;
    if (!video_url) {
        return res.status(400).json({ message: "Video URL or Video ID is required." });
    }

    let videoId = video_url.trim();
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = videoId.match(regExp);
        if (match && match[2].length === 11) {
            videoId = match[2];
        }
    }

    try {
        const details = await fetchYouTubeVideoDetails(videoId);
        await db.query('INSERT INTO active_streams (video_id, title, channel_title) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), channel_title=VALUES(channel_title)', [
            videoId,
            details ? details.title : "Live Stream",
            details ? details.channelTitle : "Streamer"
        ]);

        streamCache.timestamp = 0;
        return res.json({
            success: true,
            message: "Live stream pinned successfully!",
            stream: details
        });
    } catch (e) {
        console.error("[STREAMS DB] Pin Error:", e);
        res.status(500).json({ message: "Failed to pin stream to database." });
    }
});

// Admin endpoint: DELETE /api/streams/pin/:videoId
router.delete('/pin/:videoId', isAuthenticated, isAdmin, async (req, res) => {
    const { videoId } = req.params;
    try {
        await db.query('DELETE FROM active_streams WHERE video_id = ?', [videoId]);
        streamCache.timestamp = 0;
        res.json({ success: true, message: "Stream unpinned successfully." });
    } catch (e) {
        res.status(500).json({ message: "Failed to unpin stream." });
    }
});

// Helper: Fetch oEmbed details for a single video ID
async function fetchYouTubeVideoDetails(videoId) {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
            const data = await res.json();
            return {
                id: videoId,
                title: data.title || "Live Stream",
                channelTitle: data.author_name || "Streamer",
                avatar: "",
                thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                isLive: true,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
            };
        }
    } catch (e) {
        console.warn("[STREAMS] oEmbed error for", videoId, e.message);
    }
    return null;
}

// Official YouTube Data API v3 Search with Strict Hashtag Check
async function fetchYouTubeApiLive(apiKey, seenIds) {
    const results = [];
    const queries = ['#lsr', '#lsreborn'];

    for (const q of queries) {
        try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(q)}&maxResults=10&key=${apiKey}`;
            const res = await fetch(searchUrl);
            if (!res.ok) continue;

            const data = await res.json();
            if (data.items && Array.isArray(data.items)) {
                for (const item of data.items) {
                    const videoId = item.id.videoId;
                    if (!videoId || seenIds.has(videoId)) continue;

                    const title = item.snippet.title || "";
                    const desc = item.snippet.description || "";

                    // Strict hashtag verification check
                    if (!containsRequiredHashtag(title, desc)) continue;

                    seenIds.add(videoId);
                    results.push({
                        id: videoId,
                        title: title,
                        channelTitle: item.snippet.channelTitle || "",
                        channelId: item.snippet.channelId,
                        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        isLive: true,
                        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
                    });
                }
            }
        } catch (e) {
            console.error("[STREAMS] API Error:", e.message);
        }
    }
    return results;
}

// Robust YouTube Search Scraper with Strict Hashtag Verification
async function scrapeYouTubeLiveRecursive(seenIds) {
    const results = [];
    const queries = ['%23lsr', '%23lsreborn'];

    for (const query of queries) {
        try {
            const searchUrl = `https://www.youtube.com/results?search_query=${query}&sp=CAMSAkAB`;
            const scrapeRes = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (!scrapeRes.ok) continue;

            const html = await scrapeRes.text();
            const matches = html.match(/ytInitialData\s*=\s*({.+?});/);
            if (!matches || !matches[1]) continue;

            const data = JSON.parse(matches[1]);
            
            // Recursive object tree search with strict hashtag verification
            function searchObj(obj) {
                if (!obj || typeof obj !== 'object') return;
                if (obj.videoId && !seenIds.has(obj.videoId)) {
                    const jsonStr = JSON.stringify(obj);
                    const isLive = jsonStr.includes('BADGE_STYLE_TYPE_LIVE_NOW') || 
                                   jsonStr.includes('"label":"LIVE"') ||
                                   jsonStr.includes('watching');
                    if (isLive) {
                        const title = obj.title?.runs?.[0]?.text || obj.headline?.runs?.[0]?.text || "";
                        const owner = obj.ownerText?.runs?.[0]?.text || obj.shortBylineText?.runs?.[0]?.text || "Streamer";
                        const desc = (obj.descriptionSnippet?.runs || []).map(r => r.text).join(' ');

                        // Strict hashtag verification check
                        if (containsRequiredHashtag(title, desc) || containsRequiredHashtag(jsonStr)) {
                            seenIds.add(obj.videoId);
                            const thumbnails = obj.thumbnail?.thumbnails || [];
                            const thumbnail = thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${obj.videoId}/hqdefault.jpg`;
                            const avatar = obj.channelThumbnailSupportedRenderers?.channelThumbnailWithRippleRenderer?.thumbnail?.thumbnails?.[0]?.url || "";

                            results.push({
                                id: obj.videoId,
                                title: title || "Live Stream",
                                channelTitle: owner,
                                avatar: avatar,
                                thumbnail: thumbnail,
                                isLive: true,
                                videoUrl: `https://www.youtube.com/watch?v=${obj.videoId}`,
                                embedUrl: `https://www.youtube.com/embed/${obj.videoId}?autoplay=1`
                            });
                        }
                    }
                }
                for (const key of Object.keys(obj)) {
                    searchObj(obj[key]);
                }
            }

            searchObj(data);

        } catch (e) {
            console.error("[STREAMS] Recursive scraper error for query", query, e.message);
        }
    }

    return results;
}

module.exports = router;
