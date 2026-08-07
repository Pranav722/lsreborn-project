import React, { useState, useEffect } from 'react';
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
    const discordInvite = import.meta.env.VITE_DISCORD_INVITE || 'https://discord.gg/8xPJ2p7qUQ';

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

    // If database has catalog items, use them! If database is empty, fallback to starter catalog items
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
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-cyan-950/40 p-8 sm:p-12 border border-cyan-500/30 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles size={14} />
                        Kaizen City Marketplace
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                        Official Server <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Catalogue</span>
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                        Explore exclusive in-game perks, import vehicles, custom business licenses, and priority privileges priced in <strong className="text-amber-400">LSR Coins (🪙)</strong>.
                    </p>

                    {/* LSR Coins Info Pill */}
                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-300">
                            <Coins size={15} className="text-amber-400" />
                            <span>Currency: <strong>LSR Coins (🪙)</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-300">
                            <CheckCircle2 size={15} className="text-cyan-400" />
                            <span>Instant In-Game Delivery</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search & Category Pills */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-none">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                                    selectedCategory === cat
                                        ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/25 scale-105'
                                        : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search catalogue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Items Grid & Rich Empty UI/UX States */}
            {loading ? (
                <div className="text-center py-20 text-gray-400 space-y-3">
                    <div className="animate-spin w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm font-medium">Loading Kaizen City Catalogue...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="relative overflow-hidden rounded-3xl bg-gray-900/60 border border-cyan-500/20 backdrop-blur-xl p-12 text-center shadow-2xl space-y-6">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                        <ShoppingBag size={38} className="animate-pulse" />
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-2xl font-black text-white tracking-wide">
                            {searchTerm || selectedCategory !== 'All' ? 'No Matching Items Found' : 'Catalogue Under Setup'}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
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
                                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
                            >
                                Reset Search & Filters
                            </button>
                        ) : (
                            <button
                                onClick={fetchItems}
                                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Refresh Catalogue
                            </button>
                        )}
                        <a href={discordInvite} target="_blank" rel="noopener noreferrer">
                            <button className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all border border-gray-700 flex items-center gap-2">
                                <MessageSquare size={14} />
                                Contact Staff on Discord
                            </button>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
                        >
                            <div>
                                {/* Photo Container */}
                                <div className="relative h-52 w-full overflow-hidden bg-gray-950">
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                                    
                                    {/* Category Pill */}
                                    <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                                        <Tag size={12} />
                                        {item.category || 'General'}
                                    </div>

                                    {/* Price Badge */}
                                    <div className="absolute bottom-3 right-3 bg-cyan-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
                                        <Coins size={15} className="text-amber-400" />
                                        <span>{Number(item.price_coins).toLocaleString()} LSR Coins</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {item.description || 'No detailed description available.'}
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer Button */}
                            <div className="p-5 pt-0">
                                <button className="w-full py-2.5 px-4 bg-gray-800 group-hover:bg-cyan-500 group-hover:text-gray-950 text-cyan-300 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-500/20 group-hover:border-cyan-400">
                                    <span>View Details</span>
                                    <Sparkles size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Interactive Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
                                    <Tag size={12} />
                                    {selectedItem.category || 'General'}
                                </span>
                                <h2 className="text-2xl font-extrabold text-white">
                                    {selectedItem.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Image */}
                        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-gray-950 border border-cyan-500/20">
                            <img
                                src={selectedItem.image_url}
                                alt={selectedItem.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                            />
                            <div className="absolute bottom-3 right-3 bg-gray-950/90 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black text-amber-300 border border-amber-500/40 flex items-center gap-2 shadow-xl">
                                <Coins size={18} className="text-amber-400" />
                                <span>{Number(selectedItem.price_coins).toLocaleString()} LSR Coins</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Item Description</h4>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                                {selectedItem.description || 'No detailed description provided for this item.'}
                            </p>
                        </div>

                        {/* How to Redeem Box */}
                        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wide">
                                <HelpCircle size={16} />
                                How to Purchase & Redeem In-Game
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                To redeem this item with your <strong>LSR Coins</strong>, open a support ticket in our official Discord server or contact server management with item ID: <code className="text-cyan-400 font-mono">#{selectedItem.id}</code>.
                            </p>
                            <div className="pt-2">
                                <a href={discordInvite} target="_blank" rel="noopener noreferrer">
                                    <AnimatedButton className="w-full bg-cyan-600 hover:bg-cyan-500 text-xs font-bold !py-2.5 flex items-center justify-center gap-2">
                                        <span>Open Support Ticket on Discord</span>
                                        <ExternalLink size={14} />
                                    </AnimatedButton>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorePage;
