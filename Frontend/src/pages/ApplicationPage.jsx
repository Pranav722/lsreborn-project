import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { ShieldCheck, Siren, HeartPulse, BrainCircuit, LockKeyhole, UserCog, Clock } from 'lucide-react';
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
        <p className="text-cyan-400 font-medium">Join our Discord for updates and better marketing of the server!</p>
    </Card>
);

// Whitelist Form Application (Written Application UI)
const WhitelistForm = () => (
    <Card className="max-w-4xl mx-auto pt-10">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Citizenship Application (Written)</h2>
        <p className="text-gray-400 mb-6">Please fill out the full written application form below. This path is open when the Quiz is disabled.</p>
        {/* Placeholder for the actual large written form submission */}
        <AnimatedButton onClick={() => alert("Submitting written application...")} className="bg-cyan-500">Submit Written Application (Placeholder)</AnimatedButton>
    </Card>
);


const ApplicationPage = ({ user, setPage }) => {
    const [whitelistStatus, setWhitelistStatus] = useState({ is_open: true, type: 'quiz' });
    const [pageType, setPageType] = useState('hub'); // 'hub', 'quiz', 'form', 'department'
    const [selectedDept, setSelectedDept] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const isWhitelisted = user?.roles?.includes(import.meta.env.VITE_WHITELISTED_ROLE_ID);
    const isAdmin = user && user.isAdmin; 
    const isStaff = user && user.isStaff;
    
    // Check if user has PD or EMS role to disable the buttons
    const hasDeptRoles = user?.roles?.includes(import.meta.env.VITE_SALES_ROLE_ID) || user?.roles?.includes(import.meta.env.VITE_EMS_ROLE_ID);
    
    // Whitelisted or Admin can see job forms
    const canApplyJobs = isWhitelisted || isAdmin; 

    useEffect(() => {
        const fetchStatus = async () => {
            if (!user) return; 
            setLoadingStatus(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/whitelist/status`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (response.ok) {
                    setWhitelistStatus(await response.json());
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
        if (!whitelistStatus.is_open && !isAdmin) return; // Blocked if closed
        
        if (isWhitelisted && !isAdmin) {
             // Whitelisted users cannot retake quiz/form unless testing
             return; 
        }
        
        // Admin or user who hasn't applied: Check active type
        if (whitelistStatus.type === 'quiz') {
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
            desc: whitelistStatus.is_open ? `Current Method: ${whitelistStatus.type.charAt(0).toUpperCase() + whitelistStatus.type.slice(1)}.` : 'Currently closed for review.',
            action: handleWhitelistClick,
            locked: !whitelistStatus.is_open && !isAdmin,
            btnText: (isWhitelisted && !isAdmin) ? 'Exam Passed' : (whitelistStatus.type === 'quiz' ? 'Start Exam' : 'Start Form'),
            // Disable button if whitelisted and not admin
            disabled: (isWhitelisted && !isAdmin) && !isAdmin
        },
        {
            id: 'pd',
            title: 'Police Department',
            icon: Siren,
            color: 'text-blue-500',
            borderColor: 'border-blue-500/50',
            desc: 'Apply to join the LSPD. Requires Whitelisted status.',
            action: () => { if(canApplyJobs && !hasDeptRoles) { setSelectedDept('pd'); setPageType('department'); } },
            locked: !canApplyJobs,
            btnText: hasDeptRoles && !isAdmin ? 'Already PD/EMS' : 'Apply for LSPD',
            // Disable button if already PD/EMS/Staff
            disabled: hasDeptRoles && !isAdmin 
        },
        {
            id: 'ems',
            title: 'Emergency Medical Services',
            icon: HeartPulse,
            color: 'text-red-500',
            borderColor: 'border-red-500/50',
            desc: 'Apply to join the EMS team. Requires Whitelisted status.',
            action: () => { if(canApplyJobs && !hasDeptRoles) { setSelectedDept('ems'); setPageType('department'); } },
            locked: !canApplyJobs,
            btnText: hasDeptRoles && !isAdmin ? 'Already PD/EMS' : 'Apply for EMS',
            disabled: hasDeptRoles && !isAdmin 
        },
        {
            id: 'staff',
            title: 'Staff Team',
            icon: UserCog,
            color: 'text-purple-500',
            borderColor: 'border-purple-500/50',
            desc: 'Apply to become a moderator/admin. Requires Whitelisted status.',
            action: () => { if(canApplyJobs) { setSelectedDept('staff'); setPageType('department'); } },
            locked: !canApplyJobs,
            btnText: 'Apply for Staff',
            disabled: false
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
        return <WhitelistForm />;
    }

    // 4. MAIN HUB RENDER (or Closed UI)
    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 py-10">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">Application Center</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Welcome to the LSReborn Career Hub. Here you can apply for citizenship or join one of our whitelisted departments.
                </p>
                {(isAdmin || isStaff) && (
                    <p className="mt-4 text-sm text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 inline-block px-4 py-1 rounded-full">
                        Admin Mode: Recurring Applications Enabled
                    </p>
                )}
            </div>

            {/* If Whitelist is CLOSED (and not admin testing), show marketing screen */}
            {!whitelistStatus.is_open && !isAdmin ? (
                <ClosedFormUI 
                    title="Whitelist Applications Currently Closed" 
                    message="The application system is temporarily offline for maintenance and review. Join our Discord for announcements and sneak peeks of upcoming features!"
                />
            ) : (
                /* Main Application Grid */
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
                                            <span className="text-sm font-medium">Citizenship Required</span>
                                        </div>
                                    ) : (
                                        <AnimatedButton 
                                            onClick={app.action} 
                                            className={`w-full sm:w-auto ${app.id === 'whitelist' && app.disabled ? 'bg-green-600' : 'bg-cyan-600'} ${app.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            )}
        </div>
    );
};

export default ApplicationPage;