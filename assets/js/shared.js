// ✅ FIX: Using stable Firebase version 10.12.2
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("🚀 Shared.js loading...");

// ==========================================
// 1. FIREBASE CONFIGURATION
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

// Initialize Firebase
let app, db, auth;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("✅ Firebase Initialized");
} catch (e) {
    console.error("❌ Firebase Failed to Init:", e);
}

const appId = 'mubashir-2b7cc'; 

// ==========================================
// 2. ANALYTICS ENGINE
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.ipData = { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown' };
        this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        this.trackingActive = false;
    }

    init() {
        const consent = localStorage.getItem('dsh_cookie_consent');
        if (consent === 'rejected') return; 
        if (consent === 'accepted') this.startTracking();
        else CookieManager.show(); 
    }

    async startTracking() {
        if (this.trackingActive) return;
        this.trackingActive = true;
        console.log("📊 Analytics Started");

        await this.fetchGeoData();

        this.logEvent('page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer || 'Direct'
        });

        document.addEventListener('click', (e) => this.handleClick(e));
        setInterval(() => this.logHeartbeat(), 30000); 
    }

    async fetchGeoData() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            if(res.ok) this.ipData = await res.json();
        } catch (e) {
            console.warn("Analytics: Geo-lookup blocked (Adblocker active?)");
        }
    }

    async logEvent(type, details = {}) {
        if (!db) return;
        const payload = {
            type: type,
            sessionId: this.sessionId,
            ip: this.ipData.ip || 'Anonymous',
            country: this.ipData.country_name || 'Unknown',
            city: this.ipData.city || 'Unknown',
            device: this.getDeviceType(),
            path: window.location.pathname,
            timestamp: serverTimestamp(),
            ...details
        };
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), payload);
        } catch (e) {}
    }

    handleClick(e) {
        const target = e.target.closest('a, button, .ad-banner');
        if (!target) return;
        const isAd = target.classList.contains('ad-banner') || target.id.includes('ad');
        this.logEvent(isAd ? 'ad_click' : 'click', {
            tag: target.tagName,
            id: target.id || 'N/A',
            class: target.className,
            text: target.innerText?.substring(0, 30) || 'Image'
        });
    }

    logHeartbeat() {
        if(document.visibilityState === 'visible') {
            this.logEvent('heartbeat', { duration: 30 });
        }
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobile|Android|iP(hone|od)/.test(ua)) return "Mobile";
        if (/Tablet|iPad/.test(ua)) return "Tablet";
        return "Desktop";
    }
}

// ==========================================
// 3. COOKIE CONSENT UI
// ==========================================
const CookieManager = {
    show: () => {
        if (document.getElementById('dsh-cookie-popup')) return;
        const div = document.createElement('div');
        div.id = 'dsh-cookie-popup';
        div.className = "fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-[9999] transform transition-all duration-500 translate-y-20 opacity-0";
        div.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="text-2xl">🍪</div>
                <div>
                    <h4 class="font-bold text-slate-900">Cookie Consent</h4>
                    <p class="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">We use cookies to analyze traffic. <a href="/privacy.html" class="underline">Learn more</a>.</p>
                    <div class="flex gap-2">
                        <button id="cookie-reject" class="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Reject</button>
                        <button id="cookie-accept" class="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-lg">Accept</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div);
        setTimeout(() => div.classList.remove('translate-y-20', 'opacity-0'), 100);

        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            div.remove();
            analytics.startTracking();
        };
        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            div.remove();
        };
    }
};

// ==========================================
// 4. UI HELPERS (loadFooter, etc.)
// ==========================================

export function loadFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="col-span-1 md:col-span-2">
                    <a href="/" class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
                        <span class="font-bold text-xl text-slate-900">DigitalServicesHub</span>
                    </a>
                    <p class="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
                        Free, professional-grade tools for digital marketers, content creators, and developers. No credit card required.
                    </p>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 mb-4">Tools</h3>
                    <ul class="space-y-2 text-sm text-slate-500">
                        <li><a href="/tiktok.html" class="hover:text-brand-600">TikTok Downloader</a></li>
                        <li><a href="/instagram.html" class="hover:text-brand-600">Instagram Tools</a></li>
                        <li><a href="/email-tools.html" class="hover:text-brand-600">Email Extractor</a></li>
                        <li><a href="/blog-tools.html" class="hover:text-brand-600">AI Blog Writer</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 mb-4">Legal</h3>
                    <ul class="space-y-2 text-sm text-slate-500">
                        <li><a href="/privacy.html" class="hover:text-brand-600">Privacy Policy</a></li>
                        <li><a href="/terms.html" class="hover:text-brand-600">Terms of Service</a></li>
                        <li><a href="/contact.html" class="hover:text-brand-600">Contact Us</a></li>
                        <li><a href="/admin/login.html" class="hover:text-brand-600">Admin Login</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-400 text-sm">© ${new Date().getFullYear()} Digital Services Hub. All rights reserved.</p>
                <div class="flex gap-4">
                    <a href="#" class="text-slate-400 hover:text-brand-600"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                    <a href="#" class="text-slate-400 hover:text-brand-600"><i data-lucide="github" class="w-5 h-5"></i></a>
                </div>
            </div>
        </div>
    `;
    if(window.lucide) window.lucide.createIcons();
}

export async function generateAIContent(prompt) {
    console.log("Mock AI Content Generation for:", prompt);
    return "This is a placeholder for AI content.";
}

// Initialize Analytics
const analytics = new AnalyticsEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

// ✅ EXPORT EVERYTHING (Note: loadFooter is NOT in this list because it was exported directly above)
export { app, db, auth, appId, onAuthStateChanged, analytics };
