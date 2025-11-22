import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBPyGJ_qX58Ye3Z8BTiKnYGNMYROnyHlGA", // Safe to be public
  authDomain: "mubashir-2b7cc.firebaseapp.com",
  projectId: "mubashir-2b7cc",
  storageBucket: "mubashir-2b7cc.firebasestorage.app",
  messagingSenderId: "107494735119",
  appId: "1:107494735119:web:1fc0eab2bc0b8cb39e527a",
  measurementId: "G-SP28C45HH4"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global State
let currentUser = null;
const appId = "mubashir-2b7cc";

// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Update Login Button to Dashboard if logged in
        const navCta = document.getElementById('nav-cta');
        if(navCta) {
            navCta.innerText = "Dashboard";
            navCta.href = "admin.html";
            navCta.classList.add('bg-green-600', 'hover:bg-green-700');
            navCta.classList.remove('bg-slate-900', 'hover:bg-slate-800');
        }
    } else {
        // Silent Anonymous Login for Firestore Access
        signInAnonymously(auth).catch((error) => {
            console.error("Auth Error:", error);
        });
    }
});

// ==========================================
// 3. AI CONTENT GENERATION (NETLIFY PROXY)
// ==========================================
/**
 * Calls the Netlify Serverless Function to generate content securely.
 * This hides the API Key from the browser network tab.
 */
export async function generateAIContent(prompt, toolType, topic) {
    // Relative path to Netlify Function
    const endpoint = '/.netlify/functions/generate-content';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                // Context data (optional, good for future logging)
                metadata: { tool: toolType, topic: topic } 
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server Error: ${response.status}`);
        }

        const result = await response.json();
        return result.text;

    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw error; // Re-throw to be handled by the UI
    }
}

// ==========================================
// 4. UI COMPONENT INJECTION (HEADER/FOOTER)
// ==========================================

/**
 * Injects the Navigation Header
 * @param {string} activePage - 'home', 'about', 'blog', 'contact', 'login'
 */
export function loadHeader(activePage = 'home') {
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    // Helper to set active class
    const getClass = (page) => 
        activePage === page 
            ? 'text-brand-600 font-semibold' 
            : 'text-slate-600 hover:text-brand-600 font-medium transition-colors';

    headerElement.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
            <!-- Logo -->
            <div class="flex items-center gap-2 cursor-pointer select-none" onclick="window.location.href='index.html'">
                <div class="bg-brand-600 p-2 rounded-lg text-white shadow-lg shadow-brand-500/30">
                    <i data-lucide="cpu" class="w-6 h-6"></i>
                </div>
                <span class="text-xl font-bold font-heading text-slate-900 tracking-tight">
                    DigitalServices<span class="text-brand-600">Hub</span>
                </span>
            </div>

            <!-- Desktop Nav -->
            <nav class="hidden md:flex space-x-8 items-center">
                <a href="index.html" class="${getClass('home')} text-sm uppercase tracking-wide">Home</a>
                <a href="about.html" class="${getClass('about')} text-sm uppercase tracking-wide">About</a>
                <a href="blog.html" class="${getClass('blog')} text-sm uppercase tracking-wide">Blog</a>
                <a href="contact.html" class="${getClass('contact')} text-sm uppercase tracking-wide">Contact</a>
                <a href="login.html" id="nav-cta" class="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all transform hover:scale-105 shadow-lg">
                    Login
                </a>
            </nav>

            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Open Menu">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
        </div>
    </div>

    <!-- Mobile Menu (Hidden by default) -->
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl z-50">
        <div class="px-4 pt-4 pb-6 space-y-2">
            <a href="index.html" class="block px-4 py-3 rounded-lg ${activePage === 'home' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'} font-medium">Home</a>
            <a href="about.html" class="block px-4 py-3 rounded-lg ${activePage === 'about' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'} font-medium">About Us</a>
            <a href="blog.html" class="block px-4 py-3 rounded-lg ${activePage === 'blog' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'} font-medium">Blog</a>
            <a href="contact.html" class="block px-4 py-3 rounded-lg ${activePage === 'contact' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'} font-medium">Contact</a>
            <a href="login.html" class="block px-4 py-3 mt-4 text-center rounded-lg bg-slate-900 text-white font-bold">Login / Dashboard</a>
        </div>
    </div>`;

    // Re-initialize icons for injected content
    if(window.lucide) window.lucide.createIcons();

    // Attach Event Listener for Mobile Menu
    setTimeout(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if(btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
                const icon = menu.classList.contains('hidden') ? 'menu' : 'x';
                btn.innerHTML = `<i data-lucide="${icon}" class="w-6 h-6"></i>`;
                if(window.lucide) window.lucide.createIcons();
            });
        }
    }, 0);
}

/**
 * Injects the Footer
 */
