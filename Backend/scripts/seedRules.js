/**
 * seedRules.js - Comprehensive Server Rules Knowledge Dump
 * 
 * High-precision embedding of all server rules into Pinecone
 * for AI-powered plagiarism and rule violation detection.
 * 
 * Run: node scripts/seedRules.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');

// Target index
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'ls-reborn-rules';

// ============================================================================
// COMPREHENSIVE SERVER RULES DATA
// ============================================================================

const serverRules = [
    // --- SECTION 1: GENERAL CONDUCT ---
    'Respect Others: All players, admins, and moderators must be treated with respect, whether IC or OOC. No hate speech, bullying, or derogatory language.',
    'No Toxic Behavior: Toxic actions such as trolling, spamming chats, or creating unnecessary drama are strictly prohibited.',
    'Follow Admin Instructions: Admins are responsible for order. Follow their instructions immediately. Do not argue in chat; use proper appeal processes.',

    // --- SECTION 2: ROLEPLAY CORE ---
    'Stay In Character (IC): Players must remain in character at all times unless in designated OOC areas. Breaking character disrupts immersion.',
    'Fear Roleplay (FearRP): Players must react realistically to threats. If held at gunpoint, you must comply instead of escaping or fighting back.',
    'New Life Rule (NLR): If you die, you lose all memory of events leading to death. You cannot return to the scene or seek revenge.',
    'Consent in Sensitive Scenarios: Torture or abuse RP requires prior consent from all parties involved.',
    'No Low-Effort RP: Lazy, uncreative, or immersion-breaking actions will result in penalties.',
    'Character Boundaries: Players must create realistic backstories. No overpowered or immersion-breaking personas.',
    'Character Mixing: Using information from one character to benefit another (e.g., PD char helping Gang char) is not allowed.',

    // --- SECTION 3: META & POWERGAMING ---
    'No Metagaming: Cannot use OOC knowledge (Discord, Streams) for IC decisions. Characters only know what they learn In-Game.',
    'No Stream Sniping: Watching live streams to gain IC information is strictly prohibited.',
    'No Powergaming: No unrealistic actions (e.g., surviving multiple gunshots without medical treatment).',
    'Force Permadeath: You cannot force another player to take permanent death. The decision lies solely with the player controlling the character.',
    'Force NLR: You cannot force another player to respawn by creating a situation that makes it unavoidable.',

    // --- SECTION 4: COMBAT & PVP ---
    'Random Deathmatch (RDM): Attacking or killing without valid IC reasoning is prohibited. Every conflict needs RP buildup.',
    'Vehicle Deathmatch (VDM): Using vehicles to harm/kill without proper IC justification is forbidden.',
    'No Combat Logging: Cannot disconnect during active RP (chase, robbery). This disrupts the scenario and results in penalties.',
    'No AFK During RP: Going inactive during scenarios disrupts experience and is prohibited.',
    'No Valeting During Active Situations: Players are not allowed to valet vehicles during ongoing scenarios.',

    // --- SECTION 5: CRIMINAL RULES (SPECIFIC LIMITS) ---
    'Realistic Crime: Crimes like robbing a bank alone or without preparation are not allowed.',
    'Hostage Rules: Hostages must be treated fairly. No "Friendly Hostages" (using friends/gang members). Hostages must be real players.',
    'Water Dumping: Intentionally driving vehicles into water/ocean to evade police is not allowed. Breaks immersion.',

    // -- CRIME LIMITS & REQUIREMENTS --
    'Store Robbery: Max 5 players. Must be done in PD presence.',
    'Vehicle Heist: Max 2 players. Must be done in PD presence.',
    'House Robbery: Max 5 players. Can be done WITHOUT PD presence.',
    'Oxy Run: Max 2 players. Can be done WITHOUT PD presence.',
    'Warehouse Heist: Max 5 players. PD Presence REQUIRED. Must end in Code Red (shootout). Cooldown: 3 Days for the same group.',
    'ATM Robbery: Max 5 players. PD Must be present.',
    'Fleeca Bank Heist: Max 5 players. PD Must be present.',
    'Big Bank Heist: Max 5 players. PD Must be present. Must end in Code Red.',

    // --- SECTION 6: GANGS & GROUP PROGRESSION ---
    'Group to Gang Progression: All orgs start as Groups. Must complete tasks/influence to become a Gang. Admins decide promotion.',
    'Group Formation: At least 5 active members. Must have a legal/illegal business cover. Must have unique identity/outfit.',
    'Gang Privileges: Territory control, High-risk crimes, Custom perks unlock only after Official Status.',

    // --- SECTION 7: GANG WARS & CONFLICT ---
    'Gang Wars: Only Leaders can initiate. Requires serious RP situation. At least 4 members from EACH gang must be online.',
    'Gang Hunts: Leader initiated only. 5-man rule applies.',
    'Turf Wars: Conflicts over territory. Losing gang MUST retreat from the area.',
    'Hood Wars: Smaller conflicts over local disputes. Cannot escalate to full war without RP buildup.',
    'Drive-By Rules: Allowed but requires RP buildup. No aimless shooting. Cannot be used as instant war initiation. Injured members must follow NLR.',
    'Revenge RP: Dying in war means you forget past events. No returning to fight.',

    // --- SECTION 8: POLICE (PD) & EMS ---
    'Respect Emergency Services: Do not interfere with duties unnecessarily.',
    'No Cop-Baiting: Provoking law enforcement unnecessarily (e.g., reckless driving near station) is prohibited.',
    'Arrest Compliance: Must roleplay sentences. No escaping handcuffs without tools.',
    'Vehicle Theft: PD vehicles can be stolen with lockpicks/RP. EMS vehicles CANNOT be stolen or lockpicked.',
    'PD Corruption: Strictly Prohibited. No bribes, abusing power, or aiding criminals unless pre-approved by High Command/Staff for a storyline.',

    // --- SECTION 9: VEHICLES & ECONOMY ---
    'Economy Exploits: Hoarding, duplicating, or exploiting money/items is strictly prohibited.',
    'Vehicle Transfer Policy: No transfers without valid RP and PD/DOJ involvement. Admins may request proof.',
    'EDM Vehicle Transfers: Non-transferable by default. Requirements: Permission from Staff, Vehicle 3+ months old, Valid IC reason, Proof of RP. One-time only.'
];

// ============================================================================
// EMBEDDING & UPSERT LOGIC
// ============================================================================

/**
 * Main seeding function
 */
