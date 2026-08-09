const router = require('express').Router();
const fetch = require('node-fetch');

// Cache in memory for 30 seconds to stay fresh without rate-limiting YouTube
let streamCache = {
    timestamp: 0,
    data: []
};

// GET /api/streams - Fetch currently active live streams matching #lsr or #lsreborn
router.get('/', async (req, res) => {
    const now = Date.now();

    // Cache check (30 seconds)
    if (streamCache.data && (now - streamCache.timestamp) < 30000) {
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

        if (apiKey) {
            streams = await fetchYouTubeApiLive(apiKey);
        }

        // If no API key or API returns no streams, attempt live scraping from YouTube search
        if (streams.length === 0) {
            streams = await scrapeRealYouTubeLive();
        }

        // Cache result (NO fake fallback streams generated!)
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
        console.error("[STREAMS] Error fetching live streams:", err);
        return res.json({
            success: true,
            count: 0,
            streams: []
        });
    }
});

// Official YouTube Data API v3 Search
async function fetchYouTubeApiLive(apiKey) {
    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent('#lsr OR #lsreborn')}&maxResults=15&key=${apiKey}`;
        const res = await fetch(searchUrl);
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.items || !Array.isArray(data.items)) return [];

        return data.items.map(item => {
            const videoId = item.id.videoId;
            const title = item.snippet.title || "";
            const channelTitle = item.snippet.channelTitle || "";
            const thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            return {
                id: videoId,
                title: title,
                channelTitle: channelTitle,
                channelId: item.snippet.channelId,
                thumbnail: thumbnail,
                isLive: true,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
            };
        });
    } catch (e) {
        console.error("[STREAMS] API Fetch Error:", e.message);
        return [];
    }
}

// Scrape YouTube live search results for #lsreborn and #lsr
async function scrapeRealYouTubeLive() {
    const results = [];
    const seenIds = new Set();

    const queries = ['%23lsreborn+live', '%23lsr+live'];

    for (const query of queries) {
        try {
            const searchUrl = `https://www.youtube.com/results?search_query=${query}&sp=CAMSAkAB`;
            const scrapeRes = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            if (!scrapeRes.ok) continue;

            const html = await scrapeRes.text();
            const matches = html.match(/ytInitialData\s*=\s*({.+?});/);
            if (!matches || !matches[1]) continue;

            const data = JSON.parse(matches[1]);
            const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
            
            if (!Array.isArray(contents)) continue;

            for (const item of contents) {
                const video = item.videoRenderer;
                if (!video || !video.videoId) continue;
                if (seenIds.has(video.videoId)) continue;

                // Check if video is strictly LIVE NOW
                const badges = video.badges || [];
                const isLive = badges.some(b => 
                    b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' || 
                    b.metadataBadgeRenderer?.label === 'LIVE'
                ) || (video.viewCountText?.runs?.[0]?.text || '').toLowerCase().includes('watching');

                if (!isLive) continue;

                const title = video.title?.runs?.[0]?.text || "";
                const channelTitle = video.ownerText?.runs?.[0]?.text || "";

                // Verify hashtag matches #lsr or #lsreborn in title
                const titleLower = title.toLowerCase();
                if (!titleLower.includes('#lsr') && !titleLower.includes('#lsreborn')) continue;

                // Extract exact thumbnail & channel avatar
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
        } catch (e) {
            console.error("[STREAMS] Scraping error for query", query, e.message);
        }
    }

    return results;
}

module.exports = router;
