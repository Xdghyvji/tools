// ===============================================================
// SHARED.JS - Auto-Injecting Core & AI Logic
// ===============================================================

console.log("🚀 Shared.js is initializing...");

// 1. FIREBASE IMPORTS (Stable v10.13.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// 2. CONFIGURATION
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

// 4. EXPORT SERVICES
export { app, db, auth, appId, onAuthStateChanged, signOut, doc, getDoc };

// ===============================================================
// 5. VIP SYSTEM LOGIC
// ===============================================================
export async function getUserStatus(user) {
    if (!user) return { isVip: false, plan: 'free', name: 'User' };
    try {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            const isVip = data.plan === 'vip' || data.plan === 'pro';
            return { isVip, plan: data.plan || 'free', name: data.name || user.displayName || 'User' };
        }
    } catch (error) { console.warn("VIP Check Error:", error); }
    return { isVip: false, plan: 'free', name: user.displayName || 'User' };
}

// ===============================================================
// 6. AI CONTENT GENERATOR (The Missing Function)
// ===============================================================

/**
 * Generates text content using Google Gemini 1.5 Flash API.
 * @param {string} prompt - The user's input prompt.
 * @returns {Promise<string>} - The generated text.
 */
export async function generateAIContent(prompt) {
    // ⚠️ CRITICAL: Replace this with your actual Gemini API Key from Google AI Studio.
    // Get one here: https://aistudio.google.com/app/apikey
    const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        alert("Please configure your API Key in shared.js to use AI features.");
        throw new Error("API Key not configured");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const data = await response.json();
        
        // Extract text from Gemini response structure
        const text = data.candidates[0].content.parts[0].text;
        return text;

    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw error;
    }
}

// ===============================================================
// 7. UI INJECTION LOGIC
// ===============================================================
const style = document.createElement('style');
style.innerHTML = `.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

function loadHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;

    // Detect Active Page
    const path = window.location.pathname;
    const active = path.includes('index') || path === '/' ? 'home' 
                 : path.includes('blog') ? 'blog' 
                 : path.includes('about') ? 'about' 
                 : path.includes('subscription') ? 'pricing' : '';

    header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-full flex justify-between items-center">
            <a href="/index.html" class="flex items-center gap-2 group">
                <div class="bg-brand-600 text-white p-2 rounded-lg group-hover:bg-brand-700 transition-colors">
                    <i data-lucide="layout-grid" class="w-5 h-5"></i>
                </div>
                <span class="font-bold text-xl tracking-tight text-slate-900">DigitalServices<span class="text-brand-600">Hub</span></span>
            </a>
            <nav class="hidden md:flex items-center gap-8">
                <a href="/index.html" class="${active === 'home' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Home</a>
                <a href="/blog.html" class="${active === 'blog' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Blog</a>
                <a href="/about.html" class="${active === 'about' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">About</a>
                <a href="/subscription.html" class="${active === 'pricing' ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600'} transition-colors text-sm">Pricing</a>
            </nav>
            <div id="auth-action-area" class="hidden md:flex items-center gap-4">
                 <div class="animate-pulse bg-slate-200 w-24 h-9 rounded-full"></div>
            </div>
            <button class="md:hidden text-slate-600" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
        </div>
        <div id="mobile-menu" class="hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-xl md:hidden z-50">
            <a href="/index.html" class="text-slate-600 font-medium">Home</a>
            <a href="/blog.html" class="text-slate-600 font-medium">Blog</a>
            <a href="/subscription.html" class="text-slate-600 font-medium">Pricing</a>
            <div id="mobile-auth-area"><a href="/login.html" class="text-brand-600 font-bold block">Login</a></div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    initAuthUI();
}

function initAuthUI() {
    onAuthStateChanged(auth, async (user) => {
        const desktopArea = document.getElementById('auth-action-area');
        const mobileArea = document.getElementById('mobile-auth-area');
        
        if (user) {
            const { isVip, name } = await getUserStatus(user);
            const initial = (name && name[0]) ? name[0].toUpperCase() : 'U';
            const vipBadge = isVip ? `<div class="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 rounded-full border border-white shadow-sm flex items-center gap-0.5"><i data-lucide="crown" class="w-2 h-2"></i> VIP</div>` : '';

            if(desktopArea) {
                desktopArea.innerHTML = `
                    <div class="relative group cursor-pointer z-50">
                        <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border-2 border-slate-100 shadow-sm relative">${initial}${vipBadge}</div>
                        <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block animate-fade-in z-50">
                            <div class="px-4 py-3 border-b border-slate-50 mb-1">
                                <p class="text-xs text-slate-500 uppercase font-bold mb-1">Signed in as</p>
                                <p class="font-bold text-sm truncate text-slate-900">${name}</p>
                                ${isVip ? '<p class="text-xs text-yellow-600 font-bold mt-1 bg-yellow-50 inline-block px-2 py-0.5 rounded-full border border-yellow-100">★ VIP Active</p>' : ''}
                            </div>
                            ${user.email === 'admin@dsh.online' ? '<a href="/admin/index.html" class="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600">Admin Panel</a>' : ''}
                            <button onclick="window.handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                        </div>
                    </div>`;
            }

            if(mobileArea) {
                mobileArea.innerHTML = `
                    <div class="flex items-center gap-3 border-t border-slate-100 pt-4 mt-2">
                        <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">${initial}</div>
                        <div><p class="text-sm font-bold text-slate-900">${name}</p>${isVip ? '<p class="text-xs text-yellow-600 font-bold">VIP Member</p>' : '<p class="text-xs text-slate-500">Free Plan</p>'}</div>
                        <button onclick="window.handleLogout()" class="ml-auto text-sm text-red-600 font-bold border border-red-100 px-3 py-1 rounded-lg bg-red-50">Logout</button>
                    </div>`;
            }

            if (window.location.pathname.includes('subscription.html') && isVip) {
                document.querySelectorAll('.vip-plan-btn').forEach(btn => {
                    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Current Plan`;
                    btn.disabled = true;
                    btn.className = "w-full py-3 px-6 rounded-xl font-bold transition-all bg-green-100 text-green-700 cursor-default flex items-center justify-center gap-2 border border-green-200";
                });
            }
            if (window.lucide) window.lucide.createIcons();
        } else {
            if(desktopArea) desktopArea.innerHTML = `<a href="/login.html" class="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">Login</a>`;
            if(mobileArea) mobileArea.innerHTML = `<a href="/login.html" class="text-brand-600 font-bold block">Login / Sign Up</a>`;
        }
    });
}

