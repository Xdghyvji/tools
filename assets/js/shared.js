import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, setDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. CONFIGURATION
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mubashir-2b7cc";

export { db, auth, appId, onAuthStateChanged };

// GLOBAL STATE
let currentUserData = null; 

// HELPER: Detect if we are inside the admin folder to fix links
const isInsideAdmin = window.location.pathname.includes('/admin/');
const getPath = (path) => isInsideAdmin ? `../${path}` : path;
const getAdminPath = () => isInsideAdmin ? 'index.html' : 'admin/index.html';

// ==========================================
// 2. AUTH & USER SYNC
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Redirect Logic: If on Login Page -> Go to Home
        if (window.location.pathname.includes('login.html')) {
            // FIX: Use relative path for redirect
            if (user.email === "admin@dsh.online") {
                window.location.href = 'admin/index.html';
            } else {
                window.location.href = 'index.html';
            }
        }
        
        // 2. Navbar Logic: Admin vs User
        const navCta = document.getElementById('nav-cta');
        if(navCta) {
            if (user.email === "admin@dsh.online") {
                // *** FIX: Dashboard Link fixed to relative path ***
                navCta.innerHTML = `<span class="flex items-center gap-2"><i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard</span>`;
                navCta.href = getAdminPath(); // Uses helper to decide path
                navCta.className = "bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center";
            } else {
                // NORMAL USER VIEW
                const profileBtn = document.createElement('a');
                profileBtn.href = getPath("userprofile.html"); 
                profileBtn.className = "w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md hover:shadow-lg transition-transform transform hover:scale-105 border-2 border-white ring-2 ring-brand-100";
                profileBtn.innerHTML = user.email ? user.email.charAt(0).toUpperCase() : 'U';
                profileBtn.title = "My Profile";
                
                if(navCta.parentNode) navCta.parentNode.replaceChild(profileBtn, navCta);
            }
            if(window.lucide) window.lucide.createIcons();
        }

        // --- USER SYNC & VIP CHECK ---
        if (user.email !== "admin@dsh.online") {
            const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
            try {
                const snap = await getDoc(userRef);
                
                if (!snap.exists()) {
                    await setDoc(userRef, {
                        email: user.email || `anon_${user.uid.slice(0,5)}`,
                        displayName: user.displayName || 'Anonymous',
                        usageCount: 0,
                        vip: false,
                        blocked: false,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                        isAnonymous: user.isAnonymous
                    });
                    currentUserData = { vip: false, blocked: false };
                } else {
                    await updateDoc(userRef, { lastLogin: serverTimestamp() });
                    currentUserData = snap.data();
                }

                if (currentUserData?.vip) {
                    document.querySelectorAll('[id^="ad-"]').forEach(el => el.classList.add('hidden'));
                } else {
                    injectUpgradeButton();
                }

            } catch(e) { console.warn("User init failed", e); }
        }

        // Traffic Log
        if (user.email !== "admin@dsh.online" && !sessionStorage.getItem('session_logged')) {
            logTraffic();
            sessionStorage.setItem('session_logged', 'true');
        }
    } else {
        signInAnonymously(auth).catch(console.error);
        injectUpgradeButton();
    }
});

async function logTraffic() {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), {
            path: window.location.pathname,
            timestamp: serverTimestamp(),
            referrer: document.referrer || 'direct',
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            platform: navigator.platform,
            language: navigator.language
        });
    } catch(e) {}
}

async function logToolUsage(tool, topic) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs'), {
            tool: tool,
            topic: topic,
            createdAt: serverTimestamp(),
            user: user.uid
        });
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await updateDoc(userRef, { usageCount: increment(1), lastActive: serverTimestamp() });
    } catch(e) {}
}

