/**
 * DigitalServicesHub - Shared Core Logic (Production Grade)
 * Features:
 * - Robust Firebase Auth with User Profile Caching
 * - Batched Analytics Engine (Immediate Tracking / Soft Opt-in)
 * - Session-Based High Quality Cookie Consent (AdSense Compliant)
 * - Global Adsterra & AdSense Injection System
 * - Dynamic Header/Footer Injection with Logo
 * - Real-time Presence & Performance Monitoring
 * - Scroll Depth & Funnel Tracking
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, writeBatch, serverTimestamp, enableIndexedDbPersistence, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

console.log("🚀 System: Initializing Core Services v2.5 (Enhanced Tracking)...");

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
// 3. UI INJECTOR (Header/Footer with Logo)
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
                <img src="/digitalserviceshub.png" alt="DigitalServicesHub Logo" class="h-10 w-auto object-contain" onerror="this.onerror=null; this.src='https://via.placeholder.com/40x40?text=DSH'; this.parentElement.innerHTML='<div class=\'w-10 h-10 bg-gradient-to-br from-brand-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg\'>D</div><span class=\'font-bold text-xl text-slate-900 tracking-tight\'>DigitalServices<span class=\'text-brand-600\'>Hub</span></span>'">
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
                <a href="/about.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('about')}">About</a>
                <a href="/contact.html" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('contact')}">Contact</a>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
                <a href="/app-release.apk" class="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5" title="Download mobile app for a better version">
                    <i data-lucide="smartphone" class="w-4 h-4"></i>
                    <span>Get App</span>
                </a>

                <a href="/login.html" id="nav-auth-btn" class="hidden md:flex px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors">Log in</a>
                <a href="/subscription.html" class="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-brand-600/30 transition-all duration-300 transform hover:-translate-y-0.5">Get Started</a>
                <button id="mobile-menu-btn" class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
            </div>
        </nav>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu" class="hidden fixed inset-0 z-[60] bg-white overflow-y-auto transform transition-transform duration-300 translate-x-full">
            <div class="flex justify-between items-center p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div class="flex items-center gap-2">
                    <img src="/digitalserviceshub.png" alt="Logo" class="h-8 w-auto object-contain" onerror="this.src='https://via.placeholder.com/32x32?text=DSH'">
                    <span class="font-bold text-lg text-slate-900">Menu</span>
                </div>
                <button id="close-mobile-menu" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <div class="p-4 flex flex-col gap-6">
                <!-- Primary Navigation -->
                <div class="flex flex-col gap-2">
                    <a href="/index.html" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold ${isActive('home') ? 'bg-brand-50 text-brand-700' : ''}">
                        <i data-lucide="home" class="w-5 h-5"></i> Home
                    </a>
                    
                    <!-- Tools Dropdown (Expanded by default for mobile ease) -->
                    <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div class="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                            <i data-lucide="wrench" class="w-3 h-3"></i> AI Tools
                        </div>
                        <div class="grid grid-cols-1 gap-1">
                            <a href="/tiktok.html" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium transition-all">
                                <span class="p-1.5 bg-black text-white rounded-md"><i data-lucide="music-2" class="w-3.5 h-3.5"></i></span> TikTok Tools
                            </a>
                            <a href="/instagram.html" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium transition-all">
                                <span class="p-1.5 bg-pink-600 text-white rounded-md"><i data-lucide="instagram" class="w-3.5 h-3.5"></i></span> Instagram Tools
                            </a>
                            <a href="/twitter-tools.html" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium transition-all">
                                <span class="p-1.5 bg-blue-400 text-white rounded-md"><i data-lucide="twitter" class="w-3.5 h-3.5"></i></span> Twitter Tools
                            </a>
                            <a href="/email-tools.html" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium transition-all">
                                <span class="p-1.5 bg-emerald-500 text-white rounded-md"><i data-lucide="mail" class="w-3.5 h-3.5"></i></span> Email Tools
                            </a>
                            <a href="/blog-tools.html" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium transition-all">
                                <span class="p-1.5 bg-indigo-500 text-white rounded-md"><i data-lucide="pen-tool" class="w-3.5 h-3.5"></i></span> Blog Writer
                            </a>
                        </div>
                    </div>

                    <a href="/blog.html" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold ${isActive('blog') ? 'bg-brand-50 text-brand-700' : ''}">
                        <i data-lucide="book-open" class="w-5 h-5"></i> Blog
                    </a>
                    <a href="/subscription.html" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold ${isActive('pricing') ? 'bg-brand-50 text-brand-700' : ''}">
                        <i data-lucide="credit-card" class="w-5 h-5"></i> Pricing
                    </a>
                    <a href="/contact.html" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold ${isActive('contact') ? 'bg-brand-50 text-brand-700' : ''}">
                        <i data-lucide="message-square" class="w-5 h-5"></i> Contact
                    </a>
                </div>

                <!-- Footer Actions -->
                <div class="mt-auto flex flex-col gap-3 pt-4 border-t border-slate-100">
                    <a href="/app-release.apk" class="flex items-center justify-center gap-2 p-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                        <i data-lucide="smartphone" class="w-5 h-5"></i> Download App
                    </a>
                    <a href="/login.html" id="mobile-nav-auth-btn" class="flex items-center justify-center gap-2 p-3.5 text-sm font-bold text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors">
                        <i data-lucide="log-in" class="w-5 h-5"></i> Log In
                    </a>
                </div>
            </div>
        </div>
    `;

    const btn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-mobile-menu');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu && closeBtn) {
        // Open
        btn.onclick = () => { 
            menu.classList.remove('hidden'); 
            // Slight delay to allow display:block to apply before transition
            requestAnimationFrame(() => {
                menu.classList.remove('translate-x-full');
            });
            document.body.style.overflow = 'hidden'; 
        };
        
        // Close
        closeBtn.onclick = () => { 
            menu.classList.add('translate-x-full');
            setTimeout(() => {
                menu.classList.add('hidden'); 
                document.body.style.overflow = ''; 
            }, 300); // Match transition duration
        };
    }

    if(window.lucide) window.lucide.createIcons();
    authManager.init();
    
    // Inject Ads after header load
    injectAdSense();
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
                        <img src="/digitalserviceshub.png" alt="DigitalServicesHub" class="h-8 w-auto brightness-200 grayscale contrast-200">
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
                        <li><a href="/about.html" class="hover:text-brand-400 transition-colors">About Us</a></li>
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
// 4. POWERFUL ANALYTICS (Enhanced)
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.queue = [];
        this.ipData = null;
        this.sessionId = sessionStorage.getItem('dsh_session_id') || this.createSession();
        this.isTracking = false;
        this.flushInterval = null;
        this.heartbeatInterval = null;
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
            this.fetchGeo().then(data => this.ipData = data);
            
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

    // FEATURE 1: Scroll Depth Tracking
    setupScrollTracking() {
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                // Log milestones: 25%, 50%, 75%, 100%
                if (maxScroll >= 25 && this.scrollDepth < 25) { this.track('scroll_depth', { depth: 25 }); this.scrollDepth = 25; }
                if (maxScroll >= 50 && this.scrollDepth < 50) { this.track('scroll_depth', { depth: 50 }); this.scrollDepth = 50; }
                if (maxScroll >= 75 && this.scrollDepth < 75) { this.track('scroll_depth', { depth: 75 }); this.scrollDepth = 75; }
                if (maxScroll >= 90 && this.scrollDepth < 90) { this.track('scroll_depth', { depth: 100 }); this.scrollDepth = 100; }
            }
        });
    }

    // FEATURE 3: Performance Monitoring (Core Web Vitals Proxy)
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

    // FEATURE 5: Conversion Funnel (Helper)
    trackFunnelStep(stepName, toolName) {
        this.track('funnel_step', { step: stepName, tool: toolName });
    }

    // Real-time Heartbeat
    startHeartbeat() {
        const beat = async () => {
            if (!this.isTracking) return;
            try {
                // Write directly to a 'presence' collection with TTL-like behavior (handled by admin query)
                const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', this.sessionId);
                await setDoc(presenceRef, {
                    lastActive: serverTimestamp(),
                    path: window.location.pathname,
                    device: this.getDeviceType(),
                    country: this.ipData?.country_name || 'Unknown'
                });
            } catch (e) {
                // console.warn("Heartbeat skipped"); 
            }
        };
        beat(); // Initial beat
        this.heartbeatInterval = setInterval(beat, 60000); // Every 60s
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
        
        // GDPR/CCPA Compliant Design
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
                        We use cookies to enhance your experience, analyze site traffic, and serve personalized content. By clicking "Accept All", you consent to our use of cookies.
                        <a href="/privacy.html" class="text-brand-600 hover:underline font-semibold ml-1">Read Policy</a>
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
            // Reload ads if needed, or trigger specific ad personalization logic here
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
// 6. AD SYSTEM (AdSense & Adsterra)
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

// Load System Prompts
export async function loadSystemPrompts() {
    return true; 
}

/**
 * Injects Google AdSense.
 * Safe injection that respects existing scripts.
 */
