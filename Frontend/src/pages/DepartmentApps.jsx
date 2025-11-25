import React, { useState } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';

const DepartmentApp = ({ type, user }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/submit/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ ...formData, discordId: user.username })
            });
            const data = await res.json();
            alert(data.message);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // PD Form Config
    if (type === 'pd') {
        return (
            <div className="max-w-4xl mx-auto pt-10 animate-fade-in">
                <Card>
                    <h2 className="text-3xl font-bold text-blue-500 mb-2">LSPD Application</h2>
                    <p className="text-gray-400 mb-6">"To Protect and To Serve"</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="IRL Name" name="irlName" onChange={handleChange} />
                            <Input label="IRL Age" name="irlAge" type="number" onChange={handleChange} />
                            <Input label="IC Name" name="icName" onChange={handleChange} />
                            <Input label="Discord ID" name="discordId" value={user.username} readOnly />
                         </div>
                         <div>
                            <label className="block text-gray-300 mb-2">Experience Level</label>
                            <select name="experience" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white">
                                <option value="Fresher">Fresher</option>
                                <option value="Experienced">Experienced</option>
                            </select>
                         </div>
                         <TextArea label="Why do you want to join the PD?" name="whyJoin" onChange={handleChange} />
                         <TextArea label="Scenario: You see a fellow officer breaking rules. What do you do?" name="scenario" onChange={handleChange} />
                         <AnimatedButton type="submit" className="w-full bg-blue-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
                    </form>
                </Card>
            </div>
        );
    }

    // EMS Form Config
    if (type === 'ems') {
        return (
             <div className="max-w-4xl mx-auto pt-10 animate-fade-in">
                <Card>
                    <h2 className="text-3xl font-bold text-red-500 mb-2">EMS Application</h2>
                    <p className="text-gray-400 mb-6">Medical Services Department</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="IRL Name" name="irlName" onChange={handleChange} />
                            <Input label="IRL Age" name="irlAge" type="number" onChange={handleChange} />
                            <Input label="IC Name" name="icName" onChange={handleChange} />
                         </div>
                         <TextArea label="Medical Knowledge (CPR, Prioritizing patients)" name="medicalKnowledge" onChange={handleChange} />
                         <TextArea label="Scenario: Shooting scene, not secured. What do you do?" name="scenarios" onChange={handleChange} />
                         <AnimatedButton type="submit" className="w-full bg-red-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
                    </form>
                </Card>
            </div>
        );
    }

    // Staff Form Config
    if (type === 'staff') {
        return (
             <div className="max-w-4xl mx-auto pt-10 animate-fade-in">
                <Card>
                    <h2 className="text-3xl font-bold text-purple-500 mb-2">Staff Application</h2>
                    <p className="text-gray-400 mb-6">Help manage and protect the community.</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-6">
                            <Input label="Age (IRL)" name="age" type="number" onChange={handleChange} />
                            <Input label="Weekly Hours" name="hours" onChange={handleChange} />
                         </div>
                         <TextArea label="Previous Experience" name="experience" onChange={handleChange} />
                         <TextArea label="Define: FailRP, VDM, RDM, Powergaming, Metagaming" name="definitions" onChange={handleChange} />
                         <TextArea label="Scenario: 2 players argue in OOC. What do you do?" name="scenarios" onChange={handleChange} />
                         <TextArea label="Why staff and not just a player?" name="whyStaff" onChange={handleChange} />
                         
                         <div className="space-y-2 border-t border-gray-700 pt-4">
                             <p className="text-gray-400 text-sm">By submitting, you agree:</p>
                             <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" required /> I agree staff is responsibility, not clout.</label>
                             <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" required /> I will stay unbiased & fair.</label>
                             <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" required /> I accept instant removal if abusing powers.</label>
                         </div>

                         <AnimatedButton type="submit" className="w-full bg-purple-600">{loading ? "Submitting..." : "Submit Application"}</AnimatedButton>
                    </form>
                </Card>
            </div>
        );
    }

    return null;
};

// Helper Components for consistent styling
const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" required />
    </div>
);
const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-cyan-300 mb-1">{label}</label>
        <textarea {...props} rows="4" className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" required />
    </div>
);

export default DepartmentApp;