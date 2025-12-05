import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { Play, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamMember = ({ name, role, desc, image }) => {
    return (
        <div className="group relative w-full h-80 perspective-1000">
            <div className="relative w-full h-full duration-500 preserve-3d group-hover:my-rotate-y-180">
                {/* Card Container */}
                <motion.div
                    whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
                    className="w-full h-full bg-gray-900/40 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden relative shadow-lg shadow-cyan-500/10 transition-all duration-500 group-hover:shadow-cyan-500/30 group-hover:border-cyan-400/50"
                >
                    {/* Image Background (Darkened) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10"></div>

                    {/* MANUAL IMAGE SOURCE */}
                    <img
                        src={image}
                        alt={name}
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${name}&background=0d1117&color=22d3ee&size=256` }} // Fallback if file not found
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                    />

                    {/* Content - Default State */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform transition-transform duration-500 group-hover:-translate-y-4">
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">{role}</p>
                        <h3 className="text-2xl font-black text-white">{name}</h3>
                    </div>

                    {/* Content - Hover Reveal State */}
                    <div className="absolute inset-0 bg-gray-950/90 flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-2">{role}</p>
                            <h3 className="text-2xl font-bold text-white mb-4">{name}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-cyan-500 pl-3">
                                "{desc}"
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const HomePage = ({ setPage, onApplyClick }) => {
    const [status, setStatus] = useState({ online: false, players: 0, maxPlayers: 0 });
    const [showAllTeam, setShowAllTeam] = useState(false);

    useEffect(() => {
        const fetchStatus = () => {
            setStatus(prevStatus => ({ ...prevStatus, online: 'fetching' }));
            let apiUrl = 'http://localhost:3001';
            try {
                if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
                    apiUrl = import.meta.env.VITE_API_URL;
                }
            } catch (e) { console.warn("Env check failed"); }

            fetch(`${apiUrl}/api/status`)
                .then(res => res.json())
                .then(data => setStatus(data))
                .catch(err => {
                    console.error("Failed to fetch server status:", err);
                    setStatus({ online: false, players: 0, maxPlayers: 0 });
                });
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- MANUAL IMAGE PATHS ---
    const teamMembers = [
        {
            name: 'Certified Noob',
            role: 'OverSeer',
            desc: 'No Intro needed, Just CHAD',
            image: '/Media/Noob-Avatar.png'
        },
        {
            name: 'XTracious',
            role: 'Karma',
            desc: 'The all rounder. Introduction jitna do utna kam hai. From Roleplaying to Developing Custom assets.',
            image: '/Media/XTracious-Avatar.png'
        },
        {
            name: 'Jay Bhai',
            role: 'Community Manager',
            desc: 'The Ghost Mayor of the city who is mostly overlooking everything.',
            image: '/Media/Jay-Avatar.png'
        },
        {
            name: 'Riginex',
            role: 'LSReborn Partner',
            desc: 'The undercover chill and Rich guy in server with a Huge AURA. In short: chalta firta EDM Pack.',
            image: '/Media/Riginex-Avatar.png'
        },
        {
            name: 'Itaachi',
            role: 'Management',
            desc: 'The OG Mafia Uncle and Perfect Vehicle Handler. Short: Chalta firta Vehicle Resource of server.',
            image: '/Media/Itaachi-Avatar.png'
        },
        {
            name: 'Rexci',
            role: 'Management',
            desc: 'The most experienced and fierce player. If he enters RP, players drop their guns.',
            image: '/Media/Rexci-Avatar.png'
        },

        // Hidden by default (Click 'View Full Roster' to see)
        { name: 'Luffy', role: 'PD Management & Staff', desc: 'The non RR guy who never fights and the website guy of LSR', hidden: true, image: '/Media/Luffy-Avatar.png' },
        { name: 'Tushar Gupta', role: 'PD Management & Staff', desc: 'Aspataal Premium Member. Always in the thick of the action.', hidden: true, image: '/Media/Tushar-Avatar.png' },
        { name: 'Danny', role: 'EMS Management & Staff', desc: 'Fastest response in the server', hidden: true, image: '/Media/Danny-Avatar.png' },
        { name: 'Cheeku', role: 'Staff', desc: 'Most Peaceful guy, never ever abuses', hidden: true, image: '/Media/Draken-Avatar.png' },
        { name: 'Wangu', role: 'Core team', desc: 'Richest grinder even more available than support bots', hidden: true, image: '/Media/Wangu-Avatar.png' },
        { name: 'Leo', role: 'Core team', desc: 'Richest grinder even more available than support bots', hidden: true, image: '/Media/Leo-Avatar.png' },

        // { name: 'DaddyWoo', role: 'Staff', desc: 'Watching over the city to ensure everyone has a good time.', hidden: true, image: '/Media/DaddyWoo-Avatar.png' },
    ];

    const displayedTeam = showAllTeam ? teamMembers : teamMembers.filter(m => !m.hidden);

    return (
        <div className="animate-fade-in w-full">
            {/* Full-Screen Hero Section */}
            <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden -mt-16">
                <div className="absolute inset-0 w-full h-full z-0">
                    <div className="absolute inset-0 bg-gray-950/70 z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 h-full"></div>
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src="https://cdn.discordapp.com/attachments/1080221764562137158/1149341142544760842/gta.mp4" type="video/mp4" />
                    </video>
                </div>

                <div className="relative z-20 text-center px-4 sm:px-6 w-full max-w-5xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter mb-4 md:mb-6 drop-shadow-2xl">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">LS</span>Reborn
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light tracking-wide mb-6 md:mb-10 max-w-2xl mx-auto px-2">
                        Redefining the standard of <span className="text-cyan-400 font-medium">Roleplay</span>. Your story begins here.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <AnimatedButton onClick={onApplyClick} className="bg-cyan-500 shadow-lg shadow-cyan-500/20 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                            Start Your Journey
                        </AnimatedButton>
                        <a href="https://discord.gg/lsreborn" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-bold text-white border border-white/20 active:bg-white/20 transition-all duration-300 backdrop-blur-sm">
                                Join Community
                            </button>
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                </div>
            </div>

            {/* Main Content Area - Reduced padding for big screens */}
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 md:py-16 lg:py-24 space-y-12 md:space-y-20 lg:space-y-32">

                {/* Stats & Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                    <div className="md:col-span-4">
                        <div className="h-full bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users size={80} className="md:w-[100px] md:h-[100px]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gray-400 text-xs md:text-sm font-medium tracking-wider uppercase">Los Santos Status</span>
                                    {status.online && status.online !== 'fetching' && (
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white">
                                    {status.online === 'fetching' ? 'Connecting...' : (status.online ? 'Live Server' : 'Offline')}
                                </h3>
                            </div>
                            <div className="mt-6 md:mt-8">
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                                        {status.players}
                                    </span>
                                    <span className="text-lg md:text-xl text-gray-500 font-medium mb-1 md:mb-2">
                                        / {status.maxPlayers}
                                    </span>
                                </div>
                                <div className="text-cyan-400 text-sm font-medium mt-1">Active Citizens</div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-8">
                        <div className="h-full flex flex-col justify-center space-y-6 p-2 md:p-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Why <span className="text-cyan-400">LSReborn?</span></h2>
                            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                                We aren't just another server; we are a community-driven project aimed at providing the most immersive storytelling environment possible.
                                With custom scripts, balanced economy, and a dedicated staff team, we ensure fair play and endless opportunities for your character.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                                {['Custom Cars', 'Player Housing', 'Illegal Jobs', 'Whitelisted PD'].map((feature, i) => (
                                    <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 text-center text-xs md:text-sm text-gray-300 font-medium hover:bg-gray-800/60 transition-colors cursor-default">
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trailer Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="order-2 lg:order-1 relative group w-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-800 bg-gray-900 w-full">
                            {/* Transparent Overlay to capture mouse events for custom cursor */}
                            <div className="absolute inset-0 z-10 pointer-events-auto cursor-none"></div>
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/Xr3GZDRQ1lo?autoplay=1&mute=1&loop=1&playlist=Xr3GZDRQ1lo&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1"
                                title="Server Trailer"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen>
                            </iframe>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Experience the <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Next Generation</span></h2>
                            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                                Step into a world that feels alive. From the bustling streets of Los Santos to the quiet deserts of Sandy Shores, every corner is filled with potential interactions.
                                Our V2 update brings improved performance, new heists, and a completely revamped gang system.
                            </p>
                        </div>
                        <button onClick={() => setPage('rules')} className="flex items-center gap-3 text-white font-semibold group transition-colors hover:text-cyan-400 text-sm md:text-base">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            </div>
                            Read Server Rules
                        </button>
                    </div>
                </div>

                {/* TEAM SHOWCASE SECTION */}
                <div className="pt-8 md:pt-16">
                    <div className="text-center mb-10 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet The <span className="text-cyan-400">Legends</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto px-4 text-sm md:text-base">The minds and hearts behind LSReborn. Dedicated to providing the best roleplay experience.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        <AnimatePresence>
                            {displayedTeam.map((member, index) => (
                                <motion.div
                                    key={member.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <TeamMember {...member} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowAllTeam(!showAllTeam)}
                            className="group flex items-center gap-2 mx-auto text-gray-400 hover:text-cyan-400 transition-colors font-medium border border-gray-800 hover:border-cyan-500/50 rounded-full px-6 py-3 bg-gray-900/50 hover:bg-gray-900 text-sm md:text-base"
                        >
                            {showAllTeam ? 'Show Less' : 'View Full Roster'}
                            {showAllTeam ? <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomePage;