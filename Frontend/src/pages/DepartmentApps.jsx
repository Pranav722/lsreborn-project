import React, { useState } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

const DepartmentApp = ({ type, user }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Prepare payload based on type to match backend expectation
        let payload = { ...formData, discordId: user.username };
        
        // Consolidating specific fields into the generic DB columns
        if (type === 'pd') {
            payload.scenario = `
                Match of Force: ${formData.matchOfForce || ''}
                Situation 1: ${formData.situation1 || ''}
                Handling Rule Breakers: ${formData.ruleBreakers || ''}
            `;
            payload.whyJoin = formData.whyJoinPD;
        } else if (type === 'ems') {
            payload.medicalKnowledge = `
                Scene Accident: ${formData.emsScene || ''}
                Prioritize Patients: ${formData.emsPriority || ''}
                Refusal: ${formData.emsRefusal || ''}
                CPR: ${formData.emsCPR || ''}
                Commands: ${formData.emsCommands || ''}
            `;
            payload.scenarios = `
                Shooting Scene: ${formData.emsShooting || ''}
                Trolling: ${formData.emsTrolling || ''}
                Lone Duty: ${formData.emsLone || ''}
                Refusing Hospital: ${formData.emsFakeInjury || ''}
                Perma RP: ${formData.emsPerma || ''}
                Coordination: ${formData.emsCoord || ''}
                Rude Patient: ${formData.emsRude || ''}
                Speed vs Accuracy: ${formData.emsSpeed || ''}
            `;
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
            alert(data.message);
            if(res.ok) window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Submission failed.");
        }
        setLoading(false);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // --- PD APPLICATION FORM ---
    if (type === 'pd') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-blue-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-blue-500">LSPD Application</h2>
                        <p className="text-gray-400 mt-2">"To Protect and To Serve"</p>
                    </div>

                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20 mb-8 text-sm text-gray-300">
                        <h4 className="font-bold text-blue-300 mb-2">Why Join PD?</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Sense of Duty:</strong> Protecting citizens is an honorable mission.</li>
                            <li><strong>Stability:</strong> Government jobs offer reliable benefits.</li>
                            <li><strong>Challenge:</strong> No two days are the same.</li>
                            <li><strong>Growth:</strong> Special units (Cyber, Forensics, Intel).</li>
                        </ul>
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                            <h4 className="font-bold text-blue-300 mb-2">Requirements:</h4>
                            <p>• Must be 18+ & have a functional mic.</p>
                            <p>• Must commit ~14 hours/week.</p>
                            <p>• Must follow Server Rules & Guidelines.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                         {/* Personal Info */}
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="Name (IRL)" name="irlName" onChange={handleChange} required />
                            <Input label="Age (IRL)" name="irlAge" type="number" onChange={handleChange} required />
                            <Input label="Your IC Name" name="icName" onChange={handleChange} required />
                            <Input label="Discord ID" name="discordId" value={user.username} readOnly />
                         </div>

                         <TextArea label="Character Backstory" name="backstory" onChange={handleChange} required />

                         <div>
                            <label className="block text-gray-300 mb-2">Experience Level</label>
                            <select name="experience" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-blue-500 outline-none">
                                <option value="">Select Level...</option>
                                <option value="Fresher">Fresher</option>
                                <option value="Experienced">Experienced</option>
                            </select>
                         </div>

                         <TextArea label="Why do you want to join the Police Department?" name="whyJoinPD" onChange={handleChange} required />
                         
                         {/* Scenarios */}
                         <div className="space-y-6">
                             <h3 className="text-xl font-bold text-blue-400 border-b border-gray-700 pb-2">Situational Assessment</h3>
                             
                             <TextArea label="How would you handle a situation where you have to work with other players who may not be following the rules?" name="ruleBreakers" onChange={handleChange} required />
                             
                             <TextArea label="What actions should we take if you don't maintain professionalism and fail as a Cop?" name="unprofessional" onChange={handleChange} required />
                             
                             <TextArea label="What is Match of Force and why is it important?" name="matchOfForce" onChange={handleChange} required />
                             
                             <div className="bg-gray-800/50 p-4 rounded-lg">
                                 <p className="text-gray-300 text-sm mb-4 italic">
                                     <strong>Situation 1:</strong> In a code red you are following n+2 and you use class 1 weapon while having class 2. The suspect has only class 1. Why don't you use class 2 to neutralize immediately? Why use Match of Force here?
                                 </p>
                                 <TextArea label="Your Answer" name="situation1" rows="4" onChange={handleChange} required />
                             </div>
                         </div>

                         <AnimatedButton type="submit" className="w-full bg-blue-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
                    </form>
                </Card>
            </div>
        );
    }

    // --- EMS APPLICATION FORM ---
    if (type === 'ems') {
        return (
             <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-red-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-red-500">EMS Application</h2>
                        <p className="text-gray-400 mt-2">Emergency Medical Services</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="Name (IRL)" name="irlName" onChange={handleChange} required />
                            <Input label="Age (IRL)" name="irlAge" type="number" onChange={handleChange} required />
                            <Input label="IC Name" name="icName" onChange={handleChange} required />
                         </div>

                         {/* General */}
                         <div className="space-y-4">
                             <TextArea label="Introduce yourself and tell us why you applied for EMS?" name="emsIntro" onChange={handleChange} required />
                             <TextArea label="What do you know about the role of EMS in the city?" name="emsRole" onChange={handleChange} required />
                             <TextArea label="How would you describe the responsibilities of an EMS worker?" name="emsResp" onChange={handleChange} required />
                             <TextArea label="Why should we choose you over other applicants?" name="emsChoose" onChange={handleChange} required />
                         </div>

                         {/* Medical Knowledge */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-bold text-red-400 border-b border-gray-700 pb-2">Medical Knowledge / RP</h3>
                             <TextArea label="What’s the first thing you would do when you arrive at the scene of an accident?" name="emsScene" onChange={handleChange} required />
                             <TextArea label="If you see two unconscious patients at the same time, how will you prioritize them?" name="emsPriority" onChange={handleChange} required />
                             <TextArea label="How do you handle a situation where a patient refuses medical help?" name="emsRefusal" onChange={handleChange} required />
                             <TextArea label="What does CPR stand for, and when should it be used? (RP-friendly)" name="emsCPR" onChange={handleChange} required />
                             <TextArea label="What basic medical roleplay commands/emotes would you use when reviving someone?" name="emsCommands" onChange={handleChange} required />
                         </div>

                         {/* Scenarios */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-bold text-red-400 border-b border-gray-700 pb-2">Scenarios</h3>
                             <TextArea label="You get a call about a shooting, and police say the area isn’t fully secured. What would you do?" name="emsShooting" onChange={handleChange} required />
                             <TextArea label="A player keeps trolling or refusing RP during treatment. How will you handle it?" name="emsTrolling" onChange={handleChange} required />
                             <TextArea label="You are the only EMS on duty, and you get multiple 911 calls at the same time—what’s your plan?" name="emsLone" onChange={handleChange} required />
                             <TextArea label="What will you do if a patient is roleplaying severe injuries but refuses to go to the hospital?" name="emsFakeInjury" onChange={handleChange} required />
                             <TextArea label="If someone dies due to server rules (perma RP), how will you handle it professionally?" name="emsPerma" onChange={handleChange} required />
                         </div>

                         {/* Teamwork */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-bold text-red-400 border-b border-gray-700 pb-2">Teamwork & Communication</h3>
                             <TextArea label="How would you coordinate with police officers at an accident scene?" name="emsCoord" onChange={handleChange} required />
                             <TextArea label="How do you deal with a difficult or rude patient in RP?" name="emsRude" onChange={handleChange} required />
                             <TextArea label="What’s more important to you as EMS: speed or accuracy in treatment, and why?" name="emsSpeed" onChange={handleChange} required />
                         </div>

                         <AnimatedButton type="submit" className="w-full bg-red-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
                    </form>
                </Card>
            </div>
        );
    }

    // --- STAFF APPLICATION FORM ---
    if (type === 'staff') {
        return (
             <div className="max-w-4xl mx-auto pt-10 animate-fade-in pb-20">
                <Card>
                    <div className="border-b border-purple-500/30 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-purple-500">Staff Application</h2>
                        <p className="text-gray-400 mt-2">Community Management & Enforcement</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="Discord Tag" name="discordTag" value={user.username} readOnly />
                            <Input label="Age (Real Life)" name="age" type="number" onChange={handleChange} required />
                            <Input label="Weekly Hours" name="hours" onChange={handleChange} required />
                         </div>
                         
                         <TextArea label="Have you ever been staff in any RP server before? (If yes, list details)" name="experience" onChange={handleChange} required />
                         <TextArea label="What are staff responsibilities in an RP community?" name="responsibilities" onChange={handleChange} required />
                         
                         <TextArea label="Define: FailRP, VDM, RDM, Powergaming, Metagaming." name="definitions" rows="5" onChange={handleChange} required />
                         
                         {/* Situational */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-bold text-purple-400 border-b border-gray-700 pb-2">Situational Questions</h3>
                             <TextArea label="2 players argue in OOC chat. What do you do?" name="scenarios" onChange={handleChange} required />
                             <TextArea label="Player accuses another of RDM without proof. What do you do?" name="accusation" onChange={handleChange} required />
                             <TextArea label="You see staff abusing powers. What’s your response?" name="abuse" onChange={handleChange} required />
                             <TextArea label="How do you handle stress with multiple reports?" name="stress" onChange={handleChange} required />
                         </div>

                         <div className="bg-gray-800 p-4 rounded">
                             <label className="block text-purple-300 font-bold mb-2">Punishments</label>
                             <p className="text-gray-400 text-sm mb-2">Please suggest punishments for the following:</p>
                             <div className="grid grid-cols-2 gap-4">
                                <Input label="First-time VDM" name="punishVDM" onChange={handleChange} />
                                <Input label="Repeated RDM" name="punishRDM" onChange={handleChange} />
                                <Input label="Hacking/Mod Menu" name="punishHack" onChange={handleChange} />
                                <Input label="Racism/Discrimination" name="punishRacism" onChange={handleChange} />
                             </div>
                         </div>

                         <TextArea label="Why staff and not just a player?" name="whyStaff" onChange={handleChange} required />
                         
                         <div className="space-y-3 border-t border-gray-700 pt-4 bg-purple-900/10 p-4 rounded">
                             <p className="text-gray-300 font-bold">Agreements</p>
                             <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                 <input type="checkbox" required className="w-5 h-5 accent-purple-500" /> 
                                 I agree staff is responsibility, not clout.
                             </label>
                             <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                 <input type="checkbox" required className="w-5 h-5 accent-purple-500" /> 
                                 I will stay unbiased & fair.
                             </label>
                             <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                 <input type="checkbox" required className="w-5 h-5 accent-purple-500" /> 
                                 I accept instant removal if abusing powers.
                             </label>
                         </div>

                         <AnimatedButton type="submit" className="w-full bg-purple-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
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
        <input {...props} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" required />
    </div>
);
const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
        <textarea {...props} rows={props.rows || 4} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" required />
    </div>
);

export default DepartmentApp;