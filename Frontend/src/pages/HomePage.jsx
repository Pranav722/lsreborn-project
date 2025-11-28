import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { Play, Users } from 'lucide-react';

const HomePage = ({ setPage, onApplyClick }) => {
  const [status, setStatus] = useState({ online: false, players: 0, maxPlayers: 0 });
  
  useEffect(() => {
    const fetchStatus = () => {
        setStatus(prevStatus => ({ ...prevStatus, online: 'fetching' }));
        
        // Robust check for environment variables to prevent build warnings/errors
        let apiUrl = 'http://localhost:3001';
        try {
            // Check if import.meta and import.meta.env exist before accessing
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
                apiUrl = import.meta.env.VITE_API_URL;
            }
        } catch (e) {
            console.warn("Environment variable access failed, using default.");
        }
        
        fetch(`${apiUrl}/api/status`)
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

  return (
    <div className="animate-fade-in w-full">
      {/* Full-Screen Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden -mt-16">
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full z-0">
               <div className="absolute inset-0 bg-gray-950/70 z-10"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 h-full"></div>
               <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                  <source src="https://cdn.discordapp.com/attachments/1080221764562137158/1149341142544760842/gta.mp4" type="video/mp4" />
               </video>
          </div>

          {/* Hero Content - Centered */}
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">LS</span>Reborn
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide mb-10 max-w-2xl mx-auto">
                  Redefining the standard of <span className="text-cyan-400 font-medium">Roleplay</span>. Your story begins here.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <AnimatedButton onClick={onApplyClick} className="bg-cyan-500 shadow-lg shadow-cyan-500/20 px-10 py-4 text-lg">
                      Start Your Journey
                  </AnimatedButton>
                  <a href="https://discord.gg/lsreborn1" target="_blank" rel="noopener noreferrer">
                    <button className="px-10 py-4 rounded-lg font-bold text-white border border-white/20 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                        Join Community
                    </button>
                  </a>
              </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-32">
        
        {/* Stats & Info Grid */}
        <div className="grid md:grid-cols-12 gap-8">
            
            {/* Modern Minimalist Status Card */}
            <div className="md:col-span-4">
                <div className="h-full bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={100} />
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-400 text-sm font-medium tracking-wider uppercase">Los Santos Status</span>
                            {status.online && status.online !== 'fetching' && (
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-white">
                            {status.online === 'fetching' ? 'Connecting...' : (status.online ? 'Live Server' : 'Offline')}
                        </h3>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-end gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">
                                {status.players}
                            </span>
                            <span className="text-xl text-gray-500 font-medium mb-2">
                                / {status.maxPlayers}
                            </span>
                        </div>
                        <div className="text-cyan-400 text-sm font-medium mt-1">Active Citizens</div>
                    </div>
                </div>
            </div>

            {/* About / Why Join */}
            <div className="md:col-span-8">
                 <div className="h-full flex flex-col justify-center space-y-6 p-4">
                    <h2 className="text-4xl font-bold text-white">Why <span className="text-cyan-400">LSReborn?</span></h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        We aren't just another server; we are a community-driven project aimed at providing the most immersive storytelling environment possible. 
                        With custom scripts, balanced economy, and a dedicated staff team, we ensure fair play and endless opportunities for your character.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                        {['Custom Cars', 'Player Housing', 'Illegal Jobs', 'Whitelisted PD'].map((feature, i) => (
                            <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 text-center text-sm text-gray-300 font-medium hover:bg-gray-800/60 transition-colors cursor-default">
                                {feature}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        {/* Trailer & Feature Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-800 bg-gray-900">
                    <iframe 
                        className="w-full h-full" 
                        src="https://www.youtube.com/embed/Xr3GZDRQ1lo?si=wQezikgYsIb1y4sf&autoplay=1&mute=1&loop=1&playlist=Xr3GZDRQ1lo&controls=0&rel=0" 
                        title="Server Trailer" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                    </iframe>
                </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-8">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Experience the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Next Generation</span></h2>
                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        Step into a world that feels alive. From the bustling streets of Los Santos to the quiet deserts of Sandy Shores, every corner is filled with potential interactions.
                        Our V2 update brings improved performance, new heists, and a completely revamped gang system.
                    </p>
                </div>
                <button onClick={() => setPage('rules')} className="flex items-center gap-3 text-white font-semibold group transition-colors hover:text-cyan-400">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <Play className="w-5 h-5 fill-current" />
                    </div>
                    Read Server Rules
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
export default HomePage;