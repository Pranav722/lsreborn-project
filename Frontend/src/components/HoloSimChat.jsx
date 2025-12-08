import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, RotateCcw, Lock, Trophy, Loader2, AlertCircle, User, Bot, Radio } from 'lucide-react';

/**
 * HoloSimChat - Tactical Roleplay Simulation Terminal
 * 
 * A high-tech tactical display for practicing RP skills.
 * Matches slate-900/950 theme with cyan/blue accents.
 */
const HoloSimChat = ({ scenarioType = 'pd', onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [turnCount, setTurnCount] = useState(0);
    const [maxTurns] = useState(5);
    const [isComplete, setIsComplete] = useState(false);
    const [grade, setGrade] = useState(null);
    const [error, setError] = useState(null);
    const [scenarioName, setScenarioName] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when session starts
    useEffect(() => {
        if (sessionActive && !isComplete) {
            inputRef.current?.focus();
        }
    }, [sessionActive, isComplete, messages]);

    // Start a new simulation
    const startSimulation = async () => {
        setIsLoading(true);
        setError(null);
        setMessages([]);
        setGrade(null);
        setIsComplete(false);

        const apiUrl = `${import.meta.env.VITE_API_URL}/api/holosim/start`;
        console.log('[HoloSim] Starting simulation...');
        console.log('[HoloSim] API URL:', apiUrl);
        console.log('[HoloSim] Scenario Type:', scenarioType);
        console.log('[HoloSim] Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'MISSING!');

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ scenarioType })
            });

            console.log('[HoloSim] Response Status:', response.status, response.statusText);

            const data = await response.json();
            console.log('[HoloSim] Response Data:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to start simulation`);
            }

            setScenarioName(data.scenarioName || 'Roleplay Simulation');
            setMessages([
                {
                    type: 'system',
                    content: `// HOLO-SIM v2.0 INITIALIZED\n// Scenario: ${data.scenarioName || 'Traffic Stop'}\n// Objective: Handle the situation professionally\n// Turns: ${data.maxTurns}\n// [LINK ESTABLISHED]`
                },
                { type: 'npc', content: data.message }
            ]);
            setSessionActive(true);
            setTurnCount(data.turnCount);

        } catch (err) {
            console.error('[HoloSim] START ERROR:', err);
            console.error('[HoloSim] Error Details:', {
                message: err.message,
                url: apiUrl,
                token: localStorage.getItem('authToken') ? 'Present' : 'MISSING'
            });
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Send a message
    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading || isComplete) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);
        setError(null);

        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/holosim/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message');
            }

            setMessages(prev => [...prev, { type: 'npc', content: data.message }]);
            setTurnCount(data.turnCount);

            if (data.isComplete) {
                setIsComplete(true);
                setGrade(data.grade);

                setMessages(prev => [...prev, {
                    type: 'system',
                    content: '// [SIMULATION COMPLETE]\n// Analyzing performance...'
                }]);

                if (onComplete && data.grade) {
                    onComplete(data.grade);
                }
            }

        } catch (err) {
            console.error('Message error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset simulation
    const resetSimulation = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/holosim/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
        } catch (err) {
            console.error('Reset error:', err);
        }

        setMessages([]);
        setSessionActive(false);
        setTurnCount(0);
        setIsComplete(false);
        setGrade(null);
        setError(null);
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-cyan-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };

    // Get score bar color
    const getScoreBarColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-cyan-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <div className="bg-slate-950 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
            {/* Terminal Header */}
            <div className="bg-slate-900 border-b border-slate-700/50 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium tracking-wide">HOLO-SIM</span>
                    <span className="text-slate-500 text-xs">v2.0</span>
                </div>
                <div className="flex items-center gap-4">
                    {sessionActive && (
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">TURN</span>
                            <span className="text-cyan-400 text-xs font-mono">{turnCount}/{maxTurns}</span>
                        </div>
                    )}
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
                        <div className={`w-2.5 h-2.5 rounded-full ${sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500/30'}`}></div>
                    </div>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="h-64 overflow-y-auto p-4 bg-slate-950">
                {!sessionActive ? (
                    // Start Screen
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="mb-4">
                            <Terminal className="w-10 h-10 text-cyan-500/40 mx-auto mb-3" />
                            <h3 className="text-slate-300 font-medium mb-1">Roleplay Training Simulation</h3>
                            <p className="text-slate-500 text-xs max-w-xs">
                                Practice your de-escalation and communication skills in a simulated scenario.
                            </p>
                        </div>
                        <button
                            onClick={startSimulation}
                            disabled={isLoading}
                            className="px-5 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    <Radio className="w-4 h-4" />
                                    Start Simulation
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    // Chat Messages
                    <div className="space-y-3 font-mono text-sm">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`${msg.type === 'system' ? 'text-slate-500 text-xs' :
                                msg.type === 'user' ? 'text-cyan-300' : 'text-slate-300'
                                }`}>
                                {msg.type === 'system' ? (
                                    <pre className="whitespace-pre-wrap leading-relaxed">{msg.content}</pre>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        {msg.type === 'user' ? (
                                            <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />
                                        ) : (
                                            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                                        )}
                                        <div>
                                            <span className={`text-xs ${msg.type === 'user' ? 'text-cyan-600' : 'text-slate-600'}`}>
                                                {msg.type === 'user' ? '[YOU]' : '[NPC]'}
                                            </span>
                                            <p className="leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-slate-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                                <span className="text-xs">Processing...</span>
                            </div>
                        )}

                        {/* Grade Display */}
                        {isComplete && grade && (
                            <div className="mt-4 p-4 border border-slate-700/50 bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Trophy className="w-4 h-4 text-amber-400" />
                                    <span className="text-slate-400 text-xs uppercase tracking-wider">Performance Grade</span>
                                </div>

                                {/* Score */}
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className={`text-4xl font-bold ${getScoreColor(grade.score)}`}>
                                        {grade.score}
                                    </span>
                                    <span className="text-slate-600 text-lg">/100</span>
                                </div>

                                {/* Score Bar */}
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`h-full ${getScoreBarColor(grade.score)} transition-all duration-1000`}
                                        style={{ width: `${grade.score}%` }}
                                    />
                                </div>

                                {/* Feedback */}
                                {grade.feedback && (
                                    <p className="text-slate-400 text-xs italic">"{grade.feedback}"</p>
                                )}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Input Area */}
            {sessionActive && (
                <div className="border-t border-slate-700/50 p-3 bg-slate-900/50">
                    {isComplete ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Simulation Complete</span>
                            </div>
                            <button
                                onClick={resetSimulation}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded text-xs hover:bg-slate-700 hover:text-slate-300 transition-colors flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restart
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-500 text-sm">{'>'}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your response..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-sm focus:outline-none"
                                autoComplete="off"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="p-1.5 text-cyan-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HoloSimChat;
