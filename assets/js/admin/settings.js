import { db, appId, auth } from '../../js/shared.js';
import { collection, doc, setDoc, getDoc, addDoc, deleteDoc, updateDoc, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Route Dispatcher
export function render(type) {
    if (type === 'settings') return renderGlobalSettings();
    if (type === 'keys') return renderKeys();
    if (type === 'banners') return renderBanners();
    if (type === 'logs') return renderLogs();
}

export async function init(type) {
    if (type === 'settings') return initGlobalSettings();
    if (type === 'keys') return initKeys();
    if (type === 'banners') return initBanners();
    if (type === 'logs') return initLogs();
}

// ==========================================
// 1. GLOBAL SETTINGS (Main Configuration)
// ==========================================
function renderGlobalSettings() {
    return `
    <div class="animate-fade-in max-w-6xl mx-auto pb-20">
        <!-- Sticky Header Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-30">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Global Configuration</h1>
                <p class="text-xs text-slate-500">Manage SEO, Ads, Scripts & System Flags</p>
            </div>
            <div class="flex gap-3">
                <button id="backup-btn" class="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2 transition-all">
                    <i data-lucide="database" class="w-4 h-4"></i> Backup Data
                </button>
                <button id="save-settings-btn" class="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Save Changes
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- LEFT COLUMN: Content & SEO -->
            <div class="lg:col-span-2 space-y-8">
                
                <!-- Site Identity & SEO -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <i data-lucide="globe" class="w-4 h-4 text-brand-600"></i>
                        <h3 class="font-bold text-slate-700">Site Identity & Metadata</h3>
                    </div>
                    <div class="p-6 space-y-5">
                        <div class="grid md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Website Title</label>
                                <input type="text" id="seo-title" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="My Awesome Site">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Author Name</label>
                                <input type="text" id="seo-author" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Admin Name">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Meta Description</label>
                            <textarea id="seo-desc" rows="2" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Site summary for search engines..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Keywords (Comma Separated)</label>
                            <textarea id="seo-keywords" rows="2" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="tools, ai, generator..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">OG Image URL (Social Preview)</label>
                            <div class="flex gap-2">
                                <input type="text" id="seo-og-image" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="https://...">
                                <div class="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400"><i data-lucide="image" class="w-5 h-5"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Integrations -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <i data-lucide="code-2" class="w-4 h-4 text-purple-600"></i>
                        <h3 class="font-bold text-slate-700">Integrations & Analytics</h3>
                    </div>
                    <div class="p-6 space-y-5">
                        <div class="grid md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Google Analytics ID</label>
                                <input type="text" id="seo-analytics-id" class="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="G-XXXXXXXXXX">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Search Console Meta Tag</label>
                                <input type="text" id="seo-search-console" class="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none" placeholder='<meta name="google-site...'>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Custom Header Scripts (Global)</label>
                            <textarea id="seo-scripts" rows="4" class="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50" placeholder="<!-- Pixel Codes, Chat Widgets, etc. -->"></textarea>
                        </div>
                        <div class="grid md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Sitemap URL</label>
                                <input type="text" id="seo-sitemap" class="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="/sitemap.xml">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Robots.txt Content</label>
                                <textarea id="seo-robots" rows="1" class="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none" placeholder="User-agent: * Allow: /"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- RIGHT COLUMN: Ads, Socials & System -->
            <div class="lg:col-span-1 space-y-8">
                
                <!-- Ad Configuration -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <i data-lucide="dollar-sign" class="w-4 h-4 text-green-600"></i>
                        <h3 class="font-bold text-slate-700">Ad Configuration</h3>
                    </div>
                    <div class="p-6 space-y-6">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Google AdSense (Auto)</label>
                            <textarea id="ads-adsense" rows="2" class="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 outline-none" placeholder='<script async src="..."></script>'></textarea>
                        </div>

                        <div class="border-t border-slate-100 pt-4">
                            <label class="block text-xs font-bold text-slate-700 uppercase mb-3">Adsterra / Custom Units</label>
                            <div class="space-y-4">
                                ${renderAdInput('ads-728', '728x90 (Leaderboard)')}
                                ${renderAdInput('ads-468', '468x60 (Full Banner)')}
                                ${renderAdInput('ads-300', '300x250 (Rectangle)')}
                                ${renderAdInput('ads-160', '160x600 (Skyscraper)')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Social Links -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <i data-lucide="share-2" class="w-4 h-4 text-blue-600"></i>
                        <h3 class="font-bold text-slate-700">Social Links</h3>
                    </div>
                    <div class="p-6 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        ${renderSocialInput('twitter', 'Twitter / X')}
                        ${renderSocialInput('instagram', 'Instagram')}
                        ${renderSocialInput('facebook', 'Facebook')}
                        ${renderSocialInput('youtube', 'YouTube')}
                        ${renderSocialInput('tiktok', 'TikTok')}
                        ${renderSocialInput('linkedin', 'LinkedIn')}
                        ${renderSocialInput('github', 'GitHub')}
                        ${renderSocialInput('pinterest', 'Pinterest')}
                        ${renderSocialInput('snapchat', 'Snapchat')}
                        ${renderSocialInput('whatsapp', 'WhatsApp')}
                        ${renderSocialInput('telegram', 'Telegram')}
                        ${renderSocialInput('discord', 'Discord')}
                        ${renderSocialInput('reddit', 'Reddit')}
                        ${renderSocialInput('medium', 'Medium')}
                        ${renderSocialInput('patreon', 'Patreon')}
                    </div>
                </div>

                <!-- System Flags -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-red-600"></i>
                        <h3 class="font-bold text-slate-700">System Flags</h3>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="block text-sm font-bold text-slate-900">Maintenance Mode</span>
                                <span class="text-xs text-slate-500">Blocks public access.</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="flag-maintenance" class="sr-only peer toggle-checkbox">
                                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>`;
}

function renderAdInput(id, label) {
    return `
    <div>
        <span class="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 block mb-1">${label}</span>
        <textarea id="${id}" rows="2" class="w-full p-2 border border-slate-200 rounded text-xs font-mono focus:border-green-500 outline-none" placeholder="Paste iframe/script code here..."></textarea>
    </div>`;
}

function renderSocialInput(id, label) {
    return `
    <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i data-lucide="${mapIcon(id)}" class="h-4 w-4 text-slate-400 group-focus-within:text-brand-500"></i>
        </div>
        <input type="text" id="social-${id}" class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-200 outline-none transition-all" placeholder="${label} URL">
    </div>`;
}

function mapIcon(id) {
    const map = { 
        'tiktok': 'music-2', 'snapchat': 'ghost', 'whatsapp': 'phone', 'telegram': 'send',
        'discord': 'gamepad-2', 'reddit': 'message-circle', 'medium': 'book-open', 'patreon': 'dollar-sign'
    };
    return map[id] || id; 
}

async function initGlobalSettings() {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
    
    // 1. LOAD DATA FROM FIREBASE
    try {
        const snap = await getDoc(docRef);
        if(snap.exists()) {
            const data = snap.data();
            
            // Populate SEO & Identity
            setVal('seo-title', data.title);
            setVal('seo-author', data.author);
            setVal('seo-desc', data.description);
            setVal('seo-keywords', data.keywords);
            setVal('seo-og-image', data.ogImage);
            setVal('seo-analytics-id', data.analyticsId);
            setVal('seo-search-console', data.searchConsole);
            setVal('seo-scripts', data.scripts);
            setVal('seo-sitemap', data.sitemap);
            setVal('seo-robots', data.robots);
            
            // Populate Ads
            setVal('ads-adsense', data.adsense);
            if(data.adsterra) {
                setVal('ads-728', data.adsterra['728x90']);
                setVal('ads-468', data.adsterra['468x60']);
                setVal('ads-300', data.adsterra['300x250']);
                setVal('ads-160', data.adsterra['160x600']);
            }

            // Populate Socials
            if(data.social) {
                Object.keys(data.social).forEach(net => setVal(`social-${net}`, data.social[net]));
            }

            // Populate Flags
            if(document.getElementById('flag-maintenance')) {
                document.getElementById('flag-maintenance').checked = data.maintenance || false;
            }
        }
    } catch(e) { console.error("Settings Load Error:", e); }

    // 2. SAVE BUTTON LISTENER
    const saveBtn = document.getElementById('save-settings-btn');
    if(saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const originalHTML = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<div class="loader border-white border-t-transparent w-4 h-4 mr-2"></div> Saving...`;

            // Collect Socials Dynamically
            const socialData = {};
            const networks = ['twitter','instagram','facebook','youtube','tiktok','linkedin','github','pinterest','snapchat','whatsapp','telegram','discord','reddit','medium','patreon'];
            networks.forEach(net => {
                const val = getVal(`social-${net}`);
                if(val) socialData[net] = val;
            });

            const settings = {
                title: getVal('seo-title'),
                author: getVal('seo-author'),
                description: getVal('seo-desc'),
                keywords: getVal('seo-keywords'),
                ogImage: getVal('seo-og-image'),
                analyticsId: getVal('seo-analytics-id'),
                searchConsole: getVal('seo-search-console'),
                scripts: getVal('seo-scripts'),
                sitemap: getVal('seo-sitemap'),
                robots: getVal('seo-robots'),
                
                adsense: getVal('ads-adsense'),
                adsterra: {
                    '728x90': getVal('ads-728'),
                    '468x60': getVal('ads-468'),
                    '300x250': getVal('ads-300'),
                    '160x600': getVal('ads-160')
                },
                social: socialData,
                maintenance: document.getElementById('flag-maintenance').checked,
                updatedAt: serverTimestamp()
            };

            try {
                await setDoc(docRef, settings, { merge: true });
                // Show Success State
                saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Saved!`;
                saveBtn.classList.remove('bg-brand-600', 'hover:bg-brand-700');
                saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                
                // Log Action
                await logAction('Update', 'Global Settings');

                // Revert Button after 2s
                setTimeout(() => {
                    saveBtn.innerHTML = originalHTML;
                    saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    saveBtn.classList.add('bg-brand-600', 'hover:bg-brand-700');
                    saveBtn.disabled = false;
                    if(window.lucide) window.lucide.createIcons();
                }, 2000);
            } catch(e) {
                console.error(e);
                alert("Save failed: " + e.message + "\n\nEnsure you are logged in as Admin and your Firestore Rules allow writes.");
                saveBtn.innerHTML = originalHTML;
                saveBtn.disabled = false;
            }
        });
    }

    // 3. BACKUP BUTTON LISTENER
    document.getElementById('backup-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('backup-btn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<div class="loader border-slate-500 border-t-transparent w-3 h-3"></div> Exporting...`;
        
        try {
            const collections = ['posts', 'comments', 'subscribers', 'messages', 'banners', 'system_prompts', 'api_keys'];
            const backup = { settings: {} };
            
            // Get Settings
            const setSnap = await getDoc(docRef);
            if(setSnap.exists()) backup.settings = setSnap.data();

            // Get Collections
            for(const col of collections) {
                const s = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', col));
                backup[col] = [];
                s.forEach(d => backup[col].push({id: d.id, ...d.data()}));
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dsh_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            await logAction('Backup', 'Full Database Export');
            
        } catch(e) {
            alert("Backup failed: " + e.message);
        } finally {
            btn.innerHTML = originalContent;
            if(window.lucide) window.lucide.createIcons();
        }
    });

    return () => {}; 
}

function getVal(id) { return document.getElementById(id)?.value || ''; }
function setVal(id, val) { const el = document.getElementById(id); if(el) el.value = val || ''; }

// ==========================================
// 2. API KEYS SUB-MODULE
// ==========================================
function renderKeys() {
    return `
    <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900">API Key Management</h1>
            <button id="add-key-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-700 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Add Key</button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 border-b"><tr><th class="px-6 py-4">Key Snippet</th><th class="px-6 py-4">Status</th><th class="px-6 py-4 text-right">Action</th></tr></thead>
                <tbody id="keys-table-body" class="divide-y divide-slate-200"></tbody>
            </table>
        </div>
    </div>`;
}

function initKeys() {
    document.getElementById('add-key-btn').addEventListener('click', async () => {
        const key = prompt("Enter Gemini API Key:");
        if(key && key.startsWith("AIza")) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'), { key, createdAt: serverTimestamp(), status: 'active' });
            logAction('Create', 'Added API Key');
        } else if (key) {
            alert("Invalid Key Format. Must start with 'AIza'.");
        }
    });

    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'), (snap) => {
        const tbody = document.getElementById('keys-table-body');
        if(snap.empty) { tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500">No API keys found.</td></tr>`; return; }
        tbody.innerHTML = '';
        snap.forEach(doc => {
            const k = doc.data();
            tbody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-mono text-xs text-slate-600">••••${k.key.slice(-6)}</td>
                <td class="px-6 py-4"><span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span></td>
                <td class="px-6 py-4 text-right"><button class="text-red-500 hover:text-red-700 delete-key transition-colors" data-id="${doc.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            </tr>`;
        });
        document.querySelectorAll('.delete-key').forEach(b => b.addEventListener('click', e => {
            if(confirm("Delete key?")) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'api_keys', e.currentTarget.dataset.id));
        }));
        if(window.lucide) window.lucide.createIcons();
    });
}

