// File: frontend/src/components/Footer.jsx
import React from 'react';
import { ShieldCheck, Youtube, Instagram, Twitter } from 'lucide-react';

const Footer = ({ setPage }) => {
    return (
        <footer className="bg-gray-950 border-t border-gray-900 mt-32 relative overflow-hidden">
            {/* Decorative top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    
                    {/* Brand Block - Spans 4 cols */}
                    <div className="md:col-span-5 lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <ShieldCheck className="text-cyan-400 h-8 w-8"/>
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">LSReborn</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                            Forging narratives, building legacies. Join a community where every character has a story and every action leaves a mark.
                        </p>
                        
                        <div className="flex items-center gap-4 pt-2">
                            <SocialLink href="https://youtube.com" icon={<Youtube size={20} />} label="YouTube" />
                            <SocialLink href="https://instagram.com" icon={<Instagram size={20} />} label="Instagram" />
                            {/* Custom Discord Icon or external link */}
                            <a href="https://discord.gg/lsreborn1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.36981C18.699 3.50425 16.903 2.83421 15.01 2.33753C14.751 2.68808 14.492 3.03862 14.25 3.375C12.486 2.89885 10.739 2.89885 8.975 3.375C8.733 3.03862 8.474 2.68808 8.215 2.33753C6.322 2.83421 4.526 3.50425 2.909 4.36981C0.933 7.46497 0.25 10.824 0.963 14.048C2.583 15.436 4.483 16.374 6.516 16.968C6.776 16.6174 7.02 16.253 7.246 15.875C6.565 15.5893 5.921 15.2257 5.33 14.7874C5.52 14.6869 5.709 14.5725 5.882 14.4444C9.258 16.6111 14.021 16.6111 17.381 14.4444C17.554 14.5725 17.743 14.6869 17.933 14.7874C17.342 15.2257 16.698 15.5893 16.017 15.875C16.243 16.253 16.487 16.6174 16.747 16.968C18.78 16.374 20.68 15.436 22.3 14.048C23.142 10.226 22.112 6.91912 20.317 4.36981ZM7.422 12.1875C6.533 12.1875 5.806 11.4225 5.806 10.4625C5.806 9.5025 6.533 8.7375 7.422 8.7375C8.311 8.7375 9.038 9.5025 9.038 10.4625C9.038 11.4225 8.311 12.1875 7.422 12.1875ZM15.818 12.1875C14.929 12.1875 14.202 11.4225 14.202 10.4625C14.202 9.5025 14.929 8.7375 15.818 8.7375C16.707 8.7375 17.434 9.5025 17.434 10.4625C17.434 11.4225 16.707 12.1875 15.818 12.1875Z"/></svg>
                            </a>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block lg:col-span-2"></div>

                    {/* Navigation Links */}
                    <div className="md:col-span-7 lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div className="flex flex-col space-y-4">
                            <h4 className="text-white font-semibold tracking-wider uppercase text-xs">Navigation</h4>
                            <FooterLink onClick={() => setPage('home')}>Home</FooterLink>
                            <FooterLink onClick={() => setPage('news')}>News</FooterLink>
                            <FooterLink onClick={() => setPage('rules')}>Server Rules</FooterLink>
                        </div>
                        <div className="flex flex-col space-y-4">
                            <h4 className="text-white font-semibold tracking-wider uppercase text-xs">Resources</h4>
                            <FooterLink onClick={() => setPage('apply')}>Application</FooterLink>
                            <FooterLink onClick={() => setPage('queue')}>Queue</FooterLink>
                            <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Store</a>
                        </div>
                        <div className="flex flex-col space-y-4">
                            <h4 className="text-white font-semibold tracking-wider uppercase text-xs">Support</h4>
                            <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Help Center</a>
                            <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Report Issue</a>
                            <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">Ban Appeal</a>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-sm">
                        &copy; {new Date().getFullYear()} LSReborn Roleplay. All rights reserved.
                    </p>
                    <p className="text-gray-700 text-xs font-medium">
                        Crafted by Pranav
                    </p>
                </div>
            </div>
        </footer>
    );
};

const SocialLink = ({ href, icon, label }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300"
        aria-label={label}
    >
        {icon}
    </a>
);

const FooterLink = ({ children, onClick }) => (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} className="text-left text-gray-500 hover:text-cyan-400 transition-colors text-sm">
        {children}
    </button>
);

export default Footer;