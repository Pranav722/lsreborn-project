/**
 * ingestRules.js - Server Rules Ingestion Script
 * 
 * This script extracts text from the server rules and uploads
 * them as vector embeddings to Pinecone for plagiarism detection.
 * 
 * Run: node scripts/ingestRules.js
 */

require('dotenv').config();
const { upsertVectors, getIndexStats, clearIndex } = require('../VectorStore');

// Server rules extracted from RulesPage.jsx
// These are the text content that applications should NOT be copying
const RULES_DATA = [
    // Sheet 1 - Conduct
    {
        id: 'conduct-respect',
        category: 'Conduct',
        title: 'Respect & Community',
        content: 'Respect is the foundation of this city. Hate speech, OOC toxicity, and bullying result in immediate expulsion. We are here to build stories together, not destroy them.'
    },
    {
        id: 'conduct-microphone',
        category: 'Conduct',
        title: 'Microphone Mandatory',
        content: 'A high-quality microphone is required for all players. Text RP is disabled unless you have an approved Medical Mute application.'
    },
    {
        id: 'conduct-impersonation',
        category: 'Conduct',
        title: 'Staff Impersonation',
        content: 'Claiming to be Admin/Staff In-Character to threaten others is a permanent ban offense. Report issues via proper channels.'
    },

    // Sheet 2 - Integrity
    {
        id: 'integrity-fearrp',
        category: 'Integrity',
        title: 'Fear Roleplay (FearRP)',
        content: 'Value your life. If a gun is pointed at you, you are scared and compliant. Ignoring death threats to win a scenario is poor RP.'
    },
    {
        id: 'integrity-nlr',
        category: 'Integrity',
        title: 'New Life Rule (NLR)',
        content: 'If you are downed and respawn at the hospital, you forget the events leading to your death. You cannot return to the scene or seek revenge.'
    },
    {
        id: 'integrity-metagaming',
        category: 'Integrity',
        title: 'Metagaming',
        content: 'Using external info (Discord, Twitch) for In-Character gain is strictly banned. Your character only knows what they see and hear.'
    },
    {
        id: 'integrity-powergaming',
        category: 'Integrity',
        title: 'Powergaming',
        content: 'Forcing an outcome on another player without allowing them a chance to resist (e.g. /me knocks him out) is prohibited.'
    },

    // Sheet 2 Back - Combat
    {
        id: 'combat-rdm',
        category: 'Combat',
        title: 'RDM (Random Death Match)',
        content: 'Attacking or killing without valid RP reason and interaction is forbidden. Because I can is not a valid reason.'
    },
    {
        id: 'combat-vdm',
        category: 'Combat',
        title: 'VDM (Vehicle Death Match)',
        content: 'Using vehicles as weapons to ram or kill players without substantial RP justification is a violation.'
    },
    {
        id: 'combat-logging',
        category: 'Combat',
        title: 'Combat Logging',
        content: 'Disconnecting during an active scenario (chase, arrest, shootout) to avoid consequences triggers an automated ban.'
    },
    {
        id: 'combat-safezones',
        category: 'Combat',
        title: 'Safe Zones',
        content: 'Hospitals, Police Stations, City Hall, and Spawn Points. No violence, kidnapping, or criminal activity allowed.'
    },

    // Sheet 3 - Criminal
    {
        id: 'criminal-hostage',
        category: 'Criminal',
        title: 'Hostage Rules',
        content: 'Fake hostages (friends) are banned. You cannot execute a compliant hostage without massive escalation and negotiation.'
    },
    {
        id: 'criminal-waterdump',
        category: 'Criminal',
        title: 'Water Dumping',
        content: 'Intentionally driving vehicles into the ocean to evade police is Win Mentality and strictly prohibited.'
    },

    // Sheet 3 Back - Gangs
    {
        id: 'gangs-progression',
        category: 'Gangs',
        title: 'Progression System',
        content: 'All orgs start as Groups. Admin approval is required for official Gang status. Tasks, influence, and story quality determine promotion.'
    },
    {
        id: 'gangs-wars',
        category: 'Gangs',
        title: 'Gang Wars',
        content: 'Requires Leader initiation and 4+ members online per side. Losing a turf war mandates a full retreat from the zone for the duration.'
    },
    {
        id: 'gangs-driveby',
        category: 'Gangs',
        title: 'Drive-By Protocol',
        content: 'Requires RP buildup. No aimless shooting. Cannot be used to instant-initiate war.'
    },

    // Sheet 4 - Legal & Misc
    {
        id: 'legal-emergency',
        category: 'Legal & Misc',
        title: 'Emergency Vehicles',
        content: 'Stealing EMS vehicles is Zero Tolerance. PD cars can be stolen only with high-tier tools and valid RP reasons.'
    },
    {
        id: 'legal-corruption',
        category: 'Legal & Misc',
        title: 'Corruption',
        content: 'PD Corruption is prohibited unless explicitly approved by High Command for a specific story arc.'
    },
    {
        id: 'legal-exploits',
        category: 'Legal & Misc',
        title: 'Economy Exploits',
        content: 'Duplicating items or abusing bugs must be reported immediately. Usage results in a wipe/ban.'
    },

    // Additional context rules (common phrases people might copy)
    {
        id: 'context-roleplay-server',
        category: 'Context',
        title: 'LS Reborn Description',
        content: 'LS Reborn is a GTA V Roleplay server set in Los Santos. Players create characters and live out stories in the city, following strict roleplay guidelines.'
    },
    {
        id: 'context-value-life',
        category: 'Context',
        title: 'Value Your Life',
        content: 'In roleplay, you must value your characters life as if it were your own. This means complying with threats, avoiding unnecessary risks, and making realistic decisions.'
    },
    {
        id: 'context-character-separation',
        category: 'Context',
        title: 'IC/OOC Separation',
        content: 'Always maintain separation between In-Character and Out-Of-Character. What you know as a player should not influence your characters actions unless they learned it in-game.'
    }
];

