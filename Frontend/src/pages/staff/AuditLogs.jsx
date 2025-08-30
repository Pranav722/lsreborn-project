import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Search } from 'lucide-react';

const AuditLogs = ({ user }) => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => { 
        // In a real app, you would fetch logs from your backend
        const exampleLogs = [
            { id: 1, timestamp: new Date().toISOString(), user: 'admin', action: 'Approved application #3' },
            { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'mod', action: 'Rejected application #1. Reason: Low effort.' },
        ];
        setLogs(exampleLogs);
        setIsLoading(false);
    }, []);

    const filteredLogs = logs.filter(log => log.user.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!user.isAdmin) return <p className="text-red-400">You do not have permission to view this page.</p>;
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Audit Logs</h2>
            <div className="relative mb-6"><input type="text" placeholder="Search logs by user or action..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-3 pl-12 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" /><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/70" /></div>
            {isLoading ? <p>Loading logs...</p> : (<Card><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-cyan-500/20"><th className="p-4 text-cyan-300">Timestamp</th><th className="p-4 text-cyan-300">User</th><th className="p-4 text-cyan-300">Action</th></tr></thead><tbody>{filteredLogs.map(log => (<tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50"><td className="p-4 text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td><td className="p-4 text-white">{log.user}</td><td className="p-4 text-gray-300">{log.action}</td></tr>))}</tbody></table></div></Card>)}
        </div>
    );
};
export default AuditLogs;
