// FORCE UPDATE: v8.0 - Live Comments + Advanced SEO + ODB
const { builder } = require('@netlify/functions');
const fetch = require('node-fetch');

// 1. CONFIGURATION
const CONFIG = {
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "mubashir-2b7cc", 
  APP_ID:      process.env.FIREBASE_APP_ID      || "mubashir-2b7cc",              
  API_KEY:     process.env.FIREBASE_API_KEY     || "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA"
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
         return generatePage(idJson.fields, CONFIG, slug);
      }
      return { statusCode: 404, headers: { "Content-Type": "text/html" }, body: "<h1>404 - Post Not Found</h1>" };
    }

    return generatePage(json[0].document.fields, CONFIG, slug);

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: `Server Error: ${error.message}` };
  }
}

// 5. HTML GENERATOR
function generatePage(fields, config, currentSlug) {
    const getString = (field) => field?.stringValue || "";
    
    const data = {
      title: getString(fields.title),
      content: getString(fields.content),
      image: getString(fields.image),
      date: getString(fields.date),
      author: getString(fields.author) || "Admin",
      authorId: getString(fields.authorId),
      category: getString(fields.category) || "General",
      // SEO Fields
      seoTitle: fields.seo?.mapValue?.fields?.title?.stringValue || getString(fields.title),
      seoDesc: fields.seo?.mapValue?.fields?.description?.stringValue || getString(fields.content).substring(0, 160),
      canonical: fields.seo?.mapValue?.fields?.canonical?.stringValue || `https://digitalserviceshub.online/blog/${currentSlug}`
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.seoTitle} | Digital Services Hub</title>
    
    <!-- Core SEO -->
    <meta name="description" content="${data.seoDesc}">
    <meta name="generator" content="DigitalServicesHub v1.0">
    <meta name="referrer" content="origin-when-cross-origin">
    <meta name="robots" content="index, follow, max-image-preview:standard">
    <meta name="format-detection" content="telephone=no">
    
    <!-- Open Graph / Social -->
    <meta property="og:title" content="${data.seoTitle}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Digital Services Hub">
    <meta property="og:locale" content="en_US">
    <meta property="og:url" content="https://digitalserviceshub.online/blog/${currentSlug}">
    <meta property="og:image" content="${data.image}">
    <meta property="article:published_time" content="${data.date}">
    <meta property="article:author" content="${data.author}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${data.canonical}">
    <link rel="license" href="https://digitalserviceshub.online/terms.html">
    
    <!-- Performance & Preconnect -->
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://www.gstatic.com">
    <link rel="dns-prefetch" href="https://firestore.googleapis.com">
    
    <!-- Icons -->
    <link rel="icon" type="image/png" href="/assets/img/digitalserviceshub.png">
    <link rel="apple-touch-icon" href="/assets/img/digitalserviceshub.png">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Plus Jakarta Sans', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <!-- Fonts & Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .prose h1 { font-size: 2.25em; font-weight: 800; margin-bottom: 0.5em; line-height: 1.2; color: #0f172a; }
        .prose h2 { font-size: 1.875em; font-weight: 700; margin-top: 2em; margin-bottom: 1em; color: #0f172a; }
        .prose h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.75em; color: #334155; }
        .prose p { margin-bottom: 1.25em; line-height: 1.8; color: #334155; font-size: 1.125rem; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.25em; color: #334155; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1.25em; color: #334155; }
        .prose a { color: #2563eb; text-decoration: underline; text-underline-offset: 4px; font-weight: 500; }
        .prose img { border-radius: 0.75rem; margin: 2rem 0; width: 100%; height: auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1.5rem; font-style: italic; color: #475569; background: #eff6ff; padding: 1.5rem; border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 2rem; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    
    <div id="main-header" class="sticky top-0 z-50"></div> 

    <main class="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div class="lg:col-span-8">
                <!-- ARTICLE -->
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
                            <div class="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 uppercase">
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

                <!-- COMMENTS SECTION (Live) -->
                <div class="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-2xl font-bold text-slate-900">Discussion</h3>
                        <span class="text-sm text-slate-500" id="comment-count">0 Comments</span>
                    </div>
                    
                    <!-- Comment Form -->
                    <form id="comment-form" class="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <h4 class="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Leave a Reply</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" id="comment-name" placeholder="Name *" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" required>
                            <input type="email" id="comment-email" placeholder="Email (Optional)" class="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
                        </div>
                        <textarea id="comment-body" rows="3" placeholder="Join the discussion..." class="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" required></textarea>
                        <button type="submit" id="submit-comment-btn" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <span>Post Comment</span>
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </form>

                    <!-- Comments List -->
                    <div id="comments-list" class="space-y-8">
                        <div class="text-center py-4 text-slate-400 italic" id="no-comments-msg">Be the first to share your thoughts!</div>
                    </div>
                </div>
            </div>

            <!-- SIDEBAR -->
            <aside class="lg:col-span-4 space-y-8">
                
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
                        <i data-lucide="search" class="w-4 h-4 text-blue-500"></i> Search
                    </h4>
                    <input type="text" placeholder="Search articles..." class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
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
                    <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
                        <i data-lucide="tag" class="w-4 h-4 text-emerald-500"></i> Categories
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        <a href="/blog.html?q=AI Tools" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">AI Tools</a>
                        <a href="/blog.html?q=Marketing" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">Marketing</a>
                        <a href="/blog.html?q=SEO" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">SEO</a>
                        <a href="/blog.html?q=Business" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">Business</a>
                    </div>
                </div>
            </aside>
        </div>
    </main>

    <div id="main-footer"></div>

    <script type="module">
        import { loadHeader, loadFooter, db, appId } from '/assets/js/shared.js';
        import { collection, query, where, addDoc, serverTimestamp, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        
        const slug = "${currentSlug}";
        const auth = getAuth();

        // 1. Load Layout
        loadHeader('blog');
        loadFooter();
        lucide.createIcons();

        // 2. Auth for Comments
        onAuthStateChanged(auth, (user) => {
            if (!user) signInAnonymously(auth).catch(console.error);
        });

        // 3. Load Comments
        function loadComments() {
            const list = document.getElementById('comments-list');
            const countEl = document.getElementById('comment-count');
            const noMsg = document.getElementById('no-comments-msg');
            
            const q = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'comments'), 
                where('postSlug', '==', slug)
            );

            onSnapshot(q, (snap) => {
                const comments = [];
                snap.forEach(d => comments.push(d.data()));
                comments.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                
                countEl.innerText = \`\${comments.length} Comments\`;
                
                if(comments.length === 0) {
                    noMsg.style.display = 'block';
                    list.innerHTML = '';
                    list.appendChild(noMsg);
                } else {
                    noMsg.style.display = 'none';
                    list.innerHTML = comments.map(c => \`
                        <div class="flex gap-4 animate-fade-in">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                \${c.name.charAt(0)}
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h5 class="font-bold text-slate-900 text-sm">\${c.name}</h5>
                                    <span class="text-xs text-slate-400">\${new Date(c.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <p class="text-slate-600 text-sm leading-relaxed">\${c.text}</p>
                            </div>
                        </div>
                    \`).join('');
                }
            });
        }

        // 4. Submit Comment
        document.getElementById('comment-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-comment-btn');
            const name = document.getElementById('comment-name').value;
            const email = document.getElementById('comment-email').value;
            const text = document.getElementById('comment-body').value;
            
            if(!name || !text) return;
            if (!auth.currentUser) await signInAnonymously(auth);

            const originalBtn = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Posting...';
            btn.disabled = true;

            try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), {
                    postSlug: slug,
                    name,
                    email,
                    text,
                    createdAt: serverTimestamp()
                });
                e.target.reset();
            } catch(err) {
                alert("Error posting comment. Please try again.");
                console.error(err);
            } finally {
                btn.innerHTML = originalBtn;
                btn.disabled = false;
                lucide.createIcons();
            }
        };

        // 5. Load Sidebar (Client Side)
        async function loadSidebar() {
            const container = document.getElementById('sidebar-posts');
            try {
                // Use Client SDK for simplicity and consistence
                const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'posts'));
                const all = [];
                snap.forEach(d => all.push({id:d.id, ...d.data()}));
                
                const shuffled = all.filter(p => p.published !== false && p.slug !== slug).sort(()=>0.5-Math.random()).slice(0,5);
                
                container.innerHTML = shuffled.map(p => \`
                <a href="/blog/\${p.slug || p.id}" class="flex gap-4 group items-start">
                    <div class="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                         \${p.image ? \`<img src="\${p.image}" class="w-full h-full object-cover group-hover:opacity-80 transition-opacity">\` : ''}
                    </div>
                    <div>
                        <h5 class="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 font-display">\${p.title}</h5>
                        <span class="text-xs text-slate-400 mt-1 block">\${p.date}</span>
                    </div>
                </a>
                \`).join('');
                
            } catch(e) {
                console.warn("Sidebar Error:", e);
                container.innerHTML = "<p class='text-sm text-slate-400'>Unable to load trends.</p>";
            }
        }

        // Initialize
        loadComments();
        loadSidebar();
    </script>
</body>
</html>`;

    return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html, ttl: 3600 };
}

exports.handler = builder(myHandler);
