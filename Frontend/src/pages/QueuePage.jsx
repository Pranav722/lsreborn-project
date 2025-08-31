import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { ShieldCheck, Crown, HeartPulse, Siren, Users } from 'lucide-react';

const QUEUE_DATA = [
    { name: 'staff', roleIdEnv: 'VITE_STAFF_ROLE_ID', icon: ShieldCheck, title: 'Staff Queue', description: 'For on-duty staff members.' },
    { name: 'pd', roleIdEnv: 'VITE_SALE_ROLE_ID', icon: Siren, title: 'PD Queue', description: 'For on-duty LSPD and BCSO officers.' },
    { name: 'ems', roleIdEnv: 'VITE_EMS_ROLE_ID', icon: HeartPulse, title: 'EMS Queue', description: 'For on-duty medical personnel.' },
    { name: 'premium', roleIdEnv: 'VITE_PREMIUM_ROLE_ID', icon: Crown, title: 'Premium Queue', description: 'Highest priority access.' },
    { name: 'prime', roleIdEnv: 'VITE_PRIME_ROLE_ID', icon: Crown, title: 'Prime Queue', description: 'Excellent priority access.' },
    { name: 'elite', roleIdEnv: 'VITE_ELITE_ROLE_ID', icon: Crown, title: 'Elite Queue', description: 'Great priority access.' },
    { name: 'pro', roleIdEnv: 'VITE_PRO_ROLE_ID', icon: Crown, title: 'Pro Queue', description: 'Enhanced priority access.' },
    { name: 'starter', roleIdEnv: 'VITE_STARTER_ROLE_ID', icon: Crown, title: 'Starter Queue', description: 'Good priority access.' },
    { name: 'rookie', roleIdEnv: 'VITE_ROOKIE_ROLE_ID', icon: Crown, title: 'Rookie Queue', description: 'Basic priority access.' },
    { name: 'normal', roleIdEnv: 'VITE_WHITELISTED_ROLE_ID', icon: Users, title: 'Normal Queue', description: 'Standard queue for all civilians.' },
];


const QueuePage = ({ user, setPage }) => {
    const [queueStatus, setQueueStatus] = useState({ inQueue: false, type: null, position: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/queue/status`, { credentials: 'include' });
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
        const interval = setInterval(fetchStatus, 5000); // Poll more frequently
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleJoin = async (queueType) => {
        setIsLoading(true);
        await fetch(`${import.meta.env.VITE_API_URL}/api/queue/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ queueType })
        });
        fetchStatus();
    };

    const handleLeave = async () => {
        setIsLoading(true);
        await fetch(`${import.meta.env.VITE_API_URL}/api/queue/leave`, {
            method: 'POST',
            credentials: 'include'
        });
        fetchStatus();
    };

    const QueueCard = ({ queueInfo, isAllowed, onJoin }) => (
        <Card className={`text-center flex flex-col justify-between transition-opacity ${!isAllowed && 'opacity-40'}`}>
            <div>
                <queueInfo.icon className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold text-white">{queueInfo.title}</h3>
                <p className="text-gray-400 mt-2 text-sm">{queueInfo.description}</p>
            </div>
            <AnimatedButton onClick={() => onJoin(queueInfo.name)} disabled={!isAllowed} className={`w-full mt-6 ${isAllowed ? 'bg-cyan-500' : 'bg-gray-600 cursor-not-allowed'}`}>
                {isAllowed ? 'Join Queue' : 'Not Eligible'}
            </AnimatedButton>
        </Card>
    );

    if (isLoading) return <div className="text-center text-cyan-400">Loading Queue...</div>;
    
    if (queueStatus.inQueue) {
        const estimatedTime = queueStatus.position * 1.5;
        const isPurchasableQueue = ['rookie', 'starter', 'pro', 'elite', 'prime', 'premium'].includes(queueStatus.type);
        
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
                        {isPurchasableQueue && (
                             <p className="text-center mt-6 text-sm text-gray-400">Want even faster access? <a href="#" onClick={(e) => { e.preventDefault(); setPage('store'); }} className="text-cyan-400 hover:underline">Visit the store</a> to upgrade your priority.</p>
                        )}
                    </div>
                </Card>
            </div>
        );
    }
    
    const userRoles = user?.roles || [];
    const isAdminOrStaff = user?.isStaff || user?.isAdmin;

    return (
        <div className="animate-fade-in">
            <Card>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Join a Queue</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {QUEUE_DATA.map(queue => {
                         const roleId = import.meta.env[queue.roleIdEnv];
                         const isAllowed = isAdminOrStaff || userRoles.includes(roleId);
                         return <QueueCard key={queue.name} queueInfo={queue} isAllowed={isAllowed} onJoin={handleJoin} />
                    })}
                </div>
            </Card>
        </div>
    );
};
export default QueuePage;