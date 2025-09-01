import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { XCircle } from 'lucide-react';

const ApplicationPage = ({ user }) => {
  const [cooldown, setCooldown] = useState({ onCooldown: false, reapplyDate: null, reason: '' });
  const [timeLeft, setTimeLeft] = useState('');
  const [formData, setFormData] = useState({ characterName: '', characterAge: '', discord: '', backstory: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would fetch the cooldown status from your backend
  // For now, this is disabled as the bot handles cooldown roles.
  // useEffect(() => { ... }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
            setFormData({ characterName: '', characterAge: '', discord: '', backstory: '' });
        } else {
            const errorData = await response.json();
            setMessage({ type: 'error', text: errorData.message || 'Failed to submit application.' });
        }
    } catch (error) {
        setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card>
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Allowlist Application</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="characterName" className="block text-sm font-medium text-cyan-300 mb-1">Character Name</label>
              <input type="text" name="characterName" id="characterName" value={formData.characterName} onChange={handleChange} required className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="characterAge" className="block text-sm font-medium text-cyan-300 mb-1">Character Age</label>
                <input type="number" name="characterAge" id="characterAge" value={formData.characterAge} onChange={handleChange} required className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="discord" className="block text-sm font-medium text-cyan-300 mb-1">Discord ID (e.g., username#1234)</label>
                <input type="text" name="discord" id="discord" value={formData.discord} onChange={handleChange} required className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="backstory" className="block text-sm font-medium text-cyan-300 mb-1">Character Backstory (min. 200 words)</label>
              <textarea name="backstory" id="backstory" rows="6" value={formData.backstory} onChange={handleChange} required className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"></textarea>
            </div>
            {message.text && (<div className={`p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{message.text}</div>)}
            <div><AnimatedButton type="submit" disabled={isLoading} className="w-full bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'Submitting...' : 'Submit Application'}</AnimatedButton></div>
          </form>
      </Card>
    </div>
  );
};
export default ApplicationPage;