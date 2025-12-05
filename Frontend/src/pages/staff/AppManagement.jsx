import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import Modal from '../../components/Modal';
import { User, Calendar, Clock, Disc, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const AppManagement = ({ user }) => {
    const [apps, setApps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [viewType, setViewType] = useState('all'); // 'all', 'premium', or 'normal'
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [cooldown, setCooldown] = useState(24);

    const presetReasons = ["Low effort application.", "Backstory does not meet requirements.", "Not a unique character concept.", "Unrealistic scenario answers."];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setApps(data);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (app, action) => {
        setSelectedApp(app);
        setModalAction(action);
        setIsModalOpen(true);
        setRejectionReason('');
        setCustomReason('');
    };

    const handleConfirmAction = async () => {
        if (!selectedApp) return;
        const token = localStorage.getItem('authToken');
        const finalReason = rejectionReason === 'custom' ? customReason : rejectionReason;

        if (modalAction === 'reject' && !finalReason) {
            alert("Please select or provide a reason for rejection.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${selectedApp.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: modalAction, reason: finalReason })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Update failed');
            }

            // Success
            setIsModalOpen(false);
            setSelectedApp(null);
            fetchData();
        } catch (error) {
            console.error("Failed to update application:", error);
            alert(`Failed to update application: ${error.message}`);
        }
    };

    const finalFilteredApps = apps
        .filter(app => app.status === filter)
        .filter(app => {
            if (viewType === 'premium') return app.isPremium;
            if (viewType === 'normal') return !app.isPremium;
            return true; // for 'all'
        });

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start space-x-3 p-3 bg-gray-900/40 rounded-lg border border-gray-800">
            <div className="p-2 bg-gray-800 rounded-md text-cyan-400">
                <Icon size={18} />
            </div>
            <div>
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</span>
                <span className="text-gray-200 font-medium">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyan-500/20 pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-cyan-400">Citizenship Applications</h2>
                    <p className="text-gray-400 text-sm mt-1">Review and manage incoming whitelist applications.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900/60 p-1 rounded-lg flex space-x-1 border border-gray-800">
                        {['pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${filter === status ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex space-x-2 bg-gray-900/40 p-1 rounded-lg border border-gray-800">
                    <button onClick={() => setViewType('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewType === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
                    <button onClick={() => setViewType('premium')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewType === 'premium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'text-gray-400 hover:text-white'}`}>Premium</button>
                    <button onClick={() => setViewType('normal')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewType === 'normal' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>Standard</button>
                </div>
                <AnimatedButton onClick={fetchData} className="!px-3 !py-2 text-xs flex items-center gap-2 bg-gray-800 hover:bg-gray-700">
                    <Clock size={14} /> Refresh List
                </AnimatedButton>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading applications...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
                    {finalFilteredApps.length > 0 ? finalFilteredApps.map(app => (
                        <Card key={app.id} className={`group transition-all duration-300 border border-transparent hover:border-cyan-500/30 ${app.isPremium ? 'bg-gradient-to-r from-gray-900 to-yellow-900/10' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${app.isPremium ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/30' : 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/30'}`}>
                                            {app.characterName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                {app.characterName}
                                                {app.isPremium && <span className="text-[10px] font-extrabold bg-yellow-500 text-black px-2 py-0.5 rounded uppercase tracking-wider">Premium</span>}
                                            </h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                                <Disc size={12} /> {app.discordId}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedApp?.id === app.id && (
                                        <div className="mt-6 space-y-6 animate-fade-in-fast">

                                            {/* Grid Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <DetailItem icon={User} label="Real Name" value={app.irlName} />
                                                <DetailItem icon={Calendar} label="Real Age" value={`${app.irlAge} years`} />
                                                <DetailItem icon={User} label="Char Name" value={app.characterName} />
                                                <DetailItem icon={Calendar} label="Char Age" value={`${app.characterAge} years`} />
                                            </div>

                                            {/* Backstory Section */}
                                            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                                <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center gap-2">
                                                    <FileText size={16} className="text-cyan-400" />
                                                    <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Character Backstory</h4>
                                                </div>
                                                <div className="p-5">
                                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{app.backstory}</p>
                                                </div>
                                            </div>

                                            {/* Questions Section */}
                                            {app.questions && (() => {
                                                try {
                                                    const q = typeof app.questions === 'string' ? JSON.parse(app.questions) : app.questions;
                                                    return (
                                                        <div className="space-y-4">
                                                            {q.foundUs && (
                                                                <div className="bg-gray-800/30 p-4 rounded-lg border-l-2 border-cyan-500">
                                                                    <p className="text-xs font-bold text-cyan-500 uppercase mb-1">Discovery</p>
                                                                    <p className="text-gray-300 text-sm">{q.foundUs}</p>
                                                                </div>
                                                            )}
                                                            {q.experience && (
                                                                <div className="bg-gray-800/30 p-4 rounded-lg border-l-2 border-cyan-500">
                                                                    <p className="text-xs font-bold text-cyan-500 uppercase mb-1">Previous Experience</p>
                                                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{q.experience}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                } catch (e) { return null; }
                                            })()}

                                            {/* Rejection Note */}
                                            {app.status === 'rejected' && app.reason && (
                                                <div className="bg-red-900/20 border border-red-500/40 p-4 rounded-lg flex items-start gap-3">
                                                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                                                    <div>
                                                        <p className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">Rejection Reason</p>
                                                        <p className="text-red-200 text-sm">{app.reason}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions Column */}
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                        <Clock size={12} /> {new Date(app.submittedAt).toLocaleDateString()}
                                    </span>

                                    <button
                                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        {selectedApp?.id === app.id ? (
                                            <>Hide Details <ChevronUp size={16} /></>
                                        ) : (
                                            <>View Details <ChevronDown size={16} /></>
                                        )}
                                    </button>

                                    {filter === 'pending' && (
                                        <div className="flex flex-row md:flex-col gap-2 w-full mt-2">
                                            <button onClick={() => handleOpenModal(app, 'approved')} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all w-full shadow-lg shadow-green-900/20">
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                            <button onClick={() => handleOpenModal(app, 'rejected')} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all w-full shadow-lg shadow-red-900/20">
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )) : (
                        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
                            <FileText className="mx-auto text-gray-600 mb-4" size={48} />
                            <p className="text-gray-400 text-lg">No {viewType !== 'all' ? viewType : ''} {filter} applications found.</p>
                            <p className="text-gray-600 text-sm">Waiting for new submissions.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}>
                {modalAction === 'approved' ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Approve Application?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to approve <span className="text-white font-bold">{selectedApp?.characterName}</span>? This will grant them the Whitelisted role.</p>
                        <div className="flex justify-center space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                            <AnimatedButton onClick={handleConfirmAction} className="bg-green-600 px-8">Confirm Approval</AnimatedButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                            <AlertCircle className="text-red-500" size={24} />
                            <div>
                                <h4 className="text-red-400 font-bold">Rejecting Application</h4>
                                <p className="text-red-200/70 text-sm">Applicant: {selectedApp?.characterName}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Reason for Rejection</label>
                            <div className="relative">
                                <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all">
                                    <option value="">Select a reason...</option>
                                    {presetReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                    <option value="custom">Write custom reason...</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {rejectionReason === 'custom' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Custom Reason</label>
                                <textarea
                                    value={customReason}
                                    onChange={e => setCustomReason(e.target.value)}
                                    placeholder="Explain why the application was rejected..."
                                    rows={3}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                                ></textarea>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                            <AnimatedButton onClick={handleConfirmAction} className="bg-red-600">Reject Application</AnimatedButton>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default AppManagement;