/**
 * DigitalServicesHub - Shared Core Logic (Production Grade)
 * Features:
 * - Robust Firebase Auth with User Profile Caching
 * - Batched Analytics Engine (Cost Optimized)
 * - GDPR Compliant Cookie Consent
 * - Dynamic Header/Footer Injection with Active State
 * - Centralized Error Handling
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, writeBatch, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

console.log("🚀 System: Initializing Core Services v2.0...");

// ==========================================
// 1. FIREBASE CONFIGURATION & INIT
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
    authDomain: "mubashir-2b7cc.firebaseapp.com",
    projectId: "mubashir-2b7cc",
    storageBucket: "mubashir-2b7cc.firebasestorage.app",
    messagingSenderId: "107494735119",
    appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a",
    measurementId: "G-SP28C45HH4"
};

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Enable offline persistence for better UX on mobile
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open.');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence not supported by browser.');
        }
    });

    console.log("✅ Firebase: Services Connected");
} catch (e) {
    console.error("❌ Firebase: Critical Init Failure", e);
}

const appId = 'mubashir-2b7cc';

// ==========================================
// 2. AUTH MANAGER (Caching & State)
// ==========================================
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.listeners = [];
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                // Try to get cached profile first to save reads
                const cached = sessionStorage.getItem(`dsh_user_${user.uid}`);
                if (cached) {
                    this.userProfile = JSON.parse(cached);
                    this.broadcast(user, this.userProfile);
                }
                
                // Fetch fresh data in background
                try {
                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        this.userProfile = snap.data();
                        sessionStorage.setItem(`dsh_user_${user.uid}`, JSON.stringify(this.userProfile));
                    }
                } catch (e) {
                    console.warn("Auth: Profile fetch warning", e);
                }
            } else {
                this.userProfile = null;
                sessionStorage.clear(); // Clear sensitive data on logout
            }
            
            this.broadcast(user, this.userProfile);
            this.updateUI(user);
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
        // Immediate callback with current state
        if (auth.currentUser !== undefined) callback(auth.currentUser, this.userProfile);
    }

    broadcast(user, profile) {
        this.listeners.forEach(cb => cb(user, profile));
    }

    updateUI(user) {
        // Handle "Log In" vs "Dashboard" button in Header
        const authBtn = document.getElementById('nav-auth-btn');
        const mobileAuthBtn = document.getElementById('mobile-nav-auth-btn');
        
        if (authBtn) {
            if (user) {
                const isAdmin = user.email === "admin@dsh.online";
                const target = isAdmin ? '/admin/index.html' : '/userprofile.html';
                const label = isAdmin ? 'Admin Panel' : 'My Dashboard';
                
                authBtn.href = target;
                authBtn.innerHTML = `${label}`;
                authBtn.classList.remove('text-slate-600');
                authBtn.classList.add('text-brand-600');
                
                if(mobileAuthBtn) {
                    mobileAuthBtn.href = target;
                    mobileAuthBtn.innerHTML = label;
                }
            } else {
                authBtn.href = '/login.html';
                authBtn.innerHTML = 'Log in';
                if(mobileAuthBtn) {
                    mobileAuthBtn.href = '/login.html';
                    mobileAuthBtn.innerHTML = 'Log in';
                }
            }
        }
    }
}

const authManager = new AuthManager();

// ==========================================
// 3. UI INJECTOR (Header/Footer/Active State)
// ==========================================
export function loadHeader(activePage = '') {
    const header = document.getElementById('main-header');
    if (!header) return console.error("UI: #main-header element missing");

    // Determine active page automatically if not provided
    const path = window.location.pathname;
    const current = activePage || (path === '/' || path.includes('index') ? 'home' : 
                                  path.includes('blog') ? 'blog' : 
                                  path.includes('pricing') || path.includes('subscription') ? 'pricing' : 
                                  path.includes('contact') ? 'contact' : '');

    const isActive = (name) => current === name ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50';

    header.innerHTML = `
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="/index.html" class="flex items-center gap-2 group">
                <div class="w-10 h-10 bg-gradient-to-br from-brand-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">D</div>
                <span class="font-bold text-xl text-slate-900 tracking-tight group-hover:text-brand-600 transition-colors">DigitalServices<span class="text-brand-600">Hub</span></span>
            </a>

            <!-- Desktop Nav -->
            <div class="hidden md:flex items-center gap-2">
                <a href="/index.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('home')}">Home</a>
                
                <div class="relative group">
                    <button class="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 flex items-center gap-1 transition-all">
                        Tools <i data-lucide="chevron-down" class="w-4 h-4 transition-transform group-hover:rotate-180"></i>
                    </button>
                    <!-- Mega Menu Dropdown -->
                    <div class="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 z-50">
                        <a href="/tiktok.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors">
                            <i data-lucide="music-2" class="w-4 h-4"></i> TikTok Tools
                        </a>
                        <a href="/instagram.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors">
                            <i data-lucide="instagram" class="w-4 h-4"></i> Instagram Tools
                        </a>
                        <a href="/twitter-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors">
                            <i data-lucide="twitter" class="w-4 h-4"></i> Twitter Tools
                        </a>
                        <div class="h-px bg-slate-100 my-1"></div>
                        <a href="/email-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors">
                            <i data-lucide="mail" class="w-4 h-4"></i> Email Extractor
                        </a>
                        <a href="/blog-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors">
                            <i data-lucide="pen-tool" class="w-4 h-4"></i> AI Blog Writer
                        </a>
                    </div>
                </div>

                <a href="/blog.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('blog')}">Blog</a>
                <a href="/subscription.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('pricing')}">Pricing</a>
                <a href="/contact.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('contact')}">Contact</a>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
                <a href="/login.html" id="nav-auth-btn" class="hidden md:flex px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors">
                    Log in
                </a>
                <a href="/subscription.html" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-brand-600/30 transition-all duration-300 transform hover:-translate-y-0.5">
                    Get Started
                </a>
                <button id="mobile-menu-btn" class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </nav>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu" class="hidden md:hidden fixed inset-0 z-[60] bg-white">
            <div class="flex justify-between items-center p-4 border-b border-slate-100">
                <span class="font-bold text-xl text-slate-900">Menu</span>
                <button id="close-mobile-menu" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div class="flex flex-col p-4 gap-2 overflow-y-auto">
                <a href="/index.html" class="p-3 text-sm font-bold rounded-lg ${isActive('home')}">Home</a>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tools</span>
                    <div class="grid grid-cols-2 gap-2">
                        <a href="/tiktok.html" class="p-2 bg-white border border-slate-200 rounded text-center text-sm font-medium">TikTok</a>
                        <a href="/instagram.html" class="p-2 bg-white border border-slate-200 rounded text-center text-sm font-medium">Instagram</a>
                        <a href="/blog-tools.html" class="p-2 bg-white border border-slate-200 rounded text-center text-sm font-medium">Blog AI</a>
                        <a href="/email-tools.html" class="p-2 bg-white border border-slate-200 rounded text-center text-sm font-medium">Email</a>
                    </div>
                </div>
                <a href="/blog.html" class="p-3 text-sm font-bold rounded-lg ${isActive('blog')}">Blog</a>
                <a href="/subscription.html" class="p-3 text-sm font-bold rounded-lg ${isActive('pricing')}">Pricing</a>
                <a href="/contact.html" class="p-3 text-sm font-bold rounded-lg ${isActive('contact')}">Contact</a>
                <div class="h-px bg-slate-100 my-2"></div>
                <a href="/login.html" id="mobile-nav-auth-btn" class="p-3 text-center text-sm font-bold text-brand-600 bg-brand-50 rounded-lg">Log in</a>
            </div>
        </div>
    `;

    // Mobile Menu Logic
    const btn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-mobile-menu');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu && closeBtn) {
        btn.onclick = () => {
            menu.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        };
        closeBtn.onclick = () => {
            menu.classList.add('hidden');
            document.body.style.overflow = '';
        };
    }

    if(window.lucide) window.lucide.createIcons();
    authManager.init(); // Initialize auth listener after UI render
}

export function loadFooter() {
    const footer = document.getElementById('main-footer');
    if (!footer) return;

    footer.className = "bg-slate-900 text-slate-300 border-t border-slate-800";
    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="col-span-1 md:col-span-2">
                    <a href="/index.html" class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
                        <span class="font-bold text-xl text-white">DigitalServicesHub</span>
                    </a>
                    <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                        Empowering creators with free, professional-grade AI tools. Built for scale, security, and speed.
                    </p>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><i data-lucide="github" class="w-5 h-5"></i></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Product</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/tiktok.html" class="hover:text-brand-400 transition-colors">TikTok Downloader</a></li>
                        <li><a href="/instagram.html" class="hover:text-brand-400 transition-colors">Instagram Tools</a></li>
                        <li><a href="/email-tools.html" class="hover:text-brand-400 transition-colors">Email Extractor</a></li>
                        <li><a href="/blog-tools.html" class="hover:text-brand-400 transition-colors">AI Blog Writer</a></li>
                        <li><a href="/subscription.html" class="hover:text-brand-400 transition-colors"><span class="bg-brand-900 text-brand-300 px-2 py-0.5 rounded text-xs font-bold mr-1">NEW</span> Pricing</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Company</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/about.html" class="hover:text-brand-400 transition-colors">About Us</a></li>
                        <li><a href="/privacy.html" class="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="/terms.html" class="hover:text-brand-400 transition-colors">Terms of Service</a></li>
                        <li><a href="/contact.html" class="hover:text-brand-400 transition-colors">Contact Support</a></li>
                        <li><a href="/login.html" class="hover:text-brand-400 transition-colors">Admin Login</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-500 text-sm">© ${new Date().getFullYear()} Digital Services Hub. All rights reserved.</p>
                <div class="flex items-center gap-2 text-xs text-slate-600">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span> Systems Operational
                </div>
            </div>
        </div>
    `;
    if(window.lucide) window.lucide.createIcons();
}

// ==========================================
// 4. POWERFUL ANALYTICS (Batched & Efficient)
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.queue = [];
        this.ipData = null;
        this.sessionId = sessionStorage.getItem('dsh_session_id') || this.createSession();
        this.isTracking = false;
        this.flushInterval = null;
    }

    createSession() {
        const id = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('dsh_session_id', id);
        return id;
    }

    async init() {
        const consent = localStorage.getItem('dsh_cookie_consent');
        if (consent === 'rejected') return console.log("Analytics: Disabled by user.");
        if (!consent) return CookieManager.show();

        this.isTracking = true;
        
        // Non-blocking Geo Fetch
        this.fetchGeo().then(data => this.ipData = data);

        // Track Page View
        this.track('page_view', {
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer || 'Direct'
        });

        // Set up Listeners
        this.setupClickTracking();
        
        // Auto-flush every 10 seconds or when queue > 5
        this.flushInterval = setInterval(() => this.flush(), 10000);
        window.addEventListener('beforeunload', () => this.flush());
    }

    async fetchGeo() {
        try {
            // Use a 2s timeout to prevent hanging
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(id);
            if(res.ok) return await res.json();
        } catch (e) {
            return { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown' };
        }
    }

    track(eventName, details = {}) {
        if (!this.isTracking) return;

        const event = {
            type: eventName,
            sessionId: this.sessionId,
            timestamp: serverTimestamp(),
            // If IP data isn't ready yet, we send null, server can handle or next event will have it
            geo: this.ipData || { ip: 'Fetching...' }, 
            data: details,
            url: window.location.href,
            device: this.getDeviceType()
        };

        this.queue.push(event);
        if (this.queue.length >= 5) this.flush();
    }

    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, .trackable');
            if (target) {
                const isAd = target.id.includes('ad') || target.closest('[id*="ad-"]');
                this.track(isAd ? 'ad_click' : 'click', {
                    tag: target.tagName,
                    id: target.id || 'na',
                    text: target.innerText?.substring(0, 50) || 'icon',
                    href: target.href || null
                });
            }
        });
    }

    async flush() {
        if (this.queue.length === 0) return;

        const batch = writeBatch(db);
        const eventsToSend = [...this.queue];
        this.queue = []; // Clear local queue immediately

        try {
            eventsToSend.forEach(evt => {
                const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'));
                batch.set(ref, evt);
            });
            await batch.commit();
            console.log(`Analytics: Flushed ${eventsToSend.length} events.`);
        } catch (e) {
            console.warn("Analytics: Flush failed", e);
            // Optionally re-queue failed events if critical
        }
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobile|Android|iP(hone|od)/.test(ua)) return "Mobile";
        if (/Tablet|iPad/.test(ua)) return "Tablet";
        return "Desktop";
    }
}

const analytics = new AnalyticsEngine();

// ==========================================
// 5. COOKIE MANAGER (GDPR Compliant)
// ==========================================
const CookieManager = {
    show: () => {
        if (document.getElementById('cookie-consent-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'cookie-consent-modal';
        modal.className = "fixed bottom-0 left-0 right-0 p-4 z-[9999] animate-fade-in";
        modal.innerHTML = `
            <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6 transform transition-all duration-500 translate-y-20 opacity-0" id="cookie-inner">
                <div class="p-3 bg-brand-50 rounded-full text-brand-600 flex-shrink-0">
                    <i data-lucide="cookie" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-slate-900 text-lg mb-1">We value your privacy</h3>
                    <p class="text-sm text-slate-500 leading-relaxed">
                        We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                        <a href="/privacy.html" class="text-brand-600 hover:underline font-medium">Read Policy</a>.
                    </p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <button id="cookie-reject" class="flex-1 md:flex-none px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm transition-colors">Reject</button>
                    <button id="cookie-accept" class="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-black text-sm shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) window.lucide.createIcons();

        // Animation
        setTimeout(() => {
            const inner = document.getElementById('cookie-inner');
            inner.classList.remove('translate-y-20', 'opacity-0');
        }, 100);

        // Handlers
        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            document.getElementById('cookie-consent-modal').remove();
            analytics.init(); // Start tracking
        };
        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            document.getElementById('cookie-consent-modal').remove();
        };
    }
};

// ==========================================
// 6. GLOBAL HELPERS
// ==========================================

// Global settings loader (cached)
let globalSettings = null;
export async function loadGlobalSettings() {
    if (globalSettings) return globalSettings;
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            globalSettings = snap.data();
            
            // Apply Global SEO
            if(globalSettings.title) document.title = globalSettings.title;
            
            // Inject Ad Scripts if not admin
            if(auth.currentUser?.email !== "admin@dsh.online") {
                injectAds(globalSettings);
            }
            
            return globalSettings;
        }
    } catch (e) {
        console.warn("Settings: Load failed", e);
    }
    return null;
}

function injectAds(settings) {
    if(!settings.adsense) return;
    // Basic AdSense Injection (Production: Use a tag manager)
    // const script = document.createElement('script');
    // script.innerHTML = settings.adsense;
    // document.head.appendChild(script);
}

export async function loadSystemPrompts() {
    // Placeholder for prompt loading logic
    return true;
}

export function getPromptForTool(toolKey, input) {
    // Basic Fallback if DB load fails
    const fallbacks = {
        'default': `Generate content for ${input}`
    };
    return fallbacks[toolKey] || `Act as an expert. ${input}`;
}

// AI Content Bridge
export async function generateAIContent(prompt, tool = 'unknown', topic = '') {
    if (!auth.currentUser && !localStorage.getItem('dsh_guest_allowed')) {
        // Optional: Enforce login for AI
        // return "Please login to use AI tools.";
    }

    // Log usage
    if (auth.currentUser) {
        // Update user stats
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', auth.currentUser.uid);
        // We use a safe increment via an update if possible, or just log to analytics
    }

    analytics.track('generation', { tool, topic });

    try {
        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Generation failed');
        const data = await response.json();
        return data.text;
    } catch (e) {
        console.error("AI Error:", e);
        throw new Error("AI Service Busy. Please try again.");
    }
}

// Initialize Analytics on Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

// Export Auth State for use in other modules
export { auth, db, appId, onAuthStateChanged, analytics };
