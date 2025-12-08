require('dotenv').config({ path: './backend/.env' }); // Make sure it finds your .env
const { Pinecone } = require('@pinecone-database/pinecone');

async function checkStats() {
    try {
        console.log("1. Connecting to Pinecone...");
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        
        console.log(`2. Targeting Index: ${process.env.PINECONE_INDEX_NAME}`);
        const index = pc.index(process.env.PINECONE_INDEX_NAME);

        console.log("3. Fetching Stats...");
        const stats = await index.describeIndexStats();

        console.log("\n===========================");
        console.log("   PINECONE HEALTH CHECK   ");
        console.log("===========================");
        console.log("Total Records:", stats.totalRecordCount);
        console.log("Namespaces:", stats.namespaces);
        console.log("Dimensions:", stats.dimension); // Should be 768
        console.log("===========================\n");

        if (stats.totalRecordCount > 0) {
            console.log("✅ SUCCESS: Data is present. The Dashboard is just lagging.");
        } else {
            console.log("❌ FAILURE: Database is truly empty. The upload script failed.");
        }

    } catch (error) {
        console.error("❌ CONNECTION ERROR:", error.message);
        console.error("Check your API Key and Index Name in backend/.env");
    }
}

checkStats();