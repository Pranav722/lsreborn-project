import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { Play, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamMember = ({ name, role, desc, image }) => {
    return (
        <div className="group relative w-full h-80 perspective-1000">
            <div className="relative w-full h-full duration-500 preserve-3d group-hover:my-rotate-y-180">
                {/* Card Container */}
                <motion.div 
                    whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
                    className="w-full h-full bg-gray-900/40 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden relative shadow-lg shadow-cyan-500/10 transition-all duration-500 group-hover:shadow-cyan-500/30 group-hover:border-cyan-400/50"
                >
                    {/* Image Background (Darkened) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10"></div>
                    <img 
                        src={image || `https://ui-avatars.com/api/?name=${name}&background=0d1117&color=22d3ee&size=256`} 
                        alt={name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                    />

                    {/* Content - Default State */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform transition-transform duration-500 group-hover:-translate-y-4">
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">{role}</p>
                        <h3 className="text-2xl font-black text-white">{name}</h3>
                    </div>

                    {/* Content - Hover Reveal State */}
                    <div className="absolute inset-0 bg-gray-950/90 flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-2">{role}</p>
                            <h3 className="text-2xl font-bold text-white mb-4">{name}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-cyan-500 pl-3">
                                "{desc}"
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const HomePage = ({ setPage, onApplyClick }) => {
  const [status, setStatus] = useState({ online: false, players: 0, maxPlayers: 0 });
  const [showAllTeam, setShowAllTeam] = useState(false);
  
  useEffect(() => {
    const fetchStatus = () => {
        setStatus(prevStatus => ({ ...prevStatus, online: 'fetching' }));
        // Safe check for import.meta
        let apiUrl = 'http://localhost:3001';
        try {
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
                apiUrl = import.meta.env.VITE_API_URL;
            }
        } catch (e) { console.warn("Env check failed"); }
        
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

  const teamMembers = [
      { name: 'Certified Noob', role: 'OverWatcher', desc: 'People feel this guy is just a normie but what they need is just 5 mins in VC to understand what a Gem he is and why is he really the Overwatcher.' },
      { name: 'Xtracious', role: 'Karma', desc: 'The all rounder. Introduction jitna do utna kam hai. From Roleplaying with 12 characters to Developing assets and managing staff, he does it all.' },
      { name: 'Jay Bhai', role: 'Community Manager', desc: 'The Ghost Mayor of the city who is mostly overlooking everything.' },
      { name: 'Riginex', role: 'LSReborn Partner', desc: 'The undercover chill and Rich guy in server with a Huge AURA. In short: chalta firta EDM Pack.' },
      { name: 'Itaachi', role: 'Management', desc: 'The OG Mafia Uncle and Perfect Vehicle Handler. Short: Chalta firta Vehicle Resource of server.' },
      { name: 'Rexci', role: 'Management', desc: 'The most experienced and fierce player. If he enters RP, players drop their guns. Manages Gangs effortlessly.' },
      // Hidden by default
      { name: 'Luffy', role: 'PD Management & Staff', desc: 'The law enforcer you do not want to mess with. Try doing crime once in server and find out.', hidden: true },
      { name: 'Tushar Gupta', role: 'PD Management & Staff', desc: 'Aspataal Premium Member. Always in the thick of the action.', hidden: true },
      { name: 'Danny', role: 'Staff', desc: 'Dedicated to keeping the streets clean and the RP quality high.', hidden: true },
      { name: 'Draken', role: 'Staff', desc: 'Ensuring fair play and assisting citizens with technical issues.', hidden: true },
      { name: 'DaddyWoo', role: 'Staff', desc: 'Watching over the city to ensure everyone has a good time.', hidden: true },
  ];

  const displayedTeam = showAllTeam ? teamMembers : teamMembers.filter(m => !m.hidden);

  return (
    <div className="animate-fade-in w-full">
      {/* Full-Screen Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden -mt-16">
          <div className="absolute inset-0 w-full h-full z-0">
               <div className="absolute inset-0 bg-gray-950/70 z-10"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 h-full"></div>
               <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                  <source src="https://cdn.discordapp.com/attachments/1080221764562137158/1149341142544760842/gta.mp4" type="video/mp4" />
               </video>
          </div>

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
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-32">
        
        {/* Stats & Info Grid */}
        <div className="grid md:grid-cols-12 gap-8">
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

        {/* Trailer Section */}
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

        {/* TEAM SHOWCASE SECTION */}
        <div className="pt-16">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Meet The <span className="text-cyan-400">Legends</span></h2>
                <p className="text-gray-400 max-w-2xl mx-auto">The minds and hearts behind LSReborn. Dedicated to providing the best roleplay experience.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {displayedTeam.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <TeamMember {...member} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="text-center mt-12">
                <button 
                    onClick={() => setShowAllTeam(!showAllTeam)} 
                    className="group flex items-center gap-2 mx-auto text-gray-400 hover:text-cyan-400 transition-colors font-medium border border-gray-800 hover:border-cyan-500/50 rounded-full px-6 py-3 bg-gray-900/50 hover:bg-gray-900"
                >
                    {showAllTeam ? 'Show Less' : 'View Full Roster'}
                    {showAllTeam ? <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
export default HomePage;