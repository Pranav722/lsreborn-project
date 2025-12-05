import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import { ToggleLeft, ToggleRight, Loader2, Zap, User, Clock, Shield, Heart, FileText, Briefcase, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Settings, Calendar } from 'lucide-react';

const JobManagement = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pd');
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [uiMessage, setUIMessage] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);

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
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Action failed');
            }
            setUIMessage(`${activeTab.toUpperCase()} application ${status} successfully!`);
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
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Toggle failed');
            }
            setUIMessage(`${formName.toUpperCase()} form is now ${newState ? 'OPEN' : 'CLOSED'}`);
            await fetchSettings(); // Refresh immediately to show new state
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
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Switch failed');
            }
            setUIMessage(`Whitelist type successfully switched to ${newType.toUpperCase()}`);
            await fetchSettings();
        } catch (e) {
            setUIMessage(`Error switching type: ${e.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => setUIMessage(''), 3000);
        }
    };

    const currentFormSetting = settings[activeTab] || { is_open: 1, type: 'form' };
    const whitelistSetting = settings['whitelist'] || { is_open: 1, type: 'quiz' };

    // Determine if User can toggle CURRENT tab
    const canToggleCurrent = isAdmin || (activeTab === 'pd' && user.isPDLead) || (activeTab === 'ems' && user.isEMSLead);

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start space-x-3 p-3 bg-gray-900/40 rounded-lg border border-gray-800">
            <div className="p-2 bg-gray-800 rounded-md text-cyan-400">
                <Icon size={18} />
            </div>
            <div>
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</span>
                <span className="text-gray-200 font-medium break-words">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyan-500/20 pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
                        {activeTab === 'pd' && <Shield className="text-blue-500" />}
                        {activeTab === 'ems' && <Heart className="text-red-500" />}
                        {activeTab === 'staff' && <Zap className="text-purple-500" />}
                        {activeTab === 'whitelist' && <Settings className="text-gray-400" />}

                        {activeTab === 'pd' ? 'Police Department' : activeTab === 'ems' ? 'EMS Department' : activeTab === 'staff' ? 'Staff Applications' : 'Whitelist Config'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Manage applications and status for {activeTab.toUpperCase()}.</p>
                </div>

                {/* STATUS TOGGLE */}
                {canToggleCurrent && (
                    <div className="flex items-center space-x-4 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider px-2">Applications Status</span>
                        <button
                            onClick={() => toggleFormStatus(activeTab, currentFormSetting.is_open)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-sm transition-all shadow-lg ${currentFormSetting.is_open
                                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-900/30 ring-1 ring-green-400/50'
                                : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-900/30 ring-1 ring-red-400/50'}`}
                        >
                            {currentFormSetting.is_open ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {currentFormSetting.is_open ? 'OPEN' : 'CLOSED'}
                        </button>
                    </div>
                )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {showPD && <button onClick={() => { setActiveTab('pd'); setSelectedApp(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm font-bold ${activeTab === 'pd' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-900/20' : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'}`}><Shield size={16} /> Police Dept</button>}
                {showEMS && <button onClick={() => { setActiveTab('ems'); setSelectedApp(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm font-bold ${activeTab === 'ems' ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-lg shadow-red-900/20' : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'}`}><Heart size={16} /> EMS</button>}
                {showStaff && <button onClick={() => { setActiveTab('staff'); setSelectedApp(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm font-bold ${activeTab === 'staff' ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-lg shadow-purple-900/20' : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'}`}><Zap size={16} /> Staff Apps</button>}

                {isAdmin && <div className="h-8 w-px bg-gray-700 mx-2 self-center"></div>}
                {isAdmin && <button onClick={() => { setActiveTab('whitelist'); setSelectedApp(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm font-bold ${activeTab === 'whitelist' ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50 shadow-lg shadow-cyan-900/20' : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'}`}><Settings size={16} /> Whitelist Config</button>}
            </div>

            {/* Special View for Whitelist Config Tab */}
            {activeTab === 'whitelist' && isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <Card className="border-cyan-500/20 bg-gradient-to-br from-gray-900 to-cyan-900/10">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><ToggleRight className="text-cyan-400" /> Master Control</h3>
                        <p className="text-gray-400 text-sm mb-6">Global switch for the whitelist application system.</p>

                        <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10 flex items-center justify-between">
                            <span className="font-bold text-gray-300">Application Access</span>
                            <button
                                onClick={() => toggleFormStatus('whitelist', whitelistSetting.is_open)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${whitelistSetting.is_open ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'}`}
                            >
                                {whitelistSetting.is_open ? 'ENABLED' : 'DISABLED'}
                            </button>
                        </div>
                    </Card>

                    <Card className="border-cyan-500/20 bg-gradient-to-br from-gray-900 to-blue-900/10">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FileText className="text-blue-400" /> Application Mode</h3>
                        <p className="text-gray-400 text-sm mb-6">Choose how users apply for whitelisting.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => switchWhitelistType('quiz')}
                                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${whitelistSetting.type === 'quiz' ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                            >
                                <Zap size={24} className={whitelistSetting.type === 'quiz' ? 'text-blue-400' : 'text-gray-500'} />
                                <span className="font-bold">Quiz Mode</span>
                            </button>
                            <button
                                onClick={() => switchWhitelistType('form')}
                                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${whitelistSetting.type === 'form' ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                            >
                                <FileText size={24} className={whitelistSetting.type === 'form' ? 'text-blue-400' : 'text-gray-500'} />
                                <span className="font-bold">Written Form</span>
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {uiMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${uiMessage.includes('Error') ? 'bg-red-900/30 border border-red-500/50 text-red-200' : 'bg-green-900/30 border border-green-500/50 text-green-200'}`}>
                    {uiMessage.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {uiMessage}
                </div>
            )}

            {loading && activeTab !== 'whitelist' ? (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin w-10 h-10 text-cyan-500 mx-auto mb-4" />
                    <p className="text-gray-400">Loading department data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
                    {activeTab !== 'whitelist' && apps.map(app => (
                        <Card key={app.id} className={`group border border-transparent hover:border-cyan-500/30 transition-all ${activeTab === 'pd' ? 'hover:shadow-blue-900/10' : activeTab === 'ems' ? 'hover:shadow-red-900/10' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${activeTab === 'pd' ? 'bg-blue-600/20 text-blue-400' : activeTab === 'ems' ? 'bg-red-600/20 text-red-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                            {activeTab === 'pd' ? <Shield size={20} /> : activeTab === 'ems' ? <Heart size={20} /> : <Zap size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white leading-tight">{app.character_name || "Applicant"}</h3>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><User size={12} /> Discord: {app.discord_id || "Unknown"}</span>
                                        </div>
                                        <div className={`ml-auto px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${app.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                            {app.status}
                                        </div>
                                    </div>

                                    {/* Action Buttons (Always visible for easy access or hidden if reviewed?) */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <button
                                            onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1 transition-colors"
                                        >
                                            {selectedApp?.id === app.id ? (
                                                <>Hide Full Application <ChevronUp size={16} /></>
                                            ) : (
                                                <>View Full Application <ChevronDown size={16} /></>
                                            )}
                                        </button>

                                        {app.status === 'pending' && (
                                            <div className="flex gap-2 ml-auto">
                                                <button onClick={() => handleAction(app.id, 'approved')} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                                                <button onClick={() => handleAction(app.id, 'rejected')} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                                            </div>
                                        )}
                                    </div>


                                    {/* Expanded Details */}
                                    {selectedApp?.id === app.id && (
                                        <div className="mt-4 bg-black/20 p-6 rounded-xl border border-white/5 space-y-6 animate-fade-in">
                                            {/* Common Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <DetailItem icon={User} label="IRL Name" value={app.irl_name} />
                                                <DetailItem icon={Calendar} label="IRL Age" value={app.irl_age} />
                                                <DetailItem icon={Clock} label="Weekly Hours" value={app.weekly_hours} />
                                            </div>

                                            {/* PD Fields */}
                                            {activeTab === 'pd' && (
                                                <div className="space-y-4">
                                                    <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20">
                                                        <h4 className="text-blue-400 font-bold text-sm uppercase mb-2">Previous Experience</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.experience}</p>
                                                    </div>
                                                    <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20">
                                                        <h4 className="text-blue-400 font-bold text-sm uppercase mb-2">Reason for Joining</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.reason}</p>
                                                    </div>
                                                    <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20">
                                                        <h4 className="text-blue-400 font-bold text-sm uppercase mb-2">Scenario Response</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.scenario_cop}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* EMS Fields */}
                                            {activeTab === 'ems' && (
                                                <div className="space-y-4">
                                                    <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                                                        <h4 className="text-red-400 font-bold text-sm uppercase mb-2">Medical Knowledge</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.medical_knowledge}</p>
                                                    </div>
                                                    <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                                                        <h4 className="text-red-400 font-bold text-sm uppercase mb-2">Scenario Responses</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.scenarios}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Staff Fields */}
                                            {activeTab === 'staff' && (
                                                <div className="space-y-4">
                                                    <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                                                        <h4 className="text-purple-400 font-bold text-sm uppercase mb-2">Staff Experience</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.experience}</p>
                                                    </div>
                                                    <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                                                        <h4 className="text-purple-400 font-bold text-sm uppercase mb-2">Responsibilities</h4>
                                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.responsibilities}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {activeTab !== 'whitelist' && apps.length === 0 && (
                        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
                            <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
                            <p className="text-gray-400 text-lg">No applications found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobManagement;