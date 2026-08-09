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

// GET /api/streams - Fetch currently active live streams
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

        // 1. Fetch manually pinned streams from DB first
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

        // 2. Official YouTube Data API v3 (if key provided in .env)
        if (apiKey) {
            const apiStreams = await fetchYouTubeApiLive(apiKey, seenIds);
            streams = streams.concat(apiStreams);
        }

        // 3. Piped / Invidious Open YouTube REST APIs (Cloud-safe, bypasses bot blocks)
        const pipedStreams = await fetchPipedYouTubeLive(seenIds);
        streams = streams.concat(pipedStreams);

        // 4. Direct YouTube HTML Scraper fallback
        if (streams.length === 0) {
            const scrapedStreams = await scrapeRealYouTubeLive(seenIds);
            streams = streams.concat(scrapedStreams);
        }

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

// Helper: Fetch oEmbed details for a video ID
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

// Fetch via Piped & Invidious Public REST APIs
async function fetchPipedYouTubeLive(seenIds) {
    const results = [];
    const queries = ['%23lsreborn', '%23lsr', 'lsreborn', 'lsr'];
    const pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://api.piped.video',
        'https://inv.tux.pizza/api/v1',
        'https://invidious.drgns.space/api/v1'
    ];

    for (const query of queries) {
        for (const baseApi of pipedInstances) {
            try {
                const searchUrl = baseApi.includes('invidious') || baseApi.includes('inv.')
                    ? `${baseApi}/search?q=${query}&type=stream`
                    : `${baseApi}/search?q=${query}&filter=lives`;

                const res = await fetch(searchUrl, { timeout: 3000 });
                if (!res.ok) continue;

                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.items || []);

                for (const item of items) {
                    const videoId = item.url ? item.url.replace('/watch?v=', '') : (item.videoId || item.id);
                    if (!videoId || videoId.length !== 11 || seenIds.has(videoId)) continue;

                    // Check live status
                    const isLive = item.isLive || item.uploaded === 0 || item.type === 'stream' && (item.title || '').toLowerCase().includes('live') || item.duration === 0;
                    if (!isLive) continue;

                    seenIds.add(videoId);
                    results.push({
                        id: videoId,
                        title: item.title || "Live Stream",
                        channelTitle: item.uploaderName || item.author || item.uploader || "Streamer",
                        avatar: item.uploaderAvatar || item.authorAvatar || "",
                        thumbnail: item.thumbnail || item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        isLive: true,
                        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
                    });
                }

                if (results.length > 0) break; // Break instance loop if succeeded
            } catch (e) {
                // Try next instance silently
            }
        }
    }

    return results;
}

// Official YouTube Data API v3 Search
async function fetchYouTubeApiLive(apiKey, seenIds) {
    const results = [];
    const queries = ['#lsreborn', '#lsr', 'lsreborn', 'lsr'];

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

                    seenIds.add(videoId);
                    results.push({
                        id: videoId,
                        title: item.snippet.title || "",
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

// Direct YouTube HTML Scraper
async function scrapeRealYouTubeLive(seenIds) {
    const results = [];
    const queries = ['%23lsreborn+live', '%23lsr+live', 'lsreborn+live', 'lsr+live'];

    for (const query of queries) {
        try {
            const searchUrl = `https://www.youtube.com/results?search_query=${query}&sp=CAMSAkAB`;
            const scrapeRes = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (!scrapeRes.ok) continue;

            const html = await scrapeRes.text();

            const matches = html.match(/ytInitialData\s*=\s*({.+?});/);
            if (matches && matches[1]) {
                const data = JSON.parse(matches[1]);
                parseYouTubeSectionList(data, results, seenIds);
            }

            // Regex videoId extraction fallback
            const videoRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
            let m;
            while ((m = videoRegex.exec(html)) !== null) {
                const vid = m[1];
                if (!seenIds.has(vid)) {
                    const contextWindow = html.substring(Math.max(0, m.index - 500), Math.min(html.length, m.index + 1000));
                    const isLiveContext = contextWindow.includes("BADGE_STYLE_TYPE_LIVE_NOW") || contextWindow.includes('"label":"LIVE"') || contextWindow.includes("watching");

                    if (isLiveContext) {
                        const details = await fetchYouTubeVideoDetails(vid);
                        if (details) {
                            seenIds.add(vid);
                            results.push(details);
                        }
                    }
                }
            }

        } catch (e) {
            console.error("[STREAMS] Scraper error for query", query, e.message);
        }
    }

    return results;
}

// Deep JSON parsing helper for YouTube Initial Data
function parseYouTubeSectionList(data, results, seenIds) {
    try {
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (!Array.isArray(contents)) return;

        for (const section of contents) {
            const items = section.itemSectionRenderer?.contents;
            if (!Array.isArray(items)) continue;

            for (const item of items) {
                const video = item.videoRenderer;
                if (!video || !video.videoId) continue;
                if (seenIds.has(video.videoId)) continue;

                // Check live badge
                const badges = video.badges || [];
                const isLive = badges.some(b => 
                    b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' || 
                    b.metadataBadgeRenderer?.label === 'LIVE'
                ) || (video.viewCountText?.runs?.[0]?.text || '').toLowerCase().includes('watching');

                if (!isLive) continue;

                const title = video.title?.runs?.[0]?.text || "";
                const channelTitle = video.ownerText?.runs?.[0]?.text || "";
                const thumbnails = video.thumbnail?.thumbnails || [];
                const thumbnail = thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                const avatar = video.channelThumbnailSupportedRenderers?.channelThumbnailWithRippleRenderer?.thumbnail?.thumbnails?.[0]?.url || "";

                seenIds.add(video.videoId);
                results.push({
                    id: video.videoId,
                    title: title,
                    channelTitle: channelTitle,
                    avatar: avatar,
                    thumbnail: thumbnail,
                    isLive: true,
                    videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${video.videoId}?autoplay=1`
                });
            }
        }
    } catch (e) {
        console.warn("[STREAMS] Section parser error:", e.message);
    }
}

module.exports = router;
