import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

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

    const handleJoin = async () => {
        setIsLoading(true);
        await fetch(`${import.meta.env.VITE_API_URL}/api/queue/join`, {
            method: 'POST',
            credentials: 'include',
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

    return (
        <div className="animate-fade-in">
            <Card className="text-center">
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Server Queue</h2>
                <p className="text-gray-300 mb-6">Click the button below to join the queue. You will be automatically placed in the highest priority queue you are eligible for based on your Discord roles.</p>
                <AnimatedButton onClick={handleJoin} className="bg-cyan-500">
                    Join Queue
                </AnimatedButton>
            </Card>
        </div>
    );
};
export default QueuePage;