async function seedRules() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        LS REBORN - SERVER RULES KNOWLEDGE DUMP             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Validate environment variables FIRST
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ ERROR: GEMINI_API_KEY is not set in your .env file');
        console.log('\n💡 Add this to your Backend/.env file:');
        console.log('   GEMINI_API_KEY=your_gemini_api_key_here');
        process.exit(1);
    }
    if (!process.env.PINECONE_API_KEY) {
        console.error('❌ ERROR: PINECONE_API_KEY is not set in your .env file');
        console.log('\n💡 Add this to your Backend/.env file:');
        console.log('   PINECONE_API_KEY=your_pinecone_api_key_here');
        console.log('   PINECONE_INDEX_NAME=ls-reborn-rules');
        process.exit(1);
    }

    // Initialize clients AFTER validation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });

    console.log(`📊 Total rules to embed: ${serverRules.length}`);
    console.log(`🎯 Target Pinecone index: ${INDEX_NAME}\n`);

    /**
     * Generate embedding for a single text using Gemini text-embedding-004
     */
    async function generateEmbedding(text) {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    try {
        // Get Pinecone index
        const index = pinecone.index(INDEX_NAME);
        console.log('✅ Connected to Pinecone index\n');

        // Process each rule
        const vectors = [];
        console.log('🔄 Generating embeddings...\n');

        for (let i = 0; i < serverRules.length; i++) {
            const rule = serverRules[i];
            const ruleId = `rule-${i}`;

            // Generate embedding
            const embedding = await generateEmbedding(rule);

            vectors.push({
                id: ruleId,
                values: embedding,
                metadata: {
                    text: rule,
                    index: i,
                    section: getSection(rule)
                }
            });

            // Progress indicator
            const progress = Math.round(((i + 1) / serverRules.length) * 100);
            process.stdout.write(`\r   Progress: [${'█'.repeat(Math.floor(progress / 5))}${'░'.repeat(20 - Math.floor(progress / 5))}] ${progress}% (${i + 1}/${serverRules.length})`);

            // Small delay to avoid rate limiting
            if ((i + 1) % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('\n\n🔄 Upserting vectors to Pinecone...');

        // Upsert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
            console.log(`   ✓ Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
        }

        // Get final stats
        const stats = await index.describeIndexStats();

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                    ✅ SEED COMPLETE                        ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`\n📊 Final Statistics:`);
        console.log(`   • Rules embedded: ${serverRules.length}`);
        console.log(`   • Total vectors in index: ${stats.totalRecordCount || 'N/A'}`);
        console.log(`   • Embedding model: text-embedding-004`);
        console.log(`   • Vector dimensions: 768`);
        console.log('\n🎉 Knowledge dump successful! AI can now detect rule violations.\n');

    } catch (error) {
        console.error('\n\n❌ ERROR during seeding:', error.message);

        if (error.message.includes('not found') || error.message.includes('index')) {
            console.log('\n💡 HINT: Make sure you have created a Pinecone index with:');
            console.log(`   • Name: ${INDEX_NAME}`);
            console.log('   • Dimensions: 768');
            console.log('   • Metric: cosine');
        }

        process.exit(1);
    }
}

/**
 * Helper to categorize rules by section
 */
function getSection(rule) {
    if (rule.includes('Respect') || rule.includes('Toxic') || rule.includes('Admin')) return 'General Conduct';
    if (rule.includes('Character') || rule.includes('FearRP') || rule.includes('NLR') || rule.includes('Consent') || rule.includes('Low-Effort')) return 'Roleplay Core';
    if (rule.includes('Meta') || rule.includes('Stream') || rule.includes('Power') || rule.includes('Force')) return 'Meta & Powergaming';
    if (rule.includes('RDM') || rule.includes('VDM') || rule.includes('Combat') || rule.includes('AFK') || rule.includes('Valet')) return 'Combat & PVP';
    if (rule.includes('Robbery') || rule.includes('Heist') || rule.includes('Hostage') || rule.includes('Water') || rule.includes('Oxy') || rule.includes('Crime')) return 'Criminal Rules';
    if (rule.includes('Gang') || rule.includes('Group') || rule.includes('Territory') || rule.includes('Hood') || rule.includes('Turf')) return 'Gangs & Groups';
    if (rule.includes('Drive-By') || rule.includes('Revenge') || rule.includes('War')) return 'Gang Conflicts';
    if (rule.includes('PD') || rule.includes('EMS') || rule.includes('Cop') || rule.includes('Arrest') || rule.includes('Emergency')) return 'PD & EMS';
    if (rule.includes('Economy') || rule.includes('Vehicle') || rule.includes('Transfer')) return 'Vehicles & Economy';
    return 'General';
}

// Run if called directly
if (require.main === module) {
    seedRules();
}

module.exports = { seedRules, serverRules };
