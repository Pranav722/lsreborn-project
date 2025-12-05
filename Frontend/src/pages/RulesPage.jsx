import React, { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Gavel, BookOpen, XCircle, Info, GripVertical } from 'lucide-react';

const Rules = () => {
    const [currentPage, setCurrentPage] = useState(0);
    // We track the specific rotation of the page currently being interacted with
    const [dragRotation, setDragRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragDirection, setDragDirection] = useState(null); // 'next' or 'prev'

    const bookRef = useRef(null);
    const totalPages = pages.length;

    // --- Drag Handlers ---

    const handleMouseDown = (e, direction) => {
        e.preventDefault();
        setIsDragging(true);
        setDragDirection(direction);
        setDragRotation(direction === 'next' ? 0 : -180);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const bookRect = bookRef.current.getBoundingClientRect();
        const centerX = bookRect.left + bookRect.width / 2;
        const mouseX = e.clientX;

        // Calculate angle based on mouse position relative to book width
        // Range is typically 0 to -180 degrees
        let angle;

        if (dragDirection === 'next') {
            // Dragging from right to left (0 to -180)
            const progress = Math.min(Math.max((centerX - mouseX) / (bookRect.width / 2), -0.2), 1.2);
            angle = -180 * progress;
            // Clamp
            if (angle > 0) angle = 0;
            if (angle < -180) angle = -180;
        } else {
            // Dragging from left to right (-180 to 0)
            const progress = Math.min(Math.max((mouseX - centerX) / (bookRect.width / 2), -0.2), 1.2);
            angle = -180 + (180 * progress);
            // Clamp
            if (angle > 0) angle = 0;
            if (angle < -180) angle = -180;
        }

        setDragRotation(angle);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Threshold check to decide if we complete the flip or revert
        if (dragDirection === 'next') {
            if (dragRotation < -60) {
                // Complete flip
                setCurrentPage(curr => Math.min(curr + 1, totalPages));
            }
            // If reverted, state stays at curr, CSS transition handles the snap back
        } else {
            if (dragRotation > -120) {
                // Complete flip back
                setCurrentPage(curr => Math.max(curr - 1, 0));
            }
        }

        setDragRotation(0);
        setDragDirection(null);
    };

    // Global mouse up/move listener to handle dragging outside the element
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragRotation]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* Background Ambience - Integrated Deeply */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(2,6,23,1)_100%)] z-0" />
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px]" />
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            {/* Header - Minimalist & Modern */}
            <div className="z-10 mb-12 text-center animate-fade-in-down">
                <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mr-2"></span>
                    <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">Official Documentation</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
                    SERVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">RULES</span>
                </h1>
            </div>

            {/* 3D Interactive Notebook */}
            <div
                ref={bookRef}
                className="relative z-20 w-full max-w-5xl aspect-[3/2] md:aspect-[2/1] perspective-2000"
            >
                <div className="relative w-full h-full transform-style-3d">

                    {/* Base Layer (Shadow & Depth) */}
                    <div className="absolute inset-x-4 bottom-[-20px] top-4 bg-slate-900/80 blur-xl rounded-full opacity-50 transform translate-y-8" />

                    {/* PAGES */}
                    {pages.map((page, index) => {
                        // Z-Index: 
                        // If dragging, the dragged page needs high z-index.
                        // Otherwise, standard stack order.
                        let zIndex = totalPages - Math.abs(currentPage - index);
                        if (isDragging) {
                            if (dragDirection === 'next' && index === currentPage) zIndex = 100;
                            if (dragDirection === 'prev' && index === currentPage - 1) zIndex = 100;
                        }

                        // Rotation Logic
                        let rotation = 0; // Default flat

                        if (index < currentPage) {
                            rotation = -180; // Already flipped
                        } else if (index === currentPage) {
                            rotation = 0; // Current visible
                        }

                        // Apply Drag Override
                        let isMoving = false;
                        if (isDragging) {
                            if (dragDirection === 'next' && index === currentPage) {
                                rotation = dragRotation;
                                isMoving = true;
                            } else if (dragDirection === 'prev' && index === currentPage - 1) {
                                rotation = dragRotation;
                                isMoving = true;
                            }
                        }

                        return (
                            <div
                                key={index}
                                className="absolute top-0 left-0 w-full md:w-1/2 h-full origin-right md:origin-right transform-style-3d will-change-transform"
                                style={{
                                    zIndex: zIndex,
                                    left: '50%',
                                    transform: `rotateY(${rotation}deg)`,
                                    transition: isMoving ? 'none' : 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                                }}
                            >
                                {/* --- FRONT OF PAGE (Visible when 0deg) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-slate-900 rounded-r-2xl border border-slate-800/60 overflow-hidden"
                                    style={{
                                        boxShadow: `inset 10px 0 20px -10px rgba(0,0,0,0.8), 
                                    ${rotation < -10 ? '-5px 0 15px rgba(0,0,0,0.3)' : '0 0 0 transparent'}`
                                    }}
                                >
                                    {/* Content Container */}
                                    <div className="h-full flex flex-col relative bg-gradient-to-br from-slate-900 to-slate-950">
                                        {/* Subtle Noise Texture */}
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />

                                        {/* Header */}
                                        <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                                            <span className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">LS Reborn // Protocol</span>
                                            <span className="text-[10px] font-mono text-slate-600">{index + 1} / {totalPages}</span>
                                        </div>

                                        {/* Main Text Content */}
                                        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar relative">
                                            {page.content}
                                        </div>

                                        {/* Page Turn Handle (Visual Hint) */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-12 cursor-e-resize z-50 flex items-center justify-center group opacity-0 hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => handleMouseDown(e, 'next')}
                                        >
                                            <div className="w-1 h-12 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-colors backdrop-blur-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* --- BACK OF PAGE (Visible when -180deg) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-slate-900 rounded-l-2xl border border-slate-800/60 overflow-hidden transform rotate-y-180"
                                    style={{
                                        transform: 'rotateY(180deg)',
                                        boxShadow: `inset -10px 0 20px -10px rgba(0,0,0,0.8)`
                                    }}
                                >
                                    <div className="h-full w-full bg-slate-950 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/50 to-transparent" />
                                        <div className="text-slate-800 transform scale-x-[-1] text-6xl font-black opacity-20 select-none">
                                            LS REBORN
                                        </div>

                                        {/* Handle to flip BACK */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-12 cursor-w-resize z-50 flex items-center justify-center group opacity-0 hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => handleMouseDown(e, 'prev')}
                                        >
                                            <div className="w-1 h-12 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/50 transition-colors backdrop-blur-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Static Left Base (Back Cover when book is open) */}
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-slate-950 rounded-l-2xl border border-slate-800 -z-10 shadow-2xl flex items-center justify-center">
                        <div className="text-slate-800 text-sm font-mono rotate-90 tracking-widest opacity-20">PROPERTY OF LS GOV</div>
                    </div>

                </div>
            </div>

            {/* Interaction Hint */}
            <div className="mt-12 flex items-center gap-3 text-slate-500/60 text-sm font-mono animate-pulse">
                <GripVertical size={16} />
                <span>DRAG PAGE CORNERS TO NAVIGATE</span>
                <GripVertical size={16} />
            </div>

            <style jsx>{`
        .perspective-2000 { perspective: 2500px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>
        </div>
    );
};

// --- CONTENT COMPONENTS ---

const SectionTitle = ({ icon, title }) => (
    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-800">
        <div className="p-3 bg-cyan-950/30 rounded-xl text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            {icon}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">{title}</h2>
    </div>
);

const RuleItem = ({ title, text, type = 'neutral' }) => {
    let borderColor = 'border-slate-800';
    let bgColor = 'bg-slate-900/40';
    let titleColor = 'text-slate-200';
    let decoration = null;

    if (type === 'danger') {
        borderColor = 'border-red-500/30';
        bgColor = 'bg-red-500/5';
        titleColor = 'text-red-400';
        decoration = <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-red-500 rounded-r shadow-[0_0_10px_rgba(239,68,68,0.4)]" />;
    } else if (type === 'warning') {
        borderColor = 'border-amber-500/30';
        bgColor = 'bg-amber-500/5';
        titleColor = 'text-amber-400';
        decoration = <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-amber-500 rounded-r" />;
    } else {
        decoration = <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-slate-700 rounded-r" />;
    }

    return (
        <div className={`relative mb-6 p-5 pl-7 rounded-r-xl border-y border-r ${borderColor} ${bgColor} backdrop-blur-sm transition-all hover:bg-white/[0.02]`}>
            {decoration}
            <h3 className={`text-lg font-bold mb-2 tracking-tight ${titleColor}`}>{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-light">{text}</p>
        </div>
    );
};

const HighlightBox = ({ children }) => (
    <div className="my-6 p-5 bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 text-indigo-200 text-sm font-medium tracking-wide">
        {children}
    </div>
);

// --- PAGE CONTENT ---

const pages = [
    // Page 1: Cover
    {
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-slate-800 rounded-full opacity-30 animate-[spin_10s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border border-dashed border-slate-700 rounded-full opacity-30 animate-[spin_15s_linear_infinite_reverse]" />

                <div className="relative z-10 p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                        <span className="text-4xl font-black text-white tracking-tighter">LS</span>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">RULEBOOK</h1>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-4" />
                    <h2 className="text-sm text-cyan-400 font-mono tracking-[0.2em] mb-8">VERSION 2.0 // 2025</h2>
                </div>

                <p className="absolute bottom-10 text-slate-500 text-xs font-mono max-w-[200px]">
                    "Order in chaos. Structure in anarchy."
                </p>
            </div>
        )
    },

    // Page 2: General Conduct
    {
        content: (
            <>
                <SectionTitle icon={<Shield size={24} />} title="Conduct" />

                <RuleItem
                    title="01 // Respect & Community"
                    text="Respect is the currency of this city. Hate speech, bullying, or derogatory language towards players or staff results in immediate expulsion."
                />

                <RuleItem
                    title="02 // Toxic Behavior"
                    type="danger"
                    text="Trolling, spamming, or manufacturing OOC drama is strictly prohibited. Keep your ego checked. If you lose, roleplay the loss."
                />

                <RuleItem
                    title="03 // Microphone Mandatory"
                    type="warning"
                    text="A high-quality microphone is required. Text-based RP is disabled unless you have an approved Medical Mute application."
                />

                <div className="p-4 rounded border border-slate-800 bg-slate-950/50 text-xs text-slate-500 font-mono">
                    SYS_ADMIN_NOTE: Staff decisions are final during active scenarios. Appeal later via ticket.
                </div>
            </>
        )
    },

    // Page 3: Roleplay Integrity
    {
        content: (
            <>
                <SectionTitle icon={<Users size={24} />} title="Roleplay" />

                <RuleItem
                    title="Stay In Character"
                    text="Immersion is paramount. Never break character unless a Game Admin pauses the scene. Glitches are to be roleplayed around."
                />

                <RuleItem
                    title="FearRP (Fear Roleplay)"
                    type="warning"
                    text="Value your life above all else. If a gun is pointed at you, you are compliant. Acting fearless in the face of death is poor RP."
                />

                <RuleItem
                    title="Metagaming"
                    type="danger"
                    text="Using external info (Discord, Streams) for In-Character gain is a bannable offense. Your character only knows what they see and hear."
                />

                <HighlightBox>
                    NO POWERGAMING: You cannot force an outcome on another player without giving them a chance to resist (e.g., "/me knocks him out" is invalid).
                </HighlightBox>
            </>
        )
    },

    // Page 4: Combat Rules
    {
        content: (
            <>
                <SectionTitle icon={<XCircle size={24} />} title="Combat" />

                <RuleItem
                    title="RDM (Random Death Match)"
                    type="danger"
                    text="Killing without valid story reason and interaction is forbidden. 'Because I can' is not a valid reason."
                />

                <RuleItem
                    title="VDM (Vehicle Death Match)"
                    type="danger"
                    text="Vehicles are transport, not weapons. Ramming people without massive RP justification is a violation."
                />

                <RuleItem
                    title="Combat Logging"
                    type="danger"
                    text="Disconnecting to avoid arrest, death, or loss of items results in an automated permaban."
                />

                <RuleItem
                    title="Safe Zones"
                    text="Hospitals, Police Stations, City Hall, and Spawn: No violence, no kidnapping, no crime. These are neutral grounds."
                />
            </>
        )
    },

    // Page 5: Criminal Activity
    {
        content: (
            <>
                <SectionTitle icon={<AlertTriangle size={24} />} title="Crimes" />

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase">Store Robbery</div>
                        <div className="text-cyan-400 font-bold">Max 5 • PD Req</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                        <div className="text-xs text-slate-500 uppercase">House Robbery</div>
                        <div className="text-cyan-400 font-bold">Max 5 • Stealth</div>
                    </div>
                    <div className="p-3 bg-red-900/10 rounded border border-red-500/20">
                        <div className="text-xs text-red-400 uppercase">Bank Heist</div>
                        <div className="text-red-300 font-bold">Code Red • PD Req</div>
                    </div>
                    <div className="p-3 bg-red-900/10 rounded border border-red-500/20">
                        <div className="text-xs text-red-400 uppercase">Warehouse</div>
                        <div className="text-red-300 font-bold">3 Day Cooldown</div>
                    </div>
                </div>

                <RuleItem
                    title="Hostage Protocol"
                    text="Fake hostages (friends) are banned. You cannot execute a compliant hostage without significant escalation."
                />

                <RuleItem
                    title="Water Dumping"
                    text="Driving vehicles into the ocean to evade police is 'Win Mentality' and strictly prohibited."
                />
            </>
        )
    },

    // Page 6: Groups & Gangs
    {
        content: (
            <>
                <SectionTitle icon={<Users size={24} />} title="Gangs" />

                <RuleItem
                    title="Progression System"
                    text="You start as a Group. Tasks and influence earn you 'Gang' status. Only Admins grant this title."
                />

                <RuleItem
                    title="Gang Wars"
                    type="warning"
                    text="Requires Leader initiation and 4+ members online on both sides. Losing a turf war mandates a full retreat from the zone."
                />

                <HighlightBox>
                    DRIVE-BY RULES: Requires RP buildup. No aimless shooting. You cannot use a drive-by to initiate a war instantly.
                </HighlightBox>

                <div className="text-xs text-slate-400 mt-4 italic">
                    * Wearing gang colors implies consent to gang-related RP violence.
                </div>
            </>
        )
    },

    // Page 7: Legal & Economy
    {
        content: (
            <>
                <SectionTitle icon={<Gavel size={24} />} title="Legal" />

                <RuleItem
                    title="Emergency Vehicles"
                    text="Stealing EMS vehicles is Zero Tolerance. PD cars can be stolen with high-tier lockpicks and valid RP."
                />

                <RuleItem
                    title="Corruption"
                    text="PD Corruption is prohibited unless approved by High Command for a specific arc. Random corruption = Removal."
                />

                <RuleItem
                    title="Staff Impersonation"
                    type="danger"
                    text="Claiming to be Admin/Staff In-Character to threaten others leads to an immediate ban."
                />

                <RuleItem
                    title="Economy Exploits"
                    text="Duplicating items or abusing bugs must be reported immediately. Usage results in a wipe/ban."
                />
            </>
        )
    },

    // Page 8: Final
    {
        content: (
            <>
                <SectionTitle icon={<BookOpen size={24} />} title="Misc" />

                <RuleItem
                    title="Stream Sniping"
                    type="danger"
                    text="Watching a streamer to find their location is strictly forbidden."
                />

                <RuleItem
                    title="AFK in RP"
                    text="If you must leave during a scene, inform via /ooc. Combat logging rules apply if you leave without notice."
                />

                <div className="mt-12 p-8 border border-cyan-500/30 rounded-2xl bg-gradient-to-b from-cyan-950/20 to-transparent text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                    <p className="text-xl font-bold text-white mb-3">Welcome to LS Reborn</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        These rules exist to facilitate fun, not restrict it. Use common sense. If an action feels "cheap", it's probably against the rules.
                    </p>
                    <div className="mt-6 inline-block px-4 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20">
                        MAKE YOUR STORY LEGENDARY
                    </div>
                </div>
            </>
        )
    }
];

export default Rules;