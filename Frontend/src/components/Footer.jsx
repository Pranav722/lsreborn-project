import React from 'react';
import { ShieldCheck, Youtube, Instagram, Twitter, Twitch } from 'lucide-react';

const Footer = ({ setPage }) => {
    return (
        <footer className="bg-gray-900/50 border-t border-cyan-500/10 mt-20">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-12">
                     <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Ready to Start Your <span className="text-cyan-400">Journey</span>?</h2>
                        <p className="mt-4 text-gray-400">Apply for allowlist today and become part of our growing community of roleplayers.</p>
                        <div className="mt-8 flex justify-center gap-4">
                             <a href="#" onClick={(e) => { e.preventDefault(); setPage('apply');}} className="modern-button bg-cyan-500">Apply Now</a>
                             <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="modern-button bg-gray-700">Visit Store</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Column 1: Logo and Socials */}
                    <div className="md:col-span-5 lg:col-span-4 space-y-4">
                         <button onClick={() => setPage('home')} className="flex-shrink-0 text-white font-bold text-xl flex items-center gap-2">
                            <ShieldCheck className="text-cyan-400"/> LSReborn V2
                        </button>
                        <p className="text-gray-400 text-sm">Join the most immersive GTA V roleplay experience. Dive into a world where your story matters and every decision shapes the city.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Youtube size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><Twitch size={20} /></a>
                        </div>
                    </div>

                    <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
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
                         <div>
                            <h3 className="font-semibold text-white tracking-wider uppercase">Support</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Staff</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Report a Player</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} LSReborn. All rights reserved.</p>
                    <p className="mt-4 sm:mt-0">Crafted with ❤️ by Pranav</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;