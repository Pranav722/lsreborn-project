// File: frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

const HomePage = ({ setPage, onApplyClick }) => {
  const [status, setStatus] = useState({ online: false, players: 0, maxPlayers: 0 });
  
  useEffect(() => {
    const fetchStatus = () => {
        // Show a fetching status initially to give the backend time to wake up on Render
        setStatus(prevStatus => ({ ...prevStatus, online: 'fetching' }));
        fetch(`${import.meta.env.VITE_API_URL}/api/status`)
            .then(res => res.json())
            .then(data => setStatus(data))
            .catch(err => {
                console.error("Failed to fetch server status:", err);
                setStatus({ online: false, players: 0, maxPlayers: 0 });
            });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusJsx = () => {
      if(status.online === 'fetching') {
          return <span className={`font-bold px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-300`}>Fetching...</span>
      }
      return <span className={`font-bold px-3 py-1 rounded-full text-sm ${status.online ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{status.online ? 'Online' : 'Offline'}</span>
  }

  return (
    <div className="animate-fade-in">
      {/* New Full-Width Hero Section */}
      <div className="relative text-center h-screen flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div className="absolute inset-0 bg-grid-cyan opacity-10 z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-900 z-10"></div>
          
          <video autoPlay loop muted playsInline className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover">
              <source src="https://cdn.discordapp.com/attachments/1080221764562137158/1149341142544760842/gta.mp4" type="video/mp4" />
              Your browser does not support the video tag.
          </video>

          <div className="relative z-20 p-4">
              <h1 className="text-5xl md:text-8xl font-extrabold text-white tracking-tighter animate-slide-in-up">
                  <span className="text-cyan-400">LSReborn</span> V2
              </h1>
              <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                  Your next-level roleplaying experience starts here.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
                  <AnimatedButton onClick={onApplyClick} className="bg-cyan-500">Apply Now</AnimatedButton>
                  <a href="https://discord.gg/lsreborn1" target="_blank" rel="noopener noreferrer">
                    <AnimatedButton className="bg-blue-600">Join Discord</AnimatedButton>
                  </a>
              </div>
          </div>
      </div>

      {/* Server Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Server Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-gray-300">Status:</span>{getStatusJsx()}</div>
              <div className="flex justify-between items-center"><span className="text-gray-300">Players:</span><span className="font-bold text-white">{status.players} / {status.maxPlayers}</span></div>
              <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: status.maxPlayers > 0 ? `${(status.players / status.maxPlayers) * 100}%` : '0%' }}></div></div>
            </div>
          </Card>
          <Card className="md:col-span-2 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Why Join Us?</h3>
            <p className="text-gray-300">We offer a unique, story-driven RP environment with custom scripts, a dedicated staff team, and a vibrant community. Your story is waiting to be written in Los Santos.</p>
          </Card>
        </div>

        {/* New Trailer Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in" style={{ animationDelay: '1000ms' }}>
            <div>
                <h2 className="text-4xl font-bold text-cyan-400 mb-4">Dive Into the Action</h2>
                <p className="text-gray-300 mb-6">LSReborn V2 is more than just a server; it's a living, breathing world. We are dedicated to providing a high-quality, immersive roleplay experience with a focus on deep character development and compelling stories. Our active development team is always working to bring new and exciting features to the city.</p>
                <AnimatedButton onClick={() => setPage('rules')}>View Server Rules</AnimatedButton>
            </div>
            <div className="aspect-video-container rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
                <iframe 
                    className="w-full h-full" 
                    src="https://www.youtube.com/embed/TWH2a9EzqI8?autoplay=1&mute=1&loop=1&playlist=TWH2a9EzqI8&controls=0&showinfo=0&autohide=1&modestbranding=1" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                </iframe>
            </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
