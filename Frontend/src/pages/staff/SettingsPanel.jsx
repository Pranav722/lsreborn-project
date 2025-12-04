import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const SettingsPanel = ({ user }) => {
    const [settings, setSettings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) {
                setSettings(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch settings:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (formName, currentStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ formName, isOpen: !currentStatus ? 1 : 0 })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                fetchSettings(); // Refresh UI
            } else {
                setMessage("Failed: " + data.message);
            }
        } catch (e) {
            console.error(e);
            setMessage("Error toggling form.");
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSwitchType = async (type) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/management/settings/whitelist/switch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ type })
            });
            if (res.ok) {
                setMessage(`Whitelist switched to ${type.toUpperCase()}`);
                fetchSettings();
            }
        } catch (e) { console.error(e); }
        setTimeout(() => setMessage(''), 3000);
    };

    if (isLoading) return <div className="text-center text-cyan-400">Loading Settings...</div>;

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">System Settings</h2>

            {message && <div className="bg-cyan-500/20 text-cyan-300 p-3 rounded mb-4 border border-cyan-500/50">{message}</div>}

            <div className="grid gap-6">
                <Card>
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Application Toggles</h3>
                    <div className="space-y-4">
                        {settings.map((setting) => (
                            <div key={setting.form_name} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-200 capitalize">{setting.form_name} Applications</h4>
                                    <p className="text-sm text-gray-400">
                                        Current Status: <span className={setting.is_open ? "text-green-400" : "text-red-400"}>{setting.is_open ? "OPEN" : "CLOSED"}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {setting.form_name === 'whitelist' && (
                                        <div className="flex bg-gray-900 rounded p-1 mr-4">
                                            <button onClick={() => handleSwitchType('quiz')} className={`px-3 py-1 rounded text-sm ${setting.type === 'quiz' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Quiz</button>
                                            <button onClick={() => handleSwitchType('form')} className={`px-3 py-1 rounded text-sm ${setting.type === 'form' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Form</button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleToggle(setting.form_name, setting.is_open)}
                                        className={`px-4 py-2 rounded font-bold transition-colors ${setting.is_open ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'}`}
                                    >
                                        {setting.is_open ? 'Close Applications' : 'Open Applications'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPanel;