import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Book } from 'lucide-react';

const rulesContent = [
    {
        title: "1. General Conduct Rules",
        content: [
            { subtitle: "Respect Others", text: "All players, admins, and moderators must be treated with respect, whether in-character (IC) or out-of-character (OOC). Any form of hate speech, bullying, or derogatory language will not be tolerated." },
            { subtitle: "No Toxic Behavior", text: "Toxic actions such as trolling, spamming chats, or creating unnecessary drama are strictly prohibited, as they ruin the roleplay experience for others." },
            { subtitle: "Follow Admin Instructions", text: "Admins are responsible for maintaining order and resolving disputes. Follow their instructions and respect their decisions to ensure smooth gameplay." }
        ]
    },
    {
        title: "2. Roleplay Rules",
        content: [
            { subtitle: "Stay In Character (IC)", text: "Players must remain in character at all times unless they are in designated OOC areas. Breaking character disrupts immersion and affects roleplay quality." },
            { subtitle: "Fear Roleplay (FearRP)", text: "Players must react realistically to threats. For example, if your character is held at gunpoint, they should comply instead of making unrealistic attempts to escape or fight back." },
            { subtitle: "New Life Rule (NLR)", text: "If your character dies, they lose all memory of the events leading up to their death. You cannot return to the scene of your death or seek revenge." },
            { subtitle: "Consent in Sensitive Scenarios", text: "Sensitive roleplay situations such as torture or abuse require prior consent from all parties involved to avoid discomfort." }
        ]
    },
    {
        title: "3. Metagaming & Powergaming",
        content: [
            { subtitle: "No Metagaming", text: "Players cannot use OOC knowledge (such as Discord conversations, live streams, or forum posts) to influence IC decisions. Your character should only act on information they have learned IC." },
            { subtitle: "No Powergaming", text: "Unrealistic or overpowered actions are strictly forbidden. For example, claiming that your character can survive multiple gunshots without medical treatment is not allowed." },
            { subtitle: "No Exploiting Mechanics", text: "Abusing game bugs, glitches, or loopholes to gain an unfair advantage is considered cheating and will lead to severe consequences." }
        ]
    },
    {
        title: "4. Combat & PvP Rules",
        content: [
            { subtitle: "Random Deathmatch (RDM)", text: "Attacking or killing other players without valid IC reasoning is prohibited. Every conflict must have a proper roleplay buildup." },
            { subtitle: "Vehicle Deathmatch (VDM)", text: "Using vehicles to harm or kill others without proper IC justification is forbidden, as it disrupts roleplay." },
            { subtitle: "No Combat Logging", text: "Players cannot disconnect from the server during active roleplay, such as during a police chase or robbery. Combat logging disrupts the scenario for others and will result in penalties." },
            { subtitle: "Force NLR", text: "You cannot force another player to respawn by creating a situation that makes it unavoidable. If you initiate a situation, you must be prepared to face the consequences." },
            { subtitle: "Force Permadeath", text: "Players cannot force another player to take permanent death (permadeath). The decision of permadeath lies solely with the player controlling the character." }
        ]
    },
    {
        title: "5. Communication Rules",
        content: [
            { subtitle: "IC Communication Only", text: "All in-character communication should be done through in-game methods such as radios, phones, and chat. Using external platforms like Discord for IC communication is not allowed unless explicitly permitted by the server." },
            { subtitle: "No OOC in IC", text: "Players must avoid referencing game mechanics or real-world knowledge in IC conversations. For example, saying 'Press E to open the door' in IC chat breaks immersion." },
            { subtitle: "Language Rules", text: "Players must use the server's designated language for IC interactions to ensure that everyone can understand and participate effectively." }
        ]
    },
    {
        title: "6. Crime & Gang Rules",
        content: [
            { subtitle: "Realistic Crime", text: "All criminal activities must be realistic and fit the roleplay setting. Crimes like robbing a bank alone or committing a major crime without preparation are not allowed." },
            { subtitle: "Hostage Situations", text: "Hostages must be treated fairly, and demands should be realistic. Both parties must have an opportunity to roleplay meaningfully in hostage scenarios." },
            { subtitle: "No Friendly Hostages", text: "Players cannot use friends or gang members as hostages in any situation. Hostages must be genuine victims, and situations should not be staged." },
            { subtitle: "No Vehicle Dumping", text: "Intentionally driving or dumping vehicles into water or the ocean to evade police during a chase is not allowed." }
        ]
    },
    {
        title: "Crime Limitations",
        content: [
            { subtitle: "Store Robbery", text: "Max 5 players. Must be done in PD presence." },
            { subtitle: "Vehicle Heist", text: "Max 2 players. Must be done in PD presence." },
            { subtitle: "House Robbery", text: "Max 5 players. Can be done without PD presence." },
            { subtitle: "Oxy Run", text: "Max 2 players. Can be done without PD presence." },
            { subtitle: "Warehouse Heist", text: "Max 5 players. Must be done in PD presence and end in Code Red. (Cooldown of 3 days)" },
            { subtitle: "ATM Robbery", text: "Max 5 players. PD must be present." },
            { subtitle: "Fleeca Bank Heist", text: "Max 5 players. PD must be present." },
            { subtitle: "Big Bank Heist", text: "Max 5 players. PD must be present, and the situation must end in Code Red." }
        ]
    },
    {
        title: "7. Police & EMS Rules",
        content: [
            { subtitle: "Respect Emergency Services", text: "Police and EMS players must be allowed to perform their duties without unnecessary interference." },
            { subtitle: "No Cop-Baiting", text: "Players cannot provoke law enforcement unnecessarily, such as driving recklessly near police stations just to trigger a chase." },
            { subtitle: "Follow Arrest Roleplay", text: "If arrested, players must comply with the roleplay process. Resisting arrest unrealistically is not allowed." },
            { subtitle: "Vehicle Theft", text: "PD vehicles can be lockpicked/stolen. EMS vehicles CANNOT be stolen." },
            { subtitle: "PD Corruption", text: "Strictly prohibited. Officers may not engage in corrupt activities. Any attempt will result in disciplinary action." }
        ]
    },
    {
        title: "8. Property & Economy Rules",
        content: [
            { subtitle: "Property Ownership", text: "Players can only use houses, businesses, or vehicles that their character legally owns or has access to IC." },
            { subtitle: "No Economy Exploits", text: "Hoarding, duplicating, or exploiting money, items, or resources is strictly prohibited." },
            { subtitle: "Marketplace Trading", text: "Players must follow server rules when trading items or properties. All trades must be fair and agreed upon IC." }
        ]
    },
    {
        title: "9. Reporting & Admin Rules",
        content: [
            { subtitle: "Report Violations Properly", text: "All rule violations should be reported through designated channels (e.g., Discord tickets). Do not spam OOC chat." },
            { subtitle: "Respect Admin Decisions", text: "Admins have the final say in disputes. If you disagree with a decision, follow the proper appeal process instead of arguing in chat." }
        ]
    },
    {
        title: "10. Miscellaneous Rules",
        content: [
            { subtitle: "No Stream Sniping", text: "Players cannot watch live streams of others to gain IC information or an unfair advantage." },
            { subtitle: "No AFK During RP", text: "Going inactive during active roleplay scenarios disrupts the experience for others and is prohibited." },
            { subtitle: "Character Boundaries", text: "Players must create realistic character backstories and motivations. Avoid overpowered or immersion-breaking personas." },
            { subtitle: "Character Mixing", text: "Using information from one character to benefit another is not allowed." },
            { subtitle: "No Low-Effort RP", text: "Players must engage in meaningful roleplay. Lazy, uncreative, or immersion-breaking actions will result in penalties." },
            { subtitle: "No Valeting During Active Situations", text: "Players are not allowed to valet their vehicles during ongoing roleplay scenarios." }
        ]
    },
    {
        title: "11. Vehicle Transfer Policy",
        content: [
            { subtitle: "No Transfers Without RP", text: "Players are strictly prohibited from transferring vehicles without valid, in-character roleplay (RP). PD/DOJ must be involved." },
            { subtitle: "EDM Vehicle Restrictions", text: "EDM vehicles are non-transferable by default. Transfer requires staff permission, 3 months ownership, and valid RP reason." }
        ]
    },
    {
        title: "Groups & Gang RP",
        content: [
            { subtitle: "Group to Gang Progression", text: "All criminal organizations start as a group. Must complete tasks to become a gang." },
            { subtitle: "Group Formation", text: "Must have 5+ active members, a business cover, unique identity, and follow RP laws." },
            { subtitle: "Gang Privileges", text: "Unlock territory control, high-risk crimes, alliances, and custom perks." },
            { subtitle: "Crimes", text: "Access to House Robbery, Oxy Run, Warehouse Heist, ATM Robbery, Bank Heists, Kidnapping." }
        ]
    },
    {
        title: "Gang War & Conflict",
        content: [
            { subtitle: "Gang Wars", text: "Only leader can initiate. Requires serious RP and 4+ members online." },
            { subtitle: "Gang Hunts", text: "Leader initiates. Between two gangs. 5-man rule applies." },
            { subtitle: "Turf Wars", text: "Conflicts over territory. Requires RP escalation." },
            { subtitle: "Hood Wars", text: "Smaller scale local disputes." },
            { subtitle: "Drive-by Rules", text: "Allowed with RP buildup. Cannot be instant war initiation." },
            { subtitle: "NLR & Revenge RP", text: "NLR applies after death in war. No revenge RP." }
        ]
    }
];

