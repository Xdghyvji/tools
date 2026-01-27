const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. Handle CORS (Allow your domain)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 2. Parse Request
    const body = JSON.parse(event.body);
    const { prompt, apiKey } = body; // <--- NOW ACCEPTING KEY FROM CLIENT

    if (!prompt) throw new Error("Missing prompt");
    
    // 3. Select API Key (Client Provided OR Environment Fallback)
    const validKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (!validKey) {
        console.error("No API Key found in request or environment.");
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Server Configuration Error: Missing API Key" }) 
        };
    }

    // 4. Call Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${validKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 5. Handle Google Errors
    if (!response.ok) {
        console.error("Gemini API Error:", data);
        return { 
            statusCode: response.status, 
            headers, 
            body: JSON.stringify({ error: data.error?.message || "AI Provider Error" }) 
        };
    }

    // 6. Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
          text: data.candidates[0].content.parts[0].text 
      })
    };

  } catch (error) {
    console.error("Function Crash:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
