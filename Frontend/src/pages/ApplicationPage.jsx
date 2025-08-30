import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { XCircle } from 'lucide-react';

const ApplicationPage = ({ user }) => {
  const [cooldown, setCooldown] = useState({ onCooldown: false, reapplyDate: null, reason: '' });
  const [timeLeft, setTimeLeft] = useState('');
  const [formData, setFormData] = useState({ characterName: '', characterAge: '', discord: '', backstory: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  const calculateTimeLeft = useCallback((endDate) => {
    const difference = +new Date(endDate) - +new Date();
    if (difference > 0) {
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return '';
  }, []);

  useEffect(() => {
    // This would be a real API call in your app
    // mockApi.checkCooldown(user.username).then(data => {
    //   setCooldown(data);
    //   if (data.onCooldown) {
    //     setTimeLeft(calculateTimeLeft(data.reapplyDate));
    //   }
    //   setIsLoading(false);
    // });
    setIsLoading(false); // For now, we assume no cooldown initially
  }, [calculateTimeLeft, user.username]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
  
  if (isLoading) {
    return <div className="text-center text-cyan-400">Loading...</div>;
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Allowlist Application</h2>
        {cooldown.onCooldown ? (
          <div className="text-center bg-red-900/50 border border-red-500/30 p-8 rounded-lg">
            <XCircle className="mx-auto text-red-400 h-16 w-16 mb-4" />
            <h3 className="text-2xl font-bold text-red-300">Application on Cooldown</h3>
            <p className="text-red-200 mt-2 mb-4">{cooldown.reason}</p>
            <p className="text-lg text-white">You can reapply in:</p>
            <div className="text-4xl font-mono font-bold text-cyan-400 my-4 p-4 bg-gray-900 rounded-lg inline-block">{timeLeft}</div>
          </div>
        ) : (
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
        )}
      </Card>
    </div>
  );
};
export default ApplicationPage;