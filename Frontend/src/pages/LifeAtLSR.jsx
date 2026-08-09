import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Tv, Radio, Play, RefreshCw, ExternalLink, X, Search, Sparkles, Video, Plus, Trash2, Pin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

const getAuthToken = () => localStorage.getItem('authToken') || localStorage.getItem('token') || '';

const LifeAtLSR = ({ user }) => {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStream, setActiveStream] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Admin Pin Modal State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinUrl, setPinUrl] = useState('');
    const [pinSubmitting, setPinSubmitting] = useState(false);
    const [pinMessage, setPinMessage] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://lsreborn-backend.onrender.com';
    const isStaffOrAdmin = user && (user.isAdmin || user.isStaff || user.id === "444043711094194200");

    // Lock body scroll when modal is active
    useEffect(() => {
        if (activeStream || isPinModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeStream, isPinModalOpen]);

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
        const interval = setInterval(fetchLiveStreams, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (!pinUrl.trim()) return;

        setPinSubmitting(true);
        setPinMessage(null);

        try {
            const token = getAuthToken();
            const res = await fetch(`${apiUrl}/api/streams/pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ video_url: pinUrl.trim() })
            });

            const data = await res.json();
            if (res.ok) {
                setPinMessage({ type: 'success', text: 'Live stream pinned successfully!' });
                setPinUrl('');
                setTimeout(() => {
                    setIsPinModalOpen(false);
                    setPinMessage(null);
                }, 1200);
                fetchLiveStreams();
            } else {
                setPinMessage({ type: 'error', text: data.message || 'Failed to pin stream.' });
            }
        } catch (err) {
            setPinMessage({ type: 'error', text: 'Server connection error.' });
        } finally {
            setPinSubmitting(false);
        }
    };

    const handleUnpin = async (e, videoId) => {
        e.stopPropagation();
        try {
            const token = getAuthToken();
            const res = await fetch(`${apiUrl}/api/streams/pin/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (res.ok) {
                fetchLiveStreams();
            }
        } catch (err) {
            console.error("Error unpinning stream:", err);
        }
    };

    const filteredStreams = streams.filter(stream => {
        const query = searchTerm.toLowerCase();
        return stream.title.toLowerCase().includes(query) ||
               stream.channelTitle.toLowerCase().includes(query);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
            {/* Hero Header Section */}
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
                        Watch real-time live streams from community creators broadcasting live directly from LSReborn.
                    </p>

                    {/* Stats & Controls */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-gray-800 text-gray-200">
                            <Radio size={15} className="text-red-400 animate-pulse" />
                            <span>Currently Live: <strong className="text-white">{streams.length} {streams.length === 1 ? 'Streamer' : 'Streamers'}</strong></span>
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

            {/* Controls Bar: Search, Staff Pin Button, & Refresh */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search streamer or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {isStaffOrAdmin && (
                        <AnimatedButton
                            onClick={() => setIsPinModalOpen(true)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                        >
                            <Plus size={15} />
                            <span>Pin YouTube Live Stream</span>
                        </AnimatedButton>
                    )}

                    <button
                        onClick={fetchLiveStreams}
                        disabled={loading}
                        className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-cyan-400 rounded-xl border border-gray-800 transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
                        title="Refresh live streams"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh Feed</span>
                    </button>
                </div>
            </div>

            {/* Live Streams Cards Grid */}
            {loading && streams.length === 0 ? (
                <div className="text-center py-20 text-gray-400 space-y-4">
                    <div className="animate-spin w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs font-medium tracking-wide">Checking for live LSReborn streams...</p>
                </div>
            ) : filteredStreams.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-xl p-12 text-center shadow-2xl space-y-4">
                    <Tv className="w-16 h-16 text-gray-600 mx-auto animate-pulse" />
                    <h3 className="text-xl font-bold text-white">No Streamers Currently Live</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        {searchTerm 
                            ? `No live streams found matching "${searchTerm}".` 
                            : 'There are no community members broadcasting live at this moment. Streamers include hashtag #lsreborn or #lsr in your YouTube live stream title to appear here automatically!'
                        }
                    </p>
                    <button
                        onClick={fetchLiveStreams}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2"
                    >
                        <RefreshCw size={14} />
                        Refresh Feed
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
                                    {/* Layer 1: Ambient Blurred Background */}
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.title}
                                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 transition-transform duration-700 group-hover:scale-150"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {/* Layer 2: Main Crisp Thumbnail */}
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.title}
                                        className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${stream.id}/hqdefault.jpg`; }}
                                    />

                                    {/* Pulsing LIVE Badge */}
                                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-600/95 text-white px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-red-600/30">
                                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        <span>LIVE</span>
                                    </div>

                                    {/* Staff Unpin Option if Staff */}
                                    {isStaffOrAdmin && (
                                        <button
                                            onClick={(e) => handleUnpin(e, stream.id)}
                                            className="absolute top-3 right-3 z-30 p-1.5 bg-gray-950/80 hover:bg-rose-600 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
                                            title="Unpin / Remove stream"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}

                                    {/* Play Overlay on Hover */}
                                    <div className="absolute inset-0 z-25 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
                                        <div className="w-14 h-14 rounded-full bg-cyan-500 text-gray-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                            <Play size={24} className="fill-current ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Stream Card Content */}
                                <div className="p-4 space-y-3">
                                    {/* Channel Avatar & Name */}
                                    <div className="flex items-center gap-2.5">
                                        {stream.avatar ? (
                                            <img
                                                src={stream.avatar}
                                                alt={stream.channelTitle}
                                                className="w-7 h-7 rounded-full object-cover border border-cyan-500/40 shrink-0"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 uppercase">
                                                {stream.channelTitle ? stream.channelTitle.charAt(0) : 'L'}
                                            </div>
                                        )}
                                        <span className="text-gray-300 text-xs font-bold truncate group-hover:text-cyan-300 transition-colors">
                                            {stream.channelTitle}
                                        </span>
                                    </div>

                                    {/* Exact YouTube Stream Title */}
                                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-200 transition-colors">
                                        {stream.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Action Button */}
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

            {/* REACT PORTAL: Admin Pin Live Stream Modal */}
            {isPinModalOpen && ReactDOM.createPortal(
                <div 
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
                    onClick={() => setIsPinModalOpen(false)}
                >
                    <div 
                        className="bg-gray-900 border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative z-[1000000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Pin className="text-cyan-400" size={20} />
                                Pin YouTube Live Stream
                            </h3>
                            <button onClick={() => setIsPinModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {pinMessage && (
                            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold border ${
                                pinMessage.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                            }`}>
                                {pinMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <span>{pinMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    YouTube Video URL or Video ID <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={pinUrl}
                                    onChange={(e) => setPinUrl(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Paste any active YouTube Live Stream link to immediately display it on the Life at LSR feed.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPinModalOpen(false)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <AnimatedButton
                                    type="submit"
                                    disabled={pinSubmitting}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold px-5 py-2"
                                >
                                    {pinSubmitting ? 'Pinning Stream...' : 'Pin Stream'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* REACT PORTAL: Live Stream Player Modal */}
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

                        {/* Streamer Info Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950/80 p-4 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-3">
                                {activeStream.avatar ? (
                                    <img
                                        src={activeStream.avatar}
                                        alt={activeStream.channelTitle}
                                        className="w-10 h-10 rounded-full object-cover border border-cyan-500/40 shrink-0"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm uppercase shrink-0">
                                        {activeStream.channelTitle ? activeStream.channelTitle.charAt(0) : 'L'}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-bold text-white">{activeStream.channelTitle}</h4>
                                    <p className="text-xs text-gray-400">Broadcasting live on YouTube</p>
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
