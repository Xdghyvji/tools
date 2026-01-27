// FORCE UPDATE: v4.0 - Native Fetch (No External Dependencies)
// This uses Node.js 18+ built-in fetch to prevent "Module Not Found" crashes.

exports.handler = async (event) => {
  // 1. CORS Headers (Allow connections from your domain)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 2. Handle Preflight Requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 3. Parse Request Body
    if (!event.body) throw new Error("Empty request body");
    const body = JSON.parse(event.body);
    const { prompt, apiKey } = body;

    // 4. Validate Inputs
    if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'prompt' field" }) };
    
    // Select Key: Use the one from DB (client) or Environment Variable (fallback)
    const validKey = apiKey || process.env.GEMINI_API_KEY;
    if (!validKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Configuration Error: No API Key provided." }) };
    }

    // 5. Call Google Gemini API (Using Native Global Fetch)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${validKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 6. Handle Google API Errors
    if (!response.ok) {
        console.error("Gemini API Error:", JSON.stringify(data));
        return { 
            statusCode: response.status, 
            headers, 
            body: JSON.stringify({ error: data.error?.message || "AI Provider Error" }) 
        };
    }

    // 7. Extract & Return Text
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Invalid response structure from Gemini API");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: data.candidates[0].content.parts[0].text })
    };

  } catch (error) {
    console.error("Function Critical Failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server Error: ${error.message}` })
    };
  }
};
