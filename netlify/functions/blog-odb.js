// FORCE UPDATE: v4.0 - Using Environment Variables
const { builder } = require('@netlify/functions');
const fetch = require('node-fetch');

// ==========================================
// 1. CONFIGURATION (From Netlify Dashboard)
// ==========================================
const CONFIG = {
  // Try to use the Environment Variable first. 
  // If it's missing (like on your local PC), fall back to the string.
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "mubashir-2b7cc", 
  APP_ID:     process.env.FIREBASE_APP_ID     || "mubashir-2b7cc",             
  API_KEY:    process.env.FIREBASE_API_KEY    || "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA"
};

async function myHandler(event, context) {
  const pathParts = event.path.split('/');
  const slug = pathParts[pathParts.length - 1];

  console.log(`[Blog-ODB] Generating page for slug: ${slug}`);

  const queryUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data:runQuery?key=${CONFIG.API_KEY}`;

  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "posts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug }
        }
      },
      limit: 1
    }
  };

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      body: JSON.stringify(queryBody)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Firestore API Error]", errText);
        return { statusCode: 404, body: `<h1>Database Error: ${response.status}</h1><p>Check PROJECT_ID and API_KEY.</p>` };
    }

    const json = await response.json();

    if (!json[0] || !json[0].document) {
      console.log(`[Blog-ODB] No post found for slug "${slug}", checking ID...`);
      
      const directUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data/posts/${slug}?key=${CONFIG.API_KEY}`;
      const idResp = await fetch(directUrl);
      
      if(idResp.ok) {
         console.log("[Blog-ODB] Found by ID!");
         const idJson = await idResp.json();
         return generatePage(idJson.fields);
      }
      
      return { statusCode: 404, body: "<h1>Post not found</h1>" };
    }

    return generatePage(json[0].document.fields);

  } catch (error) {
    console.error("[Function Crash]", error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
}

// 5. HTML Generator Helper
function generatePage(fields) {
    const getString = (field) => field?.stringValue || "";
    
    const data = {
      title: getString(fields.title),
      content: getString(fields.content),
      image: getString(fields.image),
      date: getString(fields.date),
      author: getString(fields.author) || "Admin"
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} | DigitalServicesHub</title>
    <meta name="description" content="${data.title}">
    <meta property="og:title" content="${data.title}" />
    <meta property="og:image" content="${data.image}" />
    <meta property="og:type" content="article" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
      .prose img { border-radius: 0.75rem; margin: 2rem 0; width: 100%; height: auto; }
      .prose p { margin-bottom: 1.25rem; line-height: 1.75; color: #334155; }
      .prose h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; color: #0f172a; }
      .prose a { color: #2563eb; text-decoration: underline; }
      .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    <div id="app-header"></div> 

    <main class="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        <article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            ${data.image ? `<img src="${data.image}" class="w-full h-64 md:h-96 object-cover">` : ''}
            
            <div class="p-8 md:p-12">
                <div class="flex items-center gap-3 text-sm text-slate-500 mb-6">
                    <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-xs uppercase">Article</span>
                    <span>${data.date}</span>
                    <span>By ${data.author}</span>
                </div>
                
                <h1 class="text-3xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">${data.title}</h1>
                
                <div class="prose prose-lg max-w-none text-slate-600">
                    ${data.content}
                </div>
            </div>
        </article>
    </main>

    <div id="app-footer"></div>

    <script type="module">
        import { loadHeader, loadFooter } from '/assets/js/shared.js';
        loadHeader('blog');
        loadFooter();
    </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
      ttl: 3600
    };
}

exports.handler = builder(myHandler);
