/**
 * Netlify Serverless Function to Proxy Gemini API Calls
 * usage: POST /.netlify/functions/generate-content
 */

exports.handler = async (event, context) => {
    // 1. CORS Headers (Allow frontend to call this function)
    const headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 2. Handle Preflight (OPTIONS) request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // 3. Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed', headers };
    }

    try {
        // 4. Parse Input
        const data = JSON.parse(event.body);
        const prompt = data.prompt;

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }), headers };
        }

        // 5. Get API Keys from Netlify Environment Variables
        // Expects a comma-separated string: "AIzaKey1,AIzaKey2,AIzaKey3"
        const apiKeysEnv = process.env.GEMINI_API_KEYS;

        if (!apiKeysEnv) {
            console.error("Missing GEMINI_API_KEYS env var");
            return { statusCode: 500, body: JSON.stringify({ error: 'Server Configuration Error' }), headers };
        }

        const apiKeys = apiKeysEnv.split(',').map(k => k.trim()).filter(k => k);
        let lastError = null;

        // 6. Try keys sequentially until one works
        for (const apiKey of apiKeys) {
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

                // If success, break loop and return
                if (response.ok) {
                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ text: text }),
                        headers
                    };
                } 
                
                // If 429 (Rate Limit) or 403 (Quota), continue to next key
                if (response.status === 429 || response.status === 403) {
                    console.warn(`Key ending in ...${apiKey.slice(-4)} failed with ${response.status}. Rotating...`);
                    lastError = { status: response.status, message: result.error?.message };
                    continue; 
                }

                // For other errors (400 Bad Request), stop immediately
                return { 
                    statusCode: response.status, 
                    body: JSON.stringify({ error: result.error?.message || 'Gemini API Error' }), 
                    headers 
                };

            } catch (fetchError) {
                console.error(`Fetch error with key ...${apiKey.slice(-4)}:`, fetchError);
                lastError = { status: 500, message: fetchError.message };
                continue;
            }
        }

        // 7. If all keys failed
        console.error("All API keys exhausted.");
        return {
            statusCode: lastError?.status || 500,
            body: JSON.stringify({ error: 'Service Busy. All quotas exhausted. Please try again later.' }),
            headers
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
            headers
        };
    }
};