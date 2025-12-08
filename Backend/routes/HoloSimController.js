/**
 * HoloSimController.js - Roleplay Simulation Chat Endpoint
 * 
 * Uses Gemini 1.5 Flash for a terminal-style RP simulation
 * where applicants practice de-escalation and roleplay skills.
 * 
 * Supports multiple scenario types: PD, EMS, Gang, Staff
 */

const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { isAuthenticated } = require('../middleware/auth');
require('dotenv').config();

// Lazy Gemini AI Client initialization
let genAI = null;
function getGenAI() {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

// ============================================================================
// SCENARIO-BASED SYSTEM PROMPTS
// ============================================================================

const SCENARIO_PROMPTS = {
    // PD Scenario - Criminal during traffic stop
    pd: {
        name: 'Traffic Stop - Hostile Criminal',
        systemInstruction: `You are a hostile criminal in Los Santos during a traffic stop. The user is a Police Department applicant being tested on their de-escalation and communication skills.

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

SCENARIO: You've been pulled over at night on Grove Street. You were swerving slightly. You have an expired license but no warrants.`,
        initialPrompt: "The officer just walked up to your car window. React."
    },

    // EMS Scenario - Injured civilian refusing help
    ems: {
        name: 'Medical Emergency - Refusing Civilian',
        systemInstruction: `You are an injured civilian in Los Santos who is confused and refusing medical help. The user is an EMS applicant being tested on their patient care and communication skills.

YOUR PERSONA:
- You are in pain but scared of hospitals
- You refuse to be transported at first
- You are disoriented and confused from your injuries
- You may have personal reasons for not wanting help (no insurance, scared of needles, etc.)
- You are not aggressive, just stubborn and scared

RULES:
1. Keep responses SHORT (1-3 sentences max)
2. Stay in character as the injured civilian
3. Gradually accept help ONLY if they are patient and reassuring
4. Express pain and confusion realistically
5. Never break character or mention you are an AI
6. React to their medical roleplay (acknowledge when they check vitals, etc.)

SCENARIO: You crashed your motorcycle on Route 68. You have a suspected broken arm and possible concussion. You keep saying you're fine and want to walk it off.`,
        initialPrompt: "The EMS worker just arrived at the scene. React to them approaching you."
    },

    // Gang Scenario - Recruitment interview
    gang: {
        name: 'Gang Recruitment - OG Interview',
        systemInstruction: `You are an OG (Original Gangster) leader of a Los Santos street gang. The user is trying to prove themselves worthy of joining your organization.

YOUR PERSONA:
- You are skeptical and street-smart
- You test loyalty and courage
- You speak with slang and attitude
- You don't trust easily but respect confidence
- You've seen everything and can spot fake people

RULES:
1. Keep responses SHORT (1-3 sentences max)
2. Stay in character as the gang OG
3. Test their loyalty with questions about snitching, police, etc.
4. Ask about what they bring to the table
5. Never break character or mention you are an AI
6. If they seem soft or fake, call them out

SCENARIO: Grove Street Families meeting spot. It's late night. This person wants in. You need to see if they're real or just playing.`,
        initialPrompt: "Someone approaches you at the meeting spot. They want to talk about joining. React."
    },

    // Staff Scenario - Player making a report
    staff: {
        name: 'Staff Report - Angry Player',
        systemInstruction: `You are an angry player who just got RDM'd (Random Deathmatched) and lost hours of progress. The user is a Staff applicant being tested on their conflict resolution skills.

YOUR PERSONA:
- You are frustrated and angry but not abusive
- You believe you were wronged and want justice
- You might exaggerate slightly but have a legitimate complaint
- You want the other player banned immediately
- You calm down if treated with respect and given a clear process

RULES:
1. Keep responses SHORT (1-3 sentences max)
2. Stay in character as the frustrated player
3. Calm down if they are professional and explain the process
4. Get more upset if they dismiss your concerns
5. Never break character or mention you are an AI
6. Ask what's going to happen to the rule breaker

SCENARIO: You were doing a drug run when another player just shot you for no reason. No RP, no interaction, just killed you. You lost $50k in product. You're filing a report.`,
        initialPrompt: "A staff member just opened a ticket with you. Express your frustration."
    }
};

// Grading instruction templates per scenario
const GRADING_INSTRUCTIONS = {
    pd: `Based on the conversation above, grade the POLICE applicant's performance.

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
}`,

    ems: `Based on the conversation above, grade the EMS applicant's performance.

CRITERIA:
1. Bedside Manner (0-25): Were they compassionate and reassuring?
2. Patient Care (0-25): Did they properly address the patient's concerns?
3. Communication (0-25): Were they clear about what they were doing?
4. Professionalism (0-25): Did they remain calm and patient?

Return ONLY a JSON object:
{
  "score": <total 0-100>,
  "bedsideManner": <0-25>,
  "patientCare": <0-25>,
  "communication": <0-25>,
  "professionalism": <0-25>,
  "feedback": "<one sentence summary>"
}`,

    gang: `Based on the conversation above, grade the GANG applicant's roleplay.

CRITERIA:
1. Street Credibility (0-25): Did they talk and act believably?
2. Loyalty Signals (0-25): Did they show they understand loyalty/no snitching?
3. Creativity (0-25): Was their roleplay interesting and immersive?
4. Confidence (0-25): Did they hold their own in the conversation?

Return ONLY a JSON object:
{
  "score": <total 0-100>,
  "streetCred": <0-25>,
  "loyalty": <0-25>,
  "creativity": <0-25>,
  "confidence": <0-25>,
  "feedback": "<one sentence summary>"
}`,

    staff: `Based on the conversation above, grade the STAFF applicant's performance.

CRITERIA:
1. Conflict Resolution (0-25): Did they calm the player down?
2. Professionalism (0-25): Were they neutral and fair?
3. Knowledge (0-25): Did they seem to understand server rules/procedures?
4. Communication (0-25): Were they clear about next steps?

Return ONLY a JSON object:
{
  "score": <total 0-100>,
  "conflictResolution": <0-25>,
  "professionalism": <0-25>,
  "knowledge": <0-25>,
  "communication": <0-25>,
  "feedback": "<one sentence summary>"
}`
};

// In-memory chat sessions (in production, use Redis or DB)
const chatSessions = new Map();

/**
 * Helper function to safely parse JSON from Gemini response
 */
function safeParseJSON(responseText) {
    if (!responseText || typeof responseText !== 'string') {
        return null;
    }

    let cleaned = responseText.trim();

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '');
    }

    // Try to extract JSON if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        cleaned = jsonMatch[0];
    }

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.log('[HOLOSIM] JSON parse error:', error.message);
        return null;
    }
}

