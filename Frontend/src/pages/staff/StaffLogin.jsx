import React, { useState } from 'react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const StaffLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // In a real app, this would be a fetch call to a staff-specific login route
    if (username === 'admin' && password === 'password') {
        const staffUser = { username: 'admin', role: 'Admin', isStaff: true, isAdmin: true }; // Simulate a staff user object
        // In a real app, the backend would set a secure cookie. Here we simulate a token.
        localStorage.setItem('authToken', 'fake-jwt-token-admin'); 
        onLogin(staffUser);
    } else {
        setError('Invalid staff credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen animate-fade-in">
      <Card className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-6">Staff Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">Username (admin)</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">Password (password)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <AnimatedButton type="submit" disabled={isLoading} className="w-full bg-cyan-500 disabled:bg-gray-600">
            {isLoading ? 'Logging in...' : 'Login'}
          </AnimatedButton>
        </form>
      </Card>
    </div>
  );
};

export default StaffLogin;