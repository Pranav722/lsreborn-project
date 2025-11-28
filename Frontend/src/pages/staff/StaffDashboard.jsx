import React, { useState } from 'react';
import { ShieldCheck, FileText, Settings, LogOut as LogOutIcon, BookUser, Briefcase } from 'lucide-react';
import AppManagement from './AppManagement';
import SettingsPanel from './SettingsPanel';
import AuditLogs from './AuditLogs';
import JobManagement from './JobManagement';

const StaffDashboard = ({ user, setPage, onLogout }) => {
    const [dashboardPage, setDashboardPage] = useState('apps');

    // Defensive check for roles
    const isAdmin = user && Array.isArray(user.roles) && user.roles.includes(import.meta.env.VITE_LSR_ADMIN_ROLE_ID);

    const NavItem = ({ icon: Icon, label, pageName }) => (
        <button 
            onClick={() => setDashboardPage(pageName)} 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${dashboardPage === pageName ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    const renderPage = () => {
        switch (dashboardPage) {
            case 'apps': return <AppManagement user={user} />;
            case 'jobs': return <JobManagement user={user} />;
            case 'settings': return isAdmin ? <SettingsPanel user={user} /> : <AccessDenied />;
            case 'logs': return isAdmin ? <AuditLogs user={user} /> : <AccessDenied />;
            default: return <AppManagement user={user} />;
        }
    };

    const AccessDenied = () => (
        <div className="text-center p-8 bg-gray-800/50 rounded-lg">
            <h3 className="text-2xl font-bold text-red-400">Access Denied</h3>
            <p className="text-gray-300 mt-2">You do not have permission to view this page. Admin access is required.</p>
        </div>
    );

    return (
        <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
            <aside className="w-full md:w-64 bg-gray-900/80 backdrop-blur-md border-r border-cyan-500/20 p-4 flex-shrink-0">
                <div className="flex items-center space-x-2 mb-8">
                    <ShieldCheck className="text-cyan-400" size={28}/>
                    <h2 className="text-xl font-bold text-white">Staff Panel</h2>
                </div>
                <nav className="space-y-2">
                    <NavItem icon={FileText} label="Citizenship Apps" pageName="apps" />
                    <NavItem icon={Briefcase} label="Departments" pageName="jobs" />
                    {isAdmin && <NavItem icon={Settings} label="Settings" pageName="settings" />}
                    {isAdmin && <NavItem icon={BookUser} label="Audit Logs" pageName="logs" />}
                </nav>
                <div className="mt-auto pt-8">
                    <p className="text-sm text-gray-400">Logged in as <span className="font-bold text-white">{user.username}</span></p>
                    <button onClick={() => setPage('home')} className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors text-gray-400 hover:bg-gray-800 hover:text-white mt-4">
                        <span>Return to Site</span>
                    </button>
                    <button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300 mt-2">
                        <LogOutIcon size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-h-screen">{renderPage()}</main>
        </div>
    );
};

export default StaffDashboard;