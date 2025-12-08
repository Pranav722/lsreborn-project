/**
 * VectorStore.js - Pinecone + Gemini Embeddings Integration
 * 
 * Uses Google Gemini's text-embedding-004 model for vector generation
 * and Pinecone's free tier for vector storage and similarity search.
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

// Configuration
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'ls-reborn-rules';
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768; // text-embedding-004 output dimensions

/**
 * Get the Pinecone index instance
 * @returns {Object} Pinecone index
 */
function getIndex() {
    return pinecone.index(PINECONE_INDEX_NAME);
}

/**
 * Generate embeddings for text using Gemini's text-embedding-004 model
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} The embedding vector
 */
async function generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input for embedding generation');
    }

    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
            throw new Error(`Unexpected embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
        }

        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

/**
 * Upsert vectors to Pinecone index
 * @param {Array<{id: string, text: string, metadata?: Object}>} documents - Documents to upsert
 * @returns {Promise<Object>} Upsert result
 */
async function upsertVectors(documents) {
    const index = getIndex();

    const vectors = await Promise.all(
        documents.map(async (doc) => {
            const embedding = await generateEmbedding(doc.text);
            return {
                id: doc.id,
                values: embedding,
                metadata: {
                    text: doc.text.substring(0, 1000), // Store truncated text for reference
                    ...doc.metadata
                }
            };
        })
    );

    // Upsert in batches of 100 (Pinecone free tier limit)
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        const result = await index.upsert(batch);
        results.push(result);
    }

    return {
        upsertedCount: vectors.length,
        results
    };
}

/**
 * Query Pinecone for similar vectors
 * @param {string} text - Query text
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Matching results with scores
 */
async function querySimilar(text, topK = 5) {
    const index = getIndex();
    const queryEmbedding = await generateEmbedding(text);

    const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
    });

    return results.matches || [];
}

/**
 * Check if text is plagiarized from server rules
 * @param {string} text - Text to check
 * @param {number} threshold - Similarity threshold (0-1), default 0.85
 * @returns {Promise<{isPlagiarized: boolean, maxScore: number, matches: Array}>}
 */
async function checkPlagiarism(text, threshold = 0.85) {
    try {
        // Query for similar content
        const matches = await querySimilar(text, 3);

        if (!matches || matches.length === 0) {
            return {
                isPlagiarized: false,
                maxScore: 0,
                matches: []
            };
        }

        const maxScore = Math.max(...matches.map(m => m.score || 0));
        const highScoreMatches = matches.filter(m => (m.score || 0) >= threshold);

        return {
            isPlagiarized: maxScore >= threshold,
            maxScore: Math.round(maxScore * 100) / 100,
            matches: highScoreMatches.map(m => ({
                score: Math.round((m.score || 0) * 100) / 100,
                matchedText: m.metadata?.text?.substring(0, 200) || 'Unknown',
                ruleId: m.id
            }))
        };
    } catch (error) {
        console.error('Error checking plagiarism:', error);
        // Return safe default on error to not block applications
        return {
            isPlagiarized: false,
            maxScore: 0,
            matches: [],
            error: error.message
        };
    }
}

/**
 * Delete all vectors in the index (useful for re-ingestion)
 */
async function clearIndex() {
    const index = getIndex();
    await index.deleteAll();
    return { success: true, message: 'Index cleared' };
}

/**
 * Get index statistics
 */
async function getIndexStats() {
    const index = getIndex();
    const stats = await index.describeIndexStats();
    return stats;
}

module.exports = {
    generateEmbedding,
    upsertVectors,
    querySimilar,
    checkPlagiarism,
    clearIndex,
    getIndexStats,
    EMBEDDING_DIMENSIONS,
    PINECONE_INDEX_NAME
};
