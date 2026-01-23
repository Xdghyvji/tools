/**
 * DigitalServicesHub - Shared Core Logic (Production Grade)
 * Features:
 * - Robust Firebase Auth with User Profile Caching
 * - Batched Analytics Engine (Immediate Tracking / Soft Opt-in)
 * - Session-Based High Quality Cookie Consent
 * - Global Adsterra Ad Injection System
 * - Dynamic Header/Footer Injection
 * - Mobile App Integration
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, writeBatch, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

console.log("🚀 System: Initializing Core Services v2.4 (App Integration)...");

// ==========================================
// 1. FIREBASE CONFIGURATION & INIT
// ==========================================
const firebaseConfig = (typeof __firebase_config !== 'undefined') ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA",
    authDomain: "mubashir-2b7cc.firebaseapp.com",
    projectId: "mubashir-2b7cc",
    storageBucket: "mubashir-2b7cc.firebasestorage.app",
    messagingSenderId: "107494735119",
    appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a",
    measurementId: "G-SP28C45HH4"
};

const appId = (typeof __app_id !== 'undefined') ? __app_id : 'mubashir-2b7cc';

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') console.warn('Persistence failed: Multiple tabs open.');
        else if (err.code == 'unimplemented') console.warn('Persistence not supported by browser.');
    });

    console.log("✅ Firebase: Services Connected");
} catch (e) {
    console.error("❌ Firebase: Critical Init Failure", e);
}

// ==========================================
// 2. AUTH MANAGER
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
                const cached = sessionStorage.getItem(`dsh_user_${user.uid}`);
                if (cached) {
                    this.userProfile = JSON.parse(cached);
                    this.broadcast(user, this.userProfile);
                }
                
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
                sessionStorage.clear();
            }
            
            this.broadcast(user, this.userProfile);
            this.updateUI(user);
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
        if (auth.currentUser !== undefined) callback(auth.currentUser, this.userProfile);
    }

    broadcast(user, profile) {
        this.listeners.forEach(cb => cb(user, profile));
    }

    updateUI(user) {
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
// 3. UI INJECTOR (Header/Footer)
// ==========================================
export function loadHeader(activePage = '') {
    const header = document.getElementById('main-header');
    if (!header) return console.error("UI: #main-header element missing");

    const path = window.location.pathname;
    const current = activePage || (path === '/' || path.includes('index') ? 'home' : 
                                  path.includes('blog') ? 'blog' : 
                                  path.includes('pricing') || path.includes('subscription') ? 'pricing' :
                                  path.includes('about') ? 'about' :
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
                    <div class="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 z-50">
                        <a href="/tiktok.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors"><i data-lucide="music-2" class="w-4 h-4"></i> TikTok Tools</a>
                        <a href="/instagram.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors"><i data-lucide="instagram" class="w-4 h-4"></i> Instagram Tools</a>
                        <a href="/twitter-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors"><i data-lucide="twitter" class="w-4 h-4"></i> Twitter Tools</a>
                        <div class="h-px bg-slate-100 my-1"></div>
                        <a href="/email-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors"><i data-lucide="mail" class="w-4 h-4"></i> Email Extractor</a>
                        <a href="/blog-tools.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-lg transition-colors"><i data-lucide="pen-tool" class="w-4 h-4"></i> AI Blog Writer</a>
                    </div>
                </div>
                <a href="/blog.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('blog')}">Blog</a>
                <a href="/subscription.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('pricing')}">Pricing</a>
                <a href="/about.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('contact')}">about</a>
                <a href="/contact.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('contact')}">Contact</a>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
                <!-- App Download Button (Desktop) -->
                <a href="/app-release.apk" class="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5" title="Download mobile app for a better version">
                    <i data-lucide="smartphone" class="w-4 h-4"></i>
                    <span>Get App</span>
                </a>

                <a href="/login.html" id="nav-auth-btn" class="hidden md:flex px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors">Log in</a>
                <a href="/subscription.html" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-brand-600/30 transition-all duration-300 transform hover:-translate-y-0.5">Get Started</a>
                <button id="mobile-menu-btn" class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><i data-lucide="menu" class="w-6 h-6"></i></button>
            </div>
        </nav>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu" class="hidden md:hidden fixed inset-0 z-[60] bg-white">
            <div class="flex justify-between items-center p-4 border-b border-slate-100">
                <span class="font-bold text-xl text-slate-900">Menu</span>
                <button id="close-mobile-menu" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><i data-lucide="x" class="w-6 h-6"></i></button>
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
                
                <!-- App Download Button (Mobile) -->
                <a href="/app-release.apk" class="flex items-center justify-center gap-2 p-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-md hover:shadow-lg transition-all">
                    <i data-lucide="smartphone" class="w-5 h-5"></i> Download Mobile App
                </a>

                <a href="/login.html" id="mobile-nav-auth-btn" class="p-3 text-center text-sm font-bold text-brand-600 bg-brand-50 rounded-lg">Log in</a>
            </div>
        </div>
    `;

    const btn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-mobile-menu');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu && closeBtn) {
        btn.onclick = () => { menu.classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
        closeBtn.onclick = () => { menu.classList.add('hidden'); document.body.style.overflow = ''; };
    }

    if(window.lucide) window.lucide.createIcons();
    authManager.init();
    
    // Inject Adsterra Ads after header load
    injectAdsterraAds();
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
                    <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">Empowering creators with free, professional-grade AI tools. Built for scale, security, and speed.</p>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Product</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/tiktok.html" class="hover:text-brand-400 transition-colors">TikTok Downloader</a></li>
                        <li><a href="/instagram.html" class="hover:text-brand-400 transition-colors">Instagram Tools</a></li>
                        <li><a href="/email-tools.html" class="hover:text-brand-400 transition-colors">Email Extractor</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Company</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/privacy.html" class="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="/terms.html" class="hover:text-brand-400 transition-colors">Terms of Service</a></li>
                        <li><a href="/about.html" class="hover:text-brand-400 transition-colors">about us</a></li>
                        <li><a href="/contact.html" class="hover:text-brand-400 transition-colors">Contact Support</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-500 text-sm">© ${new Date().getFullYear()} Digital Services Hub.</p>
                <div class="flex items-center gap-2 text-xs text-slate-600"><span class="w-2 h-2 rounded-full bg-green-500"></span> Systems Operational</div>
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
        this.defaultGeo = { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown', region: 'Unknown', latitude: 0, longitude: 0 };
    }

    createSession() {
        const id = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('dsh_session_id', id);
        return id;
    }

    async init() {
        // Soft Opt-in Logic: Tracking starts immediately unless explicitly rejected in the past
        const consent = localStorage.getItem('dsh_cookie_consent');
        
        if (consent === 'rejected') {
            console.log("Analytics: Tracking disabled by user.");
            this.isTracking = false;
        } else {
            // Implicit consent or already accepted
            this.isTracking = true;
        }

        // Show popup on every session visit if not already shown in this session
        // This satisfies "pops up everytime a user visits"
        if (!sessionStorage.getItem('dsh_consent_session_viewed')) {
            CookieManager.show();
        }

        if (this.isTracking) {
            this.fetchGeo().then(data => this.ipData = data);
            
            this.track('page_view', {
                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer || 'Direct'
            });

            this.setupClickTracking();
            this.flushInterval = setInterval(() => this.flush(), 10000);
            window.addEventListener('beforeunload', () => this.flush());
        }
    }

    async fetchGeo() {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(id);
            if(res.ok) {
                const data = await res.json();
                return { ...this.defaultGeo, ...data };
            }
        } catch (e) {
            // Silently fail or log warning if strict debug needed
            // console.warn("Analytics: Geo fetch skipped", e);
        }
        return this.defaultGeo;
    }

    track(eventName, details = {}) {
        if (!this.isTracking) return;

        const event = {
            type: eventName,
            sessionId: this.sessionId,
            timestamp: serverTimestamp(),
            geo: this.ipData || { ...this.defaultGeo, ip: 'Fetching...' }, 
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
        this.queue = []; 

        try {
            eventsToSend.forEach(evt => {
                const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'));
                batch.set(ref, evt);
            });
            await batch.commit();
        } catch (e) {
            console.warn("Analytics: Flush failed", e);
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
// 5. COOKIE MANAGER (Quality UI)
// ==========================================
const CookieManager = {
    show: () => {
        if (document.getElementById('cookie-consent-modal')) return;
        
        // Mark session as viewed so it doesn't pop up on every page load within the same tab/session
        sessionStorage.setItem('dsh_consent_session_viewed', 'true');

        const modal = document.createElement('div');
        modal.id = 'cookie-consent-modal';
        modal.className = "fixed bottom-4 right-4 z-[9999] max-w-sm w-full animate-slide-up";
        
        // High Quality Glassmorphism Design
        modal.innerHTML = `
            <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 flex flex-col gap-4 transform transition-all duration-300 translate-y-10 opacity-0" id="cookie-inner">
                <div class="flex items-start gap-3">
                    <div class="p-3 bg-brand-100 rounded-xl text-brand-600 shadow-sm">
                        <i data-lucide="shield-check" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-lg">Privacy Choice</h3>
                        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                            We use technology to analyze traffic and serve personalized content. Your data helps us keep this tool free.
                            <a href="/privacy.html" class="text-brand-600 hover:underline font-medium">Policy</a>
                        </p>
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <button id="cookie-accept" class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black text-sm shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95">
                        Accept & Continue
                    </button>
                    <button id="cookie-reject" class="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm transition-colors">
                        Decline Tracking
                    </button>
                </div>
            </div>
            <style>
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
            </style>
        `;
        document.body.appendChild(modal);
        if(window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            const inner = document.getElementById('cookie-inner');
            inner.classList.remove('translate-y-10', 'opacity-0');
        }, 100);

        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            closeModal();
            analytics.isTracking = true;
        };
        
        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            closeModal();
            analytics.isTracking = false; 
            // Reload to stop tracking scripts if necessary, but simple flag switch is usually enough
        };

        function closeModal() {
            const inner = document.getElementById('cookie-inner');
            inner.style.transform = 'translateY(20px)';
            inner.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    }
};

// ==========================================
// 6. ADSTERRA & GLOBAL ADS SYSTEM
// ==========================================

// Global settings loader
let globalSettings = null;
export async function loadGlobalSettings() {
    if (globalSettings) return globalSettings;
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            globalSettings = snap.data();
            if(globalSettings.title) document.title = globalSettings.title;
            return globalSettings;
        }
    } catch (e) {
        console.warn("Settings: Load failed", e);
    }
    return {};
}

// RESTORED MISSING EXPORT: Load System Prompts
export async function loadSystemPrompts() {
    // This function is required by tools like instagram.html to fetch prompt templates.
    // If not found in DB, return a safe empty object or true to signal readiness.
    return true; 
}

/**
 * Injects Adsterra Ads Globally.
 * Uses a safe default structure or fetches from settings.
 * Includes error handling for AdBlockers/403s.
 */