// ==========================================
// 3. UI COMPONENTS & INJECTIONS
// ==========================================
export function loadHeader(activePage = 'home') {
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    const getClass = (page) => activePage === page ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600 font-medium transition-colors';

    // FIX: Using getPath() to ensure links work from subfolders too
    headerElement.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
            <div class="flex items-center gap-2 cursor-pointer select-none" onclick="window.location.href='${getPath('index.html')}'">
                <div class="bg-brand-600 p-2 rounded-lg text-white shadow-lg shadow-brand-500/30"><i data-lucide="cpu" class="w-6 h-6"></i></div>
                <span class="text-xl font-bold font-heading text-slate-900 tracking-tight">DigitalServices<span class="text-brand-600">Hub</span></span>
            </div>
            <nav class="hidden md:flex space-x-8 items-center">
                <a href="${getPath('index.html')}" class="${getClass('home')} text-sm uppercase tracking-wide">Home</a>
                <a href="${getPath('about.html')}" class="${getClass('about')} text-sm uppercase tracking-wide">About</a>
                <a href="${getPath('blog.html')}" class="${getClass('blog')} text-sm uppercase tracking-wide">Blog</a>
                <a href="${getPath('contact.html')}" class="${getClass('contact')} text-sm uppercase tracking-wide">Contact</a>
                <a href="${getPath('login.html')}" id="nav-cta" class="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">Login</a>
            </nav>
            <button id="mobile-menu-btn" class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><i data-lucide="menu" class="w-6 h-6"></i></button>
        </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl z-50">
        <div class="px-4 pt-4 pb-6 space-y-2">
            <a href="${getPath('index.html')}" class="block px-4 py-3 rounded-lg font-medium">Home</a>
            <a href="${getPath('about.html')}" class="block px-4 py-3 rounded-lg font-medium">About</a>
            <a href="${getPath('blog.html')}" class="block px-4 py-3 rounded-lg font-medium">Blog</a>
            <a href="${getPath('contact.html')}" class="block px-4 py-3 rounded-lg font-medium">Contact</a>
            <a href="${getPath('login.html')}" class="block px-4 py-3 mt-4 text-center rounded-lg bg-slate-900 text-white font-bold">Login</a>
        </div>
    </div>`;

    if(window.lucide) window.lucide.createIcons();
    setTimeout(() => {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if(btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        
        injectTagline();
    }, 0);
}

// TAGLINE INJECTOR
function injectTagline() {
    const toolNav = document.querySelector('.fixed.top-20');
    if (toolNav && !document.getElementById('global-tagline')) {
        const tagline = document.createElement('a'); 
        tagline.id = 'global-tagline';
        tagline.href = getPath("subscription.html");
        tagline.className = "fixed top-[144px] w-full z-30 bg-amber-50/95 backdrop-blur border-b border-amber-200 py-2 text-center text-xs font-bold text-amber-800 hidden md:block animate-fade-in hover:bg-amber-100 transition-colors cursor-pointer flex justify-center items-center gap-2";
        tagline.innerHTML = `<i data-lucide="crown" class="w-3 h-3 fill-current"></i> <span class="underline decoration-amber-300 underline-offset-2">NEW: Experience our Exclusive SEO AI models and boost your social media journey</span>`;
        document.body.appendChild(tagline);
        if(window.lucide) window.lucide.createIcons();
    }
}

// UPGRADE BUTTON INJECTOR
function injectUpgradeButton() {
    const navContainer = document.querySelector('.fixed.top-20 .max-w-7xl .flex');
    if (navContainer && !document.getElementById('nav-upgrade-btn')) {
        const btn = document.createElement('a');
        btn.id = 'nav-upgrade-btn';
        btn.href = getPath("subscription.html");
        btn.className = "ml-auto flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all transform whitespace-nowrap border border-white/20";
        btn.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3 fill-current"></i> Go Premium`;
        
        navContainer.appendChild(btn);
        if(window.lucide) window.lucide.createIcons();
    }
}

