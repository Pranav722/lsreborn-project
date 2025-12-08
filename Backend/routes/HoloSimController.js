/**
 * HoloSimController.js - Roleplay Simulation Chat Endpoint
 * 
 * Uses Gemini 1.5 Flash for a terminal-style RP simulation
 * where applicants practice de-escalation skills.
 */

const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

// Initialize Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System instruction for the criminal NPC
const CRIMINAL_SYSTEM_INSTRUCTION = `You are a hostile criminal in Los Santos during a traffic stop. The user is a Police Department applicant being tested on their de-escalation and communication skills.

YOUR PERSONA:
- You are rude, uncooperative, and suspicious of police
- You refuse to show ID initially
- You make excuses, get defensive, and act nervous
- You test their patience and professionalism
- You may have warrants or be hiding something

RULES:
1. Keep responses SHORT (1-3 sentences max)
2. Stay in character as the criminal
3. Gradually become more cooperative ONLY if they are calm and professional
4. If they are aggressive or rude, escalate the situation
5. Never break character or mention you are an AI
6. Use street slang and informal language

SCENARIO: You've been pulled over at night on Grove Street. You were swerving slightly. You have an expired license but no warrants.`;

// Grading instruction
const GRADING_INSTRUCTION = `Based on the conversation above, grade the police applicant's performance.

CRITERIA:
1. Professionalism (0-25): Did they remain calm and professional?
2. De-escalation (0-25): Did they successfully calm the situation?
3. Communication (0-25): Were their commands clear and respectful?
4. Procedure (0-25): Did they follow proper traffic stop procedures?

Return ONLY a JSON object:
{
  "score": <total 0-100>,
  "professionalism": <0-25>,
  "deescalation": <0-25>,
  "communication": <0-25>,
  "procedure": <0-25>,
  "feedback": "<one sentence summary>"
}`;

// In-memory chat sessions (in production, use Redis or DB)
const chatSessions = new Map();

/**
 * POST /api/holosim/start
 * Initializes a new HoloSim chat session
 */
router.post('/start', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { scenario = 'traffic_stop' } = req.body;

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            message: 'HoloSim service is not configured.',
            error: 'SERVICE_NOT_CONFIGURED'
        });
    }

    try {
        // Initialize the model with system instruction
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.9, // Higher for more creative responses
                topP: 0.95,
                maxOutputTokens: 150, // Keep responses short
            }
        });

        // Start a new chat session
        const chat = model.startChat({
            history: [],
            systemInstruction: CRIMINAL_SYSTEM_INSTRUCTION
        });

        // Get initial NPC message
        const initialPrompt = "The officer just walked up to your car window. React.";
        const result = await chat.sendMessage(initialPrompt);
        const npcMessage = result.response.text();

        // Store session data
        chatSessions.set(userId, {
            chat,
            history: [
                { role: 'model', content: npcMessage }
            ],
            turnCount: 0,
            maxTurns: 5,
            isComplete: false,
            score: null,
            scenario
        });

        res.json({
            success: true,
            message: npcMessage,
            turnCount: 0,
            maxTurns: 5,
            isComplete: false
        });

    } catch (error) {
        console.error('HoloSim Start Error:', error);
        res.status(500).json({
            message: 'Failed to start simulation.',
            error: error.message
        });
    }
});

/**
 * POST /api/holosim/message
 * Send a message in the HoloSim chat
 */
router.post('/message', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            message: 'Message is required.',
            error: 'INVALID_INPUT'
        });
    }

    const session = chatSessions.get(userId);
    if (!session) {
        return res.status(400).json({
            message: 'No active session. Please start a new simulation.',
            error: 'NO_SESSION'
        });
    }

    if (session.isComplete) {
        return res.status(400).json({
            message: 'Simulation already complete.',
            error: 'SESSION_COMPLETE',
            score: session.score
        });
    }

    try {
        // Increment turn count
        session.turnCount++;
        session.history.push({ role: 'user', content: message });

        let npcResponse;
        let gradeResult = null;

        // Check if this is the final turn
        if (session.turnCount >= session.maxTurns) {
            // Get final NPC response
            const result = await session.chat.sendMessage(message);
            npcResponse = result.response.text();
            session.history.push({ role: 'model', content: npcResponse });

            // Now send grading request
            const gradePrompt = `${GRADING_INSTRUCTION}`;
            const gradeResponse = await session.chat.sendMessage(gradePrompt);
            const gradeText = gradeResponse.response.text();

            // Parse the grade
            try {
                let cleanedGrade = gradeText.trim();
                if (cleanedGrade.startsWith('```json')) {
                    cleanedGrade = cleanedGrade.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedGrade.startsWith('```')) {
                    cleanedGrade = cleanedGrade.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                gradeResult = JSON.parse(cleanedGrade);
            } catch (parseError) {
                console.error('Grade parse error:', gradeText);
                gradeResult = {
                    score: 50,
                    feedback: 'Unable to parse detailed grade.',
                    raw: gradeText
                };
            }

            // Mark session complete and save score
            session.isComplete = true;
            session.score = gradeResult;

        } else {
            // Normal turn - get NPC response
            const result = await session.chat.sendMessage(message);
            npcResponse = result.response.text();
            session.history.push({ role: 'model', content: npcResponse });
        }

        res.json({
            success: true,
            message: npcResponse,
            turnCount: session.turnCount,
            maxTurns: session.maxTurns,
            turnsRemaining: session.maxTurns - session.turnCount,
            isComplete: session.isComplete,
            grade: gradeResult
        });

    } catch (error) {
        console.error('HoloSim Message Error:', error);
        res.status(500).json({
            message: 'Failed to process message.',
            error: error.message
        });
    }
});

/**
 * GET /api/holosim/status
 * Get current session status
 */
router.get('/status', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    const session = chatSessions.get(userId);

    if (!session) {
        return res.json({
            hasSession: false,
            isComplete: false
        });
    }

    res.json({
        hasSession: true,
        turnCount: session.turnCount,
        maxTurns: session.maxTurns,
        isComplete: session.isComplete,
        score: session.score,
        history: session.history
    });
});

/**
 * POST /api/holosim/reset
 * Reset/clear the current session
 */
router.post('/reset', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    chatSessions.delete(userId);

    res.json({
        success: true,
        message: 'Session reset successfully.'
    });
});

module.exports = router;