// ==========================================
// 3. BANNERS SUB-MODULE
// ==========================================
function renderBanners() {
    return `
    <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900">Notification Banners</h1>
            <button id="add-banner-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i> New Banner</button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 border-b"><tr><th class="px-6 py-4">Message</th><th class="px-6 py-4">Active</th><th class="px-6 py-4 text-right">Action</th></tr></thead>
                <tbody id="banners-table-body" class="divide-y divide-slate-200"></tbody>
            </table>
        </div>
    </div>`;
}

function initBanners() {
    document.getElementById('add-banner-btn').addEventListener('click', async () => {
        const text = prompt("Banner Message:");
        if(text) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'banners'), { text, active: true, createdAt: serverTimestamp() });
    });

    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'banners'), (snap) => {
        const tbody = document.getElementById('banners-table-body');
        if(snap.empty) { tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500">No banners found.</td></tr>`; return; }
        tbody.innerHTML = '';
        snap.forEach(doc => {
            const b = doc.data();
            tbody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium text-slate-900">${b.text}</td>
                <td class="px-6 py-4">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${b.active ? 'checked' : ''} class="sr-only peer toggle-banner" data-id="${doc.id}">
                        <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                </td>
                <td class="px-6 py-4 text-right"><button class="text-red-500 hover:text-red-700 delete-banner transition-colors" data-id="${doc.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            </tr>`;
        });
        document.querySelectorAll('.delete-banner').forEach(b => b.addEventListener('click', e => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'banners', e.currentTarget.dataset.id))));
        document.querySelectorAll('.toggle-banner').forEach(b => b.addEventListener('change', e => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'banners', e.target.dataset.id), { active: e.target.checked })));
        if(window.lucide) window.lucide.createIcons();
    });
}

