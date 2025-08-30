// File: src/mockApi.js
// This file contains all the simulated backend functions.
// In a real application, these would be replaced with actual API calls to your server.

export const mockApi = {
  getServerStatus: async () => {
    await new Promise(res => setTimeout(res, 500));
    return { online: true, players: Math.floor(Math.random() * 100) + 50, maxPlayers: 200 };
  },
  checkCooldown: async (userId) => {
    await new Promise(res => setTimeout(res, 300));
    const cooldowns = JSON.parse(localStorage.getItem('cooldowns') || '{}');
    if (cooldowns[userId] && new Date(cooldowns[userId]) > new Date()) {
      return { onCooldown: true, reapplyDate: cooldowns[userId], reason: 'Your previous application was recently rejected.' };
    }
    return { onCooldown: false };
  },
  submitApplication: async (formData, user) => {
    await new Promise(res => setTimeout(res, 1000));
    let applications = JSON.parse(localStorage.getItem('applications') || '[]');
    const newApp = { id: Date.now(), status: 'pending', ...formData, submittedAt: new Date().toISOString() };
    applications.push(newApp);
    localStorage.setItem('applications', JSON.stringify(applications));
    
    // Simulate bot removing Discord role
    console.log(`[BOT SIMULATION] New 'pending' application detected for ${user.username} (Discord: ${formData.discord}). Removing 'Applicant' role.`);
    
    return { success: true, message: 'Application submitted successfully!' };
  },
  login: async (username, password) => {
    await new Promise(res => setTimeout(res, 800));
    if (username === 'admin' && password === 'password') return { success: true, token: 'fake-jwt-token-admin', user: { username: 'admin', role: 'Admin', jobs: ['police', 'ems'], hasPrio: true, hasApplicantRole: true } };
    if (username === 'mod' && password === 'password') return { success: true, token: 'fake-jwt-token-mod', user: { username: 'mod', role: 'Moderator', jobs: [], hasPrio: false, hasApplicantRole: true } };
    return { success: false, message: 'Invalid credentials' };
  },
  getUserFromToken: async (token) => {
      if (token === 'fake-jwt-token-admin') return { username: 'admin', role: 'Admin', jobs: ['police', 'ems'], hasPrio: true, hasApplicantRole: true };
      if (token === 'fake-jwt-token-mod') return { username: 'mod', role: 'Moderator', jobs: [], hasPrio: false, hasApplicantRole: true };
      if (token === 'fake-jwt-token-discord') return { username: 'DiscordUser', role: 'Player', jobs: ['ems'], hasPrio: false, hasApplicantRole: true };
      return null;
  },
  getApplications: async () => {
    let apps = localStorage.getItem('applications');
    if (!apps) {
        const exampleApps = [
            { id: 1, status: 'pending', name: 'Jax Teller', discord: 'jax#1234', age: 35, story: 'Former military, now looking for a fresh start in a city that never sleeps. Hopes to leave his past behind but finds trouble at every corner. Skilled mechanic and an even better shot.', submittedAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 2, status: 'pending', name: 'Isabella Rossi', discord: 'bella#5678', age: 26, story: 'An art student who got caught up with the wrong crowd. She uses her charm and intelligence to navigate the city\'s underworld, hoping to one day open her own gallery with legitimately earned money.', submittedAt: new Date(Date.now() - 172800000).toISOString() },
            { id: 3, status: 'pending', name: 'Marcus "Cipher" Chen', discord: 'cipher#9101', age: 22, story: 'A tech prodigy and hacker who fled here after a data heist went wrong. He lives off the grid, offering his skills to the highest bidder while trying to stay one step ahead of the corporations hunting him.', submittedAt: new Date().toISOString() },
            { id: 4, status: 'pending', name: 'Dr. Alistair Finch', discord: 'finch#1123', age: 52, story: 'A disgraced surgeon who lost his license. Now he operates an underground clinic, patching up criminals for cash. He is cynical and world-weary but still abides by a twisted version of the Hippocratic oath.', submittedAt: new Date(Date.now() - 43200000).toISOString() },
            { id: 5, status: 'approved', name: 'Maria Sanchez', discord: 'maria#4455', age: 29, story: 'A former paramedic who saw too much corruption and decided to fight it from the inside. She joined the LSPD with a strong sense of justice, but the city is testing her resolve daily.', submittedAt: new Date(Date.now() - 259200000).toISOString() },
        ];
        localStorage.setItem('applications', JSON.stringify(exampleApps));
        return exampleApps;
    }
    return JSON.parse(apps);
  },
  updateApplication: async (appId, status, reason = '', cooldownHours = 24) => {
    let applications = JSON.parse(localStorage.getItem('applications') || '[]');
    const appIndex = applications.findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      applications[appIndex].status = status;
      applications[appIndex].reason = reason;
      if (status === 'rejected') {
        const cooldowns = JSON.parse(localStorage.getItem('cooldowns') || '{}');
        const reapplyDate = new Date();
        reapplyDate.setHours(reapplyDate.getHours() + cooldownHours);
        cooldowns[applications[appIndex].discord] = reapplyDate.toISOString();
        localStorage.setItem('cooldowns', JSON.stringify(cooldowns));
      }
      localStorage.setItem('applications', JSON.stringify(applications));
      // Simulate bot sending webhook and assigning roles
      console.log(`[BOT SIMULATION] Status for app #${appId} changed to '${status}'. Sending webhook and managing roles for Discord user ${applications[appIndex].discord}.`);
      return { success: true };
    }
    return { success: false };
  },
  getSettings: async () => JSON.parse(localStorage.getItem('settings') || JSON.stringify({ approvalWebhook: '', rejectionWebhook: '', approvalBanner: '', rejectionBanner: '', defaultCooldown: 24 })),
  updateSettings: async (newSettings) => { localStorage.setItem('settings', JSON.stringify(newSettings)); return { success: true }; },
  getLogs: async () => JSON.parse(localStorage.getItem('logs') || '[]'),
  addLog: async (user, action) => {
    const logs = await mockApi.getLogs();
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), user, action };
    logs.unshift(newLog);
    localStorage.setItem('logs', JSON.stringify(logs));
  },
  
  getQueueStatus: async (userId) => {
    const queues = JSON.parse(localStorage.getItem('serverQueues') || '{"staff":[],"police":[],"ems":[],"prio":[],"normal":[]}');
    for (const type in queues) {
      const position = queues[type].indexOf(userId);
      if (position !== -1) {
        return { inQueue: true, type, position: position + 1, total: queues[type].length };
      }
    }
    return { inQueue: false, type: null, position: 0, total: 0 };
  },
  joinQueue: async (userId, queueType) => {
    let queues = JSON.parse(localStorage.getItem('serverQueues') || '{"staff":[],"police":[],"ems":[],"prio":[],"normal":[]}');
    for (const type in queues) {
      queues[type] = queues[type].filter(id => id !== userId);
    }
    if (!queues[queueType].includes(userId)) {
      queues[queueType].push(userId);
    }
    localStorage.setItem('serverQueues', JSON.stringify(queues));
    return { success: true };
  },
  leaveQueue: async (userId) => {
    let queues = JSON.parse(localStorage.getItem('serverQueues') || '{"staff":[],"police":[],"ems":[],"prio":[],"normal":[]}');
    for (const type in queues) {
      queues[type] = queues[type].filter(id => id !== userId);
    }
    localStorage.setItem('serverQueues', JSON.stringify(queues));
    return { success: true };
  },
};