/**
 * POST /api/holosim/start
 * Initializes a new HoloSim chat session
 */
router.post('/start', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { scenarioType = 'pd' } = req.body;
    const requestId = Date.now().toString(36);

    console.log(`[HOLOSIM][${requestId}] Start request from user ${userId}, scenario: ${scenarioType}`);

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
        console.error(`[HOLOSIM][${requestId}] GEMINI_API_KEY is not configured`);
        return res.status(500).json({
            success: false,
            message: 'HoloSim service is not configured.',
            error: 'SERVICE_NOT_CONFIGURED'
        });
    }

    // Validate scenario type
    const validScenarios = ['pd', 'ems', 'gang', 'staff'];
    const scenario = validScenarios.includes(scenarioType.toLowerCase())
        ? scenarioType.toLowerCase()
        : 'pd';

    const scenarioConfig = SCENARIO_PROMPTS[scenario];
    console.log(`[HOLOSIM][${requestId}] Using scenario: ${scenarioConfig.name}`);

    try {
        const ai = getGenAI();
        if (!ai) {
            throw new Error('Failed to initialize Gemini AI client');
        }

        // Initialize the model with system instruction
        const model = ai.getGenerativeModel({
            model: 'gemini-pro',
            generationConfig: {
                temperature: 0.9, // Higher for more creative responses
                topP: 0.95,
                maxOutputTokens: 150, // Keep responses short
            }
        });

        // Start a new chat session with properly formatted systemInstruction
        const chat = model.startChat({
            history: [],
            systemInstruction: {
                parts: [{ text: scenarioConfig.systemInstruction }]
            }
        });

        // Get initial NPC message
        console.log(`[HOLOSIM][${requestId}] Generating initial NPC message...`);
        const result = await chat.sendMessage(scenarioConfig.initialPrompt);
        const npcMessage = result.response.text();

        console.log(`[HOLOSIM][${requestId}] NPC: ${npcMessage.substring(0, 100)}...`);

        // Store session data
        chatSessions.set(userId, {
            chat,
            scenario,
            scenarioName: scenarioConfig.name,
            history: [
                { role: 'model', content: npcMessage }
            ],
            turnCount: 0,
            maxTurns: 5,
            isComplete: false,
            score: null,
            requestId
        });

        res.json({
            success: true,
            message: npcMessage,
            scenarioType: scenario,
            scenarioName: scenarioConfig.name,
            turnCount: 0,
            maxTurns: 5,
            isComplete: false,
            sessionId: requestId
        });

    } catch (error) {
        console.error(`[HOLOSIM][${requestId}] Start Error:`, error.message);
        console.error(`[HOLOSIM][${requestId}] Full error:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to start simulation. Please try again.',
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
    const requestId = Date.now().toString(36);

    console.log(`[HOLOSIM][${requestId}] Message from user ${userId}`);

    if (!message || typeof message !== 'string') {
        console.log(`[HOLOSIM][${requestId}] Invalid input - message missing or not string`);
        return res.status(400).json({
            success: false,
            message: 'Message is required.',
            error: 'INVALID_INPUT'
        });
    }

    const session = chatSessions.get(userId);
    if (!session) {
        console.log(`[HOLOSIM][${requestId}] No active session for user ${userId}`);
        return res.status(400).json({
            success: false,
            message: 'No active session. Please start a new simulation.',
            error: 'NO_SESSION'
        });
    }

    if (session.isComplete) {
        console.log(`[HOLOSIM][${requestId}] Session already complete`);
        return res.json({
            success: true,
            message: 'Simulation already complete.',
            isComplete: true,
            grade: session.score
        });
    }

    console.log(`[HOLOSIM][${requestId}] User: ${message.substring(0, 100)}...`);

    try {
        // Increment turn count
        session.turnCount++;
        session.history.push({ role: 'user', content: message });

        let npcResponse;
        let gradeResult = null;

        // Check if this is the final turn
        if (session.turnCount >= session.maxTurns) {
            console.log(`[HOLOSIM][${requestId}] Final turn - getting NPC response and grading`);

            // Get final NPC response
            const result = await session.chat.sendMessage(message);
            npcResponse = result.response.text();
            session.history.push({ role: 'model', content: npcResponse });

            console.log(`[HOLOSIM][${requestId}] NPC final: ${npcResponse.substring(0, 100)}...`);

            // Now send grading request
            const gradingPrompt = GRADING_INSTRUCTIONS[session.scenario] || GRADING_INSTRUCTIONS.pd;
            console.log(`[HOLOSIM][${requestId}] Requesting grade...`);

            const gradeResponse = await session.chat.sendMessage(gradingPrompt);
            const gradeText = gradeResponse.response.text();

            console.log(`[HOLOSIM][${requestId}] Grade response: ${gradeText.substring(0, 200)}...`);

            // Parse the grade with safe parser
            gradeResult = safeParseJSON(gradeText);

            if (!gradeResult) {
                console.log(`[HOLOSIM][${requestId}] Failed to parse grade, using default`);
                gradeResult = {
                    score: 50,
                    feedback: 'Unable to parse detailed grade. Average score assigned.',
                    raw: gradeText
                };
            }

            // Ensure score is valid
            if (typeof gradeResult.score !== 'number' || gradeResult.score < 0 || gradeResult.score > 100) {
                gradeResult.score = 50;
            }

            console.log(`[HOLOSIM][${requestId}] Final score: ${gradeResult.score}`);

            // Mark session complete and save score
            session.isComplete = true;
            session.score = gradeResult;

        } else {
            // Normal turn - get NPC response
            console.log(`[HOLOSIM][${requestId}] Turn ${session.turnCount}/${session.maxTurns}`);
            const result = await session.chat.sendMessage(message);
            npcResponse = result.response.text();
            session.history.push({ role: 'model', content: npcResponse });

            console.log(`[HOLOSIM][${requestId}] NPC: ${npcResponse.substring(0, 100)}...`);
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
        console.error(`[HOLOSIM][${requestId}] Message Error:`, error.message);
        console.error(`[HOLOSIM][${requestId}] Full error:`, error);

        // Don't crash - return a helpful error
        res.status(500).json({
            success: false,
            message: 'Failed to process message. Please try again.',
            error: error.message,
            turnCount: session.turnCount,
            isComplete: session.isComplete
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

    console.log(`[HOLOSIM] Status check for user ${userId}: ${session ? 'has session' : 'no session'}`);

    if (!session) {
        return res.json({
            success: true,
            hasSession: false,
            isComplete: false
        });
    }

    res.json({
        success: true,
        hasSession: true,
        scenarioType: session.scenario,
        scenarioName: session.scenarioName,
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

    console.log(`[HOLOSIM] Reset session for user ${userId}`);
    chatSessions.delete(userId);

    res.json({
        success: true,
        message: 'Session reset successfully.'
    });
});

/**
 * GET /api/holosim/scenarios
 * Get available scenario types
 */
router.get('/scenarios', (req, res) => {
    const scenarios = Object.entries(SCENARIO_PROMPTS).map(([key, value]) => ({
        id: key,
        name: value.name
    }));

    res.json({
        success: true,
        scenarios
    });
});

module.exports = router;