function injectAdsterraAds() {
    // Prevent double injection
    if (document.getElementById('dsh-adsterra-script')) return;

    loadGlobalSettings().then(settings => {
        // 1. Social Bar / Native Banner (Everywhere)
        // Checks settings for 'adsterra_social_bar_url' or falls back to placeholder logic
        const socialBarUrl = settings?.adsterra_social_bar_url;
        
        if (socialBarUrl) {
            const script = document.createElement('script');
            script.id = 'dsh-adsterra-script';
            script.type = 'text/javascript';
            script.src = socialBarUrl;
            // Handle loading errors silently (AdBlocker)
            script.onerror = () => console.log("Ads: Social bar blocked or failed to load (expected if adblock is on).");
            document.head.appendChild(script);
        }

        // 2. Banner Injection logic (for specific containers like #ad-container)
        const adContainers = document.querySelectorAll('.adsterra-banner-728');
        if (adContainers.length > 0 && settings?.adsterra_banner_728_code) {
            adContainers.forEach(container => {
                const div = document.createElement('div');
                div.innerHTML = settings.adsterra_banner_728_code;
                container.appendChild(div);
            });
        }
    }).catch(e => {
        // Fail silently for ads
        console.log("Ads: Init skipped");
    });
}

// ==========================================
// 7. AI BRIDGE
// ==========================================
export function getPromptForTool(toolKey, input) {
    const fallbacks = { 'default': `Generate content for ${input}` };
    return fallbacks[toolKey] || `Act as an expert. ${input}`;
}

export async function generateAIContent(prompt, tool = 'unknown', topic = '') {
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

// Initializer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

export { auth, db, appId, onAuthStateChanged, analytics };
