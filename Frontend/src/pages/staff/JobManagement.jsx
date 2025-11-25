import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const JobManagement = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pd'); // pd, ems, staff
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);

    // Check permissions to show tabs
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

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Department Management</h2>
            
            <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
                {showPD && <button onClick={() => setActiveTab('pd')} className={`px-4 py-2 rounded ${activeTab === 'pd' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Police Dept</button>}
                {showEMS && <button onClick={() => setActiveTab('ems')} className={`px-4 py-2 rounded ${activeTab === 'ems' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>EMS</button>}
                {showStaff && <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded ${activeTab === 'staff' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Staff Apps</button>}
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {apps.map(app => (
                        <Card key={app.id} className="border-l-4 border-cyan-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{app.character_name || "Applicant"}</h3>
                                    <p className="text-sm text-gray-400">Status: <span className={`uppercase font-bold ${app.status === 'approved' ? 'text-green-400' : app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{app.status}</span></p>
                                    <div className="mt-2 text-gray-300 text-sm space-y-1">
                                        <p><strong>Discord ID:</strong> {app.discord_id}</p>
                                        <p><strong>Reason/Backstory:</strong> {app.reason || app.experience}</p>
                                        {/* Add more fields here based on the tab */}
                                    </div>
                                </div>
                                {app.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <AnimatedButton onClick={() => handleAction(app.id, 'approved')} className="bg-green-600 !px-3 !py-1 text-xs">Approve</AnimatedButton>
                                        <AnimatedButton onClick={() => handleAction(app.id, 'rejected')} className="bg-red-600 !px-3 !py-1 text-xs">Reject</AnimatedButton>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                    {apps.length === 0 && <p className="text-gray-500">No applications found.</p>}
                </div>
            )}
        </div>
    );
};

export default JobManagement;