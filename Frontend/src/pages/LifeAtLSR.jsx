import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Tv, Radio, Users, Play, RefreshCw, ExternalLink, X, Search, Sparkles, Filter, ShieldCheck, Video } from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

const LifeAtLSR = () => {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [activeStream, setActiveStream] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://lsreborn-backend.onrender.com';

    // Lock body scroll when modal is active
    useEffect(() => {
        if (activeStream) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeStream]);

    const fetchLiveStreams = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/streams?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setStreams(Array.isArray(data.streams) ? data.streams : []);
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error("Error fetching live streams:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveStreams();
        // Auto refresh live streams every 60 seconds
        const interval = setInterval(fetchLiveStreams, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredStreams = streams.filter(stream => {
        const matchesSearch = stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              stream.channelTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag === 'All' || 
                           (selectedTag === '#lsreborn' && stream.hashtag === '#lsreborn') ||
                           (selectedTag === '#lsr' && stream.hashtag === '#lsr');
        return matchesSearch && matchesTag;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
            {/* Hero Section - GenZ Futuristic Cyberpunk Aesthetics */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-gray-950 via-slate-900 to-cyan-950/60 p-6 sm:p-8 md:p-10 border border-cyan-500/20 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/10">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span>LIVE BROADCAST HUB</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                        Life at <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">LSR</span>
                    </h1>

                    <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl">
                        Watch real-time live streams from community creators broadcasting directly from LSReborn on YouTube with <strong className="text-cyan-400">#lsr</strong> and <strong className="text-cyan-400">#lsreborn</strong>.
                    </p>

                    {/* Stats & Live Counter */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-gray-200">
                            <Radio size={15} className="text-red-400 animate-pulse" />
                            <span>Currently Live: <strong className="text-white">{streams.length} Streamers</strong></span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-gray-300">
                            <ShieldCheck size={15} className="text-cyan-400" />
                            <span>Auto-Synced with YouTube</span>
                        </div>
                        {lastUpdated && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pl-1">
                                <RefreshCw size={12} className={loading ? "animate-spin text-cyan-400" : ""} />
                                <span>Updated at {lastUpdated}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Bar: Tags & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Tag Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none">
                    {['All', '#lsreborn', '#lsr'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                                selectedTag === tag
                                    ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/20 scale-105'
                                    : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
                            }`}
                        >
                            {tag === 'All' ? 'All Live Streams' : tag}
                        </button>
                    ))}
                </div>

                {/* Search & Refresh */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search streamer or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={fetchLiveStreams}
                        disabled={loading}
                        className="p-2.5 bg-gray-900 hover:bg-gray-800 text-cyan-400 rounded-xl border border-gray-800 transition-colors disabled:opacity-50"
                        title="Refresh streams"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Live Streams Cards Grid */}
            {loading && streams.length === 0 ? (
                <div className="text-center py-20 text-gray-400 space-y-4">
                    <div className="animate-spin w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs font-medium tracking-wide">Scanning YouTube for live #lsr & #lsreborn broadcasts...</p>
                </div>
            ) : filteredStreams.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-xl p-12 text-center shadow-2xl space-y-4">
                    <Tv className="w-16 h-16 text-gray-600 mx-auto animate-pulse" />
                    <h3 className="text-xl font-bold text-white">No Active Streams Found</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        There are currently no live streams matching "{selectedTag}" or "{searchTerm}". Start streaming on YouTube with hashtag <strong className="text-cyan-400">#lsreborn</strong> or <strong className="text-cyan-400">#lsr</strong> to appear here automatically!
                    </p>
                    <button
                        onClick={fetchLiveStreams}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2"
                    >
                        <RefreshCw size={14} />
                        Refresh Live Feed
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStreams.map(stream => (
                        <div
                            key={stream.id}
                            onClick={() => setActiveStream(stream)}
                            className="group relative bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
                        >
                            <div>
                                {/* Thumbnail Container with Dual Layer Backdrop */}
                                <div className="relative aspect-video w-full overflow-hidden bg-gray-950 flex items-center justify-center border-b border-gray-800/80">
                                    {/* Blurred Backdrop */}
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.title}
                                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 transition-transform duration-700 group-hover:scale-150"
                                    />
                                    {/* Main Crisp Thumbnail */}
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.title}
                                        className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'; }}
                                    />

                                    {/* Pulsing LIVE Badge */}
                                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-600/95 text-white px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-red-600/30">
                                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        <span>LIVE</span>
                                    </div>

                                    {/* Viewer Count Badge */}
                                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-gray-950/90 backdrop-blur-md text-gray-200 px-2.5 py-1 rounded-md text-[11px] font-bold border border-gray-700/80 shadow-md">
                                        <Users size={12} className="text-red-400" />
                                        <span>{stream.viewerCount} Viewers</span>
                                    </div>

                                    {/* Play Overlay on Hover */}
                                    <div className="absolute inset-0 z-30 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
                                        <div className="w-14 h-14 rounded-full bg-cyan-500 text-gray-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                            <Play size={24} className="fill-current ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Stream Card Body */}
                                <div className="p-4 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-[10px] shrink-0 uppercase">
                                                {stream.channelTitle.charAt(0)}
                                            </div>
                                            <span className="text-gray-300 font-semibold truncate group-hover:text-cyan-300 transition-colors">
                                                {stream.channelTitle}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-400 shrink-0">
                                            {stream.hashtag}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-200 transition-colors">
                                        {stream.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Card Action Button */}
                            <div className="p-4 pt-0">
                                <button className="w-full py-2 px-3 bg-gray-800 group-hover:bg-cyan-500 group-hover:text-gray-950 text-cyan-300 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-500/20 group-hover:border-cyan-400">
                                    <Video size={14} />
                                    <span>Watch Live Stream</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* REACT PORTAL: Interactive Live Stream Player Modal */}
            {activeStream && ReactDOM.createPortal(
                <div 
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={() => setActiveStream(null)}
                >
                    <div 
                        className="bg-gray-900 border border-cyan-500/40 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative z-[1000000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                        LIVE
                                    </span>
                                    <span className="text-xs font-bold text-cyan-400 font-mono">
                                        {activeStream.hashtag}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                                    {activeStream.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setActiveStream(null)}
                                className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Embedded YouTube Player */}
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl">
                            <iframe
                                src={activeStream.embedUrl}
                                title={activeStream.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Streamer Footer Information */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950/80 p-4 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm uppercase">
                                    {activeStream.channelTitle.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{activeStream.channelTitle}</h4>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Users size={12} className="text-red-400" />
                                        <span>{activeStream.viewerCount} Viewers currently watching</span>
                                    </p>
                                </div>
                            </div>

                            <a href={activeStream.videoUrl} target="_blank" rel="noopener noreferrer">
                                <AnimatedButton className="bg-red-600 hover:bg-red-500 text-xs font-bold px-4 py-2 flex items-center gap-2 shadow-lg shadow-red-600/20">
                                    <span>Watch on YouTube</span>
                                    <ExternalLink size={14} />
                                </AnimatedButton>
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LifeAtLSR;
