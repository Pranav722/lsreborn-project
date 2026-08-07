import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Loader2, CheckCircle2 } from 'lucide-react';

const DepartmentApp = ({ type, user }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [appStatus, setAppStatus] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://lsreborn-backend.onrender.com';

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/forms/status/${type}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAppStatus(data.status);
                }
            } catch (e) {
                console.error("Status error:", e);
            }
        };
        fetchStatus();
    }, [type]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${apiUrl}/api/forms/submit/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    discordId: user.id
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setAppStatus('pending');
            } else {
                setError(data.message || 'Submission failed');
            }
        } catch (e) {
            setError('Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Subcomponents
    const Input = ({ label, name, type = 'text', value, readOnly, placeholder, onChange }) => (
        <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value !== undefined ? value : (formData[name] || '')}
                readOnly={readOnly}
                placeholder={placeholder}
                onChange={onChange || handleChange}
                required
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:border-blue-500 focus:outline-none ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
        </div>
    );

    const TextArea = ({ label, name, rows = 3, placeholder, onChange }) => (
        <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">{label}</label>
            <textarea
                name={name}
                rows={rows}
                value={formData[name] || ''}
                placeholder={placeholder}
                onChange={onChange || handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
            />
        </div>
    );

    const SubmitButton = ({ color = 'bg-blue-600' }) => (
        <button
            type="submit"
            disabled={loading}
            className={`w-full ${color} hover:brightness-110 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
        </button>
    );

    // If application pending
    if (appStatus === 'pending') {
        return (
            <div className="max-w-xl mx-auto pt-20">
                <Card className="text-center p-8 space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto animate-bounce" />
                    <h3 className="text-2xl font-bold text-slate-100">Application Submitted</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Your <span className="text-cyan-400 font-semibold uppercase">{type}</span> application has been received and is currently under review by staff.
                    </p>
                </Card>
            </div>
        );
    }

    // === POLICE APPLICATION ===
    if (type === 'pd') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-blue-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-blue-400">Police Department Application</h2>
                        <p className="text-slate-400 mt-1">LSPD / BCSO Law Enforcement</p>
                    </div>

                    {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">Application submitted successfully!</div>}
                    {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Name (IRL)" name="irlName" onChange={handleChange} />
                            <Input label="Age (IRL)" name="irlAge" type="number" onChange={handleChange} />
                            <Input label="IC Name" name="icName" onChange={handleChange} />
                            <Input label="Discord Tag" name="discordId" value={user.username} readOnly />
                        </div>

                        <TextArea label="Character Backstory" name="backstory" rows={4} onChange={handleChange} />
                        <TextArea label="Why do you want to join the Police Department?" name="whyJoinPD" rows={3} onChange={handleChange} />
                        <TextArea label="What is Match of Force and why is it important?" name="matchOfForce" rows={3} onChange={handleChange} />

                        <TextArea label="How would you handle rule breakers?" name="ruleBreakers" onChange={handleChange} />
                        <TextArea label="What actions should we take if you fail as a Cop?" name="unprofessional" onChange={handleChange} />

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

                        <TextArea label="Introduce yourself and tell us why you applied for EMS?" name="emsIntro" rows={3} onChange={handleChange} />
                        <TextArea label="What do you know about the role of EMS?" name="emsRole" rows={3} onChange={handleChange} />
                        <TextArea label="How would you describe EMS responsibilities?" name="emsResp" rows={3} onChange={handleChange} />

                        <TextArea label="What's the first thing you'd do at an accident scene?" name="emsScene" onChange={handleChange} />
                        <TextArea label="How do you prioritize multiple patients?" name="emsPriority" onChange={handleChange} />
                        <TextArea label="What does CPR stand for?" name="emsCPR" onChange={handleChange} />

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

                        <TextArea label="Have you been staff before? (List details)" name="experience" rows={3} onChange={handleChange} />
                        <TextArea label="What are staff responsibilities?" name="responsibilities" rows={3} onChange={handleChange} />
                        <TextArea label="Why staff and not just a player?" name="whyStaff" rows={3} onChange={handleChange} />

                        <TextArea label="Define: FailRP, VDM, RDM, Powergaming, Metagaming" name="definitions" rows={4} onChange={handleChange} />
                        <TextArea label="2 players argue in OOC. What do you do?" name="scenarios" onChange={handleChange} />
                        <TextArea label="Player accuses another without proof. What do you do?" name="accusation" onChange={handleChange} />
                        <TextArea label="You see staff abusing powers. What's your response?" name="abuse" onChange={handleChange} />

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
                        </div>

                        <SubmitButton color="bg-purple-600" />
                    </form>
                </Card>
            </div>
        );
    }

    return null;
};

export default DepartmentApp;