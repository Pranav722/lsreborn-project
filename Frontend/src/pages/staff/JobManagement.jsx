import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import { ToggleLeft, ToggleRight, Loader2, Zap } from 'lucide-react';

const JobManagement = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pd');
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [uiMessage, setUIMessage] = useState('');

    const isAdmin = user.isAdmin;
    // Authorized if Admin, Staff, PD Lead, or EMS Lead
    const isAuthorized = user.isStaff || user.isAdmin || user.isPDLead || user.isEMSLead;

    // Permissions for specific tabs
    const showPD = user.isPDLead || user.isAdmin;
    const showEMS = user.isEMSLead || user.isAdmin;
    const showStaff = user.isAdmin;

    useEffect(() => {
        if (!isAuthorized) return;
        // Auto-select tab based on role priority
        if (showPD && !showEMS && !showStaff) setActiveTab('pd');
        else if (showEMS && !showPD && !showStaff) setActiveTab('ems');
        else if (showStaff) setActiveTab('staff');
        // Fallback or default behavior handled by initial state 'pd'
    }, [user, isAuthorized]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Convert array to map: { 'whitelist': {...}, 'pd': {...} }
                const settingsMap = data.reduce((acc, item) => ({ ...acc, [item.form_name]: item }), {});
                setSettings(settingsMap);
            }
        } catch (e) {
            console.error("Failed to fetch settings:", e);
        }
    };

    const fetchApps = async () => {
        if (!isAuthorized) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/${activeTab}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) setApps(await res.json());
        } catch (e) { console.error("Failed to fetch apps:", e); }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
        fetchApps();
    }, [activeTab, isAuthorized]);

    const handleAction = async (id, status) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/${activeTab}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setUIMessage(`${activeTab.toUpperCase()} application ${status} successfully!`);
            }
        } catch (e) {
            setUIMessage(`Error processing action: ${e.message}`);
        } finally {
            fetchApps();
            setLoading(false);
            setTimeout(() => setUIMessage(''), 3000);
        }
    };

    const toggleFormStatus = async (formName, currentStatus) => {
        // PERMISSION CHECK: Admin, OR specific Lead for their Department
        const canToggle = isAdmin ||
            (formName === 'pd' && user.isPDLead) ||
            (formName === 'ems' && user.isEMSLead);

        if (!canToggle) {
            setUIMessage("Error: Insufficient permissions to toggle this form.");
            return;
        }

        setLoading(true);
        // currentStatus comes from DB as 0 or 1. 
        const newState = currentStatus ? 0 : 1;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ formName, isOpen: newState })
            });
            if (res.ok) {
                setUIMessage(`${formName.toUpperCase()} form is now ${newState ? 'OPEN' : 'CLOSED'}`);
                await fetchSettings(); // Refresh immediately to show new state
            }
        } catch (e) {
            setUIMessage(`Error updating ${formName}: ${e.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => setUIMessage(''), 3000);
        }
    };

    const switchWhitelistType = async (newType) => {
        if (!isAdmin) {
            setUIMessage("Error: Only Admins can switch whitelist type.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings/whitelist/switch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ type: newType })
            });
            if (res.ok) {
                setUIMessage(`Whitelist type successfully switched to ${newType.toUpperCase()}`);
                await fetchSettings();
            }
        } catch (e) {
            setUIMessage(`Error switching type: ${e.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => setUIMessage(''), 3000);
        }
    };

    // Helper to get current setting safely
    const currentFormSetting = settings[activeTab] || { is_open: 1, type: 'form' };
    const whitelistSetting = settings['whitelist'] || { is_open: 1, type: 'quiz' };

    // Determine if User can toggle CURRENT tab
    const canToggleCurrent = isAdmin || (activeTab === 'pd' && user.isPDLead) || (activeTab === 'ems' && user.isEMSLead);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
                <h2 className="text-3xl font-bold text-cyan-400">Department Management</h2>

                {/* APPLICATION MODE TOGGLE (ADMIN OR LEAD) */}
                {canToggleCurrent && (
                    <div className="flex items-center space-x-4">
                        {/* Status Toggle */}
                        <button
                            onClick={() => toggleFormStatus(activeTab, currentFormSetting.is_open)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentFormSetting.is_open ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'}`}
                        >
                            {currentFormSetting.is_open ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            {activeTab.toUpperCase()} is {currentFormSetting.is_open ? 'OPEN' : 'CLOSED'}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2 overflow-x-auto">
                {showPD && <button onClick={() => setActiveTab('pd')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'pd' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Police Dept</button>}
                {showEMS && <button onClick={() => setActiveTab('ems')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'ems' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>EMS</button>}
                {showStaff && <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'staff' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Staff Apps</button>}

                {/* Admin Extra Tab for Whitelist Config */}
                {isAdmin && <button onClick={() => setActiveTab('whitelist')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'whitelist' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Whitelist Config</button>}
            </div>

            {/* Special View for Whitelist Config Tab */}
            {activeTab === 'whitelist' && isAdmin && (
                <Card className="mb-6 border-cyan-500/50">
                    <h3 className="text-xl font-bold text-white mb-4">Whitelist Settings</h3>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm text-gray-400">Master Toggle</span>
                            <button
                                onClick={() => toggleFormStatus('whitelist', whitelistSetting.is_open)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${whitelistSetting.is_open ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}
                            >
                                {whitelistSetting.is_open ? <ToggleRight /> : <ToggleLeft />}
                                {whitelistSetting.is_open ? 'WHITELIST OPEN' : 'WHITELIST CLOSED'}
                            </button>
                        </div>
                        <div className="w-px h-12 bg-gray-700"></div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm text-gray-400">Application Method</span>
                            <div className="flex bg-gray-800 rounded p-1">
                                <button
                                    onClick={() => switchWhitelistType('quiz')}
                                    className={`px-4 py-1 rounded transition-colors ${whitelistSetting.type === 'quiz' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                >
                                    Quiz Mode
                                </button>
                                <button
                                    onClick={() => switchWhitelistType('form')}
                                    className={`px-4 py-1 rounded transition-colors ${whitelistSetting.type === 'form' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                >
                                    Written Form
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {uiMessage && <p className="mb-4 text-center text-green-400 bg-green-900/20 p-2 rounded border border-green-500/30">{uiMessage}</p>}

            {loading && activeTab !== 'whitelist' ? <p className="text-center py-8 flex items-center justify-center gap-2 text-cyan-400"><Loader2 className="animate-spin" /> Loading applications...</p> : (
                <div className="space-y-4">
                    {activeTab !== 'whitelist' && apps.map(app => (
                        <Card key={app.id} className="border-l-4 border-cyan-500">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{app.character_name || "Applicant"}</h3>
                                        {app.discord_id && <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{app.discord_id}</span>}
                                    </div>

                                    <p className="text-sm text-gray-400 mt-1">Status: <span className={`uppercase font-bold ${app.status === 'approved' ? 'text-green-400' : app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{app.status}</span></p>

                                    <div className="mt-4 bg-gray-900/30 p-4 rounded-lg border border-gray-700/50 space-y-4">
                                        {/* Common Fields */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-300 border-b border-gray-700 pb-3">
                                            {app.irl_name && <div><span className="text-cyan-400 font-bold block text-xs uppercase">IRL Name</span> {app.irl_name}</div>}
                                            {app.irl_age && <div><span className="text-cyan-400 font-bold block text-xs uppercase">IRL Age</span> {app.irl_age}</div>}
                                            {app.weekly_hours && <div><span className="text-cyan-400 font-bold block text-xs uppercase">Weekly Hours</span> {app.weekly_hours}</div>}
                                        </div>

                                        {/* PD Fields */}
                                        {activeTab === 'pd' && (
                                            <>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Experience</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.experience}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Reason for Joining</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.reason}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Scenario</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.scenario_cop}</p>
                                                </div>
                                            </>
                                        )}

                                        {/* EMS Fields */}
                                        {activeTab === 'ems' && (
                                            <>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Medical Knowledge</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.medical_knowledge}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Scenarios</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.scenarios}</p>
                                                </div>
                                            </>
                                        )}

                                        {/* Staff Fields */}
                                        {activeTab === 'staff' && (
                                            <>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Experience</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.experience}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Responsibilities</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.responsibilities}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Definitions</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.definitions}</p>
                                                </div>
                                                <div>
                                                    <span className="text-cyan-400 font-bold block text-xs uppercase mb-1">Scenarios</span>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900/50 p-3 rounded">{app.scenarios}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {app.status === 'pending' && (
                                    <div className="flex gap-2 shrink-0 ml-4">
                                        <AnimatedButton onClick={() => handleAction(app.id, 'approved')} className="bg-green-600 !px-4 !py-2 text-sm">Approve</AnimatedButton>
                                        <AnimatedButton onClick={() => handleAction(app.id, 'rejected')} className="bg-red-600 !px-4 !py-2 text-sm">Reject</AnimatedButton>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                    {activeTab !== 'whitelist' && apps.length === 0 && <p className="text-gray-500 text-center py-8">No applications found in this category.</p>}
                </div>
            )}
        </div>
    );
};

export default JobManagement;