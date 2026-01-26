// FORCE UPDATE: v6.0 - Final Production Version
const { builder } = require('@netlify/functions');
const fetch = require('node-fetch');

// ==========================================
// 1. CONFIGURATION
// ==========================================
const CONFIG = {
  // Use Environment Variables if available, otherwise use your hardcoded keys
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "mubashir-2b7cc", 
  APP_ID:     process.env.FIREBASE_APP_ID     || "mubashir-2b7cc",             
  API_KEY:    process.env.FIREBASE_API_KEY    || "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA"
};

async function myHandler(event, context) {
  // ==========================================
  // 2. ROBUST SLUG DETECTION
  // ==========================================
  // Fixes the "Trailing Slash" bug (e.g., /blog/post-1/ vs /blog/post-1)
  const cleanPath = event.path.replace(/\/$/, "").split('?')[0];
  const pathParts = cleanPath.split('/');
  const slug = pathParts[pathParts.length - 1];

  console.log(`[Blog-ODB] Request for Slug: "${slug}"`);

  // DEBUG: Test URL to verify the function is alive
  if (slug === 'test-connection') {
      return { 
          statusCode: 200, 
          headers: { "Content-Type": "text/html" },
          body: "<h1>✅ Connection Successful!</h1><p>The Netlify Function is running correctly.</p>" 
      };
  }

  // ==========================================
  // 3. RUN FIRESTORE QUERY
  // ==========================================
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
        console.error(`[Firestore API Error] ${response.status}: ${errText}`);
        return { 
            statusCode: 404, 
            body: `<h1>Database Error (${response.status})</h1><p>Could not connect to Firestore.</p>` 
        };
    }

    const json = await response.json();

    // ==========================================
    // 4. HANDLE "NOT FOUND" & FALLBACKS
    // ==========================================
    if (!json[0] || !json[0].document) {
      console.log(`[Blog-ODB] Slug "${slug}" not found in 'slug' field. Checking if it is an ID...`);
      
      // FALLBACK: Check if the user used the Document ID in the URL instead of the Slug
      const directUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data/posts/${slug}?key=${CONFIG.API_KEY}`;
      const idResp = await fetch(directUrl);
      
      if(idResp.ok) {
         console.log("[Blog-ODB] Success! Found post by Document ID.");
         const idJson = await idResp.json();
         return generatePage(idJson.fields);
      }
      
      console.log("[Blog-ODB] Failed. Post not found by Slug OR ID.");
      return { 
          statusCode: 404, 
          headers: { "Content-Type": "text/html" },
          body: `
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1>404 - Post Not Found</h1>
                <p>We could not find a post with the slug: <strong>${slug}</strong></p>
                <a href="/">Return Home</a>
            </div>` 
      };
    }

    // Success! Found by Slug
    return generatePage(json[0].document.fields);

  } catch (error) {
    console.error("[Function Crash]", error);
    return { statusCode: 500, body: `Server Error: ${error.message}` };
  }
}

// ==========================================
// 5. HTML GENERATOR
// ==========================================
function generatePage(fields) {
    const getString = (field) => field?.stringValue || "";
    
    // Safely extract data
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
    <meta property="og:description" content="Read this article on DigitalServicesHub." />
    <meta property="og:image" content="${data.image}" />
    <meta property="og:type" content="article" />
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    
    <style>
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
      
      /* Article Content Styles */
      .prose img { border-radius: 0.75rem; margin: 2rem 0; width: 100%; height: auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      .prose p { margin-bottom: 1.25rem; line-height: 1.8; color: #334155; font-size: 1.1rem; }
      .prose h2 { font-size: 1.8rem; font-weight: 700; margin: 2.5rem 0 1rem; color: #0f172a; }
      .prose h3 { font-size: 1.4rem; font-weight: 600; margin: 2rem 0 1rem; color: #1e293b; }
      .prose a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
      .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; color: #334155; }
      .prose li { margin-bottom: 0.5rem; }
      .prose blockquote { border-left: 4px solid #e2e8f0; padding-left: 1.5rem; font-style: italic; color: #64748b; margin: 2rem 0; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    
    <div id="app-header"></div> 

    <main class="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            ${data.image ? `<img src="${data.image}" class="w-full h-64 md:h-96 object-cover" alt="${data.title}">` : ''}
            
            <div class="p-6 md:p-12">
                <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8">
                    <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">Article</span>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>${data.date}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span>${data.author}</span>
                    </div>
                </div>
                
                <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">${data.title}</h1>
                
                <div class="prose prose-lg max-w-none">
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
      ttl: 3600 // Cache for 1 hour
    };
}

// Netlify Builder Handler
exports.handler = builder(myHandler);
