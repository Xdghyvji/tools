const { builder } = require('@netlify/functions');

// ==========================================
// 1. FIREBASE CONFIGURATION (Hardcoded)
// ==========================================
const CONFIG = {
  // Get these values from your assets/js/shared.js file
  PROJECT_ID: "digital-services-hub",   // Example: "digitalserviceshub-12345"
  APP_ID: "mubashir-2b7cc",             // Your specific tenant ID
  API_KEY: "AIzaSy..."                  // Your long Firebase API Key
};

async function handler(event, context) {
  // 2. Extract Post ID from URL
  // Example URL: /blog/12345 -> postId = "12345"
  const pathParts = event.path.split('/');
  const postId = pathParts[pathParts.length - 1];

  // 3. Construct Firestore REST URL
  // This bypasses the need for the heavy Firebase Admin SDK
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data/posts/${postId}?key=${CONFIG.API_KEY}`;

  try {
    // 4. Fetch Data from Firestore
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      // If 404, return a simple 404 page (not cached)
      return { statusCode: 404, body: "<h1>Post not found</h1>" };
    }

    const json = await response.json();
    const fields = json.fields;

    // Helper: Safely extract string values from Firestore JSON format
    const getString = (field) => field?.stringValue || "";

    const postData = {
      title: getString(fields.title),
      content: getString(fields.content),
      image: getString(fields.image),
      date: getString(fields.date),
      author: getString(fields.author) || "Admin"
    };

    // 5. Generate Static HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postData.title} | DigitalServicesHub</title>
    <meta name="description" content="${postData.title} - Read more on DigitalServicesHub.">
    
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${postData.title}" />
    <meta property="og:description" content="Read this article on DigitalServicesHub." />
    <meta property="og:image" content="${postData.image}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${postData.title}" />
    <meta name="twitter:image" content="${postData.image}" />

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
      /* Basic Prose Styling for Content */
      .prose img { border-radius: 0.75rem; margin-top: 2rem; margin-bottom: 2rem; }
      .prose p { margin-bottom: 1.25rem; line-height: 1.75; color: #334155; }
      .prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; }
      .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
      .prose a { color: #2563eb; text-decoration: underline; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">

    <div id="app-header"></div>

    <main class="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        <article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            ${postData.image ? `<img src="${postData.image}" class="w-full h-64 md:h-96 object-cover" alt="${postData.title}">` : ''}
            
            <div class="p-8 md:p-12">
                <div class="flex items-center gap-3 text-sm text-slate-500 mb-6">
                    <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-xs uppercase">Article</span>
                    <span>&bull;</span>
                    <span>${postData.date}</span>
                    <span>&bull;</span>
                    <span>By ${postData.author}</span>
                </div>

                <h1 class="text-3xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">${postData.title}</h1>

                <div class="prose prose-lg max-w-none">
                    ${postData.content}
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
</html>
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
      ttl: 3600 // Cache for 1 hour
    };

  } catch (error) {
    console.error("ODB Error:", error);
    return { statusCode: 500, body: "Error generating page" };
  }
}

// Wrap handler with builder for On-Demand Builder functionality
exports.handler = builder(handler);
