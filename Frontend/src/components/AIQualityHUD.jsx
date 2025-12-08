import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

/**
 * AIQualityHUD - Minimalist Status Bar for AI Analysis
 * 
 * Handles AI service failures gracefully - never blocks submission.
 */
const AIQualityHUD = ({ inputText, onAnalysisComplete }) => {
    const [analysis, setAnalysis] = useState(null);
    const [plagiarism, setPlagiarism] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiUnavailable, setAiUnavailable] = useState(false);
    const [lastAnalyzedText, setLastAnalyzedText] = useState('');
    const debounceTimerRef = useRef(null);

    // Debounce API calls - wait 2 seconds after typing stops
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't analyze if text is too short
        if (!inputText || inputText.trim().length < 50) {
            setAnalysis(null);
            setPlagiarism(null);
            setError(null);
            setLoading(false);
            setAiUnavailable(false);
            return;
        }

        if (inputText === lastAnalyzedText) {
            return;
        }

        setLoading(true);
        setError(null);
        setAiUnavailable(false);

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const apiUrl = `${import.meta.env.VITE_API_URL}/api/analysis/analyze-text`;
                console.log('[AIQualityHUD] Fetching:', apiUrl);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ text: inputText })
                });

                const data = await response.json();
                console.log('[AIQualityHUD] Response:', data);

                // Check if backend returned an error flag
                if (data.error === true || !response.ok) {
                    console.error('[AIQualityHUD] Backend error:', data.message);
                    setAiUnavailable(true);
                    setError(data.message || 'Analysis failed');
                    // Still call onAnalysisComplete with null so parent knows we're done
                    if (onAnalysisComplete) {
                        onAnalysisComplete({
                            analysis: null,
                            plagiarism: null,
                            aiUnavailable: true
                        });
                    }
                    return;
                }

                // Check for zeroed-out scores (service error fallback)
                if (data.analysis &&
                    data.analysis.quality === 0 &&
                    data.analysis.aiProbability === 0 &&
                    data.analysis.uniqueness === 0) {
                    console.warn('[AIQualityHUD] All scores are 0 - treating as service error');
                    setAiUnavailable(true);
                    if (onAnalysisComplete) {
                        onAnalysisComplete({
                            analysis: null,
                            plagiarism: null,
                            aiUnavailable: true
                        });
                    }
                    return;
                }

                setAnalysis(data.analysis);
                setPlagiarism(data.plagiarism);
                setLastAnalyzedText(inputText);
                setError(null);
                setAiUnavailable(false);

                if (onAnalysisComplete) {
                    onAnalysisComplete(data);
                }
            } catch (err) {
                console.error('[AIQualityHUD] Fetch error:', err);
                setAiUnavailable(true);
                setError(err.message);
                // Notify parent that AI is unavailable
                if (onAnalysisComplete) {
                    onAnalysisComplete({
                        analysis: null,
                        plagiarism: null,
                        aiUnavailable: true
                    });
                }
            } finally {
                // ALWAYS stop loading regardless of success/error
                setLoading(false);
            }
        }, 2000);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputText, lastAnalyzedText, onAnalysisComplete]);

    // Calculate authenticity (inverse of AI probability)
    const authenticity = analysis ? 100 - analysis.aiProbability : 0;

    // Get color based on score
    const getBarColor = (score) => {
        if (score >= 70) return 'bg-emerald-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getTextColor = (score) => {
        if (score >= 70) return 'text-emerald-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };

    // Minimal state when no text
    if (!inputText || inputText.trim().length < 50) {
        return (
            <div className="mt-2 px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-700/50 opacity-60">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <span>AI Analysis • Write 50+ characters to scan</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 px-3 py-2.5 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
            {/* Header with status */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {loading ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            <span className="text-xs text-cyan-400">Scanning...</span>
                        </>
                    ) : aiUnavailable ? (
                        <>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400">AI Unavailable</span>
                        </>
                    ) : error ? (
                        <>
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span className="text-xs text-rose-400">Error</span>
                        </>
                    ) : analysis ? (
                        <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-slate-400">AI Analysis</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                            <span className="text-xs text-slate-500">Ready</span>
                        </>
                    )}
                </div>

                {/* Plagiarism warning badge */}
                {plagiarism?.isPlagiarized && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 rounded text-rose-400 text-xs">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Plagiarism Detected</span>
                    </div>
                )}
            </div>

            {/* AI Service Unavailable Message - Does NOT block submission */}
            {aiUnavailable && !loading && (
                <div className="py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 text-xs">
                    <p className="font-medium">AI Service Unavailable</p>
                    <p className="text-amber-400/80 mt-0.5">Manual Review Required • You may still submit</p>
                </div>
            )}

            {/* Progress Bars - Only show if we have valid analysis */}
            {analysis && !aiUnavailable ? (
                <div className="space-y-2">
                    {/* Quality Bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-12">Quality</span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getBarColor(analysis.quality)} transition-all duration-700 ease-out`}
                                style={{ width: `${analysis.quality}%` }}
                            />
                        </div>
                        <span className={`text-xs font-mono w-8 text-right ${getTextColor(analysis.quality)}`}>
                            {analysis.quality}
                        </span>
                    </div>

                    {/* Uniqueness Bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-12">Unique</span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getBarColor(analysis.uniqueness)} transition-all duration-700 ease-out`}
                                style={{ width: `${analysis.uniqueness}%` }}
                            />
                        </div>
                        <span className={`text-xs font-mono w-8 text-right ${getTextColor(analysis.uniqueness)}`}>
                            {analysis.uniqueness}
                        </span>
                    </div>

                    {/* Authenticity (Real) Bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-12">Real</span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getBarColor(authenticity)} transition-all duration-700 ease-out`}
                                style={{ width: `${authenticity}%` }}
                            />
                        </div>
                        <span className={`text-xs font-mono w-8 text-right ${getTextColor(authenticity)}`}>
                            {authenticity}
                        </span>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-cyan-500/50 rounded-full animate-pulse"></div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AIQualityHUD;
