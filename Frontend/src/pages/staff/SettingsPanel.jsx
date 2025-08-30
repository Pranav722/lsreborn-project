import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const SettingsPanel = ({ user }) => {
    const [settings, setSettings] = useState({ approvalWebhook: '', rejectionWebhook: '', approvalBanner: '', rejectionBanner: '', defaultCooldown: 24 });
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    useEffect(() => { 
        // In a real app, you would fetch settings from your backend
        setIsLoading(false);
    }, []);

    const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // In a real app, you would post settings to your backend
        console.log("Saving settings:", settings);
        setMessage('Settings updated successfully!');
        setTimeout(() => setMessage(''), 3000);
        setIsLoading(false);
    };

    if (!user.isAdmin) return <p className="text-red-400">You do not have permission to view this page.</p>;
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Settings</h2>
            {isLoading ? <p>Loading settings...</p> : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card><h3 className="text-xl font-bold text-cyan-300 mb-4">Webhook URLs</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-1">Approval Webhook</label><input type="text" name="approvalWebhook" value={settings.approvalWebhook} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Rejection Webhook</label><input type="text" name="rejectionWebhook" value={settings.rejectionWebhook} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /></div></div></Card>
                    <Card><h3 className="text-xl font-bold text-cyan-300 mb-4">Banner Images</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-1">Approval Banner URL</label><input type="text" name="approvalBanner" value={settings.approvalBanner} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Rejection Banner URL</label><input type="text" name="rejectionBanner" value={settings.rejectionBanner} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /></div></div></Card>
                    <Card><h3 className="text-xl font-bold text-cyan-300 mb-4">Application Settings</h3><div><label className="block text-sm font-medium text-gray-300 mb-1">Default Cooldown (hours)</label><input type="number" name="defaultCooldown" value={settings.defaultCooldown} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /></div></Card>
                    {message && <p className="text-green-400 text-center">{message}</p>}
                    <AnimatedButton type="submit" disabled={isLoading} className="bg-cyan-500">{isLoading ? 'Saving...' : 'Save Settings'}</AnimatedButton>
                </form>
            )}
        </div>
    );
};
export default SettingsPanel;