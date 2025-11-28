// File: frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Menu, X, LogOut as LogoutIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Components
import Layout from './components/Layout';
import Modal from './components/Modal';
import AnimatedButton from './components/AnimatedButton';
import Card from './components/Card';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
// Import Pages
import HomePage from './pages/HomePage';
import QueuePage from './pages/QueuePage';
import ApplicationPage from './pages/ApplicationPage';
import RulesPage from './pages/RulesPage';
import NewsPage from './pages/NewsPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import QuizPage from './pages/QuizPage';
import DepartmentApp from './pages/DepartmentApps';
import JobManagement from './pages/staff/JobManagement';

// --- LOGIN MODAL ---
const LoginModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Login Required">
            <div className="space-y-4">
                <p className="text-gray-300 text-sm text-center">To access the city services, you need to verify your identity.</p>
                <a href={`${import.meta.env.VITE_API_URL}/auth/discord`} className="w-full flex items-center justify-center space-x-3 text-left p-4 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-all duration-300 shadow-lg shadow-blue-900/20 group">
                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.36981C18.699 3.50425 16.903 2.83421 15.01 2.33753C14.751 2.68808 14.492 3.03862 14.25 3.375C12.486 2.89885 10.739 2.89885 8.975 3.375C8.733 3.03862 8.474 2.68808 8.215 2.33753C6.322 2.83421 4.526 3.50425 2.909 4.36981C0.933 7.46497 0.25 10.824 0.963 14.048C2.583 15.436 4.483 16.374 6.516 16.968C6.776 16.6174 7.02 16.253 7.246 15.875C6.565 15.5893 5.921 15.2257 5.33 14.7874C5.52 14.6869 5.709 14.5725 5.882 14.4444C9.258 16.6111 14.021 16.6111 17.381 14.4444C17.554 14.5725 17.743 14.6869 17.933 14.7874C17.342 15.2257 16.698 15.5893 16.017 15.875C16.243 16.253 16.487 16.6174 16.747 16.968C18.78 16.374 20.68 15.436 22.3 14.048C23.142 10.226 22.112 6.91912 20.317 4.36981ZM7.422 12.1875C6.533 12.1875 5.806 11.4225 5.806 10.4625C5.806 9.5025 6.533 8.7375 7.422 8.7375C8.311 8.7375 9.038 9.5025 9.038 10.4625C9.038 11.4225 8.311 12.1875 7.422 12.1875ZM15.818 12.1875C14.929 12.1875 14.202 11.4225 14.202 10.4625C14.202 9.5025 14.929 8.7375 15.818 8.7375C16.707 8.7375 17.434 9.5025 17.434 10.4625C17.434 11.4225 16.707 12.1875 15.818 12.1875Z"/></svg>
                    <div>
                        <h3 className="font-bold text-white group-hover:text-gray-100">Login with Discord</h3>
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
        setIsScrolled(window.scrollY > 50);
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
    <a href="#" onClick={(e) => { e.preventDefault(); (onClick || (() => { setPage(pageName); setIsMobileMenuOpen(false); }))() }} className={`nav-link relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${page === pageName ? 'text-cyan-400 after:scale-x-100' : 'text-gray-300 hover:text-white'}`}>{children}</a>
  );
  
  const renderCurrentPage = () => {
    // Admin bypass: If admin, ignore "inGuild" check
    const isAdmin = user && (user.isAdmin || user.isStaff);
    
    if (user && !user.inGuild && page !== 'home' && !isAdmin) {
        return (
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
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
        quiz: <QuizPage user={user} setPage={setPage} />,
        'apply-pd': <DepartmentApp type="pd" user={user} />,
        'apply-ems': <DepartmentApp type="ems" user={user} />,
        'apply-staff': <DepartmentApp type="staff" user={user} />,
        rules: <RulesPage />,
        news: <NewsPage />,
        queue: <QueuePage user={user} setPage={setPage} />,
        dashboard: <StaffDashboard user={user} setPage={setPage} onLogout={handleLogout} />,
        'job-dashboard': <JobManagement user={user} />
    };
    
    if ((page === 'queue' || page === 'apply' || page === 'dashboard') && !user) {
        return (
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
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

  const isStaffOrAdmin = user && (user.isStaff || user.isAdmin);
  const hasWhitelistedRole = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_WHITELISTED_ROLE_ID);
  
  // LOGIC FIX: Always show 'Apply' if Admin, regardless of whitelisted status
  const showApplyButton = !hasWhitelistedRole || isStaffOrAdmin;

  return (
    <Layout>
      <CustomCursor />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled || page !== 'home' ? 'bg-gray-950/80 backdrop-blur-md border-b border-cyan-500/10 py-2' : 'bg-transparent border-transparent py-4'}`}>
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button onClick={() => setPage('home')} className="flex-shrink-0 text-white font-bold text-2xl flex items-center gap-2 tracking-wider">
                  <ShieldCheck className="text-cyan-400 h-8 w-8"/> LSReborn
                </button>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                  <NavLink pageName="home">Home</NavLink>
                  {showApplyButton && <NavLink pageName="apply" onClick={handleApplyClick}>Apply</NavLink>}
                  <NavLink pageName="queue" onClick={handleQueueClick}>Queue</NavLink>
                  <NavLink pageName="rules">Rules</NavLink>
                  <NavLink pageName="news">News</NavLink>
                  <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="nav-link relative px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white transition-colors">Store</a>

                  {isStaffOrAdmin && (
                      <NavLink pageName="dashboard">Dashboard</NavLink>
                  )}

                  {user ? (
                        <div className="relative ml-4">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-0.5 rounded-full border-2 border-transparent hover:border-cyan-400/50 transition-all duration-300">
                                <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User" className="w-9 h-9 rounded-full object-cover" />
                            </button>
                            <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-4 w-56 bg-gray-900 border border-cyan-500/20 rounded-xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-800">
                                        <p className="text-sm text-white font-semibold truncate">{user.username}</p>
                                        <p className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Verified Member</p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        <LogoutIcon className="mr-3 h-4 w-4" />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                  ) : (
                      <AnimatedButton onClick={() => setIsLoginModalOpen(true)} className="!px-5 !py-2 text-sm ml-4">Login</AnimatedButton>
                  )}
              </div>
              
              {/* Mobile Menu Button */}
              <div className="-mr-2 flex md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-gray-800/50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-cyan-500/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                <NavLink pageName="home">Home</NavLink>
                {showApplyButton && <NavLink pageName="apply" onClick={handleApplyClick}>Apply</NavLink>}
                <NavLink pageName="queue" onClick={handleQueueClick}>Queue</NavLink>
                <NavLink pageName="rules">Rules</NavLink>
                <NavLink pageName="news">News</NavLink>
                <a href="https://ls-reborn-store.tebex.io/" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Store</a>

                {isStaffOrAdmin && (
                    <NavLink pageName="dashboard">Staff Dashboard</NavLink>
                )}
                {user ? (
                    <button onClick={handleLogout} className="w-full mt-4 flex items-center justify-center px-4 py-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10">
                        <LogoutIcon className="mr-2 h-5 w-5" /> Logout
                    </button>
                ) : (
                    <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full mt-4 bg-cyan-600 text-white px-4 py-3 rounded-lg font-bold">Login</button>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </nav>
        
        {/* Content Wrapper: Only apply padding if NOT on home page */}
        <div className={page === 'home' ? '' : 'pt-24 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full'}>
            {renderCurrentPage()}
        </div>
        
        <Footer setPage={setPage} />
      </div>
    </Layout>
  );
}