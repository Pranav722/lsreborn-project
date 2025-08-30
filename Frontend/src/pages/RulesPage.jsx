import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { Search } from 'lucide-react';

const RulesPage = () => {
    const rulesData = {
        "General RP": ["Do not RDM (Random Death Match).", "Do not VDM (Vehicle Death Match).", "Stay in character at all times.", "Value your life (NVL - No Value of Life).", "Metagaming (using out-of-character information in-character) is strictly prohibited.", "Powergaming (forcing actions on others without giving them a chance to react) is not allowed."],
        "Discord Rules": ["Be respectful to all members.", "No spamming or self-promotion.", "Follow Discord's Terms of Service.", "Do not post NSFW content in non-designated channels."],
        "Community Guidelines": ["No hate speech, racism, sexism, or any form of discrimination.", "Do not exploit bugs or glitches; report them to staff immediately.", "Staff decisions are final. Arguing with staff in public channels is not permitted.", "Do not impersonate staff members or other players."]
    };
    const [searchTerm, setSearchTerm] = useState('');
    const filteredRules = useMemo(() => {
        if (!searchTerm) return rulesData;
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = {};
        for (const category in rulesData) {
            const matchingRules = rulesData[category].filter(rule => rule.toLowerCase().includes(lowercasedFilter));
            if (matchingRules.length > 0) filtered[category] = matchingRules;
        }
        return filtered;
    }, [searchTerm, rulesData]);

    return (
        <div className="animate-fade-in">
            <Card>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Server Rules</h2>
                <div className="relative mb-8">
                    <input type="text" placeholder="Search rules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-lg px-4 py-3 pl-12 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/70" />
                </div>
                <div className="space-y-8">
                    {Object.keys(filteredRules).length > 0 ? Object.entries(filteredRules).map(([category, rules]) => (
                        <div key={category}>
                            <h3 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-4">{category}</h3>
                            <ul className="space-y-3 list-disc list-inside text-gray-300">{rules.map((rule, index) => <li key={index} className="transition-colors hover:text-white">{rule}</li>)}</ul>
                        </div>
                    )) : <p className="text-center text-gray-400 py-8">No rules found matching your search.</p>}
                </div>
            </Card>
        </div>
    );
};
export default RulesPage;