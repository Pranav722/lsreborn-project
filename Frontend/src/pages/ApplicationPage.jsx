// File: frontend/src/pages/ApplicationPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { ShieldCheck, Siren, HeartPulse, BrainCircuit, LockKeyhole, UserCog } from 'lucide-react';

const ApplicationPage = ({ user, setPage }) => {
  // Roles
  const isWhitelisted = user?.roles?.includes(import.meta.env.VITE_WHITELISTED_ROLE_ID);
  const isAdmin = user?.isAdmin || user?.isStaff;
  
  // You can extend this logic to lock PD/EMS if not whitelisted
  const canApplyJobs = isWhitelisted || isAdmin;

  const apps = [
    {
      id: 'whitelist',
      title: 'Citizenship Application',
      icon: BrainCircuit,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      desc: 'Take the Roleplay Competency Exam to become a citizen of Los Santos.',
      action: () => setPage('quiz'),
      locked: false, // Always open to try (Quiz logic handles the rest)
      btnText: isWhitelisted ? 'Exam Passed' : 'Start Exam'
    },
    {
      id: 'pd',
      title: 'Police Department',
      icon: Siren,
      color: 'text-blue-500',
      borderColor: 'border-blue-500/50',
      desc: 'Apply to join the Los Santos Police Department. To Protect and To Serve.',
      action: () => setPage('apply-pd'),
      locked: !canApplyJobs,
      btnText: 'Apply for LSPD'
    },
    {
      id: 'ems',
      title: 'Emergency Medical Services',
      icon: HeartPulse,
      color: 'text-red-500',
      borderColor: 'border-red-500/50',
      desc: 'Apply to join the EMS team. Save lives and aid the injured citizens.',
      action: () => setPage('apply-ems'),
      locked: !canApplyJobs,
      btnText: 'Apply for EMS'
    },
    {
      id: 'staff',
      title: 'Staff Team',
      icon: UserCog,
      color: 'text-purple-500',
      borderColor: 'border-purple-500/50',
      desc: 'Apply to become a moderator/admin and help manage the community.',
      action: () => setPage('apply-staff'),
      locked: !isWhitelisted, // Must be citizen to be staff usually
      btnText: 'Apply for Staff'
    }
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Application Center</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Welcome to the LSReborn Career Hub. Here you can apply for citizenship or join one of our whitelisted departments.
          Please ensure you meet all requirements before submitting.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {apps.map((app) => (
          <Card key={app.id} className={`hover:border-opacity-100 transition-all duration-300 group border-l-4 ${app.borderColor}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <app.icon className={`w-8 h-8 ${app.color}`} />
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{app.title}</h3>
                </div>
                <p className="text-gray-400 mb-6 min-h-[3rem]">{app.desc}</p>
                
                {app.locked && !isAdmin ? (
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-800/50 p-3 rounded-lg w-fit">
                    <LockKeyhole size={18} />
                    <span className="text-sm font-medium">Citizenship Required</span>
                  </div>
                ) : (
                  <AnimatedButton 
                    onClick={app.action} 
                    className={`w-full sm:w-auto ${app.id === 'whitelist' && isWhitelisted ? 'bg-green-600' : 'bg-cyan-600'}`}
                    disabled={app.id === 'whitelist' && isWhitelisted}
                  >
                    {app.btnText}
                  </AnimatedButton>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApplicationPage;