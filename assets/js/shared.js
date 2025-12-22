// ✅ FIX: Using stable Firebase version 10.12.2 (Version 11 doesn't exist yet)
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

// This is your Database Path ID
const appId = 'mubashir-2b7cc'; 

// ==========================================
// 2. ANALYTICS ENGINE (Robust & Non-Blocking)
// ==========================================
class AnalyticsEngine {
    constructor() {
        // Default to anonymous if API fails
        this.ipData = { ip: 'Anonymous', country_name: 'Unknown', city: 'Unknown' };
        this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        this.trackingActive = false;
    }

    init() {
        // Check Consent
        const consent = localStorage.getItem('dsh_cookie_consent');
        if (consent === 'rejected') return; 
        if (consent === 'accepted') this.startTracking();
        else CookieManager.show(); 
    }

    async startTracking() {
        if (this.trackingActive) return;
        this.trackingActive = true;
        console.log("📊 Analytics Started");

        // 1. Fetch IP (With Fallback for Adblockers)
        await this.fetchGeoData();

        // 2. Log Initial Page View
        this.logEvent('page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer || 'Direct'
        });

        // 3. Attach Click Listeners
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // 4. Heartbeat (Time on Page)
        setInterval(() => this.logHeartbeat(), 30000); 
    }

    async fetchGeoData() {
        try {
            // Primary: ipapi.co (JSON)
            const res = await fetch('https://ipapi.co/json/');
            if(res.ok) {
                this.ipData = await res.json();
            } else {
                throw new Error("Blocked");
            }
        } catch (e) {
            console.warn("Analytics: Primary Geo-lookup blocked. Trying backup...");
            try {
                // Backup: IP only (no country) via Cloudflare
                const res2 = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
                const text = await res2.text();
                const ipArr = text.match(/ip=(.*)/);
                if(ipArr) this.ipData.ip = ipArr[1];
            } catch(err) {
                // If everything fails, we just track as "Anonymous"
                console.log("Analytics: Tracking anonymously.");
            }
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
            // We use 'traffic_logs' collection
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), payload);
        } catch (e) {
            // Silent fail (do not crash site if DB write fails)
        }
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
                    <p class="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
                        We use cookies to analyze traffic and show personalized ads. 
                        <a href="/privacy.html" class="underline">Learn more</a>.
                    </p>
                    <div class="flex gap-2">
                        <button id="cookie-reject" class="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Reject</button>
                        <button id="cookie-accept" class="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-lg">Accept</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        // Slide In
        setTimeout(() => {
            div.classList.remove('translate-y-20', 'opacity-0');
        }, 100);

        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            div.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => div.remove(), 500);
            analytics.startTracking();
        };

        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            div.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => div.remove(), 500);
        };
    }
};

// ==========================================
// 4. GLOBAL HELPERS (Required by other scripts)
// ==========================================

// Fix for "does not provide export named generateAIContent" error
export async function generateAIContent(prompt) {
    console.log("Mock AI Content Generation for:", prompt);
    return "This is a placeholder for AI content. Real generation happens in the Admin Panel.";
}

// Initialize Analytics
const analytics = new AnalyticsEngine();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

// ✅ EXPORT EVERYTHING
export { app, db, auth, appId, onAuthStateChanged, analytics };
