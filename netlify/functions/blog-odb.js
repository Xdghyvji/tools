// FORCE UPDATE: v7.0 - Professional Layout (Sidebar + Comments + Author)
const { builder } = require('@netlify/functions');
const fetch = require('node-fetch');

// 1. CONFIGURATION
const CONFIG = {
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "mubashir-2b7cc", 
  APP_ID:     process.env.FIREBASE_APP_ID     || "mubashir-2b7cc",             
  API_KEY:    process.env.FIREBASE_API_KEY    || "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA"
};

async function myHandler(event, context) {
  // 2. ROBUST SLUG DETECTION
  const cleanPath = event.path.replace(/\/$/, "").split('?')[0];
  const pathParts = cleanPath.split('/');
  const slug = pathParts[pathParts.length - 1];

  console.log(`[Blog-ODB] Request for Slug: "${slug}"`);

  // 3. RUN FIRESTORE QUERY
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
    const response = await fetch(queryUrl, { method: 'POST', body: JSON.stringify(queryBody) });
    const json = await response.json();

    // 4. HANDLE 404
    if (!json[0] || !json[0].document) {
      // Fallback: Check by ID
      const directUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data/posts/${slug}?key=${CONFIG.API_KEY}`;
      const idResp = await fetch(directUrl);
      if(idResp.ok) {
         const idJson = await idResp.json();
         return generatePage(idJson.fields, CONFIG);
      }
      return { statusCode: 404, headers: { "Content-Type": "text/html" }, body: "<h1>404 - Post Not Found</h1>" };
    }

    return generatePage(json[0].document.fields, CONFIG);

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: `Server Error: ${error.message}` };
  }
}

// 5. PROFESSIONAL HTML GENERATOR
function generatePage(fields, config) {
    const getString = (field) => field?.stringValue || "";
    
    const data = {
      title: getString(fields.title),
      content: getString(fields.content),
      image: getString(fields.image),
      date: getString(fields.date),
      author: getString(fields.author) || "Admin",
      authorId: getString(fields.authorId), // Needed for the link
      category: getString(fields.category) || "General"
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
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
      .prose img { border-radius: 0.75rem; margin: 2rem 0; width: 100%; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      .prose p { margin-bottom: 1.25rem; line-height: 1.8; color: #334155; font-size: 1.125rem; }
      .prose h2 { font-size: 1.875rem; font-weight: 700; margin: 3rem 0 1.5rem; color: #0f172a; }
      .prose a { color: #2563eb; text-decoration: underline; text-underline-offset: 4px; }
      .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1.5rem; font-style: italic; color: #475569; background: #eff6ff; padding: 1.5rem; border-radius: 0 0.5rem 0.5rem 0; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    
    <div id="app-header" class="sticky top-0 z-50"></div> 

    <main class="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div class="lg:col-span-8">
                <article class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    ${data.image ? `<img src="${data.image}" class="w-full h-64 md:h-96 object-cover" alt="${data.title}">` : ''}
                    
                    <div class="p-6 md:p-10">
                        <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">${data.category}</span>
                            <div class="flex items-center gap-2">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                                <span>${data.date}</span>
                            </div>
                        </div>
                        
                        <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">${data.title}</h1>
                        
                        <div class="prose prose-lg max-w-none">
                            ${data.content}
                        </div>

                        <div class="mt-12 pt-8 border-t border-slate-100 flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600">
                                ${data.author.charAt(0)}
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Written By</p>
                                <a href="/author.html?id=${data.authorId}" class="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                    ${data.author} &rarr;
                                </a>
                                <p class="text-sm text-slate-500">Expert Contributor at DigitalServicesHub</p>
                            </div>
                        </div>
                    </div>
                </article>

                <div class="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                    <h3 class="text-2xl font-bold text-slate-900 mb-6">Discussion</h3>
                    <div class="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
                        <i data-lucide="message-square" class="w-8 h-8 text-slate-400 mx-auto mb-3"></i>
                        <p class="text-slate-500 font-medium">Comments are currently disabled for maintenance.</p>
                    </div>
                </div>
            </div>

            <aside class="lg:col-span-4 space-y-8">
                
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <i data-lucide="search" class="w-4 h-4 text-blue-500"></i> Search
                    </h4>
                    <input type="text" placeholder="Search articles..." class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i> Trending Now
                    </h4>
                    <div id="sidebar-posts" class="space-y-4">
                        <div class="animate-pulse space-y-4">
                            <div class="h-16 bg-slate-100 rounded-lg"></div>
                            <div class="h-16 bg-slate-100 rounded-lg"></div>
                            <div class="h-16 bg-slate-100 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <i data-lucide="tag" class="w-4 h-4 text-emerald-500"></i> Categories
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200 cursor-pointer">AI Tools</span>
                        <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200 cursor-pointer">Marketing</span>
                        <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200 cursor-pointer">SEO</span>
                        <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200 cursor-pointer">Business</span>
                    </div>
                </div>
            </aside>
        </div>
    </main>

    <div id="app-footer"></div>

    <script type="module">
        import { loadHeader, loadFooter } from '/assets/js/shared.js';
        
        // Load Layout
        loadHeader('blog');
        loadFooter();
        lucide.createIcons();

        // 5. CLIENT-SIDE SIDEBAR LOADER (Fetches real data!)
        async function loadSidebar() {
            const container = document.getElementById('sidebar-posts');
            const projectId = "${config.PROJECT_ID}";
            const apiKey = "${config.API_KEY}";
            const appId = "${config.APP_ID}";

            // Fetch 4 recent posts using REST API (No auth needed if rules are public)
            const url = \`https://firestore.googleapis.com/v1/projects/\${projectId}/databases/(default)/documents/artifacts/\${appId}/public/data:runQuery?key=\${apiKey}\`;
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        structuredQuery: {
                            from: [{ collectionId: "posts" }],
                            orderBy: [{ field: { fieldPath: "date" }, direction: "DESCENDING" }],
                            limit: 4
                        }
                    })
                });
                const json = await response.json();
                
                if(!json || !json[0]) { container.innerHTML = "<p class='text-sm text-slate-400'>No posts found.</p>"; return; }

                container.innerHTML = json.map(item => {
                    if(!item.document) return '';
                    const f = item.document.fields;
                    const title = f.title?.stringValue || "Untitled";
                    const slug = f.slug?.stringValue || "#";
                    const img = f.image?.stringValue || "";
                    
                    return \`
                    <a href="/blog/\${slug}" class="flex gap-3 group">
                        \${img ? \`<img src="\${img}" class="w-16 h-16 object-cover rounded-lg shrink-0 group-hover:opacity-80 transition-opacity">\` : '<div class="w-16 h-16 bg-slate-100 rounded-lg shrink-0"></div>'}
                        <div>
                            <h5 class="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">\${title}</h5>
                            <span class="text-xs text-slate-400 mt-1 block">Read Article &rarr;</span>
                        </div>
                    </a>
                    \`;
                }).join('');
                
            } catch(e) {
                console.warn("Sidebar Error:", e);
                container.innerHTML = "<p class='text-sm text-slate-400'>Unable to load trends.</p>";
            }
        }

        // Run Sidebar Loader
        loadSidebar();
    </script>
</body>
</html>`;

    return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html, ttl: 3600 };
}

exports.handler = builder(myHandler);
