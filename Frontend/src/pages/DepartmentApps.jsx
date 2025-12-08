import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AIQualityHUD from '../components/AIQualityHUD';
import HoloSimChat from '../components/HoloSimChat';
import { Loader2, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

const DepartmentApp = ({ type, user }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [appStatus, setAppStatus] = useState(null);

    // AI Validation State
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isPlagiarized, setIsPlagiarized] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [holoSimScore, setHoloSimScore] = useState(null);

    // Get the primary text field for AI analysis based on form type
    const getAnalyzableText = () => {
        if (type === 'pd') {
            return `${formData.backstory || ''} ${formData.whyJoinPD || ''} ${formData.matchOfForce || ''}`;
        } else if (type === 'ems') {
            return `${formData.emsIntro || ''} ${formData.emsRole || ''} ${formData.emsResp || ''}`;
        } else if (type === 'staff') {
            return `${formData.experience || ''} ${formData.responsibilities || ''} ${formData.whyStaff || ''}`;
        }
        return '';
    };

    // AI Analysis callback handler
    const handleAnalysisComplete = (data) => {
        setAiAnalysis(data.analysis);
        setIsPlagiarized(data.plagiarism?.isPlagiarized || false);
        setIsAnalyzing(false);
    };

    // HoloSim completion callback
    const handleHoloSimComplete = (grade) => {
        setHoloSimScore(grade?.score || 0);
    };

    // Validation logic for submit button
    const isSubmitDisabled = () => {
        // HoloSim required for PD only
        if (type === 'pd' && (holoSimScore === null || holoSimScore < 50)) {
            return true;
        }
        if (aiAnalysis && aiAnalysis.quality < 60) {
            return true;
        }
        if (isPlagiarized) {
            return true;
        }
        if (isAnalyzing) {
            return true;
        }
        return false;
    };

    // Get validation status message
    const getValidationMessage = () => {
        if (type === 'pd' && holoSimScore === null) {
            return { type: 'warning', message: 'Complete the HoloSim training to unlock submission.' };
        }
        if (type === 'pd' && holoSimScore < 50) {
            return { type: 'error', message: `HoloSim score too low (${holoSimScore}/100). Minimum required: 50.` };
        }
        if (isPlagiarized) {
            return { type: 'error', message: 'Plagiarism detected. Please write original content.' };
        }
        if (aiAnalysis && aiAnalysis.quality < 60) {
            return { type: 'error', message: `Quality score too low (${aiAnalysis.quality}/100). Minimum required: 60.` };
        }
        if (isAnalyzing) {
            return { type: 'info', message: 'Analyzing your application...' };
        }
        if (aiAnalysis && aiAnalysis.quality >= 60 && !isPlagiarized) {
            return { type: 'success', message: 'All checks passed! You may submit.' };
        }
        return null;
    };

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/status/${type}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAppStatus(data.status);
                }
            } catch (e) {
                console.error("Status check failed:", e);
            }
        };
        checkStatus();
    }, [type]);

    // Show pending status
    if (appStatus === 'pending') {
        return (
            <div className="max-w-2xl mx-auto pt-20 animate-fade-in text-center">
                <Card className="border-l-4 border-yellow-500">
                    <div className="py-10">
                        <h2 className="text-3xl font-bold text-yellow-400 mb-4">Application Pending</h2>
                        <p className="text-gray-300 text-lg mb-6">
                            You already have a pending {type.toUpperCase()} application.
                        </p>
                        <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600">
                            Return Home
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitDisabled()) {
            setError('Please complete all validation requirements.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        let payload = { ...formData, discordId: user.username };
        payload.aiValidation = {
            qualityScore: aiAnalysis?.quality || 0,
            uniquenessScore: aiAnalysis?.uniqueness || 0,
            aiProbability: aiAnalysis?.aiProbability || 0,
            holoSimScore: holoSimScore || 0,
            isPlagiarized
        };

        // Consolidate fields
        if (type === 'pd') {
            payload.scenario = `Match of Force: ${formData.matchOfForce || ''}\nSituation 1: ${formData.situation1 || ''}\nHandling Rule Breakers: ${formData.ruleBreakers || ''}`;
            payload.whyJoin = formData.whyJoinPD;
        } else if (type === 'ems') {
            payload.medicalKnowledge = `Scene Accident: ${formData.emsScene || ''}\nPrioritize Patients: ${formData.emsPriority || ''}\nCPR: ${formData.emsCPR || ''}`;
            payload.scenarios = `Shooting Scene: ${formData.emsShooting || ''}\nTrolling: ${formData.emsTrolling || ''}`;
        } else if (type === 'staff') {
            payload.scenarios = `OOC Argue: ${formData.scenarios || ''}\nAccusation: ${formData.accusation || ''}\nAbuse: ${formData.abuse || ''}`;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/submit/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Submission failed");
            setSuccess(true);
            setTimeout(() => window.location.reload(), 3000);
        } catch (e) {
            setError(e.message || "Submission failed.");
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (aiAnalysis) setIsAnalyzing(true);
    };

    // Validation Banner
    const ValidationBanner = () => {
        const status = getValidationMessage();
        if (!status) return null;
        const styles = {
            warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
            error: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
            info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
            success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        };
        const icons = {
            warning: <AlertTriangle className="w-4 h-4" />,
            error: <ShieldAlert className="w-4 h-4" />,
            info: <Loader2 className="w-4 h-4 animate-spin" />,
            success: <CheckCircle2 className="w-4 h-4" />
        };
        return (
            <div className={`p-3 border rounded-lg flex items-center gap-2 text-sm ${styles[status.type]}`}>
                {icons[status.type]}
                <span>{status.message}</span>
            </div>
        );
    };

    // Submit Button
    const SubmitButton = ({ color }) => {
        const disabled = isSubmitDisabled() || loading;
        return (
            <button
                type="submit"
                disabled={disabled}
                className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${disabled ? 'bg-slate-700 cursor-not-allowed opacity-50' : `${color} hover:opacity-90`
                    }`}
            >
                {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : isAnalyzing ? (
                    <><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Scanning...</>
                ) : disabled ? (
                    <><ShieldAlert className="w-4 h-4" /> Complete Validation</>
                ) : (
                    <><Sparkles className="w-4 h-4" /> Submit Application</>
                )}
            </button>
        );
    };

    // TextArea with inline AI analysis
    const AnalyzedTextArea = ({ label, name, ...props }) => (
        <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
            <textarea
                name={name}
                onChange={handleChange}
                rows={props.rows || 4}
                className="w-full bg-slate-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-none"
                required
                {...props}
            />
            <AIQualityHUD inputText={formData[name] || ''} onAnalysisComplete={handleAnalysisComplete} />
        </div>
    );

    // === PD APPLICATION ===
    if (type === 'pd') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-blue-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-blue-400">LSPD Application</h2>
                        <p className="text-slate-400 mt-1">"To Protect and To Serve"</p>
                    </div>

                    {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">Application submitted successfully!</div>}
                    {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Name (IRL)" name="irlName" onChange={handleChange} />
                            <Input label="Age (IRL)" name="irlAge" type="number" onChange={handleChange} />
                            <Input label="IC Name" name="icName" onChange={handleChange} />
                            <Input label="Discord ID" name="discordId" value={user.username} readOnly />
                        </div>

                        <AnalyzedTextArea label="Character Backstory" name="backstory" />
                        <AnalyzedTextArea label="Why do you want to join the Police Department?" name="whyJoinPD" />
                        <AnalyzedTextArea label="What is Match of Force and why is it important?" name="matchOfForce" />

                        <TextArea label="How would you handle rule breakers?" name="ruleBreakers" onChange={handleChange} />
                        <TextArea label="What actions should we take if you fail as a Cop?" name="unprofessional" onChange={handleChange} />

                        {/* HoloSim at bottom */}
                        <div className="pt-4 border-t border-slate-700">
                            <h3 className="text-lg font-medium text-blue-400 mb-2">De-escalation Training</h3>
                            <p className="text-slate-500 text-sm mb-4">Complete this simulated traffic stop. Minimum score: 50.</p>
                            <HoloSimChat scenarioType="pd" onComplete={handleHoloSimComplete} />
                            {holoSimScore !== null && (
                                <div className={`mt-3 p-2 rounded text-sm flex items-center gap-2 ${holoSimScore >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    <span>Score: {holoSimScore}/100 {holoSimScore >= 50 ? '✓' : '✗'}</span>
                                </div>
                            )}
                        </div>

                        <ValidationBanner />
                        <SubmitButton color="bg-blue-600" />
                    </form>
                </Card>
            </div>
        );
    }

    // === EMS APPLICATION ===
    if (type === 'ems') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-rose-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-rose-400">EMS Application</h2>
                        <p className="text-slate-400 mt-1">Emergency Medical Services</p>
                    </div>

                    {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">Application submitted successfully!</div>}
                    {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Name (IRL)" name="irlName" onChange={handleChange} />
                            <Input label="Age (IRL)" name="irlAge" type="number" onChange={handleChange} />
                            <Input label="IC Name" name="icName" onChange={handleChange} />
                        </div>

                        <AnalyzedTextArea label="Introduce yourself and tell us why you applied for EMS?" name="emsIntro" />
                        <AnalyzedTextArea label="What do you know about the role of EMS?" name="emsRole" />
                        <AnalyzedTextArea label="How would you describe EMS responsibilities?" name="emsResp" />

                        <TextArea label="What's the first thing you'd do at an accident scene?" name="emsScene" onChange={handleChange} />
                        <TextArea label="How do you prioritize multiple patients?" name="emsPriority" onChange={handleChange} />
                        <TextArea label="What does CPR stand for?" name="emsCPR" onChange={handleChange} />

                        {/* HoloSim at bottom */}
                        <div className="pt-4 border-t border-slate-700">
                            <h3 className="text-lg font-medium text-rose-400 mb-2">Patient Interaction Training</h3>
                            <p className="text-slate-500 text-sm mb-4">Practice handling a difficult patient.</p>
                            <HoloSimChat scenarioType="ems" onComplete={handleHoloSimComplete} />
                        </div>

                        <ValidationBanner />
                        <SubmitButton color="bg-rose-600" />
                    </form>
                </Card>
            </div>
        );
    }

    // === STAFF APPLICATION ===
    if (type === 'staff') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-purple-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-purple-400">Staff Application</h2>
                        <p className="text-slate-400 mt-1">Community Management</p>
                    </div>

                    {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">Application submitted successfully!</div>}
                    {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Discord Tag" name="discordTag" value={user.username} readOnly />
                            <Input label="Age (IRL)" name="age" type="number" onChange={handleChange} />
                            <Input label="Weekly Hours" name="hours" onChange={handleChange} />
                        </div>

                        <AnalyzedTextArea label="Have you been staff before? (List details)" name="experience" />
                        <AnalyzedTextArea label="What are staff responsibilities?" name="responsibilities" />
                        <AnalyzedTextArea label="Why staff and not just a player?" name="whyStaff" />

                        <TextArea label="Define: FailRP, VDM, RDM, Powergaming, Metagaming" name="definitions" rows={5} onChange={handleChange} />
                        <TextArea label="2 players argue in OOC. What do you do?" name="scenarios" onChange={handleChange} />
                        <TextArea label="Player accuses another without proof. What do you do?" name="accusation" onChange={handleChange} />
                        <TextArea label="You see staff abusing powers. What's your response?" name="abuse" onChange={handleChange} />

                        {/* HoloSim at bottom */}
                        <div className="pt-4 border-t border-slate-700">
                            <h3 className="text-lg font-medium text-purple-400 mb-2">Conflict Resolution Training</h3>
                            <p className="text-slate-500 text-sm mb-4">Handle an angry player making a report.</p>
                            <HoloSimChat scenarioType="staff" onComplete={handleHoloSimComplete} />
                        </div>

                        <div className="space-y-2 p-4 bg-purple-900/10 rounded-lg">
                            <p className="text-slate-300 text-sm font-medium">Agreements</p>
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <input type="checkbox" required className="accent-purple-500" />
                                I agree staff is responsibility, not clout.
                            </label>
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <input type="checkbox" required className="accent-purple-500" />
                                I will stay unbiased & fair.
                            </label>
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <input type="checkbox" required className="accent-purple-500" />
                                I accept removal if abusing powers.
                            </label>
                        </div>

                        <ValidationBanner />
                        <SubmitButton color="bg-purple-600" />
                    </form>
                </Card>
            </div>
        );
    }

    return null;
};

// Helper Components
const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-slate-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" required />
    </div>
);

const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
        <textarea {...props} rows={props.rows || 4} className="w-full bg-slate-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-none" required />
    </div>
);

export default DepartmentApp;