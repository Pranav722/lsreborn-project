import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Copy, Brain } from 'lucide-react';

/**
 * AIQualityHUD - Real-time AI Analysis Display Component
 * 
 * Shows circular progress gauges for Uniqueness, Quality, and Authenticity (inverse of AI probability)
 * with debounced API calls to the Gemini-powered analysis endpoint.
 * 
 * @param {string} inputText - The text to analyze
 * @param {function} onAnalysisComplete - Optional callback when analysis completes
 */
const AIQualityHUD = ({ inputText, onAnalysisComplete }) => {
    const [analysis, setAnalysis] = useState(null);
    const [plagiarism, setPlagiarism] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastAnalyzedText, setLastAnalyzedText] = useState('');
    const debounceTimerRef = useRef(null);

    // Debounce API calls - wait 2 seconds after typing stops
    useEffect(() => {
        // Clear any existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't analyze if text is too short (less than 50 chars)
        if (!inputText || inputText.trim().length < 50) {
            setAnalysis(null);
            setPlagiarism(null);
            setError(null);
            return;
        }

        // Don't re-analyze if text hasn't changed significantly
        if (inputText === lastAnalyzedText) {
            return;
        }

        // Set loading state immediately to show user we're waiting
        setLoading(true);
        setError(null);

        // Debounce: Wait 2 seconds after typing stops
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analysis/analyze-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ text: inputText })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Analysis failed');
                }

                setAnalysis(data.analysis);
                setPlagiarism(data.plagiarism);
                setLastAnalyzedText(inputText);
                setError(null);

                // Call optional callback
                if (onAnalysisComplete) {
                    onAnalysisComplete(data);
                }
            } catch (err) {
                console.error('Analysis error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 2000);

        // Cleanup timer on unmount or text change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputText, lastAnalyzedText, onAnalysisComplete]);

    // Calculate Authenticity as inverse of AI probability
    const authenticity = analysis ? 100 - analysis.aiProbability : 0;

    // Determine color based on score
    const getScoreColor = (score, inverted = false) => {
        const adjustedScore = inverted ? 100 - score : score;
        if (adjustedScore >= 70) return { stroke: '#22c55e', text: 'text-green-400', bg: 'bg-green-500/20' };
        if (adjustedScore >= 40) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-500/20' };
        return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/20' };
    };

    // Circular Progress Component
    const CircularGauge = ({ value, label, icon: Icon, inverted = false }) => {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const progress = (value / 100) * circumference;
        const colors = getScoreColor(value, inverted);

        return (
            <div className="flex flex-col items-center group">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                    {/* Background circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress circle with animation */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke={colors.stroke}
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                            className="transition-all duration-1000 ease-out"
                            style={{
                                filter: `drop-shadow(0 0 6px ${colors.stroke})`
                            }}
                        />
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Icon className={`w-5 h-5 ${colors.text} mb-1 group-hover:scale-110 transition-transform`} />
                        <span className={`text-2xl font-bold ${colors.text}`}>
                            {value}
                        </span>
                    </div>
                </div>

                {/* Label */}
                <span className="mt-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
            </div>
        );
    };

    // Don't render if no text input
    if (!inputText || inputText.trim().length < 50) {
        return (
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Brain className="w-5 h-5" />
                    <span className="text-sm">Write at least 50 characters to enable AI analysis</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">AI Quality Analysis</h3>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Gauges Grid */}
            {analysis ? (
                <>
                    <div className="flex justify-around items-center gap-4 mb-6">
                        <CircularGauge
                            value={analysis.uniqueness}
                            label="Uniqueness"
                            icon={Sparkles}
                        />
                        <CircularGauge
                            value={analysis.quality}
                            label="Quality"
                            icon={CheckCircle2}
                        />
                        <CircularGauge
                            value={authenticity}
                            label="Authenticity"
                            icon={Brain}
                            inverted={true}
                        />
                    </div>

                    {/* Plagiarism Warning */}
                    {plagiarism?.isPlagiarized && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-300 mb-1">Plagiarism Detected</h4>
                                    <p className="text-sm text-red-200/80">
                                        This text has {Math.round(plagiarism.similarityScore * 100)}% similarity with server rules.
                                    </p>
                                    {plagiarism.matchedRules?.length > 0 && (
                                        <div className="mt-2 text-xs text-red-200/60">
                                            Matched: {plagiarism.matchedRules.map(r => r.ruleId).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed Feedback Box */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Analysis Details
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(analysis, null, 2))}
                                className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
                                title="Copy JSON"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between items-center py-2 px-3 bg-gray-900/50 rounded">
                                <span className="text-gray-400">AI Probability</span>
                                <span className={`font-mono font-bold ${getScoreColor(analysis.aiProbability, true).text}`}>
                                    {analysis.aiProbability}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Relevance</span>
                                <span className={`font-mono font-bold ${getScoreColor(analysis.relevance).text}`}>
                                    {analysis.relevance}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Quality</span>
                                <span className={`font-mono font-bold ${getScoreColor(analysis.quality).text}`}>
                                    {analysis.quality}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Uniqueness</span>
                                <span className={`font-mono font-bold ${getScoreColor(analysis.uniqueness).text}`}>
                                    {analysis.uniqueness}%
                                </span>
                            </div>
                        </div>

                        {/* Plagiarism Score */}
                        {plagiarism && (
                            <div className={`mt-3 flex justify-between items-center py-2 px-3 rounded ${plagiarism.isPlagiarized ? 'bg-red-900/30 border border-red-500/30' : 'bg-green-900/20 border border-green-500/20'}`}>
                                <span className="text-gray-400">Rule Similarity</span>
                                <span className={`font-mono font-bold ${plagiarism.isPlagiarized ? 'text-red-400' : 'text-green-400'}`}>
                                    {Math.round(plagiarism.similarityScore * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative w-24 h-24 mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {loading ? 'Analyzing your text...' : 'Waiting for input...'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Analysis begins 2 seconds after you stop typing
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIQualityHUD;
