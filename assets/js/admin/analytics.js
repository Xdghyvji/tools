import { db, appId } from '../../js/shared.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-8 pb-20">
        
        <!-- 1. HEADER AREA -->
        <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Analytics Hub
                    <span class="flex h-3 w-3 relative">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </h1>
                <p class="text-lg text-slate-500 font-medium mt-1">Real-time system insights & performance metrics.</p>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex items-center gap-2 bg-white px-2 py-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <button onclick="loadView('analytics')" class="p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 transition-colors" title="Refresh Data">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                </button>
                <div class="w-px h-6 bg-slate-200 mx-1"></div>
                <button onclick="loadView('users')" class="p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 transition-colors" title="Users">
                    <i data-lucide="users" class="w-5 h-5"></i>
                </button>
                <button onclick="loadView('settings')" class="p-3 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-blue-600 transition-colors" title="Settings">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- 2. HERO STATS (Glassmorphism & Gradients) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Traffic Card -->
            <div class="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-2xl shadow-blue-900/5 relative overflow-hidden group">
                <div class="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-6">
                        <div class="p-4 bg-blue-50 text-blue-600 rounded-2xl"><i data-lucide="activity" class="w-8 h-8"></i></div>
                        <span class="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-black uppercase rounded-full tracking-wider">Real-Time</span>
                    </div>
                    <h3 class="text-6xl font-black text-slate-900 tracking-tighter" id="stat-traffic">--</h3>
                    <p class="text-base font-bold text-slate-500 mt-2 flex items-center gap-2">
                        Total Page Views <i data-lucide="arrow-up-right" class="w-4 h-4 text-emerald-500"></i>
                    </p>
                </div>
            </div>

            <!-- Usage Card -->
            <div class="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-2xl shadow-purple-900/5 relative overflow-hidden group">
                <div class="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-6">
                        <div class="p-4 bg-purple-50 text-purple-600 rounded-2xl"><i data-lucide="sparkles" class="w-8 h-8"></i></div>
                        <span class="px-3 py-1 bg-purple-50 text-purple-700 text-[11px] font-black uppercase rounded-full tracking-wider">Generations</span>
                    </div>
                    <h3 class="text-6xl font-black text-slate-900 tracking-tighter" id="stat-generations">--</h3>
                    <p class="text-base font-bold text-slate-500 mt-2 flex items-center gap-2">
                        AI Content Created <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i>
                    </p>
                </div>
            </div>

            <!-- Users Card -->
            <div class="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-2xl shadow-slate-900/5 relative overflow-hidden group">
                <div class="absolute -right-12 -top-12 w-48 h-48 bg-slate-900/5 rounded-full blur-3xl group-hover:bg-slate-900/10 transition-all duration-500"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-6">
                        <div class="p-4 bg-slate-100 text-slate-800 rounded-2xl"><i data-lucide="users" class="w-8 h-8"></i></div>
                        <span class="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-black uppercase rounded-full tracking-wider">Community</span>
                    </div>
                    <h3 class="text-6xl font-black text-slate-900 tracking-tighter" id="stat-total-users">--</h3>
                    <p class="text-base font-bold text-slate-500 mt-2 flex items-center gap-2">
                        Registered Users <span class="text-slate-300">|</span> <span id="stat-vip-count" class="text-amber-500">0 VIP</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- 3. SECONDARY METRICS ROW -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- API Status -->
            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-black text-slate-400 uppercase tracking-wider">API Keys</span>
                    <i data-lucide="database" class="w-4 h-4 text-emerald-500"></i>
                </div>
                <div class="flex items-end gap-2">
                    <h4 class="text-2xl font-black text-slate-900" id="stat-keys">--</h4>
                    <span id="stat-keys-status" class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md mb-1">Active</span>
                </div>
            </div>

            <!-- Newsletter -->
            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Subscribers</span>
                    <i data-lucide="mail" class="w-4 h-4 text-pink-500"></i>
                </div>
                <h4 class="text-2xl font-black text-slate-900" id="stat-subscribers">--</h4>
            </div>

            <!-- Conversion Rate -->
            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Conversion</span>
                    <i data-lucide="pie-chart" class="w-4 h-4 text-indigo-500"></i>
                </div>
                <div>
                    <h4 class="text-2xl font-black text-slate-900" id="vip-ratio-text">0%</h4>
                    <div class="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div id="vip-ratio-bar" class="bg-indigo-500 h-full w-0 transition-all duration-1000"></div>
                    </div>
                </div>
            </div>

            <!-- Admin Note Status -->
             <div class="bg-amber-50 p-5 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-center items-center text-center">
                <span class="text-xs font-black text-amber-700 uppercase tracking-wider mb-1">Scratchpad</span>
                <span id="note-status" class="text-[10px] font-bold text-amber-500 opacity-50">Auto-saves instantly</span>
            </div>
        </div>

        <!-- 4. VISUALIZATION SECTION -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Traffic Chart -->
            <div class="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-xl font-black text-slate-900">Traffic Velocity</h3>
                        <p class="text-sm font-bold text-slate-400 mt-1">Request distribution over last 500 hits</p>
                    </div>
                    <div class="flex gap-2">
                        <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span class="text-xs font-bold text-slate-500">Page Views</span>
                    </div>
                </div>
                <!-- CSS-Only Bar Chart -->
                <div class="h-64 flex items-end gap-1.5" id="traffic-chart">
                    <div class="w-full h-full flex items-center justify-center text-slate-300 font-bold text-sm animate-pulse">Loading visualization data...</div>
                </div>
            </div>

            <!-- Top Tools -->
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
                <h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <i data-lucide="wrench" class="w-5 h-5 text-slate-400"></i> Popular Tools
                </h3>
                <div class="space-y-6 flex-1" id="tool-bars">
                    <div class="text-center text-slate-400 text-sm font-bold py-10">Fetching usage statistics...</div>
                </div>
            </div>
        </div>

        <!-- 5. BOTTOM SECTION -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Recent Signups -->
            <div class="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 class="text-lg font-black text-slate-900">Recent Signups</h3>
                    <button onclick="loadView('users')" class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">View All</button>
                </div>
                <div id="recent-users-list" class="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div class="p-8 text-center text-slate-400 text-sm font-bold">No recent users found.</div>
                </div>
            </div>

            <!-- Admin Scratchpad -->
            <div class="bg-amber-50 rounded-[2rem] border border-amber-100 p-8 shadow-inner flex flex-col group transition-colors hover:bg-amber-50/80">
                <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg font-black text-amber-900/80 flex items-center gap-2">
                        <i data-lucide="sticky-note" class="w-5 h-5"></i> Admin Notes
                     </h3>
                     <i data-lucide="edit-3" class="w-4 h-4 text-amber-900/40"></i>
                </div>
                <textarea id="admin-notes" class="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-amber-900 font-bold placeholder-amber-900/30 text-sm leading-relaxed min-h-[200px]" placeholder="Type your ideas, tasks, or reminders here. Auto-saved locally."></textarea>
            </div>
        </div>

    </div>
    `;
}

export async function init() {
    const unsubs = [];
    
    // Safely add listeners
    const safeSnapshot = (q, callback) => {
        try {
            unsubs.push(onSnapshot(q, callback, (e) => console.warn("Stream Error:", e.message)));
        } catch (e) { console.error("Init Failed:", e); }
    };

    // 1. TRAFFIC LOGS (Limit 500 for a robust sample)
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), orderBy('timestamp', 'desc'), limit(500)), (snap) => {
        const total = snap.size;
        const el = document.getElementById('stat-traffic');
        if(el) el.innerText = total + (total === 500 ? '+' : '');

        const logs = [];
        snap.forEach(doc => logs.push(doc.data()));

        // --- CHART LOGIC ---
        const chart = document.getElementById('traffic-chart');
        if(logs.length > 0 && chart) {
            chart.innerHTML = '';
            // 24 Bars
            const chunks = 24; 
            const chunkSize = Math.ceil(logs.length / chunks) || 1;
            const timeData = [...logs].reverse(); // Oldest first

            for(let i=0; i<chunks; i++) {
                const chunk = timeData.slice(i*chunkSize, (i+1)*chunkSize);
                const count = chunk.length;
                // Min height 10% for visibility
                const h = Math.max(10, (count / chunkSize) * 100); 
                
                chart.innerHTML += `
                    <div class="flex-1 group relative flex flex-col justify-end h-full">
                        <div class="w-full bg-blue-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-300 relative" style="height:${Math.min(h, 100)}%">
                             <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                                ${count} Hits
                            </div>
                        </div>
                    </div>`;
            }
        }
    });

    // 2. GENERATIONS & TOOL USAGE
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs'), limit(500)), (snap) => {
        const el = document.getElementById('stat-generations');
        if(el) el.innerText = snap.size + (snap.size === 500 ? '+' : '');
        
        const counts = {};
        snap.forEach(doc => {
            const tool = doc.data().tool?.split('_')[0] || 'Unknown';
            counts[tool] = (counts[tool] || 0) + 1;
        });
        
        const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 5);
        const max = sorted[0]?.[1] || 1;

        const toolContainer = document.getElementById('tool-bars');
        if(toolContainer) {
            toolContainer.innerHTML = sorted.map(([k,v]) => `
                <div class="group">
                    <div class="flex justify-between text-xs mb-2 font-bold">
                        <span class="capitalize text-slate-700 group-hover:text-blue-600 transition-colors">${k}</span>
                        <span class="text-slate-400">${v}</span>
                    </div>
                    <div class="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-100">
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full shadow-sm transition-all duration-1000 group-hover:brightness-110" style="width:${(v/max)*100}%"></div>
                    </div>
                </div>
            `).join('') || '<div class="py-10 text-center text-slate-400 text-sm font-bold">No data available.</div>';
        }
    });

    // 3. SUBSCRIBERS
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), (snap) => {
        const el = document.getElementById('stat-subscribers');
        if(el) el.innerText = snap.size;
    });

    // 4. API KEYS
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'), (snap) => {
        const el = document.getElementById('stat-keys');
        const statusEl = document.getElementById('stat-keys-status');
        if(el) el.innerText = snap.size;
        if(statusEl) {
            statusEl.innerText = snap.size > 0 ? 'Active' : 'Empty';
            statusEl.className = snap.size > 0 
                ? "text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md mb-1" 
                : "text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md mb-1 animate-pulse";
        }
    });

    // 5. USERS (Total & Recent)
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
        let total = 0, vip = 0;
        const recent = [];

        snap.forEach(doc => {
            total++;
            const d = doc.data();
            if(d.vip) vip++;
            recent.push(d);
        });

        // Counters
        const elTotal = document.getElementById('stat-total-users');
        const elVip = document.getElementById('stat-vip-count');
        if(elTotal) elTotal.innerText = total;
        if(elVip) elVip.innerText = `${vip} VIP`;

        // VIP Ratio
        const ratio = total > 0 ? Math.round((vip/total)*100) : 0;
        const elRatioText = document.getElementById('vip-ratio-text');
        const elRatioBar = document.getElementById('vip-ratio-bar');
        if(elRatioText) elRatioText.innerText = `${ratio}%`;
        if(elRatioBar) elRatioBar.style.width = `${ratio}%`;

        // Recent Users List
        recent.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const listEl = document.getElementById('recent-users-list');
        if(listEl) {
            if(recent.length > 0) {
                listEl.innerHTML = recent.slice(0, 7).map(u => `
                    <div class="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group cursor-default">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full ${u.vip ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'} flex items-center justify-center text-sm font-black shadow-sm">
                                ${u.email ? u.email.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                    ${u.displayName || 'Anonymous'}
                                    ${u.vip ? '<i data-lucide="crown" class="w-3 h-3 text-amber-500 fill-current"></i>' : ''}
                                </p>
                                <p class="text-[10px] text-slate-400 font-bold truncate max-w-[140px]">${u.email || 'No Email'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                             <span class="text-[10px] text-slate-400 font-bold block">
                                ${u.createdAt ? new Date(u.createdAt.seconds*1000).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Today'}
                            </span>
                        </div>
                    </div>
                `).join('');
            } else {
                listEl.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm font-bold">No registered users yet.</div>';
            }
        }
        if(window.lucide) window.lucide.createIcons();
    });

    // 6. SCRATCHPAD (Local Storage)
    const noteArea = document.getElementById('admin-notes');
    const noteStatus = document.getElementById('note-status');
    if (noteArea) {
        noteArea.value = localStorage.getItem('dsh_admin_notes') || '';
        noteArea.addEventListener('input', () => {
            localStorage.setItem('dsh_admin_notes', noteArea.value);
            if(noteStatus) {
                noteStatus.innerText = "Saving...";
                noteStatus.style.opacity = "1";
                setTimeout(() => {
                    noteStatus.innerText = "Saved";
                    setTimeout(() => noteStatus.style.opacity = "0.5", 1000);
                }, 500);
            }
        });
    }

    if(window.lucide) window.lucide.createIcons();
    return () => unsubs.forEach(u => u());
}