window.handleLogout = () => { signOut(auth).then(() => window.location.href = '/index.html'); };

function loadFooter() {
    const footer = document.getElementById('main-footer');
    if (!footer) return;
    
    const year = new Date().getFullYear();
    footer.innerHTML = `
        <div class="bg-slate-900 text-white py-12 border-t border-slate-800">
            <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div class="col-span-1 md:col-span-2">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="bg-brand-500 text-white p-1.5 rounded-md"><i data-lucide="layout-grid" class="w-5 h-5"></i></div>
                        <span class="font-bold text-xl">DigitalServicesHub</span>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed max-w-sm">Empowering creators with free, AI-powered tools.</p>
                </div>
                <div><h4 class="font-bold mb-4">Tools</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="/tiktok.html" class="hover:text-white">TikTok Tools</a></li><li><a href="/instagram.html" class="hover:text-white">Instagram Tools</a></li></ul></div>
                <div><h4 class="font-bold mb-4">Company</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="/about.html" class="hover:text-white">About</a></li><li><a href="/contact.html" class="hover:text-white">Contact</a></li><li><a href="/privacy.html" class="hover:text-white">Privacy Policy</a></li></ul></div>
            </div>
            <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">&copy; ${year} Digital Services Hub. All rights reserved.</div>
        </div>`;
    initCookieConsent();
    if (window.lucide) window.lucide.createIcons();
}

function initCookieConsent() {
    if (localStorage.getItem('dsh_cookie_consent') === 'true') return;
    const banner = document.createElement('div');
    banner.className = 'fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[100] animate-fade-in p-4 md:p-6';
    banner.innerHTML = `<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"><div class="flex items-start gap-3"><div class="bg-brand-100 text-brand-600 p-2 rounded-lg shrink-0 hidden md:block"><i data-lucide="cookie" class="w-6 h-6"></i></div><div><p class="text-slate-900 font-bold text-sm mb-1">We value your privacy</p><p class="text-slate-600 text-xs md:text-sm leading-relaxed">We use cookies to serve personalized ads. By clicking "Accept", you consent. <a href="/privacy.html" class="text-brand-600 underline">Privacy Policy</a>.</p></div></div><div class="flex gap-3 w-full md:w-auto"><button id="cookie-reject" class="flex-1 md:flex-none py-2 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50">Close</button><button id="cookie-accept" class="flex-1 md:flex-none py-2 px-6 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 shadow-lg">Accept</button></div></div>`;
    document.body.appendChild(banner);
    if(window.lucide) window.lucide.createIcons();
    document.getElementById('cookie-accept').addEventListener('click', () => { localStorage.setItem('dsh_cookie_consent', 'true'); banner.remove(); });
    document.getElementById('cookie-reject').addEventListener('click', () => { localStorage.setItem('dsh_cookie_consent', 'true'); banner.remove(); });
}

// 8. AUTO-EXECUTE (Injects UI automatically)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { loadHeader(); loadFooter(); });
} else {
    loadHeader(); loadFooter();
}
