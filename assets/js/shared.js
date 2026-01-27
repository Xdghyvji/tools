/**
 * DigitalServicesHub - Shared Core Logic (Production Grade v3.7)
 * Features:
 * - Robust Firebase Auth with User Profile Caching
 * - Batched Analytics Engine (CORS Fixed)
 * - Session-Based High Quality Cookie Consent
 * - Global Adsterra & AdSense Injection System
 * - Dynamic Header/Footer
 * - Multi-Tab Persistence Fix
 * - DYNAMIC AI ENGINE (Full DB Integration)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, 
    writeBatch, query, where, limit, orderBy, serverTimestamp, 
    enableMultiTabIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

console.log("🚀 System: Initializing Core Services v3.7 (Stable)...");

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
    
    // CRITICAL FIX: Use Multi-Tab Persistence with Error Handling
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        // Silently fail on persistence errors to prevent console spam
        // This is expected behavior in some multi-tab scenarios
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
                } catch (e) {}
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
        
        const updateBtn = (btn) => {
            if (!btn) return;
            if (user) {
                const isAdmin = user.email === "admin@dsh.online"; 
                const target = isAdmin ? '/admin/index.html' : '/userprofile.html';
                const label = isAdmin ? 'Admin Panel' : 'Dashboard';
                
                btn.href = target;
                btn.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> ${label}`;
                
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
// 3. UI INJECTOR (Header & Footer)
// ==========================================

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

function generateSocialIcons(settings) {
    if (!settings) return '';
    let html = '';
    const twitter = settings.twitter || settings.social_twitter;
    const facebook = settings.facebook || settings.social_facebook;
    const instagram = settings.instagram || settings.social_instagram;
    const linkedin = settings.linkedin || settings.social_linkedin;
    const youtube = settings.youtube || settings.social_youtube;

    if (twitter) html += `<a href="${twitter}" target="_blank" class="text-slate-400 hover:text-blue-400 transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>`;
    if (facebook) html += `<a href="${facebook}" target="_blank" class="text-slate-400 hover:text-blue-600 transition-colors"><i data-lucide="facebook" class="w-5 h-5"></i></a>`;
    if (instagram) html += `<a href="${instagram}" target="_blank" class="text-slate-400 hover:text-pink-600 transition-colors"><i data-lucide="instagram" class="w-5 h-5"></i></a>`;
    if (linkedin) html += `<a href="${linkedin}" target="_blank" class="text-slate-400 hover:text-blue-700 transition-colors"><i data-lucide="linkedin" class="w-5 h-5"></i></a>`;
    if (youtube) html += `<a href="${youtube}" target="_blank" class="text-slate-400 hover:text-red-600 transition-colors"><i data-lucide="youtube" class="w-5 h-5"></i></a>`;
    return html;
}

export function loadHeader(activePage = '') {
    injectFavicon();
    const container = document.getElementById('app-header') || document.getElementById('main-header');
    if (!container) return;

    const path = window.location.pathname;
    const current = activePage || (path === '/' || path.includes('index') ? 'home' : 
                                   path.includes('blog') ? 'blog' : 
                                   path.includes('about') ? 'about' :
                                   path.includes('contact') ? 'contact' : '');

    const isActive = (name) => current === name ? 'text-brand-600 font-bold bg-brand-50' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50';
    
    container.innerHTML = `
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 w-full shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                
                <div class="flex items-center">
                    <a href="/" class="flex-shrink-0 flex items-center gap-2 group">
                        <img src="/assets/img/digitalserviceshub.png" alt="DigitalServicesHub" class="h-10 w-auto object-contain transition-transform group-hover:scale-105">
                        <span class="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">DigitalServices<span class="text-brand-600">Hub</span></span>
                    </a>
                </div>

                <div class="hidden lg:flex items-center space-x-1">
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

                    <div id="header-socials" class="flex items-center gap-2 pl-2 border-l border-slate-200 ml-2"></div>
                </div>

                <div class="flex items-center gap-3">
                    <a href="/app-release.apk" class="hidden xl:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                        <i data-lucide="smartphone" class="w-4 h-4"></i> Get App
                    </a>

                    <a href="/login.html" id="nav-auth-btn" class="hidden md:flex px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors items-center gap-2">
                        <i data-lucide="log-in" class="w-4 h-4"></i> Log in
                    </a>

                    <button id="mobile-menu-btn" class="lg:hidden p-2 rounded-md text-slate-600 hover:text-brand-600 hover:bg-slate-100 focus:outline-none">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden lg:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-2xl h-[calc(100vh-80px)] overflow-y-auto transform transition-transform duration-300">
            <div class="px-4 py-6 space-y-6">
                <div class="grid gap-2">
                    <a href="/" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-lg">
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

                <a href="/app-release.apk" class="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-lg">
                     <i data-lucide="smartphone" class="w-5 h-5"></i> Download App
                </a>

                <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">AI Tools</h3>
                    <div class="grid grid-cols-1 gap-2">
                        <a href="/tiktok.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors"><i data-lucide="music-2" class="w-4 h-4"></i> TikTok Tools</a>
                        <a href="/instagram.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors"><i data-lucide="instagram" class="w-4 h-4"></i> Instagram Tools</a>
                        <a href="/twitter-tools.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors"><i data-lucide="twitter" class="w-4 h-4"></i> Twitter Tools</a>
                        <a href="/email-tools.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-medium transition-colors"><i data-lucide="mail" class="w-4 h-4"></i> Email Tools</a>
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

    setTimeout(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if(btn && menu) {
            btn.onclick = () => {
                menu.classList.toggle('hidden');
                btn.innerHTML = menu.classList.contains('hidden') ? `<i data-lucide="menu" class="w-6 h-6"></i>` : `<i data-lucide="x" class="w-6 h-6"></i>`;
                document.body.style.overflow = menu.classList.contains('hidden') ? '' : 'hidden';
                if(window.lucide) window.lucide.createIcons();
            };
        }
        if(window.lucide) window.lucide.createIcons();
        authManager.init();
        lazyLoadAds();
        
        loadGlobalSettings().then(settings => {
            const iconsHtml = generateSocialIcons(settings);
            const headerSocials = document.getElementById('header-socials');
            if(headerSocials) { headerSocials.innerHTML = iconsHtml; if(window.lucide) window.lucide.createIcons(); }
        });
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
                        <img src="/assets/img/digitalserviceshub.png" alt="DigitalServicesHub" class="h-8 w-auto brightness-200 grayscale contrast-200 opacity-90">
                        <span class="font-bold text-lg text-white">DigitalServicesHub</span>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                        Empowering creators with free, professional-grade AI tools. Built for scale, security, and speed.
                    </p>
                    <div id="footer-socials" class="flex items-center gap-4 mt-4"></div>
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
    
    loadGlobalSettings().then(settings => {
        const iconsHtml = generateSocialIcons(settings);
        const footerSocials = document.getElementById('footer-socials');
        if(footerSocials) { footerSocials.innerHTML = iconsHtml; if(window.lucide) window.lucide.createIcons(); }
    });

    if(window.lucide) window.lucide.createIcons();
}

// ==========================================
// 4. POWERFUL ANALYTICS (CORS FIXED)
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.queue = [];
        this.ipData = null;
        this.sessionId = sessionStorage.getItem('dsh_session_id') || this.createSession();
        this.isTracking = false;
        this.defaultGeo = { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown', region: 'Unknown', latitude: 0, longitude: 0 };
    }
    createSession() {
        const id = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('dsh_session_id', id);
        return id;
    }
    async init() {
        const consent = localStorage.getItem('dsh_cookie_consent');
        if (consent === 'rejected') {
            this.isTracking = false;
        } else {
            this.isTracking = true;
        }

        if (!sessionStorage.getItem('dsh_consent_session_viewed')) {
            CookieManager.show();
        }

        if (this.isTracking) {
            requestIdleCallback(() => { this.fetchGeo().then(data => this.ipData = data); });
            this.track('page_view', { path: window.location.pathname, title: document.title, referrer: document.referrer || 'Direct' });
            this.setupClickTracking();
            this.startHeartbeat();
            setInterval(() => this.flush(), 10000);
            window.addEventListener('beforeunload', () => this.flush());
        }
    }
    async fetchGeo() {
        try {
            // FIX: Using ip-api.com because it supports CORS for browser requests (unlike ipapi.co)
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 2000);
            const res = await fetch('http://ip-api.com/json', { signal: controller.signal });
            if(res.ok) { 
                const data = await res.json(); 
                return { 
                    ip: data.query, 
                    country_name: data.country, 
                    city: data.city, 
                    region: data.regionName, 
                    latitude: data.lat, 
                    longitude: data.lon 
                }; 
            }
        } catch (e) {
            // Silently fail to avoid console red ink
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
    startHeartbeat() {
        const beat = async () => {
            if (!this.isTracking) return;
            try {
                const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', this.sessionId);
                await setDoc(presenceRef, { lastActive: serverTimestamp(), path: window.location.pathname, device: this.getDeviceType(), country: this.ipData?.country_name || 'Unknown' });
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
                this.track(isAd ? 'ad_click' : 'click', { tag: target.tagName, id: target.id || 'na', text: target.innerText?.substring(0, 50) || 'icon', href: target.href || null });
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
        } catch (e) {}
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
// 5. COOKIE MANAGER
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
                        <div class="p-2 bg-brand-100 rounded-lg text-brand-600"><i data-lucide="cookie" class="w-5 h-5"></i></div>
                        <h3 class="font-bold text-slate-900 text-lg">We value your privacy</h3>
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed">
                        We use cookies to enhance your experience. <a href="/cookies-policy.html" class="text-brand-600 hover:underline font-semibold ml-1">Read Policy</a>
                    </p>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <button id="cookie-reject" class="flex-1 md:flex-none px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm whitespace-nowrap">Essential Only</button>
                    <button id="cookie-accept" class="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-brand-600 text-sm shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap">Accept All</button>
                </div>
            </div>
            <style>@keyframes slideUpCookie { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUpCookie 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }</style>
        `;
        document.body.appendChild(modal);
        if(window.lucide) window.lucide.createIcons();
        setTimeout(() => { document.getElementById('cookie-inner').classList.remove('translate-y-full', 'opacity-0'); }, 100);
        document.getElementById('cookie-accept').onclick = () => { localStorage.setItem('dsh_cookie_consent', 'accepted'); closeModal(); analytics.isTracking = true; lazyLoadAds(); };
        document.getElementById('cookie-reject').onclick = () => { localStorage.setItem('dsh_cookie_consent', 'rejected'); closeModal(); analytics.isTracking = false; };
        function closeModal() { const inner = document.getElementById('cookie-inner'); inner.style.transform = 'translateY(100%)'; inner.style.opacity = '0'; setTimeout(() => modal.remove(), 500); }
    }
};

// ==========================================
// 6. DB CONFIG LOADER (Settings, Prompts, Keys)
// ==========================================
let globalSettings = null;
let systemPrompts = {};
let dynamicApiKey = null;

// A. Load Global Settings
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

// B. Load System Prompts
export async function loadSystemPrompts() {
    if (Object.keys(systemPrompts).length > 0) return systemPrompts;
    try {
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'system_prompts');
        const snap = await getDocs(colRef);
        snap.forEach(doc => {
            const data = doc.data();
            // Try different field names just in case
            systemPrompts[doc.id] = data.prompt || data.text || data.value || "";
        });
        console.log("System: AI Prompts Loaded", Object.keys(systemPrompts));
    } catch (e) { console.warn("Prompts load failed", e); }
    return systemPrompts;
}

// C. Load API Keys
async function loadApiKeys() {
    if (dynamicApiKey) return dynamicApiKey;
    try {
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'api_keys');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
            // Try to find a working key from the first doc
            const data = snap.docs[0].data();
            // Check keys like 'key', 'apiKey', 'value', or just grab the first string value
            dynamicApiKey = data.key || data.apiKey || data.value || Object.values(data)[0];
            if(dynamicApiKey) console.log("System: API Key Loaded (Ready)");
        }
    } catch (e) { console.warn("API Key load failed", e); }
    return dynamicApiKey;
}

function lazyLoadAds() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const delay = isMobile ? 3500 : 1500; 
    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, delay));
    scheduleLoad(() => { injectAdSense(); injectAdsterraAds(); }, { timeout: 5000 });
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
// 7. AI BRIDGE & EXPORTS (Server-Proxy Strategy)
// ==========================================
export function getPromptForTool(toolKey, input) {
    if (systemPrompts[toolKey]) {
        return systemPrompts[toolKey].replace(/\{input\}/g, input).replace(/\{\{input\}\}/g, input);
    }
    return `Generate content for ${input}`;
}

export async function generateAIContent(prompt, tool = 'unknown', topic = '') {
    // Ensure dependencies are loaded
    if(Object.keys(systemPrompts).length === 0) await loadSystemPrompts();
    if(!dynamicApiKey) await loadApiKeys(); // Assuming loadApiKeys is defined above

    analytics.track('funnel_step', { step: 'generation_request', tool, topic });

    try {
        if (!dynamicApiKey) throw new Error("System Configuration Error: No API Key found in Database.");

        console.log("System: Sending request to Netlify Proxy..."); // Debug Log

        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            body: JSON.stringify({ 
                prompt: prompt,
                apiKey: dynamicApiKey 
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        // 1. Check if Response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // If Netlify returns HTML (503/500/404), get text to see the real error
            const textError = await response.text();
            console.error("Netlify Raw Error:", textError);
            throw new Error(`Server Error (${response.status}): The function crashed. Check Netlify Logs.`);
        }

        const data = await response.json();

        // 2. Handle Logic Errors
        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }
        
        analytics.track('funnel_step', { step: 'generation_success', tool });
        return data.text;

    } catch (e) {
        analytics.track('funnel_step', { step: 'generation_fail', tool, error: e.message });
        console.error("AI Generation Error:", e);
        throw new Error(e.message || "AI Service Busy. Please try again.");
    }
}

export { 
    db, auth, provider, analytics,
    collection, addDoc, getDocs, doc, getDoc, query, where, limit, orderBy, updateDoc, setDoc,
    serverTimestamp, onAuthStateChanged, signOut, signInWithPopup, appId
};
