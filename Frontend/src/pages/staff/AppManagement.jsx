import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import Modal from '../../components/Modal';

const AppManagement = ({ user }) => {
    const [apps, setApps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('premium');
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [cooldown, setCooldown] = useState(24);
    const presetReasons = ["Low effort application.", "Backstory does not meet requirements.", "Not a unique character concept."];
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, { credentials: 'include' });
            const data = await response.json();
            setApps(data);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (app, action) => {
        setSelectedApp(app);
        setModalAction(action);
        setIsModalOpen(true);
        setRejectionReason('');
        setCustomReason('');
    };

    const handleConfirmAction = async () => {
        if (!selectedApp) return;
        
        let finalReason = '';
        if (modalAction === 'reject') {
            finalReason = rejectionReason === 'custom' ? customReason : rejectionReason;
            if (!finalReason) {
                alert("Please select or provide a reason for rejection.");
                return;
            }
        }

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${selectedApp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: modalAction,
                    reason: finalReason,
                }),
            });
        } catch (error) {
            console.error("Failed to update application:", error);
        }
        
        setIsModalOpen(false);
        setSelectedApp(null);
        fetchData(); // Refresh the list
    };

    const filteredApps = apps.filter(app => {
        if (filter === 'premium') return app.isPremium && app.status === 'pending';
        if (filter === 'pending') return !app.isPremium && app.status === 'pending';
        return app.status === filter;
    });

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Application Management</h2>
            <div className="flex space-x-2 mb-6 border-b border-cyan-500/20 pb-4">
                <button onClick={() => setFilter('premium')} className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${filter === 'premium' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:bg-gray-800'}`}>Premium</button>
                <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${filter === 'pending' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-800'}`}>Pending</button>
                <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${filter === 'approved' ? 'bg-green-500/20 text-green-300' : 'text-gray-400 hover:bg-gray-800'}`}>Approved</button>
                <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${filter === 'rejected' ? 'bg-red-500/20 text-red-300' : 'text-gray-400 hover:bg-gray-800'}`}>Rejected</button>
            </div>
            {isLoading ? <p>Loading applications...</p> : (
                <div className="space-y-4">{filteredApps.length > 0 ? filteredApps.map(app => (
                    <Card key={app.id} className={`transition-all hover:border-cyan-500/50 ${app.isPremium ? 'border-yellow-500/40' : ''}`}>
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center">{app.characterName} {app.isPremium && <span className="ml-2 text-xs font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">PREMIUM</span>}</h3>
                                <p className="text-sm text-gray-400">Discord ID: {app.discordId}</p>
                                <p className="text-sm text-gray-500">Submitted: {new Date(app.submittedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                                <button onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)} className="text-cyan-400 hover:underline">{selectedApp?.id === app.id ? 'Hide Details' : 'View Details'}</button>
                                {(filter === 'pending' || filter === 'premium') && (<>
                                    <AnimatedButton onClick={() => handleOpenModal(app, 'approved')} className="bg-green-600 !px-4 !py-1.5 text-sm">Approve</AnimatedButton>
                                    <AnimatedButton onClick={() => handleOpenModal(app, 'rejected')} className="bg-red-600 !px-4 !py-1.5 text-sm">Reject</AnimatedButton>
                                </>)}
                            </div>
                        </div>
                        {selectedApp?.id === app.id && (
                            <div className="mt-4 pt-4 border-t border-cyan-500/20 animate-fade-in-fast">
                                <p className="text-gray-300 whitespace-pre-wrap">{app.backstory}</p>
                                {app.status === 'rejected' && <p className="mt-2 text-red-400">Reason: {app.reason}</p>}
                            </div>
                        )}
                    </Card>
                )) : <p className="text-gray-400">No {filter} applications found.</p>}</div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}>
                {modalAction === 'approved' ? (
                    <div>
                        <p className="text-gray-300">Are you sure you want to approve the application for <span className="font-bold text-white">{selectedApp?.characterName}</span>?</p>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                            <AnimatedButton onClick={handleConfirmAction} className="bg-green-600">Confirm</AnimatedButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-300">Rejecting application for <span className="font-bold text-white">{selectedApp?.characterName}</span>.</p>
                        <div>
                            <label className="block text-sm font-medium text-cyan-300 mb-1">Rejection Reason</label>
                            <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none">
                                <option value="">Select a preset reason...</option>
                                {presetReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                <option value="custom">Custom Reason...</option>
                            </select>
                        </div>
                        {rejectionReason === 'custom' && (<textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Enter custom reason" className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"></textarea>)}
                        <div>
                            <label className="block text-sm font-medium text-cyan-300 mb-1">Cooldown (hours)</label>
                            <input type="number" value={cooldown} onChange={e => setCooldown(Number(e.target.value))} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                            <AnimatedButton onClick={handleConfirmAction} className="bg-red-600">Confirm Rejection</AnimatedButton>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default AppManagement;