export function loadFooter() {
    // Find footer by ID or create it if missing
    let footer = document.getElementById('main-footer');
    if (!footer) {
        footer = document.createElement('footer');
        footer.id = 'main-footer';
        document.body.appendChild(footer);
    }

    footer.className = "bg-slate-900 text-slate-300 py-16 border-t border-slate-800 mt-auto";
    
    footer.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <!-- Brand Column -->
            <div class="col-span-1">
                <div class="flex items-center gap-2 mb-6">
                    <div class="bg-brand-600 p-1.5 rounded text-white">
                        <i data-lucide="cpu" class="w-5 h-5"></i>
                    </div>
                    <span class="text-lg font-bold text-white">DigitalServicesHub</span>
                </div>
                <p class="text-sm text-slate-400 leading-relaxed mb-6">
                    Empowering creators with free, professional-grade AI tools. Scale your digital presence without the subscription fees.
                </p>
                <div class="flex space-x-4">
                    <a href="#" class="text-slate-400 hover:text-white transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                    <a href="#" class="text-slate-400 hover:text-white transition-colors"><i data-lucide="github" class="w-5 h-5"></i></a>
                    <a href="#" class="text-slate-400 hover:text-white transition-colors"><i data-lucide="linkedin" class="w-5 h-5"></i></a>
                </div>
            </div>
            
            <!-- Tools Links -->
            <div>
                <h4 class="text-white font-bold mb-6 uppercase text-xs tracking-wider">Popular Tools</h4>
                <ul class="space-y-3 text-sm">
                    <li><a href="index.html" class="hover:text-white hover:pl-2 transition-all">YouTube Generator</a></li>
                    <li><a href="instagram.html" class="hover:text-white hover:pl-2 transition-all">Instagram Captions</a></li>
                    <li><a href="tiktok.html" class="hover:text-white hover:pl-2 transition-all">TikTok Viral Hooks</a></li>
                    <li><a href="twitter-tools.html" class="hover:text-white hover:pl-2 transition-all">Twitter Threads</a></li>
                </ul>
            </div>

            <!-- Company Links -->
            <div>
                <h4 class="text-white font-bold mb-6 uppercase text-xs tracking-wider">Company</h4>
                <ul class="space-y-3 text-sm">
                    <li><a href="about.html" class="hover:text-white hover:pl-2 transition-all">About Us</a></li>
                    <li><a href="contact.html" class="hover:text-white hover:pl-2 transition-all">Contact Support</a></li>
                    <li><a href="blog.html" class="hover:text-white hover:pl-2 transition-all">Blog & Guides</a></li>
                    <li><a href="privacy.html" class="hover:text-white hover:pl-2 transition-all">Privacy Policy</a></li>
                </ul>
            </div>

            <!-- Newsletter (Static for now) -->
            <div>
                <h4 class="text-white font-bold mb-6 uppercase text-xs tracking-wider">Stay Updated</h4>
                <p class="text-xs text-slate-500 mb-4">Get the latest AI tools and tips delivered to your inbox.</p>
                <div class="flex gap-2">
                    <input type="email" placeholder="Enter email" class="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-brand-500">
                    <button class="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg transition-colors">
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; ${new Date().getFullYear()} DigitalServicesHub.online. All rights reserved.</p>
            <p class="flex items-center gap-1">Made with <i data-lucide="heart" class="w-3 h-3 text-red-500 fill-current"></i> for Creators</p>
        </div>
    </div>`;

    if(window.lucide) window.lucide.createIcons();
}

// ==========================================
// 5. GLOBAL SETTINGS & ADS (HYBRID FALLBACK)
// ==========================================
export async function loadGlobalSettings() {
    try {
        // Fetch global settings from Firestore
        const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'));
        
        if(snap.exists()) {
            const data = snap.data();
            
            // 1. Inject Google AdSense (Head)
            // This runs if AdSense data exists
            if(data.adsense && !document.getElementById('adsense-script')) {
                const div = document.createElement('div');
                div.id = 'adsense-script';
                div.innerHTML = data.adsense; 
                // Execute Scripts manually for AdSense
                Array.from(div.querySelectorAll('script')).forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    document.head.appendChild(newScript);
                });
            }

            // 2. Inject Adsterra (Body Placeholders)
            // This runs IF Adsterra data exists AND specific placeholder divs are on the page.
            // It serves as a fallback (if AdSense is blocked/empty) OR as additional inventory.
            if (data.adsterra) {
                const adSizes = ['728x90', '468x60', '300x250', '160x600', '320x50', '160x300'];
                
                adSizes.forEach(size => {
                    const adCode = data.adsterra[size];
                    if (!adCode) return;

                    // Find the specific container for this size (e.g., <div id="ad-728-90">)
                    const slot = document.getElementById(`ad-${size}`);
                    const container = document.getElementById(`ad-${size}-container`);

                    // Only inject if the slot exists and is empty (prevents double injection)
                    if (slot && container && !slot.hasChildNodes()) {
                        slot.innerHTML = adCode;
                        container.classList.remove('hidden'); // Unhide container
                        
                        // Execute Adsterra Scripts (critical for ads to show)
                        Array.from(slot.querySelectorAll('script')).forEach(oldScript => {
                            const newScript = document.createElement('script');
                            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        });
                    }
                });
            }

            return data; 
        }
    } catch(e) { 
        console.warn("Settings Load Warning:", e); 
    }
    return null;
}

// Export instances for page-specific use if needed
export { db, auth, appId };