export function loadFooter() {
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
            <div class="col-span-1">
                <div class="flex items-center gap-2 mb-6">
                    <div class="bg-brand-600 p-1.5 rounded text-white"><i data-lucide="cpu" class="w-5 h-5"></i></div>
                    <span class="text-lg font-bold text-white">DigitalServicesHub</span>
                </div>
                <p class="text-sm text-slate-400 leading-relaxed">AI-powered tools for content creators.</p>
            </div>
            <div>
                <h4 class="text-white font-bold mb-6 uppercase text-xs tracking-wider">Tools</h4>
                <ul class="space-y-3 text-sm">
                    <li><a href="${getPath('index.html')}" class="hover:text-white transition-colors">YouTube Generator</a></li>
                    <li><a href="${getPath('tiktok.html')}" class="hover:text-white transition-colors">TikTok Viral</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-bold mb-6 uppercase text-xs tracking-wider">Legal</h4>
                <ul class="space-y-3 text-sm">
                    <li><a href="#" class="hover:text-white transition-colors">Privacy</a></li>
                    <li><a href="${getPath('contact.html')}" class="hover:text-white transition-colors">Support</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-bold mb-4">Follow Us</h4>
                <div class="flex space-x-4" id="footer-socials"></div>
            </div>
        </div>
        <div class="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>&copy; ${new Date().getFullYear()} DigitalServicesHub. All rights reserved.</p>
        </div>
    </div>`;
}

// ... (Rest of settings and AI generation code remains the same)
// ==========================================
// 4. SETTINGS & ADS
// ==========================================
export async function loadGlobalSettings() {
    try {
        if (currentUserData?.vip) return null;
        const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'));
        if(snap.exists()) {
            const data = snap.data();
            if (currentUserData?.vip) return null;
            if (data.maintenance && !window.location.pathname.includes('admin') && !window.location.pathname.includes('login')) {
                if (!auth.currentUser || auth.currentUser.email !== "admin@dsh.online") {
                    document.body.innerHTML = `<div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:white;"><h1>🚧 Site Under Maintenance</h1></div>`;
                    return null;
                }
            }
            if(data.title) document.title = data.title;
            const socialContainer = document.getElementById('footer-socials');
            if(socialContainer && data.social) {
                socialContainer.innerHTML = '';
                ['twitter','github','linkedin','facebook','instagram','youtube'].forEach(net => {
                    if(data.social[net]) socialContainer.innerHTML += `<a href="${data.social[net]}" class="hover:text-white transition-colors"><i data-lucide="${net === 'tiktok' ? 'music-2' : net}" class="w-5 h-5"></i></a>`;
                });
                if(window.lucide) window.lucide.createIcons();
            }
            // ... (Ads logic remains same)
            return data;
        }
    } catch(e) {}
    return null;
}

// ... (AI Generation functions remain same)
// ==========================================
// 5. AI GENERATION
// ==========================================
let systemPrompts = {};
export async function loadSystemPrompts() {
    try {
        const q = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'system_prompts'));
        q.forEach((doc) => { systemPrompts[doc.id] = doc.data().template; });
    } catch (e) {}
}

export function getPromptForTool(toolKey, topic) {
    const isVip = currentUserData?.vip || false;
    const targetKey = isVip ? `${toolKey}_vip` : toolKey;
    const defaults = { 'youtube_title': 'Generate 5 viral YouTube titles for: "${topic}"' };
    let template = systemPrompts[targetKey] || systemPrompts[toolKey] || defaults[toolKey] || `Generate content for ${toolKey} about ${topic}`;
    if (isVip) console.log(`✨ Using VIP Model for ${toolKey}`);
    return template.replace('${topic}', topic);
}

export async function generateAIContent(prompt, toolType, topic) {
    const user = auth.currentUser;
    if (user && currentUserData?.blocked) throw new Error("Access Denied. Your account has been blocked by the administrator.");
    await logToolUsage(toolType, topic);
    const endpoint = '/.netlify/functions/generate-content';
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, metadata: { tool: toolType, topic, vip: currentUserData?.vip } })
        });
        if (!response.ok) throw new Error("AI Service Busy or Rate Limited");
        const result = await response.json();
        return result.text;
    } catch (error) {
        console.error("AI Error:", error);
        throw error;
    }
}