const RulesPage = () => {
    const [currentPage, setCurrentPage] = useState(0);

    const nextPage = () => {
        if (currentPage < rulesContent.length - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-10 px-4 perspective-1000">
            <div className="relative w-full max-w-4xl aspect-[3/2] bg-gray-900 rounded-lg shadow-2xl flex overflow-hidden border-4 border-yellow-900/50">
                {/* Book Cover / Background */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>

                {/* Left Page (Previous or Cover) */}
                <div className="w-1/2 h-full bg-[#fdfbf7] p-8 border-r border-gray-300 shadow-inner relative flex flex-col">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-50 pointer-events-none"></div>

                    {currentPage > 0 ? (
                        <motion.div
                            key={currentPage - 1}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="relative z-10 h-full overflow-y-auto custom-scrollbar"
                        >
                            <h2 className="text-2xl font-bold text-yellow-900 mb-6 font-serif border-b-2 border-yellow-900/20 pb-2">
                                {rulesContent[currentPage - 1].title}
                            </h2>
                            <div className="space-y-4">
                                {rulesContent[currentPage - 1].content.map((item, idx) => (
                                    <div key={idx}>
                                        <h3 className="font-bold text-gray-800 text-lg font-serif">{item.subtitle}</h3>
                                        <p className="text-gray-700 text-sm leading-relaxed font-serif">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full text-center text-gray-400 text-xs font-serif py-4">
                                Page {currentPage}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full relative z-10">
                            <Book size={64} className="text-yellow-900 mb-4" />
                            <h1 className="text-4xl font-bold text-yellow-900 font-serif text-center">Official Rulebook</h1>
                            <p className="text-gray-600 mt-4 font-serif italic">LS Reborn Roleplay</p>
                        </div>
                    )}
                </div>

                {/* Right Page (Current) */}
                <div className="w-1/2 h-full bg-[#fdfbf7] p-8 shadow-inner relative flex flex-col">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-50 pointer-events-none"></div>

                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative z-10 h-full overflow-y-auto custom-scrollbar"
                    >
                        <h2 className="text-2xl font-bold text-yellow-900 mb-6 font-serif border-b-2 border-yellow-900/20 pb-2">
                            {rulesContent[currentPage].title}
                        </h2>
                        <div className="space-y-4">
                            {rulesContent[currentPage].content.map((item, idx) => (
                                <div key={idx}>
                                    <h3 className="font-bold text-gray-800 text-lg font-serif">{item.subtitle}</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed font-serif">{item.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full text-center text-gray-400 text-xs font-serif py-4">
                            Page {currentPage + 1}
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-yellow-900/80 text-white hover:bg-yellow-800 transition-colors z-20 ${currentPage === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextPage}
                    disabled={currentPage === rulesContent.length - 1}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-yellow-900/80 text-white hover:bg-yellow-800 transition-colors z-20 ${currentPage === rulesContent.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ChevronRight size={24} />
                </button>

                {/* Spine Effect */}
                <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 z-20 shadow-xl opacity-50 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default RulesPage;