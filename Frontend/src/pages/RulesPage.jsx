import React, { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Gavel, BookOpen, XCircle, GripVertical, ChevronRight, ChevronLeft } from 'lucide-react';

const Rules = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = pages.length;

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentDragRotation, setCurrentDragRotation] = useState(0);
    const [dragDirection, setDragDirection] = useState(null); // 'next' (flipping right to left) or 'prev' (left to right)

    const bookRef = useRef(null);

    // --- Interaction Handlers ---

    const startDrag = (e, direction) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX || e.touches?.[0].clientX);
        setDragDirection(direction);
        // If going next, we start at 0 and go negative. If prev, we start at -180 and go positive.
        setCurrentDragRotation(direction === 'next' ? 0 : -180);
    };

    const onDrag = (e) => {
        if (!isDragging) return;

        const clientX = e.clientX || e.touches?.[0].clientX;
        const delta = clientX - startX;
        const width = bookRef.current ? bookRef.current.offsetWidth / 2 : 300; // Half book width

        let rotation = 0;

        if (dragDirection === 'next') {
            // Dragging Next: 0 -> -180
            // Delta is negative (moving left)
            const progress = Math.max(Math.min(-delta / width, 1.5), -0.2); // Allow slight overdrag
            rotation = -(progress * 180);
        } else {
            // Dragging Prev: -180 -> 0
            // Delta is positive (moving right)
            const progress = Math.max(Math.min(delta / width, 1.5), -0.2);
            rotation = -180 + (progress * 180);
        }

        setCurrentDragRotation(rotation);
    };

    const endDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Snap Logic
        if (dragDirection === 'next') {
            if (currentDragRotation < -45) { // If flipped more than 45 degrees
                setCurrentPage(p => Math.min(p + 1, totalPages));
            }
        } else {
            if (currentDragRotation > -135) { // If flipped back more than 45 degrees (from -180)
                setCurrentPage(p => Math.max(p - 1, 0));
            }
        }

        setDragDirection(null);
        setCurrentDragRotation(0);
    };

    // Global listeners for smooth drag outside component
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDrag);
            window.addEventListener('touchmove', onDrag);
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);
        }
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchend', endDrag);
        };
    }, [isDragging, currentDragRotation, dragDirection]);


    return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* --- Ambient Background --- */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-indigo-950/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-cyan-950/20 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
            </div>

            {/* --- Header --- */}
            <div className="z-10 mb-8 md:mb-12 text-center animate-fade-in-down">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-500">Official Protocol</span>
                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                    SERVER <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">RULES</span>
                </h1>
            </div>

            {/* --- 3D BOOK CONTAINER --- */}
            <div
                className="relative z-20 w-full max-w-6xl h-[600px] flex justify-center items-center perspective-camera"
                ref={bookRef}
            >
                {/* The Book Itself */}
                <div className="relative w-full h-full md:w-[800px] md:h-[550px] transform-style-3d transition-transform duration-500">

                    {/* Back Cover (Static Base) */}
                    <div className="absolute right-0 w-1/2 h-full bg-[#111] rounded-r-xl shadow-2xl border-l border-white/5 transform-style-3d -z-50 hidden md:block">
                        {/* Simulates the thickness of right pages stack */}
                        <div className="absolute left-0 top-1 bottom-1 w-full border-r-[4px] border-[#222] rounded-r-md" />
                    </div>
                    <div className="absolute left-0 w-1/2 h-full bg-[#111] rounded-l-xl shadow-2xl transform-style-3d -z-50 hidden md:block">
                        {/* Simulates the thickness of left pages stack */}
                        <div className="absolute right-0 top-1 bottom-1 w-full border-l-[4px] border-[#222] rounded-l-md" />
                    </div>


                    {/* --- PAGES --- */}
                    {pages.map((page, i) => {
                        // Z-Index Logic for perfect stacking
                        // Closed stack (Right): Order is 5, 4, 3, 2, 1 (Top is low index? No, Top must be high index)
                        // Actually: Page 0 is on top of right stack. Page 1 is under it.
                        // Open stack (Left): Page 0 is bottom. Page 1 is on top of it.

                        // Let's simplify:
                        // Pages > current are on right. Order: i ascending = deeper. So z-index = total - i.
                        // Pages < current are on left. Order: i ascending = higher. So z-index = i.
                        // Current page being flipped needs highest z-index.

                        let zIndex = 0;

                        if (i === currentPage && dragDirection === 'next' && isDragging) {
                            zIndex = 100; // Active dragging page
                        } else if (i === currentPage - 1 && dragDirection === 'prev' && isDragging) {
                            zIndex = 100; // Active dragging back page
                        } else if (i < currentPage) {
                            zIndex = i; // Left stack
                        } else {
                            zIndex = totalPages - i; // Right stack
                        }

                        // Rotation Logic
                        let rotation = 0;
                        if (i < currentPage) rotation = -180;

                        // Drag Override
                        let isAnimating = true;
                        if (isDragging) {
                            if (dragDirection === 'next' && i === currentPage) {
                                rotation = currentDragRotation;
                                isAnimating = false;
                            } else if (dragDirection === 'prev' && i === currentPage - 1) {
                                rotation = currentDragRotation;
                                isAnimating = false;
                            }
                        }

                        return (
                            <div
                                key={i}
                                className="absolute top-0 left-0 md:left-1/2 w-full md:w-1/2 h-full origin-left transform-style-3d will-change-transform"
                                style={{
                                    zIndex: zIndex,
                                    transform: `rotateY(${rotation}deg)`,
                                    transition: isAnimating ? 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)' : 'none', // Smooth "Framer-like" spring bezier
                                }}
                            >
                                {/* --- FRONT FACE (Visible 0 to -90) --- */}
                                <div className="absolute inset-0 backface-hidden bg-[#1a1a1e] rounded-r-xl border border-white/5 overflow-hidden shadow-inner">
                                    {/* Paper Texture & Lighting */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10" />
                                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/10 z-20" /> {/* Spine Highlight */}

                                    {/* Interactive Grab Area (Next) */}
                                    {i === currentPage && (
                                        <div
                                            className="absolute inset-y-0 right-0 w-24 cursor-grab active:cursor-grabbing z-50 flex items-center justify-end pr-4 group"
                                            onMouseDown={(e) => startDrag(e, 'next')}
                                            onTouchStart={(e) => startDrag(e, 'next')}
                                        >
                                            <div className="w-1 h-12 rounded-full bg-white/10 group-hover:bg-cyan-500/50 transition-colors duration-300" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="relative h-full p-8 md:p-10 flex flex-col bg-gradient-to-br from-[#1a1a1e] to-[#151518]">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">LS Reborn // Rulebook</span>
                                            <span className="text-[10px] text-slate-600 font-mono">0{i + 1}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            {page.front}
                                        </div>
                                    </div>
                                </div>

                                {/* --- BACK FACE (Visible -90 to -180) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-[#1a1a1e] rounded-l-xl border border-white/5 overflow-hidden shadow-inner"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    {/* Paper Texture & Lighting (Reversed) */}
                                    <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10" />

                                    {/* Interactive Grab Area (Prev) */}
                                    {i === currentPage - 1 && (
                                        <div
                                            className="absolute inset-y-0 left-0 w-24 cursor-grab active:cursor-grabbing z-50 flex items-center justify-start pl-4 group"
                                            onMouseDown={(e) => startDrag(e, 'prev')}
                                            onTouchStart={(e) => startDrag(e, 'prev')}
                                        >
                                            <div className="w-1 h-12 rounded-full bg-white/10 group-hover:bg-indigo-500/50 transition-colors duration-300" />
                                        </div>
                                    )}

                                    {/* Content (We display the "back" content if defined, or just a stylized back) */}
                                    <div className="relative h-full p-8 md:p-10 flex flex-col bg-gradient-to-bl from-[#1a1a1e] to-[#151518]">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 dir-rtl">
                                            <span className="text-[10px] text-slate-600 font-mono">BACK</span>
                                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">SECTION {i + 1}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-center opacity-10">
                                            <div className="text-8xl font-black text-white rotate-90 md:rotate-0">LS</div>
                                        </div>
                                        <div className="text-center text-[10px] text-slate-700 font-mono mt-auto">
                                            OFFICIAL SERVER DOCUMENTATION
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Footer Controls & Hints --- */}
            <div className="mt-12 flex items-center gap-6 text-slate-500 text-xs font-mono animate-fade-in-up">
                <button
                    onClick={() => {
                        if (currentPage > 0) setCurrentPage(p => p - 1);
                    }}
                    disabled={currentPage === 0}
                    className="p-3 rounded-full hover:bg-white/5 disabled:opacity-20 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                    <GripVertical size={14} />
                    <span>DRAG CORNER OR CLICK ARROWS</span>
                    <GripVertical size={14} />
                </div>

                <button
                    onClick={() => {
                        if (currentPage < totalPages) setCurrentPage(p => p + 1);
                    }}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-full hover:bg-white/5 disabled:opacity-20 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <style jsx>{`
        .perspective-camera {
            perspective: 1500px;
        }
        .transform-style-3d {
            transform-style: preserve-3d;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 2px;
        }
      `}</style>
        </div>
    );
};

// --- CONTENT COMPONENTS ---

const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {icon}
        </div>
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">{title}</h2>
    </div>
);

const RuleBlock = ({ title, content, variant = 'neutral' }) => {
    const variants = {
        neutral: 'border-slate-800 bg-slate-900/50 text-slate-300',
        danger: 'border-red-900/50 bg-red-950/20 text-red-200',
        warning: 'border-amber-900/50 bg-amber-950/20 text-amber-200'
    };

    return (
        <div className={`mb-4 p-4 rounded-lg border ${variants[variant]} backdrop-blur-sm`}>
            <h3 className="font-bold text-sm mb-1 opacity-90">{title}</h3>
            <p className="text-xs leading-relaxed opacity-70">{content}</p>
        </div>
    );
};

// --- PAGES DATA ---

const pages = [
    // Page 1: Cover
    {
        front: (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 mb-8 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-cyan-900/50 shadow-2xl animate-pulse-slow">
                    <span className="text-4xl font-black text-white italic tracking-tighter">LS</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">RULEBOOK</h1>
                <div className="w-12 h-1 bg-cyan-500 mb-6" />
                <p className="text-xs text-slate-400 font-mono max-w-[200px] leading-relaxed">
                    THE DEFINITIVE GUIDE TO CONDUCT AND SURVIVAL IN LOS SANTOS REBORN.
                </p>
                <div className="mt-12 text-[10px] text-slate-600 font-mono border border-slate-800 px-3 py-1 rounded-full">
                    UPDATED 2025
                </div>
            </div>
        )
    },

    // Page 2: General Conduct
    {
        front: (
            <>
                <SectionHeader icon={<Shield size={18} />} title="Conduct" />
                <RuleBlock
                    title="Respect & Community"
                    content="Respect is non-negotiable. Hate speech, OOC toxicity, and bullying result in immediate bans. We build stories, not egos."
                />
                <RuleBlock
                    title="Microphone Mandatory"
                    variant="warning"
                    content="A working, high-quality microphone is required. Text RP is strictly disabled unless you have an approved Medical Mute application."
                />
                <RuleBlock
                    title="Staff Impersonation"
                    variant="danger"
                    content="Claiming to be Admin/Staff In-Character to threaten or coerce others is a permanent ban offense."
                />
            </>
        )
    },

    // Page 3: Roleplay Integrity
    {
        front: (
            <>
                <SectionHeader icon={<Users size={18} />} title="Integrity" />
                <RuleBlock
                    title="Fear Roleplay (FearRP)"
                    variant="warning"
                    content="Value your life. If a gun is pointed at you, you are compliant. Ignoring death threats to 'win' is poor RP."
                />
                <RuleBlock
                    title="New Life Rule (NLR)"
                    content="If you die and respawn, you forget the events leading to your death. No revenge seeking. No returning to the scene."
                />
                <RuleBlock
                    title="Metagaming"
                    variant="danger"
                    content="Using external info (Discord, Streams) for In-Character gain is strictly banned. Your character only knows what they experience."
                />
            </>
        )
    },

    // Page 4: Combat Rules
    {
        front: (
            <>
                <SectionHeader icon={<XCircle size={18} />} title="Combat" />
                <RuleBlock
                    title="RDM (Random Death Match)"
                    variant="danger"
                    content="Killing without valid story reason and interaction is forbidden. 'Because I can' is not a valid reason."
                />
                <RuleBlock
                    title="Combat Logging"
                    variant="danger"
                    content="Disconnecting during an active RP scenario (chase, arrest, shootout) to avoid consequences results in an automated ban."
                />
                <RuleBlock
                    title="Safe Zones"
                    content="Hospitals, Police Stations, City Hall, and Spawn Points are Neutral Grounds. No violence, kidnapping, or crime allowed."
                />
            </>
        )
    },

    // Page 5: Crimes
    {
        front: (
            <>
                <SectionHeader icon={<AlertTriangle size={18} />} title="Criminal" />
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Store Robbery</div>
                        <div className="text-xs text-cyan-400 font-bold">Max 5 • PD Req</div>
                    </div>
                    <div className="p-2 bg-red-900/10 rounded border border-red-500/20 text-center">
                        <div className="text-[10px] text-red-400 uppercase">Bank Heist</div>
                        <div className="text-xs text-red-300 font-bold">Code Red • PD Req</div>
                    </div>
                </div>
                <RuleBlock
                    title="Hostage Rules"
                    content="Fake hostages (friends) are banned. You cannot execute a compliant hostage without massive escalation."
                />
                <RuleBlock
                    title="Water Dumping"
                    content="Intentionally driving vehicles into the ocean to evade police is strictly prohibited."
                />
            </>
        )
    },

    // Page 6: Gangs
    {
        front: (
            <>
                <SectionHeader icon={<Users size={18} />} title="Gangs" />
                <RuleBlock
                    title="Progression System"
                    content="All orgs start as Groups. Admin approval is required for Gang status. Tasks and influence determine promotion."
                />
                <RuleBlock
                    title="Gang Wars"
                    variant="warning"
                    content="Requires Leader initiation & 4+ members online per side. Losing a turf war mandates full retreat from the zone."
                />
                <div className="p-3 bg-indigo-500/10 border-l-2 border-indigo-500 text-xs text-indigo-200 rounded-r">
                    <strong>Drive-By Rules:</strong> Requires RP buildup. No aimless shooting. Cannot be used to instant-initiate war.
                </div>
            </>
        )
    },

    // Page 7: Legal
    {
        front: (
            <>
                <SectionHeader icon={<Gavel size={18} />} title="Legal" />
                <RuleBlock
                    title="Emergency Vehicles"
                    variant="danger"
                    content="Stealing EMS vehicles is Zero Tolerance. PD cars can be stolen with high-tier tools and valid RP reasons."
                />
                <RuleBlock
                    title="Corruption"
                    content="PD Corruption is prohibited unless explicitly approved by High Command for a specific story arc."
                />
                <RuleBlock
                    title="Economy Exploits"
                    variant="danger"
                    content="Duplicating items or abusing bugs must be reported. Usage results in a wipe/ban."
                />
            </>
        )
    },

    // Page 8: End
    {
        front: (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <BookOpen size={48} className="text-slate-700 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Enjoy Your Stay</h3>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mb-8">
                    These rules exist to facilitate fun, not restrict it. Use common sense.
                </p>
                <div className="text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
                    MAKE YOUR STORY LEGENDARY
                </div>
            </div>
        )
    }
];

export default Rules;