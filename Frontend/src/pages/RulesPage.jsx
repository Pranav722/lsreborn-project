import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Users, Gavel, BookOpen, ChevronRight, ChevronLeft, AlertOctagon, RotateCcw, CheckCircle2 } from 'lucide-react';

const Rules = () => {
    const [currentSheet, setCurrentSheet] = useState(0);
    const totalSheets = sheets.length;

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [initialRotation, setInitialRotation] = useState(0);
    const [dragRotation, setDragRotation] = useState(0);

    const [dragDirection, setDragDirection] = useState(null); // 'next' or 'prev'
    const [hoverDirection, setHoverDirection] = useState(null); // 'next' or 'prev'

    // Touch-specific state to prevent double-flip and improve UX
    const [isTouchInteraction, setIsTouchInteraction] = useState(false);
    const [touchLocked, setTouchLocked] = useState(false);
    const [isScrollIntent, setIsScrollIntent] = useState(false);
    const touchLockTimeoutRef = useRef(null);

    const bookRef = useRef(null);

    // --- Helpers ---
    const getClientX = (e) => {
        if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
        return e.clientX;
    };

    const getClientY = (e) => {
        if (e.touches && e.touches.length > 0) return e.touches[0].clientY;
        if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientY;
        return e.clientY;
    };

    // --- Logic ---

    const startDrag = (e, direction) => {
        // Prevent interaction if touch is locked (prevents double-flip)
        if (touchLocked) return;

        const isTouch = e.type === 'touchstart';
        setIsTouchInteraction(isTouch);
        setIsScrollIntent(false);

        // For touch, we need to track both X and Y to detect scroll intent
        setStartY(getClientY(e));

        setIsDragging(true);
        setDragDirection(direction);
        setStartX(getClientX(e));

        if (direction === 'next') {
            setInitialRotation(hoverDirection === 'next' ? -15 : 0);
        } else {
            setInitialRotation(hoverDirection === 'prev' ? -165 : -180);
        }
    };

    const onDrag = useCallback((e) => {
        if (!isDragging) return;

        const x = getClientX(e);
        const y = getClientY(e);
        const deltaX = x - startX;
        const deltaY = y - startY;

        // On touch devices, detect if user is trying to scroll (vertical movement > horizontal)
        if (isTouchInteraction && !isScrollIntent && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            // User is trying to scroll, cancel the drag
            setIsScrollIntent(true);
            setIsDragging(false);
            setDragDirection(null);
            setDragRotation(0);
            setInitialRotation(0);
            return;
        }

        // Prevent scrolling when horizontally dragging on touch devices
        if (isTouchInteraction && Math.abs(deltaX) > 10) {
            e.preventDefault?.();
        }

        const width = bookRef.current ? bookRef.current.offsetWidth / 2 : 450;

        // Sensitivity - reduced for touch for less accidental flips
        const sensitivity = isTouchInteraction ? 0.7 : 1;
        const rotationDelta = (deltaX / width) * 180 * sensitivity;

        setDragRotation(rotationDelta);
    }, [isDragging, startX, startY, isTouchInteraction, isScrollIntent]);

    const endDrag = useCallback((e) => {
        if (!isDragging) return;
        setIsDragging(false);

        const finalRotation = initialRotation + dragRotation;
        // Increase click threshold for touch to prevent accidental flips
        const clickThreshold = isTouchInteraction ? 8 : 5;
        const isClick = Math.abs(dragRotation) < clickThreshold;

        // Require more rotation for touch to actually flip page
        const flipThreshold = isTouchInteraction ? 25 : 15;

        if (dragDirection === 'next') {
            if (finalRotation < -flipThreshold || isClick) {
                setCurrentSheet(p => Math.min(p + 1, totalSheets));
                // Lock touch to prevent double-flip
                if (isTouchInteraction) {
                    setTouchLocked(true);
                    touchLockTimeoutRef.current = setTimeout(() => setTouchLocked(false), 400);
                }
            }
        } else {
            if (finalRotation > (-180 + flipThreshold) || isClick) {
                setCurrentSheet(p => Math.max(p - 1, 0));
                // Lock touch to prevent double-flip
                if (isTouchInteraction) {
                    setTouchLocked(true);
                    touchLockTimeoutRef.current = setTimeout(() => setTouchLocked(false), 400);
                }
            }
        }

        setDragDirection(null);
        setDragRotation(0);
        setInitialRotation(0);
        setIsTouchInteraction(false);
    }, [isDragging, initialRotation, dragRotation, dragDirection, isTouchInteraction, totalSheets]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (touchLockTimeoutRef.current) {
                clearTimeout(touchLockTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isDragging) {
            // Use passive: false for touchmove to allow preventDefault
            const touchMoveOptions = { passive: false };

            window.addEventListener('mousemove', onDrag);
            window.addEventListener('touchmove', onDrag, touchMoveOptions);
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);
            window.addEventListener('touchcancel', endDrag);
        }
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('touchend', endDrag);
            window.removeEventListener('touchcancel', endDrag);
        };
    }, [isDragging, onDrag, endDrag]);


    return (
        <div className={`min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans select-none ${isDragging ? 'cursor-grabbing' : ''}`}>

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
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                    SERVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">RULES</span>
                </h1>
            </div>

            {/* --- 3D BOOK STAGE --- */}
            <div
                className="relative z-20 w-full max-w-7xl h-[650px] md:h-[700px] flex justify-center items-center perspective-camera group"
                ref={bookRef}
            >
                {/* --- INTERACTION ZONES (Fixed to Edges) --- 
            We reduced the width to 'w-24' (approx 6rem) so the center of the page
            remains clickable and scrollable.
         */}

                {/* Prev Zone (Left Edge) */}
                {currentSheet > 0 && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-50 cursor-grab active:cursor-grabbing md:left-[50%] md:-translate-x-[450px]"
                        style={{ touchAction: 'pan-x' }}
                        onMouseEnter={() => !isDragging && setHoverDirection('prev')}
                        onMouseLeave={() => !isDragging && setHoverDirection(null)}
                        onMouseDown={(e) => startDrag(e, 'prev')}
                        onTouchStart={(e) => startDrag(e, 'prev')}
                    />
                )}

                {/* Next Zone (Right Edge) */}
                {currentSheet < totalSheets && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-50 cursor-grab active:cursor-grabbing md:right-[50%] md:translate-x-[450px]"
                        style={{ touchAction: 'pan-x' }}
                        onMouseEnter={() => !isDragging && setHoverDirection('next')}
                        onMouseLeave={() => !isDragging && setHoverDirection(null)}
                        onMouseDown={(e) => startDrag(e, 'next')}
                        onTouchStart={(e) => startDrag(e, 'next')}
                    />
                )}


                {/* --- VISUAL BOOK WRAPPER --- */}
                <div className="relative w-full md:w-[900px] h-[580px] md:h-[600px] transform-style-3d transition-transform duration-700 ease-out group-hover:scale-[1.02] group-hover:-translate-y-4">

                    {/* Dynamic Thickness (Right Stack) */}
                    <div
                        className={`absolute right-0 w-1/2 h-full bg-[#0F0F11] rounded-r-2xl shadow-2xl border-l border-white/5 transform-style-3d -z-50 hidden md:block transition-all duration-500 pointer-events-none ${currentSheet >= totalSheets ? 'opacity-0 translate-x-4' : 'opacity-100'}`}
                    >
                        <div className="absolute left-0 top-1 bottom-1 w-full border-r-[6px] border-[#1a1a1e] rounded-r-lg bg-[#111]" />
                        <div className="absolute top-2 bottom-2 right-[2px] w-4 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay" />
                    </div>

                    {/* Dynamic Thickness (Left Stack) */}
                    <div
                        className={`absolute left-0 w-1/2 h-full bg-[#0F0F11] rounded-l-2xl shadow-2xl transform-style-3d -z-50 hidden md:block transition-all duration-500 pointer-events-none ${currentSheet === 0 ? 'opacity-0 -translate-x-4' : 'opacity-100'}`}
                    >
                        <div className="absolute right-0 top-1 bottom-1 w-full border-l-[6px] border-[#1a1a1e] rounded-l-lg bg-[#111]" />
                    </div>


                    {/* --- SHEETS --- */}
                    {sheets.map((sheet, i) => {
                        // Z-Index Calculation
                        let zIndex = 0;
                        if (dragDirection === 'next' && i === currentSheet) zIndex = 100;
                        else if (dragDirection === 'prev' && i === currentSheet - 1) zIndex = 100;
                        else if (i < currentSheet) zIndex = i;
                        else zIndex = totalSheets - i;

                        let rotation = i < currentSheet ? -180 : 0;

                        if (isDragging) {
                            if (dragDirection === 'next' && i === currentSheet) {
                                const raw = initialRotation + dragRotation;
                                rotation = Math.min(Math.max(raw, -180), 0);
                            }
                            else if (dragDirection === 'prev' && i === currentSheet - 1) {
                                const raw = initialRotation + dragRotation;
                                rotation = Math.min(Math.max(raw, -180), 0);
                            }
                        } else {
                            if (hoverDirection === 'next' && i === currentSheet) {
                                rotation = -15;
                            } else if (hoverDirection === 'prev' && i === currentSheet - 1) {
                                rotation = -165;
                            }
                        }

                        return (
                            <div
                                key={i}
                                className="absolute top-0 left-0 md:left-1/2 w-full md:w-1/2 h-full origin-left transform-style-3d will-change-transform"
                                style={{
                                    zIndex: zIndex,
                                    transform: `rotateY(${rotation}deg)`,
                                    transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                }}
                            >
                                {/* --- FRONT FACE (Right) --- */}
                                <div className="absolute inset-0 backface-hidden bg-[#131316] rounded-r-xl border border-white/5 overflow-hidden shadow-[inset_2px_0_5px_rgba(0,0,0,0.3)]">
                                    {/* Lighting */}
                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10 mix-blend-overlay" />

                                    {/* Hover Highlight */}
                                    <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyan-500/10 to-transparent transition-opacity duration-300 pointer-events-none ${hoverDirection === 'next' && i === currentSheet ? 'opacity-100' : 'opacity-0'}`} />

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col pointer-events-none">
                                        <div className={`${i === currentSheet ? 'pointer-events-auto' : ''} h-full`}>
                                            {/* Pass state setter to the last page */}
                                            {typeof sheet.front === 'function' ? sheet.front(setCurrentSheet) : sheet.front}
                                        </div>
                                    </div>
                                </div>

                                {/* --- BACK FACE (Left) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-[#131316] rounded-l-xl border border-white/5 overflow-hidden shadow-[inset_-2px_0_5px_rgba(0,0,0,0.3)]"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    {/* Lighting */}
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none z-10 mix-blend-overlay" />

                                    {/* Hover Highlight */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-indigo-500/10 to-transparent transition-opacity duration-300 pointer-events-none ${hoverDirection === 'prev' && i === currentSheet - 1 ? 'opacity-100' : 'opacity-0'}`} />

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col pointer-events-none">
                                        <div className={`${i === currentSheet - 1 ? 'pointer-events-auto' : ''} h-full`}>
                                            {typeof sheet.back === 'function' ? sheet.back(setCurrentSheet) : sheet.back}
                                        </div>
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
                <span className="tracking-widest">TAP EDGE OR DRAG TO FLIP</span>
                <ChevronRight size={16} />
            </div>

            <style jsx>{`
        .perspective-camera { perspective: 2500px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
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
    <div className="h-full flex flex-col p-6 md:p-10 relative bg-[#131316] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4 mb-4 md:mb-6 shrink-0 z-10">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                LS REBORN
            </span>
            <span className="text-[10px] text-slate-600 font-mono">{pageNum}</span>
        </div>

        {/* Content Area - Scrollable with proper touch support */}
        <div
            className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2 overscroll-contain"
            style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 tracking-tight uppercase">{title}</h2>
            <div className="space-y-3 md:space-y-4 pb-4">
                {children}
            </div>
        </div>

        {/* Footer Decoration */}
        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/5 flex justify-between items-end shrink-0 opacity-30 z-10">
            <div className="h-1 w-16 bg-slate-700" />
            <div className="text-[9px] font-mono text-slate-500">SEC. 84-B</div>
        </div>
    </div>
);

const RuleBlock = ({ title, content, variant = 'neutral' }) => {
    const styles = {
        neutral: 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50',
        danger: 'border-red-900/30 bg-red-950/10 text-red-200 hover:border-red-800/50 hover:bg-red-900/20',
        warning: 'border-amber-900/30 bg-amber-950/10 text-amber-200 hover:border-amber-800/50 hover:bg-amber-900/20'
    };

    return (
        <div className={`p-4 rounded-lg border transition-all duration-300 ${styles[variant]} group cursor-default`}>
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

const EndPage = ({ onRestart }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#131316] relative overflow-hidden">
        {/* Modern Minimalistic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.03),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0F0F11] to-transparent pointer-events-none" />

        <div className="mb-8 p-4 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm shadow-xl animate-in zoom-in duration-500">
            <CheckCircle2 size={40} className="text-cyan-400" />
        </div>

        <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Protocol Complete</h3>
        <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mb-10 font-light">
            You have reviewed the core operational standards. Proceed with caution and creativity.
        </p>

        <button
            onClick={() => onRestart(0)}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300"
        >
            <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
            <span>REINITIALIZE</span>
        </button>

        {/* Subtle Decorative Footer */}
        <div className="absolute bottom-8 flex gap-2 opacity-20">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
        </div>
    </div>
);

// --- SHEET DATA MAPPING ---

const sheets = [
    // SHEET 1
    {
        front: <CoverPage />,
        back: (setPage) => (
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
        back: (setPage) => <EndPage onRestart={setPage} />
    }
];

export default Rules;