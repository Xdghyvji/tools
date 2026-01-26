import { builder } from '@netlify/functions';

const CONFIG = {
  PROJECT_ID: "digitalserviceshub-online", // Check your shared.js
  APP_ID: "mubashir-2b7cc",             
  API_KEY: "AIzaSy..."  // Check your shared.js
};

async function myHandler(event, context) {
  // 1. Get the SLUG from the URL
  const pathParts = event.path.split('/');
  const slug = pathParts[pathParts.length - 1]; // This is now "my-cool-post"

  // 2. RUN A QUERY (Find post where slug == URL)
  // We target the parent collection path to run the query
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

    const json = await response.json();

    // Check if any document was found
    if (!json[0] || !json[0].document) {
      return { statusCode: 404, body: "<h1>Post not found</h1>" };
    }

    const fields = json[0].document.fields;
    const getString = (field) => field?.stringValue || "";

    const postData = {
      title: getString(fields.title),
      content: getString(fields.content),
      image: getString(fields.image),
      date: getString(fields.date),
      author: getString(fields.author) || "Admin"
    };

    // 3. Generate HTML (Same as before)
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postData.title} | DigitalServicesHub</title>
    <meta name="description" content="${postData.title}">
    <meta property="og:title" content="${postData.title}" />
    <meta property="og:image" content="${postData.image}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
      .prose img { border-radius: 0.75rem; margin: 2rem 0; max-width: 100%; height: auto; }
      .prose p { margin-bottom: 1.25rem; line-height: 1.75; color: #334155; }
      .prose h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; color: #0f172a; }
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
                    <span>${postData.date}</span>
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
</html>`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
      ttl: 3600
    };

  } catch (error) {
    console.error("ODB Error:", error);
    return { statusCode: 500, body: "Error generating page" };
  }
}

export const handler = builder(myHandler);
