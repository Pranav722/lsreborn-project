// File: src/pages/QueuePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { ShieldCheck, Crown, HeartPulse, Siren, Users } from 'lucide-react';

const QueuePage = ({ user, setPage }) => {
    const [queueStatus, setQueueStatus] = useState({ inQueue: false, type: null, position: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/queue/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setQueueStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch queue status:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchStatus]); // fetchStatus is memoized with [user], so this is safe.

    const handleJoin = async (queueType) => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/queue/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ queueType })
            });
        } catch (error) {
            console.error(`Failed to join ${queueType} queue:`, error);
        } finally {
            fetchStatus();
        }
    };

    const handleLeave = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        await fetch(`${import.meta.env.VITE_API_URL}/api/queue/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchStatus();
    };

    const QueueCard = ({ title, icon: Icon, description, allowed, onJoin }) => (
        <Card className={`text-center flex flex-col justify-between transition-opacity duration-300 ${!allowed && 'opacity-50'}`}>
            <div>
                <Icon className={`mx-auto h-12 w-12 mb-4 ${allowed ? 'text-cyan-400' : 'text-gray-500'}`} />
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-gray-400 mt-2 text-sm h-10">{description}</p>
            </div>
            <AnimatedButton onClick={onJoin} disabled={!allowed} className={`w-full mt-6 ${allowed ? 'bg-cyan-500' : 'bg-gray-700 cursor-not-allowed'}`}>
                {allowed ? 'Join Queue' : 'Not Eligible'}
            </AnimatedButton>
        </Card>
    );

    if (isLoading) return <div className="text-center text-cyan-400">Loading Queue...</div>;

    if (queueStatus.inQueue) {
        const estimatedTime = queueStatus.position * 1.5;
        return (
            <div className="animate-fade-in">
                <Card>
                    <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">You are in the {queueStatus.type} queue</h2>
                    <div className="text-center">
                        {queueStatus.position === 1 ? (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-green-400">You're next!</h3>
                                <p className="text-gray-300">You can now connect to the server.</p>
                                <a href="fivem://connect/your.server.ip:port">
                                    <AnimatedButton className="bg-green-600">Connect to Server</AnimatedButton>
                                </a>
                                <p className="text-sm text-gray-500">Your spot is held for 5 minutes.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-lg text-gray-300">Your position in queue:</p>
                                <p className="text-6xl font-bold text-cyan-400 my-4">{queueStatus.position} <span className="text-3xl text-gray-400">/ {queueStatus.total}</span></p>
                                <p className="text-gray-400">Estimated wait time: ~{estimatedTime.toFixed(1)} minutes</p>
                                <AnimatedButton onClick={handleLeave} className="bg-red-600">Leave Queue</AnimatedButton>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    const userRoles = user?.roles || [];
    const isStaffOrAdmin = userRoles.includes(import.meta.env.VITE_STAFF_ROLE_ID) || userRoles.includes(import.meta.env.VITE_LSR_ADMIN_ROLE_ID);

    const queueData = [
        { type: 'staff', title: 'Staff', icon: ShieldCheck, desc: "For on-duty staff members.", role: import.meta.env.VITE_STAFF_ROLE_ID },
        { type: 'police', title: 'PD', icon: Siren, desc: "For on-duty LSPD and BCSO officers.", role: import.meta.env.VITE_SALE_ROLE_ID },
        { type: 'ems', title: 'EMS', icon: HeartPulse, desc: "For on-duty medical personnel.", role: import.meta.env.VITE_EMS_ROLE_ID },
        { type: 'premium', title: 'Premium Priority', icon: Crown, desc: "Highest tier priority access.", role: import.meta.env.VITE_PREMIUM_ROLE_ID },
        { type: 'prime', title: 'Prime Priority', icon: Crown, desc: "High tier priority access.", role: import.meta.env.VITE_PRIME_ROLE_ID },
        { type: 'elite', title: 'Elite Priority', icon: Crown, desc: "Great priority access.", role: import.meta.env.VITE_ELITE_ROLE_ID },
        { type: 'pro', title: 'Pro Priority', icon: Crown, desc: "Good priority access.", role: import.meta.env.VITE_PRO_ROLE_ID },
        { type: 'starter', title: 'Starter Priority', icon: Crown, desc: "Basic priority access.", role: import.meta.env.VITE_STARTER_ROLE_ID },
        { type: 'rookie', title: 'Rookie Priority', icon: Crown, desc: "Entry-level priority access.", role: import.meta.env.VITE_ROOKIE_ROLE_ID },
        { type: 'normal', title: 'Normal', icon: Users, desc: "Standard queue for all civilians.", role: import.meta.env.VITE_WHITELISTED_ROLE_ID },
    ];


    return (
        <div className="animate-fade-in">
            <Card>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Join a Queue</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {queueData.map(q => (
                        <QueueCard
                            key={q.type}
                            title={q.title}
                            icon={q.icon}
                            description={q.desc}
                            allowed={isStaffOrAdmin || userRoles.includes(q.role) || q.type === 'normal'}
                            onJoin={() => handleJoin(q.type)}
                        />
                    ))}
                </div>
            </Card>
        </div>
    );
};
export default QueuePage;
