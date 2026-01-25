import { db, appId } from '../../js/shared.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-8 pb-20">
        
        <!-- 1. HEADER & UTILITIES -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <h1 class="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                    Analytics Hub
                    <span class="px-3 py-1 rounded-full text-[11px] bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider flex items-center gap-1.5 font-bold shadow-sm">
                        <span class="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Live
                    </span>
                </h1>
                <p class="text-lg text-slate-500 mt-2 font-medium">Real-time system insights and growth metrics.</p>
            </div>
            
            <!-- Quick Actions Toolbar -->
            <div class="flex items-center gap-2 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
                <div class="px-4 py-2 border-r border-slate-200/60">
                    <span class="text-[10px] text-slate-500 uppercase font-black tracking-wider">Status</span>
                    <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-0.5">
                        <i data-lucide="activity" class="w-3.5 h-3.5"></i> Operational
                    </div>
                </div>
                <div class="flex gap-1 pl-2">
                    <button onclick="loadView('users')" class="p-3 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all duration-200" title="Manage Users">
                        <i data-lucide="users" class="w-5 h-5"></i>
                    </button>
                    <button onclick="loadView('keys')" class="p-3 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all duration-200" title="Manage Keys">
                        <i data-lucide="key" class="w-5 h-5"></i>
                    </button>
                    <button onclick="loadView('settings')" class="p-3 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all duration-200" title="Settings">
                        <i data-lucide="settings" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- 2. KEY METRICS GRID (High Contrast Light Mode) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Traffic Stats -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-blue-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="bar-chart-2" class="w-32 h-32 text-blue-600"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-blue-100 text-blue-700 rounded-2xl shadow-sm"><i data-lucide="activity" class="w-6 h-6"></i></div>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">All Time</span>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-traffic">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    Total Page Views <i data-lucide="arrow-up-right" class="w-3 h-3 text-green-500"></i>
                </p>
            </div>

            <!-- AI Generations -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-purple-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="cpu" class="w-32 h-32 text-purple-600"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-purple-100 text-purple-700 rounded-2xl shadow-sm"><i data-lucide="sparkles" class="w-6 h-6"></i></div>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Usage</span>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-generations">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    AI Content Generated
                </p>
            </div>

            <!-- Total Users -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-cyan-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="users" class="w-32 h-32 text-cyan-600"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-cyan-100 text-cyan-700 rounded-2xl shadow-sm"><i data-lucide="user-check" class="w-6 h-6"></i></div>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Community</span>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-total-users">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    Registered Users
                </p>
            </div>

            <!-- API Status -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-orange-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="database" class="w-32 h-32 text-orange-600"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-orange-100 text-orange-700 rounded-2xl shadow-sm"><i data-lucide="server" class="w-6 h-6"></i></div>
                    <span id="stat-keys-status" class="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full">--</span>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-keys">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    Active API Keys
                </p>
            </div>

            <!-- Subscribers -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-pink-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="mail" class="w-32 h-32 text-pink-600"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-pink-100 text-pink-700 rounded-2xl shadow-sm"><i data-lucide="mail-plus" class="w-6 h-6"></i></div>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-subscribers">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    Newsletter Subscribers
                </p>
            </div>

            <!-- VIP Members -->
            <div class="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-amber-500/10 transition-all duration-300">
                <div class="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                    <i data-lucide="crown" class="w-32 h-32 text-amber-500"></i>
                </div>
                <div class="flex justify-between items-center mb-6 relative z-10">
                    <div class="p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-sm"><i data-lucide="crown" class="w-6 h-6"></i></div>
                    <span class="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">PREMIUM</span>
                </div>
                <h3 class="text-5xl font-black text-slate-900 tracking-tighter relative z-10" id="stat-vip-count">0</h3>
                <p class="text-sm text-slate-600 font-bold mt-2 relative z-10 flex items-center gap-1">
                    VIP Members
                </p>
            </div>
        </div>

        <!-- 3. DETAILED ANALYTICS (Charts & Lists) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Traffic Chart -->
            <div class="lg:col-span-2 bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-xl font-black text-slate-900">Traffic Velocity</h3>
                        <p class="text-sm text-slate-500 font-semibold mt-1">Request distribution over time</p>
                    </div>
                    <span class="px-4 py-1.5 rounded-xl bg-slate-100 text-xs text-slate-600 font-bold border border-slate-200">Real-time</span>
                </div>
                <div class="flex-1 flex items-end gap-2 h-48 border-b border-slate-200 pb-2" id="traffic-chart">
                    <div class="w-full text-center text-slate-400 text-sm font-bold animate-pulse py-12">Loading visual data...</div>
                </div>
            </div>

            <!-- Audience Breakdown -->
            <div class="lg:col-span-1 bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-amber-100 rounded-xl text-amber-600"><i data-lucide="pie-chart" class="w-5 h-5"></i></div>
                    <h3 class="text-xl font-black text-slate-900">Audience</h3>
                </div>
                
                <!-- VIP Ratio Bar -->
                <div class="mb-10">
                    <div class="flex justify-between text-sm mb-3 font-bold">
                        <span class="text-slate-500">Conversion Rate</span>
                        <span class="text-amber-600" id="vip-ratio-text">0%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                        <div class="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000 relative" id="vip-ratio-bar" style="width: 0%">
                             <div class="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                <!-- Top Referrers List -->
                <div class="mt-auto">
                    <h4 class="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest border-b border-slate-100 pb-2">Top Referrers</h4>
                    <div class="space-y-4" id="top-referrers">
                        <p class="text-xs text-slate-400 italic">No referral data found.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. TOOLS & NEW USERS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Tool Popularity -->
            <div class="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                        <i data-lucide="wrench" class="w-5 h-5 text-slate-400"></i> Popular Tools
                    </h3>
                </div>
                <div class="space-y-6" id="tool-bars">
                    <div class="text-center text-slate-400 text-sm font-bold py-8">Fetching usage statistics...</div>
                </div>
            </div>

            <!-- Recent Users -->
            <div class="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 class="text-xl font-black text-slate-900">New Signups</h3>
                    <button onclick="loadView('users')" class="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">View All</button>
                </div>
                <div class="divide-y divide-slate-100 overflow-y-auto max-h-[350px] custom-scrollbar" id="recent-users-list">
                    <div class="p-8 text-center text-slate-400 text-sm font-medium">No recent activity.</div>
                </div>
            </div>
        </div>

        <!-- 5. ADMIN NOTEPAD -->
        <div class="bg-yellow-50/80 backdrop-blur-sm p-6 rounded-3xl border border-yellow-200/60 shadow-lg relative group transition-all hover:bg-yellow-50">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-black text-yellow-800 flex items-center gap-2">
                    <i data-lucide="sticky-note" class="w-5 h-5"></i> Scratchpad
                </h3>
                <span class="text-[10px] text-yellow-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-200/50 px-2 py-1 rounded" id="note-status">Auto-saved</span>
            </div>
            <textarea id="admin-notes" class="w-full min-h-[120px] bg-transparent border-0 outline-none text-sm text-yellow-900 font-bold resize-none placeholder-yellow-800/40 leading-relaxed" placeholder="Write your ideas, tasks, or reminders here..."></textarea>
        </div>

    </div>`;
}

export async function init() {
    const unsubs = [];

    const safeSnapshot = (q, callback) => {
        try {
            unsubs.push(onSnapshot(q, callback, (e) => console.warn("Stream Error:", e.message)));
        } catch (e) { console.error("Init Failed:", e); }
    };

    // 1. TRAFFIC (Increased limit for 'All Time' feel)
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), orderBy('timestamp', 'desc'), limit(500)), (snap) => {
        // Count
        const total = snap.size;
        document.getElementById('stat-traffic').innerText = total + (total === 500 ? '+' : '');
        
        // Process Data for Charts
        const logs = [];
        const refs = {};
        snap.forEach(doc => {
            const d = doc.data();
            logs.push(d);
            let r = d.referrer || 'Direct';
            if(r.includes('http')) try { r = new URL(r).hostname.replace('www.',''); } catch(e) { r = 'Direct'; }
            refs[r] = (refs[r] || 0) + 1;
        });

        // Traffic Chart (Visualizing distribution)
        const chart = document.getElementById('traffic-chart');
        if(logs.length > 0 && chart) {
            chart.innerHTML = '';
            const chunks = 24;
            const chunkSize = Math.ceil(logs.length / chunks) || 1;
            
            // Reverse logs to show timeline left-to-right (oldest to newest)
            const timeData = [...logs].reverse(); 
            
            for(let i=0; i<chunks; i++) {
                // Slice chunks
                const chunk = timeData.slice(i*chunkSize, (i+1)*chunkSize);
                const count = chunk.length;
                // Height percentage logic
                const h = Math.max(15, (count / chunkSize) * 100);
                
                chart.innerHTML += `
                    <div class="flex-1 bg-blue-100 hover:bg-blue-600 group rounded-t-lg transition-all duration-300 relative" style="height:${Math.min(h, 100)}%">
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">
                            ${count} Hits
                        </div>
                    </div>`;
            }
        }

        // Top Referrers
        const topRefs = Object.entries(refs).sort((a,b) => b[1]-a[1]).slice(0, 5);
        document.getElementById('top-referrers').innerHTML = topRefs.map(([k,v]) => `
            <div class="flex justify-between items-center text-xs group">
                <span class="text-slate-700 font-bold truncate max-w-[150px] group-hover:text-blue-600 transition-colors">${k}</span>
                <span class="text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200 group-hover:bg-white group-hover:shadow-sm">${v}</span>
            </div>
        `).join('');
    });

    // 2. GENERATIONS & TOOLS
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs'), limit(500)), (snap) => {
        document.getElementById('stat-generations').innerText = snap.size + (snap.size === 500 ? '+' : '');
        
        const counts = {};
        snap.forEach(doc => {
            const tool = doc.data().tool?.split('_')[0] || 'Unknown';
            counts[tool] = (counts[tool] || 0) + 1;
        });
        
        const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 5);
        const max = sorted[0]?.[1] || 1;

        document.getElementById('tool-bars').innerHTML = sorted.map(([k,v]) => `
            <div class="group">
                <div class="flex justify-between text-xs mb-2 font-bold">
                    <span class="capitalize text-slate-700 group-hover:text-blue-600 transition-colors">${k}</span>
                    <span class="text-slate-400">${v}</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-sm group-hover:from-blue-400 group-hover:to-indigo-500 transition-all duration-500" style="width:${(v/max)*100}%"></div>
                </div>
            </div>
        `).join('') || '<div class="py-4 text-center text-slate-400 text-xs font-bold">No tool usage yet.</div>';
    });

    // 3. SUBSCRIBERS
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), (snap) => {
        document.getElementById('stat-subscribers').innerText = snap.size;
    });

    // 4. API KEYS
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'), (snap) => {
        const count = snap.size;
        document.getElementById('stat-keys').innerText = count;
        const statusEl = document.getElementById('stat-keys-status');
        if(count > 0) {
            statusEl.innerText = "Active";
            statusEl.className = "px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase rounded-full border border-emerald-200";
        } else {
            statusEl.innerText = "Empty";
            statusEl.className = "px-3 py-1 bg-red-100 text-red-700 text-xs font-black uppercase rounded-full border border-red-200 animate-pulse";
        }
    });

    // 5. USERS
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
        document.getElementById('stat-total-users').innerText = total;
        document.getElementById('stat-vip-count').innerText = vip;

        // VIP Ratio
        const ratio = total > 0 ? Math.round((vip/total)*100) : 0;
        document.getElementById('vip-ratio-text').innerText = `${ratio}%`;
        document.getElementById('vip-ratio-bar').style.width = `${ratio}%`;

        // Recent List
        recent.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const listEl = document.getElementById('recent-users-list');
        if(recent.length > 0) {
            listEl.innerHTML = recent.slice(0, 6).map(u => `
                <div class="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group cursor-default">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${u.vip ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white text-slate-400 border border-slate-200'} flex items-center justify-center text-sm font-black shadow-sm">
                            ${u.email ? u.email.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <p class="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                ${u.displayName || 'Anonymous User'}
                                ${u.vip ? '<i data-lucide="crown" class="w-3 h-3 text-amber-500 fill-current"></i>' : ''}
                            </p>
                            <p class="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">${u.email || 'No Email'}</p>
                        </div>
                    </div>
                    <span class="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        ${u.createdAt ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : 'Just now'}
                    </span>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs font-bold">No registered users found.</div>';
        }
        if(window.lucide) window.lucide.createIcons();
    });

    // 6. SCRATCHPAD
    const noteArea = document.getElementById('admin-notes');
    const status = document.getElementById('note-status');
    if (noteArea) {
        noteArea.value = localStorage.getItem('dsh_admin_notes') || '';
        noteArea.addEventListener('input', () => {
            localStorage.setItem('dsh_admin_notes', noteArea.value);
            if(status) {
                status.classList.remove('opacity-0');
                status.innerText = "Saving...";
                setTimeout(() => { 
                    status.innerText = "Saved"; 
                    setTimeout(() => status.classList.add('opacity-0'), 1500);
                }, 600);
            }
        });
    }

    if(window.lucide) window.lucide.createIcons();
    return () => unsubs.forEach(u => u());
}
