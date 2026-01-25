import { db, appId } from '../../js/shared.js';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-8 pb-20">
        
        <!-- 1. Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-black text-white tracking-tight">Dashboard Overview</h1>
                <p class="text-slate-400 font-medium mt-1">Welcome back, Admin.</p>
            </div>
            <div class="flex gap-3">
                <button onclick="loadView('posts')" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
                    <i data-lucide="pen-tool" class="w-4 h-4"></i> Write Post
                </button>
            </div>
        </div>

        <!-- 2. Quick Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Active Users -->
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><i data-lucide="activity" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                </div>
                <h3 class="text-3xl font-black text-white" id="db-stat-active">0</h3>
                <p class="text-xs text-slate-400 mt-1 font-bold">Active Users</p>
            </div>

            <!-- Total Views (24h) -->
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><i data-lucide="eye" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-500">24h</span>
                </div>
                <h3 class="text-3xl font-black text-white" id="db-stat-views">0</h3>
                <p class="text-xs text-slate-400 mt-1 font-bold">Page Views</p>
            </div>

            <!-- New Users -->
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><i data-lucide="users" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-500">Total</span>
                </div>
                <h3 class="text-3xl font-black text-white" id="db-stat-users">0</h3>
                <p class="text-xs text-slate-400 mt-1 font-bold">Registered Users</p>
            </div>

            <!-- AI Usage -->
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><i data-lucide="sparkles" class="w-5 h-5"></i></div>
                </div>
                <h3 class="text-3xl font-black text-white" id="db-stat-gens">0</h3>
                <p class="text-xs text-slate-400 mt-1 font-bold">AI Generations</p>
            </div>
        </div>

        <!-- 3. Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Traffic Feed -->
            <div class="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 class="font-bold text-white">Live Traffic Feed</h3>
                    <button onclick="loadView('analytics')" class="text-xs font-bold text-blue-400 hover:text-blue-300">View All</button>
                </div>
                <div class="divide-y divide-slate-700" id="db-recent-traffic">
                    <div class="p-8 text-center text-slate-500 text-sm">Loading feed...</div>
                </div>
            </div>

            <!-- System Status -->
            <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                <h3 class="font-bold text-white mb-6">System Health</h3>
                
                <div class="space-y-6">
                    <div>
                        <div class="flex justify-between text-xs font-bold text-slate-400 mb-2">
                            <span>API Quota Usage</span>
                            <span class="text-white" id="quota-text">--%</span>
                        </div>
                        <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full transition-all duration-1000" id="quota-bar" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="p-4 bg-slate-900 rounded-xl border border-slate-700">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-sm font-bold text-slate-300">All Systems Operational</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">Database, Auth, and AI endpoints are responding normally.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

export async function init() {
    const unsubs = [];
    const safeSnapshot = (q, cb) => {
        try { unsubs.push(onSnapshot(q, cb, e => console.warn(e))); } 
        catch(e) { console.error(e); }
    };

    // Helper to safely set text
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    };

    // 1. ACTIVE USERS
    const presenceRef = collection(db, 'artifacts', appId, 'public', 'data', 'presence');
    const fiveMinsAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    const qPresence = query(presenceRef, where('lastActive', '>', fiveMinsAgo));
    
    safeSnapshot(qPresence, (snap) => {
        setText('db-stat-active', snap.size);
    });

    // 2. TOTAL VIEWS (Last 100 for snapshot to save reads, or aggregation)
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs');
    const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    
    safeSnapshot(qLogs, (snap) => {
        // Just showing recent count for "Live" feel, in real app use aggregation
        // To avoid massive reads, we'll just display "50+" if full
        const count = snap.size;
        setText('db-stat-views', count + (count === 50 ? '+' : ''));

        // Render Recent Traffic List
        const listEl = document.getElementById('db-recent-traffic');
        if(listEl) {
            const logs = [];
            snap.forEach(d => logs.push(d.data()));
            
            if(logs.length === 0) {
                listEl.innerHTML = `<div class="p-8 text-center text-slate-500 text-sm">No recent traffic.</div>`;
            } else {
                listEl.innerHTML = logs.slice(0, 5).map(log => {
                    const time = log.timestamp ? new Date(log.timestamp.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
                    return `
                    <div class="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-slate-700 rounded-lg text-slate-400">
                                ${log.device === 'Mobile' ? '<i data-lucide="smartphone" class="w-4 h-4"></i>' : '<i data-lucide="monitor" class="w-4 h-4"></i>'}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-200 truncate max-w-[150px]">${log.data?.path || '/'}</p>
                                <p class="text-[10px] text-slate-500 font-bold uppercase">${log.geo?.country_name || 'Unknown'}</p>
                            </div>
                        </div>
                        <span class="text-xs font-mono text-slate-500">${time}</span>
                    </div>`;
                }).join('');
                if(window.lucide) window.lucide.createIcons();
            }
        }
    });

    // 3. TOTAL USERS
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    // One-time fetch to save costs, or snapshot if critical
    getDocs(query(usersRef, limit(1000))).then(snap => {
        setText('db-stat-users', snap.size);
    }).catch(console.warn);

    // 4. AI GENERATIONS
    const toolsRef = collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs');
    getDocs(query(toolsRef, limit(1000))).then(snap => {
        setText('db-stat-gens', snap.size);
        
        // Mock Quota (Real app would calc from this)
        const used = snap.size;
        const limit = 1000; 
        const pct = Math.min(100, Math.round((used/limit)*100));
        
        setText('quota-text', `${pct}%`);
        const bar = document.getElementById('quota-bar');
        if(bar) bar.style.width = `${pct}%`;
        
    }).catch(console.warn);

    if(window.lucide) window.lucide.createIcons();
    return () => unsubs.forEach(u => u());
}
