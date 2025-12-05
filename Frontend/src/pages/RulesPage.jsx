import React, { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Gavel, BookOpen, XCircle, GripVertical, ChevronRight, ChevronLeft, Info, FileText, Check, AlertOctagon } from 'lucide-react';

const Rules = () => {
    const [currentSheet, setCurrentSheet] = useState(0);
    // We paired the content so we have fewer physical "sheets" but double the pages.
    const totalSheets = sheets.length;

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentDragRotation, setCurrentDragRotation] = useState(0);
    const [dragDirection, setDragDirection] = useState(null); // 'next' or 'prev'

    const bookRef = useRef(null);

    // --- Interaction Handlers ---

    const startDrag = (e, direction) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX || e.touches?.[0].clientX);
        setDragDirection(direction);
        setCurrentDragRotation(direction === 'next' ? 0 : -180);
    };

    const onDrag = (e) => {
        if (!isDragging) return;

        const clientX = e.clientX || e.touches?.[0].clientX;
        const delta = clientX - startX;
        const width = bookRef.current ? bookRef.current.offsetWidth / 2 : 400;

        let rotation = 0;

        if (dragDirection === 'next') {
            const progress = Math.max(Math.min(-delta / width, 1.5), -0.1);
            rotation = -(progress * 180);
        } else {
            const progress = Math.max(Math.min(delta / width, 1.5), -0.1);
            rotation = -180 + (progress * 180);
        }

        setCurrentDragRotation(rotation);
    };

    const endDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (dragDirection === 'next') {
            if (currentDragRotation < -30) {
                setCurrentSheet(p => Math.min(p + 1, totalSheets));
            }
        } else {
            if (currentDragRotation > -150) {
                setCurrentSheet(p => Math.max(p - 1, 0));
            }
        }

        setDragDirection(null);
        setCurrentDragRotation(0);
    };

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
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* --- Ambient Background --- */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            {/* --- Header --- */}
            <div className="z-10 mb-10 text-center animate-fade-in-down">
                <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">Official Protocol V2.0</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                    SERVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">RULES</span>
                </h1>
            </div>

            {/* --- 3D BOOK CONTAINER --- */}
            <div
                className="relative z-20 w-full max-w-7xl h-[650px] md:h-[700px] flex justify-center items-center perspective-camera group"
                ref={bookRef}
            >
                {/* Book Wrapper with Hover Effect */}
                <div className="relative w-full md:w-[900px] h-[580px] md:h-[600px] transform-style-3d transition-transform duration-700 ease-out group-hover:scale-[1.02] group-hover:-translate-y-4">

                    {/* --- Static Back Covers (The "Thickness") --- */}
                    <div className="absolute right-0 w-1/2 h-full bg-[#0F0F11] rounded-r-2xl shadow-2xl border-l border-white/5 transform-style-3d -z-50 hidden md:block">
                        <div className="absolute left-0 top-1 bottom-1 w-full border-r-[6px] border-[#1a1a1e] rounded-r-lg bg-[#111]" />
                        {/* Page Edges Texture */}
                        <div className="absolute top-2 bottom-2 right-[2px] w-4 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay" />
                    </div>
                    <div className="absolute left-0 w-1/2 h-full bg-[#0F0F11] rounded-l-2xl shadow-2xl transform-style-3d -z-50 hidden md:block">
                        <div className="absolute right-0 top-1 bottom-1 w-full border-l-[6px] border-[#1a1a1e] rounded-l-lg bg-[#111]" />
                    </div>

                    {/* --- SHEETS --- */}
                    {sheets.map((sheet, i) => {
                        // Z-Index: 
                        // Sheets on Right (Not flipped): Higher index = Top. So (Total - i).
                        // Sheets on Left (Flipped): Higher index = Top. So i.

                        let zIndex = 0;
                        if (i === currentSheet && dragDirection === 'next' && isDragging) zIndex = 50;
                        else if (i === currentSheet - 1 && dragDirection === 'prev' && isDragging) zIndex = 50;
                        else if (i < currentSheet) zIndex = i; // Left Stack
                        else zIndex = totalSheets - i; // Right Stack

                        // Rotation
                        let rotation = i < currentSheet ? -180 : 0;

                        // Drag Override
                        let isAnimating = true;
                        if (isDragging) {
                            if (dragDirection === 'next' && i === currentSheet) {
                                rotation = currentDragRotation;
                                isAnimating = false;
                            } else if (dragDirection === 'prev' && i === currentSheet - 1) {
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
                                    transition: isAnimating ? 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                                }}
                            >
                                {/* --- FRONT FACE (Right Side) --- */}
                                <div className="absolute inset-0 backface-hidden bg-[#131316] rounded-r-xl border border-white/5 overflow-hidden shadow-[inset_2px_0_5px_rgba(0,0,0,0.3)]">
                                    {/* Lighting/Spine Shadow */}
                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10 mix-blend-overlay" />

                                    {/* Drag Trigger */}
                                    {i === currentSheet && (
                                        <div
                                            className="absolute inset-y-0 right-0 w-20 cursor-grab active:cursor-grabbing z-50 flex items-center justify-end pr-2 group/drag"
                                            onMouseDown={(e) => startDrag(e, 'next')}
                                            onTouchStart={(e) => startDrag(e, 'next')}
                                        >
                                            <div className="w-1 h-16 rounded-full bg-white/5 group-hover/drag:bg-cyan-500/50 transition-colors duration-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
                                        </div>
                                    )}

                                    {/* Content Wrapper */}
                                    <div className="relative h-full flex flex-col">
                                        {sheet.front}
                                    </div>
                                </div>

                                {/* --- BACK FACE (Left Side) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-[#131316] rounded-l-xl border border-white/5 overflow-hidden shadow-[inset_-2px_0_5px_rgba(0,0,0,0.3)]"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    {/* Lighting/Spine Shadow (Reversed) */}
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none z-10 mix-blend-overlay" />

                                    {/* Drag Trigger */}
                                    {i === currentSheet - 1 && (
                                        <div
                                            className="absolute inset-y-0 left-0 w-20 cursor-grab active:cursor-grabbing z-50 flex items-center justify-start pl-2 group/drag"
                                            onMouseDown={(e) => startDrag(e, 'prev')}
                                            onTouchStart={(e) => startDrag(e, 'prev')}
                                        >
                                            <div className="w-1 h-16 rounded-full bg-white/5 group-hover/drag:bg-indigo-500/50 transition-colors duration-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                                        </div>
                                    )}

                                    {/* Content Wrapper */}
                                    <div className="relative h-full flex flex-col">
                                        {sheet.back}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Footer Hint --- */}
            <div className="mt-10 flex items-center justify-center gap-4 text-slate-500 text-xs font-mono opacity-60 hover:opacity-100 transition-opacity">
                <ChevronLeft size={16} />
                <span className="tracking-widest">DRAG PAGE EDGES TO FLIP</span>
                <ChevronRight size={16} />
            </div>

            <style jsx>{`
        .perspective-camera { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
        </div>
    );
};

// --- CONTENT COMPONENTS ---

const PageContainer = ({ children, pageNum, title }) => (
    <div className="h-full flex flex-col p-8 md:p-10 relative bg-[#131316]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                LS REBORN
            </span>
            <span className="text-[10px] text-slate-600 font-mono">{pageNum}</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight uppercase">{title}</h2>
            <div className="space-y-4">
                {children}
            </div>
        </div>

        {/* Footer Decoration */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end shrink-0 opacity-30">
            <div className="h-1 w-16 bg-slate-700" />
            <div className="text-[9px] font-mono text-slate-500">SEC. 84-B</div>
        </div>
    </div>
);

const RuleBlock = ({ title, content, variant = 'neutral' }) => {
    const styles = {
        neutral: 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700',
        danger: 'border-red-900/30 bg-red-950/10 text-red-200 hover:border-red-800/50 hover:bg-red-900/20',
        warning: 'border-amber-900/30 bg-amber-950/10 text-amber-200 hover:border-amber-800/50 hover:bg-amber-900/20'
    };

    return (
        <div className={`p-4 rounded-lg border transition-all duration-300 ${styles[variant]} group`}>
            <div className="flex items-start gap-3 mb-2">
                {variant === 'danger' && <AlertOctagon size={16} className="text-red-400 mt-0.5 shrink-0" />}
                {variant === 'warning' && <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />}
                {variant === 'neutral' && <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />}
                <h3 className="font-bold text-sm leading-tight">{title}</h3>
            </div>
            <p className="text-xs leading-relaxed opacity-70 pl-4 border-l border-white/5 ml-0.5">{content}</p>
        </div>
    );
};

const CoverPage = () => (
    <div className="h-full flex flex-col items-center justify-center text-center relative p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)]" />

        <div className="w-32 h-32 mb-10 relative group">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative w-full h-full rounded-2xl border border-white/10 bg-[#18181b] flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:rotate-6">
                <span className="text-5xl font-black text-white italic tracking-tighter">LS</span>
            </div>
        </div>

        <h1 className="text-6xl font-black text-white mb-4 tracking-tighter z-10">RULEBOOK</h1>
        <div className="w-16 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mb-8 z-10" />

        <p className="text-xs text-slate-400 font-mono max-w-[240px] leading-7 z-10">
            THE DEFINITIVE GUIDE TO CONDUCT,<br />LAW, AND SURVIVAL IN<br />
            <span className="text-white font-bold">LOS SANTOS REBORN</span>.
        </p>

        <div className="mt-auto z-10 border border-white/10 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md">
            <span className="text-[10px] font-mono text-cyan-400">EST. 2025</span>
        </div>
    </div>
);

// --- SHEET DATA MAPPING ---

const sheets = [
    // SHEET 1
    {
        front: <CoverPage />,
        back: (
            <PageContainer pageNum="01" title="Conduct">
                <RuleBlock
                    title="Respect & Community"
                    content="Respect is the foundation of this city. Hate speech, OOC toxicity, and bullying result in immediate expulsion. We are here to build stories together, not destroy them."
                />
                <RuleBlock
                    title="Microphone Mandatory"
                    variant="warning"
                    content="A high-quality microphone is required for all players. Text RP is disabled unless you have an approved Medical Mute application."
                />
                <RuleBlock
                    title="Staff Impersonation"
                    variant="danger"
                    content="Claiming to be Admin/Staff In-Character to threaten others is a permanent ban offense. Report issues via proper channels."
                />
            </PageContainer>
        )
    },

    // SHEET 2
    {
        front: (
            <PageContainer pageNum="02" title="Integrity">
                <RuleBlock
                    title="Fear Roleplay (FearRP)"
                    variant="warning"
                    content="Value your life. If a gun is pointed at you, you are scared and compliant. Ignoring death threats to 'win' a scenario is poor RP."
                />
                <RuleBlock
                    title="New Life Rule (NLR)"
                    content="If you are downed and respawn at the hospital, you forget the events leading to your death. You cannot return to the scene or seek revenge."
                />
                <RuleBlock
                    title="Metagaming"
                    variant="danger"
                    content="Using external info (Discord, Twitch) for In-Character gain is strictly banned. Your character only knows what they see and hear."
                />
                <RuleBlock
                    title="Powergaming"
                    content="Forcing an outcome on another player without allowing them a chance to resist (e.g. '/me knocks him out') is prohibited."
                />
            </PageContainer>
        ),
        back: (
            <PageContainer pageNum="03" title="Combat">
                <RuleBlock
                    title="RDM (Random Death Match)"
                    variant="danger"
                    content="Attacking or killing without valid RP reason and interaction is forbidden. 'Because I can' is not a valid reason."
                />
                <RuleBlock
                    title="VDM (Vehicle Death Match)"
                    variant="danger"
                    content="Using vehicles as weapons to ram or kill players without substantial RP justification is a violation."
                />
                <RuleBlock
                    title="Combat Logging"
                    variant="danger"
                    content="Disconnecting during an active scenario (chase, arrest, shootout) to avoid consequences triggers an automated ban."
                />
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2 flex items-center gap-2">
                        <Shield size={12} /> Safe Zones
                    </h4>
                    <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                        Hospitals, Police Stations, City Hall, and Spawn Points. No violence, kidnapping, or criminal activity allowed.
                    </p>
                </div>
            </PageContainer>
        )
    },

    // SHEET 3
    {
        front: (
            <PageContainer pageNum="04" title="Criminal">
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-3 bg-slate-800/40 rounded border border-slate-700">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Store Robbery</div>
                        <div className="text-xs text-cyan-400 font-bold">Max 5 • PD Req</div>
                    </div>
                    <div className="p-3 bg-red-900/10 rounded border border-red-500/20">
                        <div className="text-[9px] text-red-400 uppercase tracking-wider mb-1">Bank Heist</div>
                        <div className="text-xs text-red-300 font-bold">Code Red • PD Req</div>
                    </div>
                </div>
                <RuleBlock
                    title="Hostage Rules"
                    content="Fake hostages (friends) are banned. You cannot execute a compliant hostage without massive escalation and negotiation."
                />
                <RuleBlock
                    title="Water Dumping"
                    content="Intentionally driving vehicles into the ocean to evade police is 'Win Mentality' and strictly prohibited."
                />
            </PageContainer>
        ),
        back: (
            <PageContainer pageNum="05" title="Gangs">
                <RuleBlock
                    title="Progression System"
                    content="All orgs start as Groups. Admin approval is required for official Gang status. Tasks, influence, and story quality determine promotion."
                />
                <RuleBlock
                    title="Gang Wars"
                    variant="warning"
                    content="Requires Leader initiation & 4+ members online per side. Losing a turf war mandates a full retreat from the zone for the duration."
                />
                <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-indigo-500">
                    <h4 className="text-xs font-bold text-slate-300 mb-1">Drive-By Protocol</h4>
                    <p className="text-[10px] text-slate-400">Requires RP buildup. No aimless shooting. Cannot be used to instant-initiate war.</p>
                </div>
            </PageContainer>
        )
    },

    // SHEET 4 (Last Sheet)
    {
        front: (
            <PageContainer pageNum="06" title="Legal & Misc">
                <RuleBlock
                    title="Emergency Vehicles"
                    variant="danger"
                    content="Stealing EMS vehicles is Zero Tolerance. PD cars can be stolen only with high-tier tools and valid RP reasons."
                />
                <RuleBlock
                    title="Corruption"
                    content="PD Corruption is prohibited unless explicitly approved by High Command for a specific story arc."
                />
                <RuleBlock
                    title="Economy Exploits"
                    variant="danger"
                    content="Duplicating items or abusing bugs must be reported immediately. Usage results in a wipe/ban."
                />
            </PageContainer>
        ),
        back: (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#131316] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse" />

                <div className="w-20 h-20 mb-6 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                    <BookOpen size={32} className="text-slate-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">End of Protocol</h3>
                <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed mb-8">
                    These rules exist to facilitate fun, not restrict it. Use common sense. If an action feels "cheap", it's probably against the rules.
                </p>

                <button className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-6 py-2 rounded-full border border-cyan-500/20 hover:bg-cyan-950/40 transition-colors">
                    RETURN TO START
                </button>

                <div className="mt-auto opacity-20 text-[200px] font-black text-white absolute -bottom-16 -right-10 pointer-events-none select-none">
                    LS
                </div>
            </div>
        )
    }
];

export default Rules;