import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';
import { ToggleLeft, ToggleRight } from 'lucide-react';

const JobManagement = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pd'); // pd, ems, staff
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(true);

    // Check permissions
    const showPD = user.isPDLead || user.isAdmin;
    const showEMS = user.isEMSLead || user.isAdmin;
    const showStaff = user.isAdmin;

    useEffect(() => {
        if (showPD) setActiveTab('pd');
        else if (showEMS) setActiveTab('ems');
        else if (showStaff) setActiveTab('staff');
    }, [user]);

    const fetchApps = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/${activeTab}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) setApps(await res.json());
            
            // Also fetch status
            const setRes = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            const settings = await setRes.json();
            const currentSetting = settings.find(s => s.form_name === activeTab);
            setIsFormOpen(currentSetting ? currentSetting.is_open : true);

        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchApps(); }, [activeTab]);

    const handleAction = async (id, status) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/management/${activeTab}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ status })
            });
            fetchApps();
        } catch (e) { console.error(e); }
    };

    const toggleForm = async () => {
        try {
            const newState = !isFormOpen;
            await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ formName: activeTab, isOpen: newState ? 1 : 0 })
            });
            setIsFormOpen(newState);
        } catch(e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-cyan-400">Department Management</h2>
                {/* Form Toggle Switch */}
                <button onClick={toggleForm} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isFormOpen ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'}`}>
                    {isFormOpen ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    {isFormOpen ? `${activeTab.toUpperCase()} Apps OPEN` : `${activeTab.toUpperCase()} Apps CLOSED`}
                </button>
            </div>
            
            <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
                {showPD && <button onClick={() => setActiveTab('pd')} className={`px-4 py-2 rounded ${activeTab === 'pd' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Police Dept</button>}
                {showEMS && <button onClick={() => setActiveTab('ems')} className={`px-4 py-2 rounded ${activeTab === 'ems' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>EMS</button>}
                {showStaff && <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded ${activeTab === 'staff' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Staff Apps</button>}
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {apps.map(app => (
                        <Card key={app.id} className="border-l-4 border-cyan-500">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{app.character_name || "Applicant"}</h3>
                                        {app.discord_id && <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{app.discord_id}</span>}
                                    </div>
                                    
                                    <p className="text-sm text-gray-400 mt-1">Status: <span className={`uppercase font-bold ${app.status === 'approved' ? 'text-green-400' : app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{app.status}</span></p>
                                    
                                    {/* Collapsible details could go here, for now showing key reason */}
                                    <div className="mt-3 bg-gray-900/50 p-3 rounded text-sm text-gray-300 max-h-40 overflow-y-auto">
                                        <p><strong>Reason/Backstory:</strong> {app.reason || app.experience || app.whyStaff}</p>
                                        {app.scenario_cop && <p className="mt-2"><strong>Scenario:</strong> {app.scenario_cop}</p>}
                                        {app.medical_knowledge && <p className="mt-2 whitespace-pre-wrap"><strong>Medical:</strong> {app.medical_knowledge}</p>}
                                    </div>
                                </div>
                                
                                {app.status === 'pending' && (
                                    <div className="flex gap-2 shrink-0">
                                        <AnimatedButton onClick={() => handleAction(app.id, 'approved')} className="bg-green-600 !px-4 !py-2 text-sm">Approve</AnimatedButton>
                                        <AnimatedButton onClick={() => handleAction(app.id, 'rejected')} className="bg-red-600 !px-4 !py-2 text-sm">Reject</AnimatedButton>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                    {apps.length === 0 && <p className="text-gray-500 text-center py-8">No applications found in this category.</p>}
                </div>
            )}
        </div>
    );
};

export default JobManagement;