// ==========================================
// 4. LOGS SUB-MODULE
// ==========================================
function renderLogs() {
    return `
    <div class="animate-fade-in">
        <h1 class="text-2xl font-bold text-slate-900 mb-6">System Logs</h1>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 border-b"><tr><th class="px-6 py-4">Action</th><th class="px-6 py-4">Admin</th><th class="px-6 py-4">Date</th></tr></thead>
                <tbody id="logs-table-body" class="divide-y divide-slate-200"></tbody>
            </table>
        </div>
    </div>`;
}

function initLogs() {
    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), (snap) => {
        const tbody = document.getElementById('logs-table-body');
        const logs = [];
        snap.forEach(doc => logs.push(doc.data()));
        logs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        tbody.innerHTML = logs.slice(0, 50).map(l => `
            <tr>
                <td class="px-6 py-4"><span class="font-bold bg-slate-100 px-2 py-1 rounded text-xs mr-2">${l.action}</span> ${l.details}</td>
                <td class="px-6 py-4 text-slate-500">${l.admin || 'System'}</td>
                <td class="px-6 py-4 text-xs text-slate-400 font-mono">${l.createdAt ? new Date(l.createdAt.seconds * 1000).toLocaleString() : ''}</td>
            </tr>`).join('');
    });
}

async function logAction(action, details) {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), {
        action, details, admin: auth.currentUser?.email || 'System', createdAt: serverTimestamp()
    });
}