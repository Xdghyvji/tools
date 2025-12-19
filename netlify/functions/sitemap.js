import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 1. CONFIGURATION (Same as your frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
  authDomain: "mubashir-2b7cc.firebaseapp.com",
  projectId: "mubashir-2b7cc",
  storageBucket: "mubashir-2b7cc.firebasestorage.app",
  messagingSenderId: "107494735119",
  appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = "mubashir-2b7cc";

export const handler = async (event, context) => {
  try {
    // 2. Fetch the Sitemap XML we saved from the Admin Panel
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sitemap');
    const snap = await getDoc(docRef);

    let xmlData = '';

    if (snap.exists()) {
      xmlData = snap.data().xml;
    } else {
      // Fallback if no sitemap exists yet
      xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://digitalserviceshub.online/</loc></url>
</urlset>`;
    }

    // 3. Return as XML Content Type
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: xmlData
    };

  } catch (error) {
    console.error("Sitemap Error:", error);
    return { statusCode: 500, body: "Error generating sitemap" };
  }
};
