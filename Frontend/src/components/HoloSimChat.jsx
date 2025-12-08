import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, RotateCcw, Lock, Trophy, Loader2, AlertCircle, User, Bot, Radio, RefreshCw } from 'lucide-react';

/**
 * HoloSimChat - Tactical Roleplay Simulation Terminal
 * 
 * Features:
 * - Retry button on connection failure
 * - 3-attempt fallback with bypass score
 * - Visible input text (fixed)
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
    const [attemptCount, setAttemptCount] = useState(0);
    const [bypassed, setBypassed] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const MAX_ATTEMPTS = 3;

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

    // Bypass the simulation after max attempts
    const bypassSimulation = () => {
        console.warn('[HoloSim] BYPASS: Max attempts reached. Auto-filling score.');
        const bypassGrade = {
            score: 100,
            improvisation: 100,
            feedback: 'Simulation service unavailable - Bypassed for manual review',
            bypassed: true
        };
        setGrade(bypassGrade);
        setIsComplete(true);
        setBypassed(true);
        setError(null);

        if (onComplete) {
            onComplete(bypassGrade);
        }
    };

    // Start a new simulation
    const startSimulation = async () => {
        setIsLoading(true);
        setError(null);

        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        const apiUrl = `${import.meta.env.VITE_API_URL}/api/holosim/start`;
        console.log(`[HoloSim] Starting simulation (attempt ${newAttemptCount}/${MAX_ATTEMPTS})...`);
        console.log('[HoloSim] API URL:', apiUrl);
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

            // Success - reset attempt counter
            setAttemptCount(0);
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
            console.error(`[HoloSim] START ERROR (attempt ${newAttemptCount}):`, err);

            // Check if we've hit max attempts
            if (newAttemptCount >= MAX_ATTEMPTS) {
                bypassSimulation();
            } else {
                setError(`Connection failed (${newAttemptCount}/${MAX_ATTEMPTS}). ${err.message}`);
            }
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
            console.error('[HoloSim] Message error:', err);
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
            console.error('[HoloSim] Reset error:', err);
        }

        setMessages([]);
        setSessionActive(false);
        setTurnCount(0);
        setIsComplete(false);
        setGrade(null);
        setError(null);
        setAttemptCount(0);
        setBypassed(false);
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
                    {bypassed && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">BYPASSED</span>
                    )}
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
                {!sessionActive && !bypassed ? (
                    // Start Screen
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="mb-4">
                            <Terminal className="w-10 h-10 text-cyan-500/40 mx-auto mb-3" />
                            <h3 className="text-slate-300 font-medium mb-1">Roleplay Training Simulation</h3>
                            <p className="text-slate-500 text-xs max-w-xs">
                                Practice your de-escalation and communication skills in a simulated scenario.
                            </p>
                        </div>

                        {/* Error with Retry Button */}
                        {error && (
                            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg max-w-xs">
                                <div className="flex items-center gap-2 text-rose-400 text-xs mb-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                                <button
                                    onClick={startSimulation}
                                    disabled={isLoading}
                                    className="w-full px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded text-xs hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    Retry ({attemptCount}/{MAX_ATTEMPTS})
                                </button>
                            </div>
                        )}

                        {!error && (
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
                        )}
                    </div>
                ) : (
                    // Chat Messages or Bypass State
                    <div className="space-y-3 font-mono text-sm">
                        {bypassed && !sessionActive ? (
                            // Bypass message
                            <div className="text-center py-8">
                                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                                <h4 className="text-amber-300 font-medium mb-1">Simulation Unavailable</h4>
                                <p className="text-slate-500 text-xs mb-3">Service is temporarily down. Score has been auto-filled.</p>
                                <p className="text-amber-400 text-xs">Your application will be flagged for manual review.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
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
                            ))
                        )}

                        {/* Loading indicator */}
                        {isLoading && sessionActive && (
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
                                    <span className="text-slate-400 text-xs uppercase tracking-wider">
                                        {bypassed ? 'Bypass Score' : 'Performance Grade'}
                                    </span>
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

            {/* Input Area - Fixed text visibility */}
            {sessionActive && !bypassed && (
                <div className="border-t border-slate-700/50 p-3 bg-slate-900">
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
                                className="flex-1 bg-slate-800 text-white placeholder-slate-500 text-sm px-3 py-1.5 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
                                autoComplete="off"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="p-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
