import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ShoppingBag, Search, Tag, Coins, Info, Sparkles, CheckCircle2, X, ExternalLink, HelpCircle, RefreshCw, MessageSquare } from 'lucide-react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

const CATEGORIES = ['All', 'Vehicles', 'VIP Perks', 'Currency', 'Businesses', 'Weapons & Gear', 'Custom Perks'];

const StorePage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://lsreborn-backend.onrender.com';
    const discordInvite = import.meta.env.VITE_DISCORD_INVITE || 'https://discord.gg/5C8xvCC66x';

    // Disable background page scrolling when modal is open
    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedItem]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/catalog?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching store catalogue:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Fallback starter items if database is empty
    const displayItems = items.length > 0 ? items : [
        {
            id: 'default-1',
            name: 'VIP Bronze Perk Package (30 Days)',
            category: 'VIP Perks',
            price_coins: 500,
            image_url: 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png',
            description: 'Includes priority queue access (Rookie tier), custom Discord role, 2x daily paycheck multiplier, and exclusive VIP garage spawn.'
        },
        {
            id: 'default-2',
            name: 'Custom Import Vehicle Slot',
            category: 'Vehicles',
            price_coins: 1500,
            image_url: 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png',
            description: 'Custom personal import car slot with custom plate, 1-of-1 handling tuning, and custom garage storage in Los Santos.'
        },
        {
            id: 'default-3',
            name: 'Kaizen City Player Business License',
            category: 'Businesses',
            price_coins: 3000,
            image_url: 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png',
            description: 'Official registration license to establish a player-owned business (nightclub, mechanic shop, food store) with custom blip and management menu.'
        }
    ];

    const filteredItems = displayItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Hero Header - Compact, Responsive & Senior UI/UX Tailored */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-cyan-950/40 p-5 sm:p-7 md:p-8 border border-cyan-500/20 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles size={13} />
                        Kaizen City Marketplace
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        Official Server <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Catalogue</span>
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                        Explore exclusive in-game perks, import vehicles, custom business licenses, and priority privileges priced in <strong className="text-amber-400">LSR Coins (🪙)</strong>.
                    </p>

                    {/* LSR Coins Info Pills */}
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5 bg-gray-900/90 px-3 py-1 rounded-lg border border-gray-800 text-gray-300">
                            <Coins size={14} className="text-amber-400" />
                            <span>Currency: <strong>LSR Coins (🪙)</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-900/90 px-3 py-1 rounded-lg border border-gray-800 text-gray-300">
                            <CheckCircle2 size={14} className="text-cyan-400" />
                            <span>Instant In-Game Delivery</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search & Category Pills */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                                    selectedCategory === cat
                                        ? 'bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20 scale-105'
                                        : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search catalogue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Items Grid & Rich Empty UI/UX States */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs font-medium">Loading Kaizen City Catalogue...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-gray-900/60 border border-cyan-500/20 backdrop-blur-xl p-10 text-center shadow-2xl space-y-5">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                        <ShoppingBag size={32} className="animate-pulse" />
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            {searchTerm || selectedCategory !== 'All' ? 'No Matching Items Found' : 'Catalogue Under Setup'}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {searchTerm || selectedCategory !== 'All' 
                                ? `No items in category "${selectedCategory}" matched your search term "${searchTerm}".`
                                : 'The Kaizen City staff team is currently configuring new import vehicles, VIP perks, and business items.'
                            }
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {(searchTerm || selectedCategory !== 'All') ? (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                            >
                                Reset Search & Filters
                            </button>
                        ) : (
                            <button
                                onClick={fetchItems}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
                            >
                                <RefreshCw size={13} />
                                Refresh Catalogue
                            </button>
                        )}
                        <a href={discordInvite} target="_blank" rel="noopener noreferrer">
                            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all border border-gray-700 flex items-center gap-2">
                                <MessageSquare size={13} />
                                Contact Staff on Discord
                            </button>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
                        >
                            <div>
                                {/* Dual-Layer Glassmorphism Image Container (100% Uncropped Image Presentation) */}
                                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-950 flex items-center justify-center p-2 border-b border-gray-800/80">
                                    {/* Layer 1: Blurred background fill */}
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 transition-transform duration-700 group-hover:scale-150 pointer-events-none"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {/* Layer 2: Main crisp image - FULLY UN-CROPPED */}
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="relative z-10 max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                                    />

                                    {/* Category Pill */}
                                    <div className="absolute top-2.5 left-2.5 z-20 bg-gray-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow-lg">
                                        <Tag size={11} />
                                        {item.category || 'General'}
                                    </div>

                                    {/* Price Badge */}
                                    <div className="absolute bottom-2.5 right-2.5 z-20 bg-cyan-950/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xl">
                                        <Coins size={14} className="text-amber-400" />
                                        <span>{Number(item.price_coins).toLocaleString()} LSR Coins</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-1.5">
                                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {item.description || 'No detailed description available.'}
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer Button */}
                            <div className="p-4 pt-0">
                                <button className="w-full py-2 px-3 bg-gray-800 group-hover:bg-cyan-500 group-hover:text-gray-950 text-cyan-300 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-500/20 group-hover:border-cyan-400">
                                    <span>View Details</span>
                                    <Sparkles size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* REACT PORTAL: Interactive Item Detail Modal Rendered Directly to document.body */}
            {selectedItem && ReactDOM.createPortal(
                <div 
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
                    onClick={() => setSelectedItem(null)}
                >
                    <div 
                        className="bg-gray-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto relative z-[1000000] my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-3">
                            <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                                    <Tag size={11} />
                                    {selectedItem.category || 'General'}
                                </span>
                                <h2 className="text-xl font-extrabold text-white">
                                    {selectedItem.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Dual-Layer Image Box */}
                        <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-gray-950 border border-cyan-500/20 flex items-center justify-center p-3">
                            <img
                                src={selectedItem.image_url}
                                alt={selectedItem.name}
                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <img
                                src={selectedItem.image_url}
                                alt={selectedItem.name}
                                className="relative z-10 max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
                                onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                            />
                            <div className="absolute bottom-3 right-3 z-20 bg-gray-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xl">
                                <Coins size={16} className="text-amber-400" />
                                <span>{Number(selectedItem.price_coins).toLocaleString()} LSR Coins</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Item Description</h4>
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line bg-gray-950/60 p-3.5 rounded-xl border border-gray-800">
                                {selectedItem.description || 'No detailed description provided for this item.'}
                            </p>
                        </div>

                        {/* How to Redeem Box */}
                        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wide">
                                <HelpCircle size={15} />
                                How to Purchase & Redeem In-Game
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                To redeem this item with your <strong>LSR Coins</strong>, open a support ticket in our official Discord server or contact server management with item ID: <code className="text-cyan-400 font-mono">#{selectedItem.id}</code>.
                            </p>
                            <div className="pt-1">
                                <a href={discordInvite} target="_blank" rel="noopener noreferrer">
                                    <AnimatedButton className="w-full bg-cyan-600 hover:bg-cyan-500 text-xs font-bold !py-2 flex items-center justify-center gap-2">
                                        <span>Open Support Ticket on Discord</span>
                                        <ExternalLink size={13} />
                                    </AnimatedButton>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StorePage;
