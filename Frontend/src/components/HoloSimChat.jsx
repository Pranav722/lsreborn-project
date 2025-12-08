import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, RotateCcw, Lock, Trophy, Loader2, AlertCircle, User, Bot } from 'lucide-react';

/**
 * HoloSimChat - Terminal-style Roleplay Simulation Chat
 * 
 * A retro terminal interface for practicing de-escalation skills
 * with an AI-powered criminal NPC.
 */
const HoloSimChat = ({ onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [turnCount, setTurnCount] = useState(0);
    const [maxTurns] = useState(5);
    const [isComplete, setIsComplete] = useState(false);
    const [grade, setGrade] = useState(null);
    const [error, setError] = useState(null);

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

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/holosim/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ scenario: 'traffic_stop' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to start simulation');
            }

            // Add system message and NPC's first response
            setMessages([
                {
                    type: 'system',
                    content: '> HOLO-SIM v2.0 INITIALIZED\n> Scenario: Traffic Stop - Grove Street\n> Objective: De-escalate the situation\n> Turns: 5\n> [CONNECTION ESTABLISHED]'
                },
                { type: 'npc', content: data.message }
            ]);
            setSessionActive(true);
            setTurnCount(data.turnCount);

        } catch (err) {
            console.error('Start error:', err);
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

        // Add user message immediately
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

            // Add NPC response
            setMessages(prev => [...prev, { type: 'npc', content: data.message }]);
            setTurnCount(data.turnCount);

            // Check if simulation is complete
            if (data.isComplete) {
                setIsComplete(true);
                setGrade(data.grade);

                // Add completion message
                setMessages(prev => [...prev, {
                    type: 'system',
                    content: '> [SIMULATION COMPLETE]\n> Processing performance data...'
                }]);

                // Callback if provided
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
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-black border-2 border-green-500/50 rounded-lg overflow-hidden shadow-2xl shadow-green-500/20 font-mono">
            {/* Terminal Header */}
            <div className="bg-green-900/30 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-bold tracking-wider">HOLO-SIM™</span>
                    <span className="text-green-600 text-xs">v2.0</span>
                </div>
                <div className="flex items-center gap-4">
                    {sessionActive && (
                        <span className="text-green-500 text-xs">
                            TURN {turnCount}/{maxTurns}
                        </span>
                    )}
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className={`w-3 h-3 rounded-full ${sessionActive ? 'bg-green-500 animate-pulse' : 'bg-green-500/30'}`}></div>
                    </div>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="h-80 overflow-y-auto p-4 bg-black/95 custom-scrollbar">
                {!sessionActive ? (
                    // Start Screen
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-green-500 mb-6 animate-pulse">
                            <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <pre className="text-xs leading-relaxed">
                                {`╔════════════════════════════════════╗
║     HOLO-SIM TRAINING SYSTEM       ║
║  Roleplay De-escalation Trainer    ║
╚════════════════════════════════════╝`}
                            </pre>
                        </div>
                        <p className="text-green-400/70 text-xs mb-6 max-w-xs">
                            Practice your de-escalation skills in a simulated traffic stop scenario.
                            You have 5 turns to handle the situation professionally.
                        </p>
                        <button
                            onClick={startSimulation}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 hover:border-green-400 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    INITIALIZING...
                                </>
                            ) : (
                                <>
                                    <Terminal className="w-4 h-4" />
                                    START SIMULATION
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    // Chat Messages
                    <div className="space-y-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`${msg.type === 'system' ? 'text-green-600 text-xs' :
                                    msg.type === 'user' ? 'text-cyan-400' : 'text-green-400'
                                }`}>
                                {msg.type === 'system' ? (
                                    <pre className="whitespace-pre-wrap leading-relaxed">{msg.content}</pre>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        {msg.type === 'user' ? (
                                            <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />
                                        ) : (
                                            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                                        )}
                                        <div>
                                            <span className={`text-xs ${msg.type === 'user' ? 'text-cyan-600' : 'text-green-600'}`}>
                                                {msg.type === 'user' ? '[OFFICER]' : '[SUSPECT]'}
                                            </span>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-green-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs animate-pulse">Processing response...</span>
                            </div>
                        )}

                        {/* Grade Display */}
                        {isComplete && grade && (
                            <div className="mt-4 p-4 border border-green-500/30 bg-green-900/10 rounded">
                                <div className="flex items-center gap-2 mb-3">
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                    <span className="text-green-400 font-bold">PERFORMANCE GRADE</span>
                                </div>
                                <div className="text-center mb-4">
                                    <span className={`text-5xl font-bold ${getScoreColor(grade.score)}`}>
                                        {grade.score}
                                    </span>
                                    <span className="text-green-600 text-lg">/100</span>
                                </div>
                                {grade.feedback && (
                                    <p className="text-green-400/80 text-xs text-center mb-3 italic">
                                        "{grade.feedback}"
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between p-2 bg-black/50 rounded">
                                        <span className="text-green-600">Professionalism</span>
                                        <span className="text-green-400">{grade.professionalism || '-'}/25</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-black/50 rounded">
                                        <span className="text-green-600">De-escalation</span>
                                        <span className="text-green-400">{grade.deescalation || '-'}/25</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-black/50 rounded">
                                        <span className="text-green-600">Communication</span>
                                        <span className="text-green-400">{grade.communication || '-'}/25</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-black/50 rounded">
                                        <span className="text-green-600">Procedure</span>
                                        <span className="text-green-400">{grade.procedure || '-'}/25</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="px-4 py-2 bg-red-900/30 border-t border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Input Area */}
            {sessionActive && (
                <div className="border-t border-green-500/30 p-3 bg-green-900/10">
                    {isComplete ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                <Lock className="w-4 h-4" />
                                <span>Simulation Complete - Input Locked</span>
                            </div>
                            <button
                                onClick={resetSimulation}
                                className="px-4 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                RESTART
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 text-sm">{'>'}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your response as an officer..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent text-green-400 placeholder-green-700 text-sm focus:outline-none caret-green-400"
                                autoComplete="off"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="p-2 text-green-500 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #22c55e40;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #22c55e60;
                }
            `}</style>
        </div>
    );
};

export default HoloSimChat;
