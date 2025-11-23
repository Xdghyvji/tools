import { db, appId } from '../../js/shared.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-6 pb-20">
        
        <!-- 1. HEADER & UTILITIES -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Command Center <span class="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span> Live</span>
                </h1>
                <p class="text-sm text-slate-500">System performance and user growth tracking.</p>
            </div>
            <div class="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div class="px-3 py-1 border-r border-slate-100">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Backend</span>
                    <div class="flex items-center gap-1 text-xs font-bold text-emerald-600"><i data-lucide="wifi" class="w-3 h-3"></i> Online</div>
                </div>
                <div class="flex gap-1">
                    <button onclick="loadView('users')" class="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Manage Users"><i data-lucide="users" class="w-4 h-4"></i></button>
                    <button onclick="loadView('keys')" class="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Manage Keys"><i data-lucide="key" class="w-4 h-4"></i></button>
                    <button onclick="loadView('settings')" class="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Settings"><i data-lucide="settings" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>

        <!-- 2. KEY METRICS GRID (6 Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Traffic (Restored) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="activity" class="w-20 h-20 text-brand-600"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-brand-50 text-brand-600 rounded-lg"><i data-lucide="bar-chart-2" class="w-5 h-5"></i></div>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-traffic">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">Total Page Views</p>
            </div>

            <!-- Generations (Restored) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="cpu" class="w-20 h-20 text-purple-600"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><i data-lucide="zap" class="w-5 h-5"></i></div>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-generations">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">AI Generations</p>
            </div>

            <!-- API Health (Restored) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="server" class="w-20 h-20 text-slate-600"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-slate-100 text-slate-700 rounded-lg"><i data-lucide="database" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full" id="stat-keys-status">Checking...</span>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-keys">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">API Keys Active</p>
            </div>

            <!-- Newsletter Subs (Restored) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="mail" class="w-20 h-20 text-green-600"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-green-50 text-green-600 rounded-lg"><i data-lucide="mail" class="w-5 h-5"></i></div>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-subscribers">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">Newsletter Subscribers</p>
            </div>

            <!-- Registered Users (New) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="users" class="w-20 h-20 text-blue-600"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><i data-lucide="user-plus" class="w-5 h-5"></i></div>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-total-users">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">Registered Users</p>
            </div>

            <!-- VIP Count (New) -->
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i data-lucide="crown" class="w-20 h-20 text-amber-500"></i></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-amber-50 text-amber-600 rounded-lg"><i data-lucide="crown" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">Premium</span>
                </div>
                <h3 class="text-3xl font-bold text-slate-900 tracking-tight" id="stat-vip-count">0</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">VIP Members</p>
            </div>
        </div>

        <!-- 3. TRAFFIC & AUDIENCE -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Main Chart: Traffic Trend -->
            <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-slate-900">Traffic Activity</h3>
                    <span class="text-xs text-slate-400">Last 24 Activity Points</span>
                </div>
                <div class="flex-1 flex items-end gap-1 h-48 border-b border-slate-100 pb-2" id="traffic-chart">
                    <div class="w-full text-center text-slate-400 text-xs self-center">Collecting traffic data...</div>
                </div>
            </div>

            <!-- Audience Intelligence -->
            <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <h3 class="font-bold text-slate-900 mb-4">Audience Health</h3>
                
                <!-- VIP Ratio -->
                <div class="mb-6">
                    <div class="flex justify-between text-xs mb-2 font-medium">
                        <span class="text-slate-500">VIP Conversion Rate</span>
                        <span class="text-amber-600" id="vip-ratio-text">0%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-amber-500 h-2 rounded-full transition-all duration-1000" id="vip-ratio-bar" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Top Referrers -->
                <div class="mt-auto">
                    <h4 class="text-xs font-bold text-slate-500 uppercase mb-3">Top Sources</h4>
                    <div class="space-y-3" id="top-referrers">
                        <p class="text-xs text-slate-400 italic">No data yet.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. TOOL STATS & RECENT USERS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Tool Popularity -->
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-slate-900">Popular Tools</h3>
                    <span class="text-xs text-slate-400">By Usage Volume</span>
                </div>
                <div class="space-y-4" id="tool-bars">
                    <div class="text-center text-slate-400 text-sm py-10">Loading usage data...</div>
                </div>
            </div>

            <!-- Recent Signups -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 class="font-bold text-slate-700 text-sm">New Registrations</h3>
                    <button onclick="loadView('users')" class="text-xs text-brand-600 font-bold hover:underline">View All</button>
                </div>
                <div class="divide-y divide-slate-100" id="recent-users-list">
                    <div class="p-4 text-center text-slate-400 text-xs">No users yet.</div>
                </div>
            </div>
        </div>

        <!-- 5. ADMIN SCRATCHPAD -->
        <div class="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col relative group">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-bold text-amber-900 flex items-center gap-2"><i data-lucide="sticky-note" class="w-4 h-4"></i> Admin Scratchpad</h3>
                <span class="text-[10px] text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" id="note-status">Auto-saved</span>
            </div>
            <textarea id="admin-notes" class="w-full min-h-[100px] bg-transparent border-0 outline-none text-sm text-amber-800 font-medium resize-none placeholder-amber-400" placeholder="Type quick notes, ideas, or todos here..."></textarea>
        </div>

    </div>`;
}

export async function init() {
    const unsubs = [];

    // Helper to safely add listeners
    const safeSnapshot = (q, callback) => {
        try {
            const unsub = onSnapshot(q, callback, (error) => {
                console.warn("Dashboard Data Error:", error.message);
            });
            unsubs.push(unsub);
        } catch (e) { console.error("Snapshot Init Failed:", e); }
    };

    // 1. TRAFFIC LOGS
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), orderBy('timestamp', 'desc'), limit(150)), (snap) => {
        document.getElementById('stat-traffic').innerText = snap.size + (snap.size === 150 ? '+' : '');
        
        const logs = [];
        const refs = {};
        snap.forEach(doc => {
            const d = doc.data();
            logs.push(d);
            let r = d.referrer || 'Direct';
            if(r.includes('http')) try { r = new URL(r).hostname.replace('www.',''); } catch(e) { r = 'Direct'; }
            refs[r] = (refs[r] || 0) + 1;
        });

        // Chart
        const chart = document.getElementById('traffic-chart');
        if(logs.length > 0 && chart) {
            chart.innerHTML = '';
            const chunkSize = Math.ceil(logs.length / 24) || 1;
            for(let i=0; i<24; i++) {
                const count = logs.slice(i*chunkSize, (i+1)*chunkSize).length;
                const h = Math.max(10, (count / chunkSize) * 100);
                chart.innerHTML += `<div class="flex-1 bg-brand-100 hover:bg-brand-300 rounded-t-sm transition-all" style="height:${h}%" title="${count} hits"></div>`;
            }
        }

        // Referrers
        const topRefs = Object.entries(refs).sort((a,b) => b[1]-a[1]).slice(0,5);
        document.getElementById('top-referrers').innerHTML = topRefs.map(([k,v]) => 
            `<div class="flex justify-between text-xs"><span class="text-slate-600 font-medium truncate max-w-[150px]">${k}</span><span class="text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">${v}</span></div>`
        ).join('');
    });

    // 2. TOOL USAGE
    safeSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tool_usage_logs'), limit(300)), (snap) => {
        document.getElementById('stat-generations').innerText = snap.size;
        const counts = {};
        snap.forEach(doc => {
            const t = doc.data().tool?.split('_')[0];
            if(t) counts[t] = (counts[t]||0)+1;
        });
        
        const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const max = sorted[0]?.[1] || 1;

        document.getElementById('tool-bars').innerHTML = sorted.map(([k,v]) => 
            `<div class="mb-2">
                <div class="flex justify-between text-xs mb-1 font-medium"><span class="capitalize text-slate-700">${k}</span><span class="text-slate-500">${v}</span></div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full"><div class="bg-slate-800 h-1.5 rounded-full" style="width:${(v/max)*100}%"></div></div>
            </div>`
        ).join('') || '<div class="text-center text-xs text-slate-400 py-4">No data</div>';
    });

    // 3. SUBSCRIBERS (Newsletter)
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), (snap) => {
        document.getElementById('stat-subscribers').innerText = snap.size;
    });

    // 4. API KEYS
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'), (snap) => {
        document.getElementById('stat-keys').innerText = snap.size;
        const statusEl = document.getElementById('stat-keys-status');
        if(snap.size > 0) {
            statusEl.innerText = "Operational";
            statusEl.className = "text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full";
        } else {
            statusEl.innerText = "Critical";
            statusEl.className = "text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse";
        }
    });

    // 5. USERS (TOTAL & VIP)
    safeSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
        let total = 0;
        let vip = 0;
        const recent = [];

        snap.forEach(doc => {
            total++;
            const d = doc.data();
            if(d.vip) vip++;
            recent.push(d);
        });

        // Stats
        document.getElementById('stat-total-users').innerText = total;
        document.getElementById('stat-vip-count').innerText = vip;
        
        // Ratio Bar
        const ratio = total > 0 ? Math.round((vip/total)*100) : 0;
        document.getElementById('vip-ratio-text').innerText = `${ratio}%`;
        document.getElementById('vip-ratio-bar').style.width = `${ratio}%`;

        // Recent List (Client Sort)
        recent.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const listEl = document.getElementById('recent-users-list');
        if (recent.length > 0) {
            listEl.innerHTML = recent.slice(0, 5).map(u => `
                <div class="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${u.vip ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'} flex items-center justify-center text-xs font-bold">
                            ${u.email ? u.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-800 truncate max-w-[120px] flex items-center gap-1">
                                ${u.displayName || 'Anonymous'}
                                ${u.vip ? '<i data-lucide="crown" class="w-3 h-3 text-amber-500 fill-current"></i>' : ''}
                            </p>
                            <p class="text-[10px] text-slate-400 truncate">${u.email || 'No Email'}</p>
                        </div>
                    </div>
                    <span class="text-[10px] text-slate-400 font-mono">${u.createdAt ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</span>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">No users found.</div>';
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
                status.innerText = "Saving...";
                status.classList.remove('opacity-0');
                setTimeout(() => { status.innerText = "Saved"; setTimeout(() => status.classList.add('opacity-0'), 1000); }, 500);
            }
        });
    }

    if(window.lucide) window.lucide.createIcons();
    return () => unsubs.forEach(u => u());
}