async function ingestRules() {
    console.log('🚀 Starting LS Reborn Rules Ingestion...\n');

    // Check environment variables
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is not set in environment variables');
        process.exit(1);
    }
    if (!process.env.PINECONE_API_KEY) {
        console.error('❌ PINECONE_API_KEY is not set in environment variables');
        process.exit(1);
    }

    try {
        // Get current stats
        console.log('📊 Checking current index status...');
        const statsBefore = await getIndexStats();
        console.log(`   Current vectors in index: ${statsBefore.totalRecordCount || 0}\n`);

        // Prepare documents for upsert
        const documents = RULES_DATA.map(rule => ({
            id: rule.id,
            text: `${rule.title}: ${rule.content}`,
            metadata: {
                category: rule.category,
                title: rule.title,
                originalContent: rule.content
            }
        }));

        console.log(`📝 Preparing ${documents.length} rules for embedding...\n`);

        // Upsert vectors
        console.log('⬆️  Upserting vectors to Pinecone...');
        const result = await upsertVectors(documents);
        console.log(`   ✅ Successfully upserted ${result.upsertedCount} vectors\n`);

        // Get updated stats
        console.log('📊 Fetching updated index stats...');
        const statsAfter = await getIndexStats();
        console.log(`   Vectors in index: ${statsAfter.totalRecordCount || 0}\n`);

        console.log('✨ Rules ingestion complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Total rules ingested: ${RULES_DATA.length}`);
        console.log(`   Categories covered: ${[...new Set(RULES_DATA.map(r => r.category))].join(', ')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error during ingestion:', error.message);
        if (error.message.includes('not found') || error.message.includes('index')) {
            console.log('\n💡 Hint: Make sure you have created a Pinecone index named "lsreborn-rules"');
            console.log('   with dimension 768 and cosine metric in your Pinecone dashboard.');
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    ingestRules();
}

module.exports = { ingestRules, RULES_DATA };
