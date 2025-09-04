import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { Clock, CheckCircle } from 'lucide-react';

const ApplicationPage = ({ user, setPage }) => {
  const [formData, setFormData] = useState({ characterName: '', characterAge: '', backstory: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  // Defensive checks to ensure user and user.roles exist before trying to access them
  const hasWaitingRole = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_WAITING_FOR_APPROVAL_ROLE_ID);
  const hasCooldownRole = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_COOLDOWN_ROLE_ID);
  
  const calculateTimeLeft = useCallback(() => {
    if (!user || !user.cooldownExpiry) return '';
    const difference = +new Date(user.cooldownExpiry) - +new Date();
    if (difference > 0) {
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return '0h 0m 0s';
  }, [user]);

  useEffect(() => {
    if (hasCooldownRole) {
      setTimeLeft(calculateTimeLeft());
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasCooldownRole, calculateTimeLeft]);

  const handleBackstoryChange = (e) => {
    setFormData({ ...formData, backstory: e.target.value });
    setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (wordCount < 200) return;
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
            setMessage({ type: 'success', text: 'Application submitted successfully! Redirecting...' });
            setTimeout(() => setPage('home'), 2000);
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
  
  if (hasWaitingRole) {
    return (
        <Card className="text-center">
            <CheckCircle className="mx-auto text-cyan-400 h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold text-cyan-300">Application in Review</h2>
            <p className="text-gray-300 mt-2">Your application has been received and is currently waiting for review. This process can take up to 24-48 hours. Please be patient.</p>
        </Card>
    );
  }
  
  if (hasCooldownRole) {
    return (
        <Card className="text-center bg-gray-900/80 border border-red-500/30">
            <Clock className="mx-auto text-red-400 h-16 w-16 mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-red-300">Application on Cooldown</h3>
            <p className="text-red-200 mt-2 mb-4">Your previous application was rejected. You can reapply in:</p>
            <div className="text-4xl font-mono font-bold text-cyan-400 my-4 p-4 bg-gray-900 rounded-lg inline-block shadow-lg">{timeLeft}</div>
        </Card>
    );
  }

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
                 <label htmlFor="discord" className="block text-sm font-medium text-cyan-300 mb-1">Your Discord</label>
                 <input type="text" name="discord" id="discord" value={user ? `${user.username}#${user.discriminator}` : ''} readOnly className="w-full bg-gray-800/80 border border-cyan-500/30 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label htmlFor="backstory" className="block text-sm font-medium text-cyan-300 mb-1">Character Backstory</label>
              <textarea name="backstory" id="backstory" rows="8" value={formData.backstory} onChange={handleBackstoryChange} required className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"></textarea>
              <p className={`text-sm mt-1 ${wordCount < 200 ? 'text-red-400' : 'text-green-400'}`}>Word Count: {wordCount} / 200</p>
            </div>
            {message.text && (<div className={`p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{message.text}</div>)}
            <div><AnimatedButton type="submit" disabled={isLoading || wordCount < 200} className="w-full bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'Submitting...' : 'Submit Application'}</AnimatedButton></div>
          </form>
      </Card>
    </div>
  );
};
export default ApplicationPage;