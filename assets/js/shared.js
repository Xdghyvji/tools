/**
 * DigitalServicesHub - Shared Core Logic (Production Grade v3.1)
 * Features:
 * - Robust Firebase Auth with User Profile Caching
 * - Batched Analytics Engine (Immediate Tracking / Soft Opt-in)
 * - Session-Based High Quality Cookie Consent (AdSense Compliant)
 * - Global Adsterra & AdSense Injection System (Lazy Loaded for LCP)
 * - Dynamic Header/Footer (Responsive Mobile Menu + Dropdowns)
 * - Real-time Presence & Performance Monitoring
 * - Multi-Tab Persistence Fix (No more Internal Assertion Failures)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// UPDATED IMPORTS: Added 'enableMultiTabIndexedDbPersistence' and all Firestore helpers needed for Admin
import { 
    getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, 
    writeBatch, query, where, limit, orderBy, serverTimestamp, 
    enableMultiTabIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

console.log("🚀 System: Initializing Core Services v3.1...");

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

let app, db, auth, provider, analyticsInstance;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    analyticsInstance = getAnalytics(app);
    
    // CRITICAL FIX: Use Multi-Tab Persistence instead of standard
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
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
        // Desktop Button
        const authBtn = document.getElementById('nav-auth-btn');
        // Mobile Button
        const mobileAuthBtn = document.getElementById('mobile-nav-auth-btn');
        
        const updateBtn = (btn) => {
            if (!btn) return;
            if (user) {
                const isAdmin = user.email === "admin@dsh.online"; // Update with your actual admin email if different
                const target = isAdmin ? '/admin/index.html' : '/userprofile.html';
                const label = isAdmin ? 'Admin Panel' : 'Dashboard';
                
                btn.href = target;
                btn.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> ${label}`;
                
                // Style adjustment for logged in state
                if(btn.id === 'nav-auth-btn') {
                    btn.classList.remove('text-slate-600');
                    btn.classList.add('text-brand-600', 'bg-brand-50');
                }
            } else {
                btn.href = '/login.html';
                btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> Log in`;
            }
        };

        updateBtn(authBtn);
        updateBtn(mobileAuthBtn);
        if(window.lucide) window.lucide.createIcons();
    }
}

const authManager = new AuthManager();

// ==========================================
// 3. UI INJECTOR (Responsive Header & Footer)
// ==========================================

// Global Favicon Injector
function injectFavicon() {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/assets/img/digitalserviceshub.png';
    link.type = 'image/png';
}

export function loadHeader(activePage = '') {
    injectFavicon();

    const container = document.getElementById('app-header') || document.getElementById('main-header');
    if (!container) return; // Silent fail if container missing

    const path = window.location.pathname;
    const current = activePage || (path === '/' || path.includes('index') ? 'home' : 
                                   path.includes('blog') ? 'blog' : 
                                   path.includes('about') ? 'about' :
                                   path.includes('contact') ? 'contact' : '');

    const isActive = (name) => current === name ? 'text-brand-600 font-bold bg-brand-50' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50';
    
    // NEW RESPONSIVE HEADER HTML
    container.innerHTML = `
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 w-full shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                
                <div class="flex items-center">
                    <a href="/assets/img/digitalserviceshub.jpg" class="flex-shrink-0 flex items-center gap-2 group">
                        <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">D</div>
                        <span class="font-bold text-xl tracking-tight text-slate-900">DigitalServices<span class="text-brand-600">Hub</span></span>
                    </a>
                </div>

                <div class="hidden md:flex items-center space-x-1">
                    <a href="/" class="px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('home')}">Home</a>
                    
                    <div class="relative group">
                        <button class="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-brand-600 inline-flex items-center gap-1 transition-colors">
                            Tools <i data-lucide="chevron-down" class="w-3 h-3 group-hover:rotate-180 transition-transform"></i>
                        </button>
                        <div class="absolute left-0 mt-0 w-56 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                            <div class="p-2 space-y-1">
                                <a href="/tiktok.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"><i data-lucide="music-2" class="w-4 h-4"></i> TikTok Tools</a>
                                <a href="/instagram.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"><i data-lucide="instagram" class="w-4 h-4"></i> Instagram Tools</a>
                                <a href="/twitter-tools.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"><i data-lucide="twitter" class="w-4 h-4"></i> Twitter Tools</a>
                                <a href="/email-tools.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4"></i> Email Tools</a>
                                <a href="/blog-tools.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"><i data-lucide="pen-tool" class="w-4 h-4"></i> Blog Tools</a>
                            </div>
                        </div>
                    </div>

                    <a href="/blog.html" class="px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('blog')}">Blog</a>
                    <a href="/about.html" class="px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('about')}">About</a>
                    <a href="/contact.html" class="px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('contact')}">Contact</a>

                    <div class="relative group">
                        <button class="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-brand-600 inline-flex items-center gap-1 transition-colors">
                            Legal <i data-lucide="chevron-down" class="w-3 h-3 group-hover:rotate-180 transition-transform"></i>
                        </button>
                        <div class="absolute right-0 mt-0 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                            <div class="p-2 space-y-1">
                                <a href="/privacy-policy.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600">Privacy Policy</a>
                                <a href="/terms-conditions.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600">Terms & Conditions</a>
                                <a href="/cookies-policy.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600">Cookie Policy</a>
                                <a href="/disclaimer.html" class="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600">Disclaimer</a>
                            </div>
                        </div>
                    </div>

                    <div class="pl-4 ml-4 border-l border-slate-200">
                        <a href="/login.html" id="nav-auth-btn" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                            <i data-lucide="log-in" class="w-4 h-4"></i> Log in
                        </a>
                    </div>
                </div>

                <div class="flex items-center md:hidden gap-3">
                    <a href="/login.html" id="mobile-top-auth" class="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg">Log in</a>
                    <button id="mobile-menu-btn" class="p-2 rounded-md text-slate-600 hover:text-brand-600 hover:bg-slate-100 focus:outline-none">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-2xl h-[calc(100vh-64px)] overflow-y-auto transform transition-transform duration-300">
            <div class="px-4 py-6 space-y-6">
                
                <div class="grid gap-2">
                    <a href="/assets/img/digitalserviceshub.jpg" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-lg">
                        <i data-lucide="home" class="w-5 h-5 text-slate-400"></i> Home
                    </a>
                    <a href="/blog.html" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-lg">
                        <i data-lucide="book-open" class="w-5 h-5 text-slate-400"></i> Blog
                    </a>
                    <a href="/about.html" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-lg">
                        <i data-lucide="info" class="w-5 h-5 text-slate-400"></i> About
                    </a>
                    <a href="/contact.html" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-lg">
                        <i data-lucide="mail" class="w-5 h-5 text-slate-400"></i> Contact
                    </a>
                </div>

                <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">AI Tools</h3>
                    <div class="grid grid-cols-1 gap-2">
                        <a href="/tiktok.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors">
                            <i data-lucide="music-2" class="w-4 h-4"></i> TikTok Tools
                        </a>
                        <a href="/instagram.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors">
                            <i data-lucide="instagram" class="w-4 h-4"></i> Instagram Tools
                        </a>
                        <a href="/twitter-tools.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors">
                            <i data-lucide="twitter" class="w-4 h-4"></i> Twitter Tools
                        </a>
                        <a href="/email-tools.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors">
                            <i data-lucide="mail" class="w-4 h-4"></i> Email Tools
                        </a>
                        <a href="/blog-tools.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors">
                            <i data-lucide="pen-tool" class="w-4 h-4"></i> Blog Tools
                        </a>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-100">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Legal</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <a href="/privacy-policy.html" class="px-3 py-2 text-sm text-slate-500 hover:text-brand-600">Privacy</a>
                        <a href="/terms-conditions.html" class="px-3 py-2 text-sm text-slate-500 hover:text-brand-600">Terms</a>
                        <a href="/cookies-policy.html" class="px-3 py-2 text-sm text-slate-500 hover:text-brand-600">Cookies</a>
                        <a href="/disclaimer.html" class="px-3 py-2 text-sm text-slate-500 hover:text-brand-600">Disclaimer</a>
                    </div>
                </div>
                
                <div class="pt-6">
                    <a href="/login.html" id="mobile-nav-auth-btn" class="flex items-center justify-center gap-2 w-full p-3.5 text-sm font-bold text-white bg-brand-600 rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition-all">
                        <i data-lucide="log-in" class="w-5 h-5"></i> Log In
                    </a>
                </div>
            </div>
        </div>
    </nav>
    `;

    // Initialize Mobile Menu Logic
    setTimeout(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        
        if(btn && menu) {
            btn.onclick = () => {
                menu.classList.toggle('hidden');
                
                // Animate Icon
                if (menu.classList.contains('hidden')) {
                    btn.innerHTML = `<i data-lucide="menu" class="w-6 h-6"></i>`;
                    document.body.style.overflow = '';
                } else {
                    btn.innerHTML = `<i data-lucide="x" class="w-6 h-6"></i>`;
                    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu open
                }
                if(window.lucide) window.lucide.createIcons();
            };
        }
        if(window.lucide) window.lucide.createIcons();
        
        // Init Auth Manager and Ads
        authManager.init();
        lazyLoadAds();
    }, 50);
}

export function loadFooter() {
    const container = document.getElementById('app-footer') || document.getElementById('main-footer');
    if (!container) return;

    container.innerHTML = `
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                <div class="col-span-1 md:col-span-1">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white font-bold text-xs">D</div>
                        <span class="font-bold text-lg text-white">DigitalServicesHub</span>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                        Empowering creators with free, professional-grade AI tools. Built for scale, security, and speed.
                    </p>
                </div>
                
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Free Tools</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/tiktok.html" class="hover:text-brand-400 transition-colors">TikTok Downloader</a></li>
                        <li><a href="/instagram.html" class="hover:text-brand-400 transition-colors">Instagram Tools</a></li>
                        <li><a href="/twitter-tools.html" class="hover:text-brand-400 transition-colors">Twitter Analytics</a></li>
                        <li><a href="/email-tools.html" class="hover:text-brand-400 transition-colors">Email Validator</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Resources</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/blog.html" class="hover:text-brand-400 transition-colors">Latest Articles</a></li>
                        <li><a href="/about.html" class="hover:text-brand-400 transition-colors">About Us</a></li>
                        <li><a href="/contact.html" class="hover:text-brand-400 transition-colors">Contact Support</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold text-white mb-4 uppercase text-xs tracking-wider">Legal</h3>
                    <ul class="space-y-3 text-sm text-slate-400">
                        <li><a href="/privacy-policy.html" class="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                        <li><a href="/terms-conditions.html" class="hover:text-brand-400 transition-colors">Terms of Service</a></li>
                        <li><a href="/cookies-policy.html" class="hover:text-brand-400 transition-colors">Cookie Policy</a></li>
                        <li><a href="/disclaimer.html" class="hover:text-brand-400 transition-colors">Disclaimer</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-500 text-sm">© ${new Date().getFullYear()} Digital Services Hub.</p>
                <div class="flex items-center gap-2 text-xs text-slate-500"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational</div>
            </div>
        </div>
    </footer>
    `;
    if(window.lucide) window.lucide.createIcons();
}

// ==========================================
// 4. POWERFUL ANALYTICS (Enhanced)
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.queue = [];
        this.ipData = null;
        this.sessionId = sessionStorage.getItem('dsh_session_id') || this.createSession();
        this.isTracking = false;
        this.flushInterval = null;
        this.defaultGeo = { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown', region: 'Unknown', latitude: 0, longitude: 0 };
        this.scrollDepth = 0;
    }

    createSession() {
        const id = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('dsh_session_id', id);
        return id;
    }

    async init() {
        // Cookie Consent Logic
        const consent = localStorage.getItem('dsh_cookie_consent');
        
        if (consent === 'rejected') {
            console.log("Analytics: Tracking disabled by user.");
            this.isTracking = false;
        } else {
            this.isTracking = true;
        }

        // Show popup on every session visit if not already shown
        if (!sessionStorage.getItem('dsh_consent_session_viewed')) {
            CookieManager.show();
        }

        if (this.isTracking) {
            // Lazy load geo to improve LCP
            requestIdleCallback(() => {
                this.fetchGeo().then(data => this.ipData = data);
            });
            
            // Track Page View
            this.track('page_view', {
                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer || 'Direct'
            });

            // Start Services
            this.setupClickTracking();
            this.setupScrollTracking();
            this.setupPerformanceTracking();
            this.startHeartbeat();
            
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
        } catch (e) {}
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

    setupScrollTracking() {
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll >= 25 && this.scrollDepth < 25) { this.track('scroll_depth', { depth: 25 }); this.scrollDepth = 25; }
                if (maxScroll >= 50 && this.scrollDepth < 50) { this.track('scroll_depth', { depth: 50 }); this.scrollDepth = 50; }
                if (maxScroll >= 75 && this.scrollDepth < 75) { this.track('scroll_depth', { depth: 75 }); this.scrollDepth = 75; }
                if (maxScroll >= 90 && this.scrollDepth < 90) { this.track('scroll_depth', { depth: 100 }); this.scrollDepth = 100; }
            }
        });
    }

    setupPerformanceTracking() {
        window.addEventListener('load', () => {
            if (window.performance) {
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry) {
                    this.track('performance', {
                        loadTime: navEntry.loadEventEnd - navEntry.startTime,
                        domReady: navEntry.domContentLoadedEventEnd - navEntry.startTime,
                        ttfb: navEntry.responseStart - navEntry.requestStart
                    });
                }
            }
        });
    }

    trackFunnelStep(stepName, toolName) {
        this.track('funnel_step', { step: stepName, tool: toolName });
    }

    startHeartbeat() {
        const beat = async () => {
            if (!this.isTracking) return;
            try {
                const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', this.sessionId);
                await setDoc(presenceRef, {
                    lastActive: serverTimestamp(),
                    path: window.location.pathname,
                    device: this.getDeviceType(),
                    country: this.ipData?.country_name || 'Unknown'
                });
            } catch (e) {}
        };
        beat();
        setInterval(beat, 60000);
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
// 5. COOKIE MANAGER (AdSense Enhanced)
// ==========================================
const CookieManager = {
    show: () => {
        if (document.getElementById('cookie-consent-modal')) return;
        
        sessionStorage.setItem('dsh_consent_session_viewed', 'true');

        const modal = document.createElement('div');
        modal.id = 'cookie-consent-modal';
        modal.className = "fixed bottom-0 left-0 right-0 z-[9999] p-4 flex justify-center animate-slide-up";
        
        modal.innerHTML = `
            <div class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 p-6 max-w-2xl w-full flex flex-col md:flex-row gap-6 items-center transform transition-all duration-500 translate-y-full opacity-0" id="cookie-inner">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <i data-lucide="cookie" class="w-5 h-5"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-lg">We value your privacy</h3>
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed">
                        We use cookies to enhance your experience and analyze site traffic. By clicking "Accept All", you consent to our use of cookies.
                        <a href="/cookies-policy.html" class="text-brand-600 hover:underline font-semibold ml-1">Read Policy</a>
                    </p>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <button id="cookie-reject" class="flex-1 md:flex-none px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all text-sm whitespace-nowrap">
                        Essential Only
                    </button>
                    <button id="cookie-accept" class="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-brand-600 text-sm shadow-lg shadow-slate-900/20 hover:shadow-brand-600/20 transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                        Accept All
                    </button>
                </div>
            </div>
            <style>
                @keyframes slideUpCookie { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slideUpCookie 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            </style>
        `;
        document.body.appendChild(modal);
        if(window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            const inner = document.getElementById('cookie-inner');
            inner.classList.remove('translate-y-full', 'opacity-0');
        }, 100);

        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            closeModal();
            analytics.isTracking = true;
            lazyLoadAds();
        };
        
        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            closeModal();
            analytics.isTracking = false; 
        };

        function closeModal() {
            const inner = document.getElementById('cookie-inner');
            inner.style.transform = 'translateY(100%)';
            inner.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        }
    }
};

// ==========================================
// 6. AD SYSTEM (Lazy Loaded)
// ==========================================
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
    } catch (e) {}
    return {};
}

function lazyLoadAds() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const delay = isMobile ? 3500 : 1500; 
    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, delay));

    scheduleLoad(() => {
        injectAdSense();
        injectAdsterraAds();
    }, { timeout: 5000 });
}

function injectAdSense() {
    if (document.getElementById('dsh-adsense-script')) return;
    const script = document.createElement('script');
    script.id = 'dsh-adsense-script';
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7047763389543423";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
}

function injectAdsterraAds() {
    if (document.getElementById('dsh-adsterra-script')) return;
    loadGlobalSettings().then(settings => {
        const socialBarUrl = settings?.adsterra_social_bar_url;
        if (socialBarUrl) {
            const script = document.createElement('script');
            script.id = 'dsh-adsterra-script';
            script.type = 'text/javascript';
            script.src = socialBarUrl;
            document.head.appendChild(script);
        }
    }).catch(e => {});
}

// ==========================================
// 7. AI BRIDGE
// ==========================================
export function getPromptForTool(toolKey, input) {
    const fallbacks = { 'default': `Generate content for ${input}` };
    return fallbacks[toolKey] || `Act as an expert. ${input}`;
}

export async function generateAIContent(prompt, tool = 'unknown', topic = '') {
    analytics.track('funnel_step', { step: 'generation_request', tool, topic });
    try {
        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Generation failed');
        const data = await response.json();
        analytics.track('funnel_step', { step: 'generation_success', tool });
        return data.text;
    } catch (e) {
        analytics.track('funnel_step', { step: 'generation_fail', tool, error: e.message });
        throw new Error("AI Service Busy. Please try again.");
    }
}

// Initializer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

// ==========================================
// 8. EXPORTS (Comprehensive for Admin)
// ==========================================
export { 
    db, 
    auth, 
    provider, 
    analytics,
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where, 
    limit, 
    orderBy, 
    updateDoc, 
    setDoc,
    serverTimestamp, 
    onAuthStateChanged, 
    signOut, 
    signInWithPopup,
    appId
};
