import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import AIQualityHUD from '../components/AIQualityHUD';
import { ShieldCheck, Siren, HeartPulse, BrainCircuit, LockKeyhole, UserCog, Clock, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import DepartmentApp from './DepartmentApps';
import QuizPage from './QuizPage';

// New component for the closed/disabled state
const ClosedFormUI = ({ title, message }) => (
    <Card className="text-center max-w-lg mx-auto bg-gray-900/80 border border-yellow-500/30">
        <Clock className="mx-auto text-yellow-400 h-16 w-16 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-yellow-300 mb-4">{title}</h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
            {message}
        </p>
        <p className="text-cyan-400 font-medium">Stay tuned and Join our Discord for updates!</p>
    </Card>
);

// Whitelist Form Application (Written Application UI)
const WhitelistForm = ({ user }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // AI Validation State
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isPlagiarized, setIsPlagiarized] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiUnavailable, setAiUnavailable] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (aiAnalysis) setIsAnalyzing(true);
    };

    // AI Analysis callback - handles AI service failures
    const handleAnalysisComplete = (data) => {
        if (data.aiUnavailable) {
            setAiUnavailable(true);
            setAiAnalysis(null);
        } else {
            setAiAnalysis(data.analysis);
            setAiUnavailable(false);
        }
        setIsPlagiarized(data.plagiarism?.isPlagiarized || false);
        setIsAnalyzing(false);
    };

    // Validation check - Do NOT block if AI is unavailable
    const isSubmitDisabled = () => {
        // Only block if AI gave us a score AND it's too low
        if (aiAnalysis && aiAnalysis.quality < 60 && !aiUnavailable) return true;
        if (isPlagiarized) return true;
        if (isAnalyzing) return true;
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitDisabled()) {
            setError('Please complete AI validation requirements.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Client-side validation for word count
        const backstory = formData.backstory || "";
        const wordCount = backstory.trim().split(/\s+/).length;
        if (wordCount < 200) {
            setError(`Backstory is too short (${wordCount}/200 words). Please provide more detail.`);
            setLoading(false);
            return;
        }

        const payload = {
            ...formData,
            aiValidation: {
                qualityScore: aiAnalysis?.quality || 0,
                uniquenessScore: aiAnalysis?.uniqueness || 0,
                aiProbability: aiAnalysis?.aiProbability || 0,
                isPlagiarized
            },
            questions: {
                foundUs: formData.foundUs || "",
                experience: formData.experience || ""
            }
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(payload)
            });

            const responseText = await res.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Server returned non-JSON response:", responseText);
                throw new Error(`Server Error: ${res.status} ${res.statusText}. The server returned an invalid response.`);
            }

            if (!res.ok) {
                throw new Error(data.message || "Server Error");
            }

            setSuccess(true);
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            console.error("Submission Error:", e);
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <Card className="max-w-4xl mx-auto pt-10 pb-20">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Citizenship Application (Written)</h2>
            <p className="text-gray-400 mb-6">Please fill out the full written application form below.</p>

            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 animate-fade-in">
                    <strong>Submission Failed:</strong> {error}
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 animate-fade-in">
                    <strong>Success!</strong> Application submitted successfully. Redirecting...
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-cyan-300 mb-1">IRL Name</label>
                        <input name="irlName" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 placeholder-slate-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cyan-300 mb-1">IRL Age</label>
                        <input name="irlAge" type="number" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 placeholder-slate-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cyan-300 mb-1">Character Name</label>
                        <input name="characterName" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 placeholder-slate-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cyan-300 mb-1">Character Age</label>
                        <input name="characterAge" type="number" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 placeholder-slate-500" required />
                    </div>
                </div>

                {/* Backstory with inline AI analysis */}
                <div className="relative">
                    <label className="block text-sm font-medium text-cyan-300 mb-1">Character Backstory (Min 200 words)</label>
                    <textarea name="backstory" rows="8" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 resize-none placeholder-slate-500" required />
                    <AIQualityHUD inputText={formData.backstory || ''} onAnalysisComplete={handleAnalysisComplete} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-1">Where did you find us?</label>
                    <input name="foundUs" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 placeholder-slate-500" required />
                </div>

                <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-1">Previous RP Experience</label>
                    <textarea name="experience" rows="3" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-cyan-500 caret-cyan-500 relative z-10 resize-none placeholder-slate-500" required />
                </div>

                {/* Smart Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitDisabled() || loading}
                    className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${isSubmitDisabled() || loading ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-cyan-600 hover:opacity-90'
                        }`}
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : isAnalyzing ? (
                        <><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Scanning...</>
                    ) : isSubmitDisabled() ? (
                        <><ShieldAlert className="w-4 h-4" /> Complete Validation</>
                    ) : (
                        <><Sparkles className="w-4 h-4" /> Submit Application</>
                    )}
                </button>
            </form>
        </Card>
    );
};


const ApplicationPage = ({ user, setPage }) => {
    const [statuses, setStatuses] = useState({
        whitelist: { is_open: 0, type: 'quiz' },
        pd: { is_open: 0 },
        ems: { is_open: 0 },
        staff: { is_open: 0 }
    });
    const [pageType, setPageType] = useState('hub'); // 'hub', 'quiz', 'form', 'department'
    const [selectedDept, setSelectedDept] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [userAppStatus, setUserAppStatus] = useState(null);

    const isWhitelisted = user?.isWhitelisted || (Array.isArray(user?.roles) && user?.roles?.includes(import.meta.env.VITE_WHITELISTED_ROLE_ID || "1322674155107127458")) || user?.isAdmin || user?.isStaff;
    const isAdmin = user && (user.isAdmin || user.id === "444043711094194200");
    const isStaff = user && (user.isStaff || user.isAdmin);

    // Check if user has PD or EMS role to disable the buttons
    const hasDeptRoles = Array.isArray(user?.roles) && (user?.roles?.includes(import.meta.env.VITE_SALE_ROLE_ID || "1409962915091578920") || user?.roles?.includes(import.meta.env.VITE_EMS_ROLE_ID || "1409963165751574618"));

    // Whitelisted or Admin can see job forms
    const canApplyJobs = isWhitelisted || isAdmin || isStaff;

    // Helper to check if a specific form is open
    const isFormOpen = (name) => statuses[name]?.is_open || isAdmin;

    useEffect(() => {
        const fetchStatus = async () => {
            if (!user) return;
            setLoadingStatus(true);
            try {
                // Fetch global settings
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/all-status`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (response.ok) {
                    setStatuses(await response.json());
                }

                // Fetch user specific whitelist status
                const wlRes = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/status/whitelist`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (wlRes.ok) {
                    const wlData = await wlRes.json();
                    setUserAppStatus(wlData.status);
                }
            } catch (e) {
                console.error("Failed to fetch form status:", e);
            } finally {
                setLoadingStatus(false);
            }
        };
        fetchStatus();
    }, [user]);

    // Logic for Whitelist flow
    const handleWhitelistClick = () => {
        const wlStatus = statuses.whitelist || { is_open: 1, type: 'quiz' };
        if (!wlStatus.is_open && !isAdmin) return; // Blocked if closed
        if (userAppStatus === 'pending') return; // Blocked if pending

        if (isWhitelisted && !isAdmin) {
            // Whitelisted users cannot retake quiz/form unless testing
            return;
        }

        // Admin or user who hasn't applied: Check active type
        if (wlStatus.type === 'quiz') {
            setPageType('quiz');
        } else {
            setPageType('form'); // Directs to the written form
        }
    };

    // --- APP LIST CONFIG ---
    const apps = [
        {
            id: 'whitelist',
            title: 'Citizenship Application',
            icon: BrainCircuit,
            color: 'text-cyan-400',
            borderColor: 'border-cyan-500/50',
            desc: isWhitelisted && !isAdmin
                ? 'You are already a citizen of Los Santos.'
                : (userAppStatus === 'pending'
                    ? 'Your application is currently pending review.'
                    : ((statuses.whitelist?.is_open || isAdmin)
                        ? `Current Method: ${statuses.whitelist?.type?.charAt(0).toUpperCase() + statuses.whitelist?.type?.slice(1)}.`
                        : 'Currently closed for review.')),
            action: handleWhitelistClick,
            // Locked if closed AND not admin AND not whitelisted (if whitelisted, we just disable button, not lock with keyhole)
            locked: (!statuses.whitelist?.is_open && !isAdmin && !isWhitelisted && userAppStatus !== 'pending'),
            btnText: (isWhitelisted && !isAdmin) ? 'Already Whitelisted' : (userAppStatus === 'pending' ? 'Application Pending' : (statuses.whitelist?.type === 'quiz' ? 'Start Exam' : 'Start Form')),
            // Disable if: (Whitelisted & not admin) OR (Closed & not admin) OR (Pending)
            disabled: (isWhitelisted && !isAdmin) || (!statuses.whitelist?.is_open && !isAdmin) || userAppStatus === 'pending'
        },
        {
            id: 'pd',
            title: 'Police Department',
            icon: Siren,
            color: 'text-blue-500',
            borderColor: 'border-blue-500/50',
            desc: isFormOpen('pd') ? 'Apply to join the LSPD. Requires Whitelisted status.' : 'Applications are currently closed.',
            action: () => { if (canApplyJobs && !hasDeptRoles && isFormOpen('pd')) { setSelectedDept('pd'); setPageType('department'); } },
            locked: !canApplyJobs, // Locked if not whitelisted
            btnText: !isFormOpen('pd') ? 'Closed' : (hasDeptRoles && !isAdmin ? 'Already PD/EMS' : 'Apply for LSPD'),
            disabled: (hasDeptRoles && !isAdmin) || !isFormOpen('pd') || !canApplyJobs
        },
        {
            id: 'ems',
            title: 'Emergency Medical Services',
            icon: HeartPulse,
            color: 'text-red-500',
            borderColor: 'border-red-500/50',
            desc: isFormOpen('ems') ? 'Apply to join the EMS team. Requires Whitelisted status.' : 'Applications are currently closed.',
            action: () => { if (canApplyJobs && !hasDeptRoles && isFormOpen('ems')) { setSelectedDept('ems'); setPageType('department'); } },
            locked: !canApplyJobs, // Locked if not whitelisted
            btnText: !isFormOpen('ems') ? 'Closed' : (hasDeptRoles && !isAdmin ? 'Already PD/EMS' : 'Apply for EMS'),
            disabled: (hasDeptRoles && !isAdmin) || !isFormOpen('ems') || !canApplyJobs
        },
        {
            id: 'staff',
            title: 'Staff Team',
            icon: UserCog,
            color: 'text-purple-500',
            borderColor: 'border-purple-500/50',
            desc: isFormOpen('staff') ? 'Apply to become a building block of Kaizen City by LSReborn. Requires Whitelisted status.' : 'Applications are currently closed.',
            action: () => { if (canApplyJobs && isFormOpen('staff')) { setSelectedDept('staff'); setPageType('department'); } },
            locked: !canApplyJobs, // Locked if not whitelisted
            btnText: !isFormOpen('staff') ? 'Closed' : 'Apply for Staff',
            disabled: !isFormOpen('staff') || !canApplyJobs
        }
    ];


    if (loadingStatus) {
        return <div className="text-center text-cyan-400 pt-20 animate-pulse">Loading Application Status...</div>;
    }

    // 1. Department Form Routing
    if (pageType === 'department') {
        return <DepartmentApp type={selectedDept} user={user} setPageType={setPageType} />;
    }

    // 2. Quiz Routing
    if (pageType === 'quiz') {
        return <QuizPage user={user} setPage={setPage} />;
    }

    // 3. Written Whitelist Form Routing
    if (pageType === 'form') {
        return <WhitelistForm user={user} />;
    }

    // 4. MAIN HUB RENDER
    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 py-10">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">Application Center</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Welcome to Kaizen City by LSReborn. Here you can apply for citizenship or join one of our whitelisted departments.
                </p>
                {(isAdmin) && (
                    <p className="mt-4 text-sm text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 inline-block px-4 py-1 rounded-full">
                        Admin Mode: Recurring Applications Enabled
                    </p>
                )}
            </div>

            {/* Main Application Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {apps.map((app) => (
                    <Card key={app.id} className={`hover:border-opacity-100 transition-all duration-300 group border-l-4 ${app.borderColor}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <app.icon className={`w-8 h-8 ${app.color}`} />
                                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{app.title}</h3>
                                </div>
                                <p className="text-gray-400 mb-6 min-h-[3rem]">{app.desc}</p>

                                {app.locked && !isAdmin ? (
                                    <div className="flex items-center gap-2 text-gray-500 bg-gray-800/50 p-3 rounded-lg w-fit">
                                        <LockKeyhole size={18} />
                                        <span className="text-sm font-medium">
                                            {app.id === 'whitelist' && !statuses.whitelist?.is_open
                                                ? 'Applications Closed'
                                                : (app.id !== 'whitelist' && !isWhitelisted ? 'Citizenship Required' : 'Locked')}
                                        </span>
                                    </div>
                                ) : (
                                    <AnimatedButton
                                        onClick={app.action}
                                        className={`w-full sm:w-auto ${app.id === 'whitelist' && isWhitelisted && !isAdmin ? 'bg-green-600/50' : (app.disabled ? 'bg-gray-600' : 'bg-cyan-600')} ${app.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={app.disabled}
                                    >
                                        {app.btnText}
                                    </AnimatedButton>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ApplicationPage;