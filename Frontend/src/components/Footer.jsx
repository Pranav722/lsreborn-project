import React from 'react';
import { ShieldCheck, Youtube, Instagram, Twitter } from 'lucide-react';

const Footer = ({ setPage }) => {
    return (
        <footer className="bg-gray-900/50 border-t border-cyan-500/10 mt-20">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Column 1: Logo and Socials */}
                    <div className="space-y-4">
                         <button onClick={() => setPage('home')} className="flex-shrink-0 text-white font-bold text-xl flex items-center gap-2">
                            <ShieldCheck className="text-cyan-400"/> LSReborn V2
                        </button>
                        <p className="text-gray-400 text-sm">Join the most immersive GTA V roleplay experience. Dive into a world where your story matters.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Youtube /></a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Instagram /></a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Twitter /></a>
                        </div>
                    </div>

                    {/* Column 2 & 3 can be empty for a cleaner look or used for more links */}
                    <div></div> 
                    <div></div>

                    {/* Column 4: Navigation Links */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-white tracking-wider uppercase">Navigation</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('home'); }} className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('rules'); }} className="text-gray-400 hover:text-white transition-colors">Rules</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('news'); }} className="text-gray-400 hover:text-white transition-colors">News</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white tracking-wider uppercase">Resources</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('apply'); }} className="text-gray-400 hover:text-white transition-colors">Apply Now</a></li>
                                <li><a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Store</a></li>
                                <li><a href="https://discord.gg/lsreborn1" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Discord</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} LSReborn. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;