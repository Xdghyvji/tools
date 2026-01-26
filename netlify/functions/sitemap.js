// FORCE UPDATE: v2.0 - Complete Sitemap (Tools + Legal + Blog)
const fetch = require('node-fetch');

// ==========================================
// 1. CONFIGURATION
// ==========================================
const CONFIG = {
  // Use Environment Variables or fallback to hardcoded
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "mubashir-2b7cc", 
  APP_ID:     process.env.FIREBASE_APP_ID     || "mubashir-2b7cc",             
  API_KEY:    process.env.FIREBASE_API_KEY    || "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
  SITE_URL:   "https://digitalserviceshub.online"
};

exports.handler = async (event, context) => {
  try {
    console.log("[Sitemap] Generating...");

    // ==========================================
    // 2. DEFINE ALL YOUR STATIC PAGES
    // ==========================================
    const staticPages = [
      { path: '', priority: '1.0', freq: 'daily' },           // Homepage
      { path: '/blog', priority: '0.9', freq: 'daily' },      // Blog Index
      
      // Main Tools
      { path: '/tiktok', priority: '0.8', freq: 'weekly' },
      { path: '/instagram', priority: '0.8', freq: 'weekly' },
      { path: '/twitter-tools', priority: '0.8', freq: 'weekly' },
      { path: '/email-tools', priority: '0.8', freq: 'weekly' },
      { path: '/blog-tools', priority: '0.8', freq: 'weekly' },
      
      // Info Pages
      { path: '/about', priority: '0.7', freq: 'monthly' },
      { path: '/contact', priority: '0.7', freq: 'monthly' },
      
      // Legal Pages
      { path: '/privacy-policy', priority: '0.5', freq: 'yearly' },
      { path: '/terms-conditions', priority: '0.5', freq: 'yearly' },
      { path: '/cookie-policy', priority: '0.5', freq: 'yearly' },
      { path: '/disclaimer', priority: '0.5', freq: 'yearly' }
    ];

    // ==========================================
    // 3. FETCH DYNAMIC BLOG POSTS (Firestore)
    // ==========================================
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/databases/(default)/documents/artifacts/${CONFIG.APP_ID}/public/data:runQuery?key=${CONFIG.API_KEY}`;
    
    // Query: Get all posts where 'published' is true
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "published" },
              op: "EQUAL",
              value: { booleanValue: true }
            }
          },
          limit: 1000 // Max posts to fetch
        }
      })
    });

    const json = await response.json();
    let postUrls = [];

    // Parse Firestore Response
    if (json && Array.isArray(json)) {
       postUrls = json
        .filter(item => item.document) // Filter out empty results
        .map(item => {
            const f = item.document.fields;
            // Use 'slug' if available, otherwise use Document ID
            const slug = f.slug?.stringValue || item.document.name.split('/').pop();
            // Use 'updatedAt' or 'date', fallback to today
            const date = f.updatedAt?.timestampValue || f.date?.stringValue || new Date().toISOString();
            
            return {
                loc: `${CONFIG.SITE_URL}/blog/${slug}`,
                lastmod: date.split('T')[0] // Format: YYYY-MM-DD
            };
        });
    }

    // ==========================================
    // 4. BUILD THE XML
    // ==========================================
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPages.map(page => `
    <url>
        <loc>${CONFIG.SITE_URL}${page.path}</loc>
        <changefreq>${page.freq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('')}

    ${postUrls.map(post => `
    <url>
        <loc>${post.loc}</loc>
        <lastmod>${post.lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`).join('')}
</urlset>`;

    // ==========================================
    // 5. RETURN RESPONSE
    // ==========================================
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      },
      body: xml
    };

  } catch (error) {
    console.error("[Sitemap Error]", error);
    return { 
        statusCode: 500, 
        body: `Error generating sitemap: ${error.message}` 
    };
  }
};
