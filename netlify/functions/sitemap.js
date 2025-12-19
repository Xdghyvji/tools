import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore/lite"; 

const firebaseConfig = {
  apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
  authDomain: "mubashir-2b7cc.firebaseapp.com",
  projectId: "mubashir-2b7cc",
  storageBucket: "mubashir-2b7cc.firebasestorage.app",
  messagingSenderId: "107494735119",
  appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = "mubashir-2b7cc";

export const handler = async (event, context) => {
  try {
    console.log("Function started..."); // Log to Netlify Dashboard
    
    // 1. Target the 'xml' document in the 'sitemap' collection
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sitemap', 'xml');
    
    console.log("Fetching document...");
    const snap = await getDoc(docRef);

    let xmlData = '';

    if (snap.exists()) {
      console.log("Document found!");
      xmlData = snap.data().xml;
    } else {
      console.log("Document does NOT exist. Returning default.");
      xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://digitalserviceshub.online/</loc><priority>1.0</priority></url>
  <url><loc>https://digitalserviceshub.online/debug-mode-active</loc></url>
</urlset>`;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache' // Disable cache for debugging
      },
      body: xmlData
    };

  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    
    // *** THIS WILL SHOW THE REAL ERROR ON YOUR SCREEN ***
    return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'text/plain' },
        body: `CRITICAL SITEMAP ERROR:\n\nMessage: ${error.message}\n\nStack: ${error.stack}` 
    };
  }
};
