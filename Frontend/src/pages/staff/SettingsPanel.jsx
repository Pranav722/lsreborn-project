import React, { useState } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const SettingsPanel = ({ user }) => {
    // This component is currently a placeholder.
    // In a real app, you would fetch and update settings via API calls.
    const [settings, setSettings] = useState({ 
        approvalWebhook: '', 
        rejectionWebhook: '', 
        defaultCooldown: 24 
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(res => setTimeout(res, 500));
        console.log("Settings saved:", settings);
        setIsLoading(false);
        setMessage('Settings updated successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <h3 className="text-xl font-bold text-cyan-300 mb-4">Webhook URLs</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Approval Webhook</label>
                            <input type="text" name="approvalWebhook" value={settings.approvalWebhook} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Rejection Webhook</label>
                            <input type="text" name="rejectionWebhook" value={settings.rejectionWebhook} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold text-cyan-300 mb-4">Application Settings</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Default Cooldown (hours)</label>
                        <input type="number" name="defaultCooldown" value={settings.defaultCooldown} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                    </div>
                </Card>
                {message && <p className="text-green-400 text-center">{message}</p>}
                <AnimatedButton type="submit" disabled={isLoading} className="bg-cyan-500">{isLoading ? 'Saving...' : 'Save Settings'}</AnimatedButton>
            </form>
        </div>
    );
};

export default SettingsPanel;