import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ==========================================
// 1. CONFIGURATION
// ==========================================
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "digitalserviceshub-786.firebaseapp.com",
    projectId: "digitalserviceshub-786",
    storageBucket: "digitalserviceshub-786.firebasestorage.app",
    messagingSenderId: "549394013098",
    appId: "1:549394013098:web:4f03c7344933a39151c888"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = 'mubashir-2b7cc'; // Your unique App ID

// ==========================================
// 2. ANALYTICS ENGINE (The Spyglass)
// ==========================================
class AnalyticsEngine {
    constructor() {
        this.ipData = null;
        this.sessionId = this.generateSessionId();
    }

    async init() {
        // 1. Check Consent
        if (localStorage.getItem('dsh_cookie_consent') !== 'accepted') {
            CookieManager.show();
            return; // Stop tracking until accepted
        }

        // 2. Get User Identity (IP/Geo)
        try {
            const res = await fetch('https://ipapi.co/json/');
            this.ipData = await res.json();
        } catch (e) {
            console.warn("Analytics: Geo-lookup failed");
            this.ipData = { ip: 'Unknown', country_name: 'Unknown', city: 'Unknown' };
        }

        // 3. Log Page View
        this.logEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer || 'Direct',
            title: document.title
        });

        // 4. Attach Listeners
        this.attachClickListeners();
        this.trackTimeOnPage();
    }

    async logEvent(type, details = {}) {
        if (!this.ipData) return; // Wait for IP data

        const payload = {
            type: type, // 'page_view', 'click', 'ad_click'
            sessionId: this.sessionId,
            ip: this.ipData.ip || 'Anonymous',
            country: this.ipData.country_name || 'Unknown',
            city: this.ipData.city || 'Unknown',
            device: this.getDeviceType(),
            os: this.getOS(),
            browser: this.getBrowser(),
            path: window.location.pathname,
            timestamp: serverTimestamp(),
            ...details
        };

        try {
            // Write to Firestore 'traffic_logs'
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), payload);
        } catch (e) {
            // Silent fail to not disrupt user experience
        }
    }

    attachClickListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, .ad-banner');
            if (!target) return;

            let type = 'click';
            if (target.classList.contains('ad-banner') || target.id.includes('ad')) {
                type = 'ad_click';
            }

            this.logEvent(type, {
                element: target.tagName,
                id: target.id || 'N/A',
                class: target.className,
                link: target.href || 'N/A',
                text: target.innerText.substring(0, 50)
            });
        });
    }

    trackTimeOnPage() {
        let seconds = 0;
        setInterval(() => {
            seconds += 10;
            // Only log significant milestones (10s, 30s, 60s, etc) to save DB writes
            if ([10, 30, 60, 120, 300].includes(seconds)) {
                this.logEvent('ping', { duration: seconds });
            }
        }, 10000);
    }

    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9);
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(ua)) return "Mobile";
        return "Desktop";
    }

    getOS() {
        const platform = navigator.platform;
        if (platform.indexOf('Win') !== -1) return 'Windows';
        if (platform.indexOf('Mac') !== -1) return 'MacOS';
        if (platform.indexOf('Linux') !== -1) return 'Linux';
        if (/Android/.test(navigator.userAgent)) return 'Android';
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'iOS';
        return 'Unknown';
    }

    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf("Chrome") > -1) return "Chrome";
        if (ua.indexOf("Safari") > -1) return "Safari";
        if (ua.indexOf("Firefox") > -1) return "Firefox";
        return "Other";
    }
}

// ==========================================
// 3. COOKIE CONSENT UI (GDPR/CCPA)
// ==========================================
const CookieManager = {
    show: () => {
        if (document.getElementById('dsh-cookie-popup')) return;

        const div = document.createElement('div');
        div.id = 'dsh-cookie-popup';
        div.className = "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-[9999] animate-fade-in-up transform transition-all";
        div.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="p-2 bg-brand-100 text-brand-600 rounded-lg shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>
                </div>
                <div>
                    <h4 class="font-bold text-slate-900 mb-1">We value your privacy</h4>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">
                        We use cookies to enhance your experience, analyze site traffic, and serve relevant advertisements.
                        <a href="/privacy.html" class="text-brand-600 underline hover:text-brand-700">Read Policy</a>.
                    </p>
                    <div class="flex gap-2">
                        <button id="cookie-reject" class="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Necessary Only</button>
                        <button id="cookie-accept" class="flex-1 px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-lg shadow-brand-500/30 transition-colors">Accept All</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        // Add Animations CSS if not present
        if (!document.getElementById('dsh-anim-style')) {
            const style = document.createElement('style');
            style.id = 'dsh-anim-style';
            style.textContent = `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('cookie-accept').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'accepted');
            div.remove();
            analytics.init(); // Start tracking immediately
        };

        document.getElementById('cookie-reject').onclick = () => {
            localStorage.setItem('dsh_cookie_consent', 'rejected');
            div.remove();
        };
    }
};

// Initialize
const analytics = new AnalyticsEngine();
// Wait for DOM to load fully
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}

export { app, db, auth, appId, onAuthStateChanged, analytics };
