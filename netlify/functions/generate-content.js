/**
 * Production-Ready Serverless Function for AI Generation
 * Features:
 * 1. Dynamic Key Fetching (Env Var + Firestore Fallback)
 * 2. Round-Robin Load Balancing
 * 3. Robust Error Handling & Retries
 * 4. Secure CORS Headers
 */

const fetch = require('node-fetch'); // Netlify provides this, or use native fetch in Node 18+

// CONFIGURATION
const FIREBASE_PROJECT_ID = "mubashir-2b7cc"; // Your Project ID
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/artifacts/${FIREBASE_PROJECT_ID}/public/data/api_keys`;

exports.handler = async (event, context) => {
    // 1. CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 2. Handle Preflight
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed', headers };

    try {
        const { prompt, metadata } = JSON.parse(event.body);
        if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Prompt required' }), headers };

        // 3. Key Strategy: Env Vars (Priority) -> Firestore (Dynamic)
        let apiKeys = [];
        
        // A. Check Environment Variable (Fastest)
        if (process.env.GEMINI_API_KEYS) {
            apiKeys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim());
        }

        // B. If Env is empty, fetch from Firestore (Dynamic)
        if (apiKeys.length === 0) {
            try {
                const firestoreRes = await fetch(FIRESTORE_URL);
                if (firestoreRes.ok) {
                    const data = await firestoreRes.json();
                    // Parse Firestore REST format
                    if(data.documents) {
                        apiKeys = data.documents
                            .map(doc => doc.fields?.key?.stringValue)
                            .filter(k => k); // Filter undefined
                    }
                }
            } catch (dbError) {
                console.error("Firestore Key Fetch Error:", dbError);
            }
        }

        if (apiKeys.length === 0) {
            console.error("CRITICAL: No API Keys found in ENV or Firestore.");
            return { statusCode: 503, body: JSON.stringify({ error: 'Service misconfigured. No active keys.' }), headers };
        }

        // 4. Execute Request with Key Rotation
        // Shuffle keys to load balance
        const shuffledKeys = apiKeys.sort(() => 0.5 - Math.random());
        let lastError = null;

        for (const apiKey of shuffledKeys) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                const result = await response.json();

                // Success
                if (response.ok && result.candidates) {
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ text: result.candidates[0].content.parts[0].text }),
                        headers
                    };
                }

                // Handle Specific API Errors
                if (response.status === 429 || response.status === 503) {
                    console.warn(`Key ${apiKey.slice(0,4)}... rate limited. Retrying...`);
                    continue; // Try next key
                }

                // Fatal Error for this key
                throw new Error(result.error?.message || 'Unknown AI Error');

            } catch (e) {
                lastError = e.message;
                console.error(`Key failed: ${e.message}`);
            }
        }

        // 5. All keys failed
        return {
            statusCode: 503,
            body: JSON.stringify({ error: 'Server busy. Please try again later.', details: lastError }),
            headers
        };

    } catch (error) {
        console.error("Global Function Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }), headers };
    }
};