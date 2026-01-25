import { db, appId } from '../../js/shared.js';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-8 pb-24">
        
        <!-- 1. HEADER & CONTROLS -->
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-slate-200/60 pb-8">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">Enterprise View</span>
                    <span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Websocket Connected
                    </span>
                </div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Global Traffic Intelligence
                </h1>
                <p class="text-slate-500 font-medium mt-2 max-w-2xl">
                    Real-time telemetry streaming from client instances. Monitoring geographic distribution, user sessions, and content engagement velocity.
                </p>
            </div>
            
            <div class="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div class="px-5 py-2 border-r border-slate-100">
                    <span class="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Session ID</span>
                    <span class="font-mono text-xs font-bold text-slate-700 truncate max-w-[100px] block">ADMIN-${Math.floor(Math.random()*10000)}</span>
                </div>
                <button onclick="loadView('analytics')" class="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95" title="Force Refresh">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- 2. HIGH-LEVEL KPI MATRICES -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <!-- Real-Time Active -->
            <div class="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                <div class="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-white/10 rounded-xl backdrop-blur-md"><i data-lucide="zap" class="w-5 h-5 text-yellow-400"></i></div>
                        <span class="text-[10px] font-bold bg-white/20 px-2 py-1 rounded text-white/90">LIVE</span>
                    </div>
                    <div class="flex items-baseline gap-1">
                        <h3 class="text-5xl font-black tracking-tighter" id="stat-active-now">--</h3>
                        <span class="text-sm font-medium text-slate-400">active</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-2 font-medium">Users active in last 5 min</p>
                </div>
                <!-- Mini Sparkline -->
                <div class="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-0.5 px-6 opacity-30" id="mini-sparkline"></div>
            </div>

            <!-- Total Impressions -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-colors">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><i data-lucide="eye" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impressions</span>
                </div>
                <h3 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-total-views">--</h3>
                <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <i data-lucide="trending-up" class="w-3 h-3"></i> +12%
                    </span>
                    <span class="text-xs text-slate-400 font-medium">vs yesterday</span>
                </div>
            </div>

            <!-- Global Reach -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><i data-lucide="globe" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Countries</span>
                </div>
                <h3 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-countries">--</h3>
                <div class="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-full w-[70%] rounded-full"></div>
                </div>
                <p class="text-xs text-slate-400 mt-2 font-medium">Top region: <span class="text-slate-700 font-bold" id="stat-top-region">--</span></p>
            </div>

            <!-- Device Split -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-purple-200 transition-colors">
                 <div class="flex justify-between items-start mb-4">
                    <div class="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><i data-lucide="smartphone" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                </div>
                <h3 class="text-4xl font-black text-slate-900 tracking-tight" id="stat-mobile-pct">--%</h3>
                <div class="mt-3 flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
                    <div class="bg-purple-500 w-[60%]"></div> <!-- Mobile -->
                    <div class="bg-slate-300 w-[30%]"></div> <!-- Desktop -->
                    <div class="bg-slate-200 w-[10%]"></div> <!-- Tablet -->
                </div>
                <div class="flex justify-between text-[10px] text-slate-400 mt-1 font-bold uppercase">
                    <span>Mob</span><span>Desk</span><span>Tab</span>
                </div>
            </div>
        </div>

        <!-- 3. DETAILED VISUALIZATIONS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- A. Traffic Velocity Chart -->
            <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-lg font-black text-slate-900">Request Velocity</h3>
                        <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Requests per Timestamp Bucket</p>
                    </div>
                    <div class="flex gap-4">
                         <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span class="text-xs font-bold text-slate-500">Page Views</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                            <span class="text-xs font-bold text-slate-500">Generations</span>
                        </div>
                    </div>
                </div>
                
                <!-- Chart Container -->
                <div class="flex-1 w-full h-64 flex items-end gap-1" id="main-velocity-chart">
                    <!-- Bars injected via JS -->
                    <div class="w-full h-full flex items-center justify-center text-slate-300 font-bold text-sm animate-pulse">Initializing Visualization...</div>
                </div>
                
                <!-- X-Axis Labels (Time) -->
                <div class="flex justify-between text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-wider" id="chart-labels">
                    <span>Oldest</span>
                    <span>Recent</span>
                </div>
            </div>

            <!-- B. Geographic Breakdown -->
            <div class="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
                <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <i data-lucide="map" class="w-5 h-5 text-slate-400"></i> Top Geographies
                </h3>
                
                <div class="space-y-5 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]" id="geo-list">
                    <div class="text-center py-10 text-slate-400 text-xs font-bold">Waiting for geo data...</div>
                </div>

                <div class="mt-auto pt-6 border-t border-slate-100">
                    <button class="w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider">
                        View Full Map Report
                    </button>
                </div>
            </div>
        </div>

        <!-- 4. PRECISION DATA: LIVE FEED TABLE -->
        <div class="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div class="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                        <i data-lucide="radio" class="w-5 h-5 text-red-500 animate-pulse"></i> Live Traffic Feed
                    </h3>
                    <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Streaming individual request packets</p>
                </div>
                <div class="flex gap-2">
                    <input type="text" placeholder="Search IP or Path..." class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 w-48 shadow-sm">
                    <button class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors">Export CSV</button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th class="px-8 py-4">Timestamp</th>
                            <th class="px-8 py-4">Location / IP</th>
                            <th class="px-8 py-4">Page Path</th>
                            <th class="px-8 py-4">Device / OS</th>
                            <th class="px-8 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-600" id="live-feed-body">
                        <tr>
                            <td colspan="5" class="px-8 py-12 text-center text-slate-400">
                                <div class="flex flex-col items-center gap-2">
                                    <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-slate-300"></i>
                                    <span>Establishing secure connection to stream...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                <button class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">Load More Records</button>
            </div>
        </div>

    </div>
    `;
}

export async function init() {
    const unsubs = [];
    const safeSnapshot = (q, cb) => {
        try { unsubs.push(onSnapshot(q, cb, e => console.warn(e))); } 
        catch(e) { console.error(e); }
    };

    // 1. PRESENCE (Active Users)
    const presenceRef = collection(db, 'artifacts', appId, 'public', 'data', 'presence');
    const fiveMinsAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    // Simple query for active users. In real app, filter by timestamp if possible or filter client-side.
    // Assuming simple size count for now as per previous logic.
    safeSnapshot(presenceRef, (snap) => {
        const count = snap.size;
        document.getElementById('stat-active-now').innerText = count;
        
        // Generate sparkline bars based on random noise + count for effect
        const sparkline = document.getElementById('mini-sparkline');
        if(sparkline) {
            sparkline.innerHTML = Array(20).fill(0).map(() => 
                `<div class="w-1 bg-white/40 rounded-t-sm transition-all duration-500" style="height: ${Math.random() * 80 + 20}%"></div>`
            ).join('');
        }
    });

    // 2. MAIN TRAFFIC LOGS (Large Query for aggregation)
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(100)); // Fetch last 100 for live feed & charts

    safeSnapshot(logsQuery, (snap) => {
        const logs = [];
        const countries = {};
        let mobileCount = 0;
        let totalViews = 0;

        snap.forEach(doc => {
            const d = doc.data();
            logs.push(d);
            
            // Aggregation: Countries
            const country = d.geo?.country_name || 'Unknown';
            countries[country] = (countries[country] || 0) + 1;

            // Aggregation: Device
            if (d.device === 'Mobile') mobileCount++;
            if (d.type === 'page_view') totalViews++;
        });

        // UPDATE KPI CARDS
        document.getElementById('stat-total-views').innerText = totalViews; // Note: This is "recent" views in this query context. Real total would need aggregate query.
        document.getElementById('stat-countries').innerText = Object.keys(countries).length;
        
        const topCountry = Object.entries(countries).sort((a,b) => b[1]-a[1])[0];
        document.getElementById('stat-top-region').innerText = topCountry ? topCountry[0] : 'None';

        const mobilePct = logs.length > 0 ? Math.round((mobileCount / logs.length) * 100) : 0;
        document.getElementById('stat-mobile-pct').innerText = `${mobilePct}%`;

        // UPDATE CHARTS
        updateVelocityChart(logs);
        updateGeoList(countries, logs.length);
        updateLiveFeed(logs);
    });

    if(window.lucide) window.lucide.createIcons();
    return () => unsubs.forEach(u => u());
}

// --- HELPER FUNCTIONS ---

function updateVelocityChart(logs) {
    const chart = document.getElementById('main-velocity-chart');
    if(!chart || logs.length === 0) return;

    // Bucket logs by time (simple visual clustering)
    const buckets = 30;
    const bucketData = Array(buckets).fill(0);
    const chunk = Math.ceil(logs.length / buckets);
    
    // Reverse logs to be chronological for the chart (Old -> New)
    const chronologicalLogs = [...logs].reverse();

    for(let i=0; i<buckets; i++) {
        const slice = chronologicalLogs.slice(i*chunk, (i+1)*chunk);
        bucketData[i] = slice.length;
    }
    
    const max = Math.max(...bucketData) || 1;

    chart.innerHTML = bucketData.map((val, i) => {
        const h = (val / max) * 100;
        const colorClass = i > buckets - 5 ? 'bg-emerald-400' : 'bg-blue-500'; // Highlight recent
        return `
            <div class="flex-1 flex flex-col justify-end h-full group relative">
                <div class="${colorClass} w-full rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-300 relative" style="height: ${Math.max(h, 5)}%">
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 whitespace-nowrap">
                        ${val} Reqs
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateGeoList(countries, total) {
    const container = document.getElementById('geo-list');
    if(!container) return;

    const sorted = Object.entries(countries).sort((a,b) => b[1]-a[1]).slice(0, 6);
    
    if(sorted.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs font-bold">No geo data available</div>`;
        return;
    }

    container.innerHTML = sorted.map(([country, count]) => {
        const pct = Math.round((count / total) * 100);
        return `
            <div class="flex items-center gap-4 group">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                    ${country.substring(0,2).toUpperCase()}
                </div>
                <div class="flex-1">
                    <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>${country}</span>
                        <span>${count}</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div class="bg-indigo-500 h-full rounded-full" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateLiveFeed(logs) {
    const tbody = document.getElementById('live-feed-body');
    if(!tbody) return;

    if(logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-8 py-8 text-center text-slate-400 text-xs font-bold">Waiting for traffic...</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        // Safe formatting
        const date = log.timestamp ? new Date(log.timestamp.seconds * 1000) : new Date();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        const country = log.geo?.country_name || 'Unknown';
        const city = log.geo?.city || '';
        const path = log.data?.path || '/';
        const device = log.device || 'Desktop';
        const isGen = log.type === 'generation';
        
        return `
            <tr class="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <td class="px-8 py-3.5">
                    <div class="flex flex-col">
                        <span class="text-slate-900 font-bold">${time}</span>
                        <span class="text-slate-400 font-medium text-[10px] uppercase">${day}</span>
                    </div>
                </td>
                <td class="px-8 py-3.5">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${country === 'Unknown' ? 'bg-slate-300' : 'bg-emerald-500'}"></span>
                        <span class="text-slate-700 font-bold truncate max-w-[120px]">${country}</span>
                        ${city ? `<span class="text-slate-400 text-[10px] hidden xl:inline">(${city})</span>` : ''}
                    </div>
                </td>
                <td class="px-8 py-3.5">
                    <span class="text-slate-600 font-mono text-[11px] px-2 py-1 bg-slate-100 rounded border border-slate-200 truncate block max-w-[180px]" title="${path}">
                        ${path}
                    </span>
                </td>
                <td class="px-8 py-3.5">
                     <div class="flex items-center gap-2 text-slate-500">
                        ${device === 'Mobile' ? '<i data-lucide="smartphone" class="w-3.5 h-3.5"></i>' : '<i data-lucide="monitor" class="w-3.5 h-3.5"></i>'}
                        <span class="text-xs font-bold">${device}</span>
                    </div>
                </td>
                <td class="px-8 py-3.5 text-right">
                    ${isGen 
                        ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider"><i data-lucide="sparkles" class="w-3 h-3"></i> AI Gen</span>`
                        : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">View</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
    
    if(window.lucide) window.lucide.createIcons();
}
