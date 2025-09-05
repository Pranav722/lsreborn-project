import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Menu, X, LogOut as LogoutIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Components
import Layout from './components/Layout';
import Modal from './components/Modal';
import AnimatedButton from './components/AnimatedButton';
import Card from './components/Card';
import Footer from './components/Footer';

// Import Pages
import HomePage from './pages/HomePage';
import QueuePage from './pages/QueuePage';
import ApplicationPage from './pages/ApplicationPage';
import RulesPage from './pages/RulesPage';
import NewsPage from './pages/NewsPage';
import StaffDashboard from './pages/staff/StaffDashboard';


// --- LOGIN MODAL ---
const LoginModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Login">
            <div className="space-y-4">
                <a href={`${import.meta.env.VITE_API_URL}/auth/discord`} className="w-full flex items-center justify-center space-x-3 text-left p-4 bg-gray-800 hover:bg-gray-700/80 border border-cyan-500/20 rounded-lg transition-all duration-300">
                    <svg role="img" width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.36981C18.699 3.50425 16.903 2.83421 15.01 2.33753C14.751 2.68808 14.492 3.03862 14.25 3.375C12.486 2.89885 10.739 2.89885 8.975 3.375C8.733 3.03862 8.474 2.68808 8.215 2.33753C6.322 2.83421 4.526 3.50425 2.909 4.36981C0.933 7.46497 0.25 10.824 0.963 14.048C2.583 15.436 4.483 16.374 6.516 16.968C6.776 16.6174 7.02 16.253 7.246 15.875C6.565 15.5893 5.921 15.2257 5.33 14.7874C5.52 14.6869 5.709 14.5725 5.882 14.4444C9.258 16.6111 14.021 16.6111 17.381 14.4444C17.554 14.5725 17.743 14.6869 17.933 14.7874C17.342 15.2257 16.698 15.5893 16.017 15.875C16.243 16.253 16.487 16.6174 16.747 16.968C18.78 16.374 20.68 15.436 22.3 14.048C23.142 10.226 22.112 6.91912 20.317 4.36981ZM7.422 12.1875C6.533 12.1875 5.806 11.4225 5.806 10.4625C5.806 9.5025 6.533 8.7375 7.422 8.7375C8.311 8.7375 9.038 9.5025 9.038 10.4625C9.038 11.4225 8.311 12.1875 7.422 12.1875ZM15.818 12.1875C14.929 12.1875 14.202 11.4225 14.202 10.4625C14.202 9.5025 14.929 8.7375 15.818 8.7375C16.707 8.7375 17.434 9.5025 17.434 10.4625C17.434 11.4225 16.707 12.1875 15.818 12.1875Z"/></svg>
                    <div>
                        <h3 className="font-bold text-white">Login with Discord</h3>
                        <p className="text-sm text-gray-400">Connect your Discord account.</p>
                    </div>
                </a>
            </div>
        </Modal>
    );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [page, setPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuthStatus = useCallback(async (tokenToUse = null) => {
    const storedToken = tokenToUse || localStorage.getItem('authToken');
    if (storedToken) {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${storedToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                localStorage.removeItem('authToken');
                setUser(null);
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setUser(null);
        }
    } else {
        setUser(null);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    let tokenToUse = null;

    if (token) {
        localStorage.setItem('authToken', token);
        tokenToUse = token;
        window.history.replaceState({}, document.title, "/");
    }
    checkAuthStatus(tokenToUse);
  }, [checkAuthStatus]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsProfileOpen(false);
    setPage('home');
  };

  const handleApplyClick = async () => {
    setIsMobileMenuOpen(false);
    if (user) {
        await checkAuthStatus();
        setPage('apply');
    } else {
        setIsLoginModalOpen(true);
    }
  };
  
  const handleQueueClick = async () => {
    setIsMobileMenuOpen(false);
    if (user) {
        await checkAuthStatus();
        setPage('queue');
    } else {
        setIsLoginModalOpen(true);
    }
  };

  const NavLink = ({ pageName, children, onClick }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); (onClick || (() => { setPage(pageName); setIsMobileMenuOpen(false); }))() }} className={`nav-link relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === pageName ? 'text-cyan-400 active' : 'text-gray-300'}`}>{children}</a>
  );
  
  const renderCurrentPage = () => {
    // Defensive check to ensure user object exists before checking its properties
    if (user && !user.inGuild && page !== 'home') {
        return (
            <div className="py-20">
                <Card className="text-center max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">Join Our Discord Server</h2>
                    <p className="text-gray-300 mb-6">To access this and other features, you need to be a member of our Discord server. Click the button below to join!</p>
                    <a href="https://discord.gg/lsreborn1" target="_blank" rel="noopener noreferrer">
                      <AnimatedButton className="bg-blue-600">Join Discord</AnimatedButton>
                    </a>
                </Card>
            </div>
        );
    }

    const pageMap = {
        home: <HomePage setPage={setPage} onApplyClick={handleApplyClick} />,
        apply: <ApplicationPage user={user} setPage={setPage} />,
        rules: <RulesPage />,
        news: <NewsPage />,
        queue: <QueuePage user={user} setPage={setPage} />,
        dashboard: <StaffDashboard user={user} setPage={setPage} onLogout={handleLogout} />
    };
    
    if ((page === 'queue' || page === 'apply' || page === 'dashboard') && !user) {
        return (
            <div className="py-20">
                <Card className="text-center max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">Access Denied</h2>
                    <p className="text-gray-300 mb-6">You must be logged in to access this page.</p>
                    <AnimatedButton onClick={() => setIsLoginModalOpen(true)} className="bg-cyan-500">Login</AnimatedButton>
                </Card>
            </div>
        );
    }
    return pageMap[page];
  };

  if (authLoading) return <Layout><div></div></Layout>;

  // Defensive checks to ensure user and user.roles exist before checking permissions
  const isStaff = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_STAFF_ROLE_ID);
  const isAdmin = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_LSR_ADMIN_ROLE_ID);
  const isStaffOrAdmin = isStaff || isAdmin;
  const hasWhitelistedRole = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_WHITELISTED_ROLE_ID);

  return (
    <Layout>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
      />
      <div className="relative z-10">
        <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-gray-900/50 backdrop-blur-lg border-b border-cyan-500/10' : 'bg-transparent border-transparent'}`}>
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button onClick={() => setPage('home')} className="flex-shrink-0 text-white font-bold text-xl flex items-center gap-2">
                  <ShieldCheck className="text-cyan-400"/> LSReborn
                </button>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-4">
                  <NavLink pageName="home">Home</NavLink>
                  {!hasWhitelistedRole && <NavLink pageName="apply" onClick={handleApplyClick}>Apply</NavLink>}
                  <NavLink pageName="queue" onClick={handleQueueClick}>Queue</NavLink>
                  <NavLink pageName="rules">Rules</NavLink>
                  <NavLink pageName="news">News</NavLink>
                  <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="nav-link relative px-3 py-2 rounded-md text-sm font-medium text-gray-300">Store</a>

                  {isStaffOrAdmin && (
                      <NavLink pageName="dashboard">Staff Dashboard</NavLink>
                  )}

                  {user ? (
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-1 rounded-full transition-all duration-300 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20">
                                <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User Avatar" className="w-9 h-9 rounded-full" />
                            </button>
                            <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 bg-gray-800/80 backdrop-blur-lg border border-cyan-500/20 rounded-md shadow-lg py-1 z-50">
                                    <div className="px-4 py-2 border-b border-gray-700">
                                        <p className="text-sm text-white font-semibold">{user.username}</p>
                                        <p className="text-xs text-gray-400">#{user.discriminator}</p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20">
                                        <LogoutIcon className="mr-2 h-4 w-4" />
                                        Logout
                                    </button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                  ) : (
                      <AnimatedButton onClick={() => setIsLoginModalOpen(true)} className="!px-4 !py-2 text-sm">Login</AnimatedButton>
                  )}
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gray-900/80 backdrop-blur-md"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <NavLink pageName="home">Home</NavLink>
                {!hasWhitelistedRole && <NavLink pageName="apply" onClick={handleApplyClick}>Apply</NavLink>}
                <NavLink pageName="queue" onClick={handleQueueClick}>Queue</NavLink>
                <NavLink pageName="rules">Rules</NavLink>
                <NavLink pageName="news">News</NavLink>
                <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="nav-link relative block px-3 py-2 rounded-md text-sm font-medium text-gray-300">Store</a>

                {isStaffOrAdmin && (
                    <NavLink pageName="dashboard">Staff Dashboard</NavLink>
                )}
                {user ? (
                    <button onClick={handleLogout} className="w-full text-left bg-red-500/20 text-red-300 block px-3 py-2 rounded-md text-base font-medium">Logout</button>
                ) : (
                    <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 block px-3 py-2 rounded-md text-base font-medium">Login</button>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </nav>
        <div className="page-content-wrapper">
          {renderCurrentPage()}
        </div>
        <Footer setPage={setPage} />
      </div>
    </Layout>
  );
}