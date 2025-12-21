// ===============================================================
// SHARED.JS - Global Configuration, UI & Core Logic
// ===============================================================

// 1. FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// 2. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
  authDomain: "mubashir-2b7cc.firebaseapp.com",
  projectId: "mubashir-2b7cc",
  storageBucket: "mubashir-2b7cc.firebasestorage.app",
  messagingSenderId: "107494735119",
  appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a"
};

// 3. INITIALIZE SERVICES
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "mubashir-2b7cc";

// 4. STATE MANAGEMENT
let globalSettings = {};
let systemPrompts = {};

// ===============================================================
// 5. CORE FUNCTIONS (AI & DATA)
// ===============================================================

/**
 * Loads global site settings (SEO, Ads, etc.) from Firestore
 */
export async function loadGlobalSettings() {
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            globalSettings = snap.data();
            
            // Auto-inject global scripts if present (e.g., Analytics)
            if (globalSettings.scripts) {
                const range = document.createRange();
                const fragment = range.createContextualFragment(globalSettings.scripts);
                document.head.appendChild(fragment);
            }
            return globalSettings;
        }
    } catch (e) { 
        console.error("Settings Load Error:", e); 
    }
    return null;
}

/**
 * Loads all system prompts from Firestore into memory
 */
export async function loadSystemPrompts() {
    try {
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'system_prompts');
        const snap = await getDocs(colRef);
        snap.forEach(doc => {
            systemPrompts[doc.id] = doc.data().template;
        });
        return systemPrompts;
    } catch (e) { 
        console.error("Prompts Load Error:", e); 
        return {};
    }
}

/**
 * Retrieves and formats a specific prompt template
 */
export function getPromptForTool(toolKey, userInput) {
    const template = systemPrompts[toolKey];
    if (!template) {
        console.warn(`Prompt template not found for key: ${toolKey}`);
        return `Please generate content about: ${userInput}`; // Fallback
    }
    // Simple template replacement
    return template.replace(/\$\{topic\}/g, userInput);
}

/**
 * Calls the backend Netlify function to generate AI content
 */
export async function generateAIContent(prompt, toolKey = 'custom', topic = '') {
    // 1. Log the attempt (optional: fire & forget)
    if (auth.currentUser) {
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs'), {
            user: auth.currentUser.uid,
            tool: toolKey,
            topic: topic,
            createdAt: serverTimestamp()
        }).catch(e => console.warn("Logging failed:", e));
    }

    // 2. Call Serverless Function
    try {
        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                metadata: { tool: toolKey, topic: topic } 
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "AI Generation Service Failed");
        }
        
        return data.text;

    } catch (error) {
        console.error("AI Error:", error);
        throw error; // Re-throw for UI to handle
    }
}

// ===============================================================
// 6. SHARED UI COMPONENTS
// ===============================================================

export function loadHeader(activePage = '') {
    const header = document.getElementById('main-header');
    if (!header) return;

    header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-full flex justify-between items-center">
            <a href="/index.html" class="flex items-center gap-2 group">
                <div class="bg-brand-600 text-white p-2 rounded-lg group-hover:bg-brand-700 transition-colors">
                    <i data-lucide="layout-grid" class="w-5 h-5"></i>
                </div>
                <span class="font-bold text-xl tracking-tight text-slate-900">DigitalServices<span class="text-brand-600">Hub</span></span>
            </a>

            <nav class="hidden md:flex items-center gap-8">
                <a href="/index.html" class="${activePage === 'home' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Home</a>
                <a href="/blog.html" class="${activePage === 'blog' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Blog</a>
                <a href="/about.html" class="${activePage === 'about' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">About</a>
                <a href="/contact.html" class="${activePage === 'contact' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Contact</a>
            </nav>

            <div class="hidden md:flex items-center gap-4">
                 <a href="/subscription.html" class="text-slate-900 hover:text-brand-600 font-medium text-sm">Pricing</a>
                 <div id="auth-container">
                    <a href="/login.html" class="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">Login</a>
                 </div>
            </div>

            <button class="md:hidden text-slate-600" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
        </div>

        <div id="mobile-menu" class="hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-xl md:hidden">
            <a href="/index.html" class="text-slate-600 font-medium">Home</a>
            <a href="/blog.html" class="text-slate-600 font-medium">Blog</a>
            <a href="/about.html" class="text-slate-600 font-medium">About</a>
            <a href="/login.html" class="text-brand-600 font-bold">Login / Sign Up</a>
        </div>
    `;

    // Dynamic Auth State Update
    onAuthStateChanged(auth, (user) => {
        const container = document.getElementById('auth-container');
        if (container && user) {
            container.innerHTML = `
                <a href="/userprofile.html" class="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand-600">
                    <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center border border-brand-200">
                        ${(user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span>My Account</span>
                </a>
            `;
        }
    });

    if (window.lucide) window.lucide.createIcons();
}

export function loadFooter() {
    const footer = document.getElementById('main-footer');
    if (!footer) return;

    const year = new Date().getFullYear();

    footer.innerHTML = `
        <div class="bg-slate-900 text-white py-12 border-t border-slate-800">
            <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div class="col-span-1 md:col-span-2">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="bg-brand-500 text-white p-1.5 rounded-md">
                            <i data-lucide="layout-grid" class="w-5 h-5"></i>
                        </div>
                        <span class="font-bold text-xl">DigitalServicesHub</span>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
                        Empowering creators and marketers with free, AI-powered tools to grow their online presence. Join thousands of users today.
                    </p>
                </div>
                
                <div>
                    <h4 class="font-bold mb-4">Tools</h4>
                    <ul class="space-y-2 text-sm text-slate-400">
                        <li><a href="/tiktok.html" class="hover:text-white">TikTok Viral Tools</a></li>
                        <li><a href="/instagram.html" class="hover:text-white">Instagram Downloader</a></li>
                        <li><a href="/email-tools.html" class="hover:text-white">Email Extractor</a></li>
                        <li><a href="/blog-tools.html" class="hover:text-white">Blog Generator</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Company</h4>
                    <ul class="space-y-2 text-sm text-slate-400">
                        <li><a href="/about.html" class="hover:text-white">About Us</a></li>
                        <li><a href="/contact.html" class="hover:text-white">Contact</a></li>
                        <li><a href="/privacy.html" class="hover:text-white">Privacy Policy</a></li>
                        <li><a href="/terms.html" class="hover:text-white">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                &copy; ${year} Digital Services Hub. All rights reserved.
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

// 7. EXPORT EVERYTHING
export { 
    app, 
    db, 
    auth, 
    appId, 
    onAuthStateChanged, 
    signOut 
};