function injectAdSense() {
    if (document.getElementById('dsh-adsense-script')) return;

    const script = document.createElement('script');
    script.id = 'dsh-adsense-script';
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7047763389543423";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
    console.log("✅ AdSense: Script Injected");
}

/**
 * Injects Adsterra Ads Globally.
 */
function injectAdsterraAds() {
    if (document.getElementById('dsh-adsterra-script')) return;

    loadGlobalSettings().then(settings => {
        // 1. Social Bar
        const socialBarUrl = settings?.adsterra_social_bar_url;
        if (socialBarUrl) {
            const script = document.createElement('script');
            script.id = 'dsh-adsterra-script';
            script.type = 'text/javascript';
            script.src = socialBarUrl;
            script.onerror = () => console.log("Ads: Social bar blocked (AdBlock).");
            document.head.appendChild(script);
        }

        // 2. Banner Injection
        const adContainers = document.querySelectorAll('.adsterra-banner-728');
        if (adContainers.length > 0 && settings?.adsterra_banner_728_code) {
            adContainers.forEach(container => {
                const div = document.createElement('div');
                div.innerHTML = settings.adsterra_banner_728_code;
                container.appendChild(div);
            });
        }
    }).catch(e => {
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
    // FUNNEL TRACKING: Step 1 (Generation Requested)
    analytics.track('funnel_step', { step: 'generation_request', tool, topic });
    
    try {
        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Generation failed');
        const data = await response.json();
        
        // FUNNEL TRACKING: Step 2 (Generation Success)
        analytics.track('funnel_step', { step: 'generation_success', tool });
        
        return data.text;
    } catch (e) {
        console.error("AI Error:", e);
        // FUNNEL TRACKING: Step 2 (Generation Fail)
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

export { auth, db, appId, onAuthStateChanged, analytics };
