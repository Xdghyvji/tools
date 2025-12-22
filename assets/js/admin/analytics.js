import { db, appId } from '../shared.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. RENDER UI
// ==========================================
export function render() {
    return `
    <div class="animate-fade-in space-y-6">
        <div class="flex justify-between items-end mb-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Traffic Analytics</h1>
                <p class="text-sm text-slate-500">Real-time visitor insights and ad performance.</p>
            </div>
            <button onclick="loadView('analytics')" class="text-sm text-brand-600 font-bold hover:underline flex items-center gap-1">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i> Refresh Data
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Hits</p>
                        <h3 class="text-3xl font-bold text-slate-900 mt-1" id="kpi-views">...</h3>
                    </div>
                    <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><i data-lucide="eye" class="w-5 h-5"></i></div>
                </div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Unique Visitors</p>
                        <h3 class="text-3xl font-bold text-slate-900 mt-1" id="kpi-visitors">...</h3>
                    </div>
                    <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><i data-lucide="users" class="w-5 h-5"></i></div>
                </div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Ad Clicks</p>
                        <h3 class="text-3xl font-bold text-slate-900 mt-1" id="kpi-clicks">...</h3>
                    </div>
                    <div class="p-2 bg-amber-50 text-amber-600 rounded-lg"><i data-lucide="mouse-pointer-2" class="w-5 h-5"></i></div>
                </div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Top Country</p>
                        <h3 class="text-xl font-bold text-slate-900 mt-2 truncate" id="kpi-country">...</h3>
                    </div>
                    <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><i data-lucide="globe" class="w-5 h-5"></i></div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="font-bold text-slate-900">Live Traffic Feed</h3>
                    <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th class="px-6 py-3">Time</th>
                                <th class="px-6 py-3">Location</th>
                                <th class="px-6 py-3">Page</th>
                                <th class="px-6 py-3">Device</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="traffic-table">
                            <tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">Loading live data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-900 mb-4">Device Breakdown</h3>
                    <div class="space-y-4" id="device-bars">
                        </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-900 mb-4">Top Countries</h3>
                    <div class="space-y-3" id="country-list">
                        </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ==========================================
// 2. LOGIC
// ==========================================
export async function init() {
    try {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'traffic_logs'), orderBy('timestamp', 'desc'), limit(200));
        const snapshot = await getDocs(q);
        
        const logs = [];
        snapshot.forEach(doc => logs.push(doc.data()));

        processStats(logs);

    } catch (e) {
        console.error("Analytics Error:", e);
        document.getElementById('traffic-table').innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Error loading analytics data.</td></tr>`;
    }
}

function processStats(logs) {
    if (logs.length === 0) {
        document.getElementById('traffic-table').innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No data recorded yet.</td></tr>`;
        return;
    }

    // 1. KPIs
    const totalHits = logs.length;
    const uniqueIPs = new Set(logs.map(l => l.ip)).size;
    const adClicks = logs.filter(l => l.type === 'ad_click').length;
    
    // Country Logic
    const countryCount = {};
    logs.forEach(l => { if(l.country) countryCount[l.country] = (countryCount[l.country] || 0) + 1; });
    const topCountry = Object.keys(countryCount).sort((a,b) => countryCount[b] - countryCount[a])[0] || "Unknown";

    document.getElementById('kpi-views').innerText = formatNumber(totalHits);
    document.getElementById('kpi-visitors').innerText = formatNumber(uniqueIPs);
    document.getElementById('kpi-clicks').innerText = adClicks;
    document.getElementById('kpi-country').innerText = topCountry;

    // 2. Live Table
    const tbody = document.getElementById('traffic-table');
    tbody.innerHTML = logs.slice(0, 10).map(l => {
        const time = l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now';
        const page = l.path === '/' ? 'Home' : l.path.replace('.html', '').replace('/', '');
        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-3 text-slate-500 font-mono text-xs">${time}</td>
                <td class="px-6 py-3 font-medium text-slate-700 flex items-center gap-2">
                    ${getFlagEmoji(l.country)} ${l.city || 'Unknown'}
                </td>
                <td class="px-6 py-3"><span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100 capitalize">${page}</span></td>
                <td class="px-6 py-3 text-slate-600 text-xs">${l.device || 'Desktop'}</td>
            </tr>
        `;
    }).join('');

    // 3. Device Bars
    const devices = { 'Mobile': 0, 'Desktop': 0, 'Tablet': 0 };
    logs.forEach(l => { if(devices[l.device] !== undefined) devices[l.device]++; });
    
    const deviceHTML = Object.entries(devices).map(([dev, count]) => {
        const pct = Math.round((count / totalHits) * 100) || 0;
        return `
            <div>
                <div class="flex justify-between text-xs mb-1 font-bold text-slate-600">
                    <span>${dev}</span>
                    <span>${pct}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-600 h-2 rounded-full" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('device-bars').innerHTML = deviceHTML;

    // 4. Country List
    const sortedCountries = Object.entries(countryCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const countryHTML = sortedCountries.map(([c, count]) => `
        <div class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <div class="flex items-center gap-2 font-medium text-slate-700">
                <span class="text-lg">${getFlagEmoji(c)}</span> ${c}
            </div>
            <span class="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">${count}</span>
        </div>
    `).join('');
    document.getElementById('country-list').innerHTML = countryHTML;

    if(window.lucide) window.lucide.createIcons();
}

function formatNumber(num) {
    return num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
}

// Helper: Convert Country Name to Flag Emoji (Simple mapping)
// For production, a real ISO code map is better, but this works for common names
function getFlagEmoji(countryName) {
    if (!countryName) return '🌍';
    // Simple heuristic for demo purposes. 
    // In production, store ISO codes (US, PK, IN) and map to emoji properly.
    if(countryName === 'Pakistan') return '🇵🇰';
    if(countryName === 'United States') return '🇺🇸';
    if(countryName === 'India') return '🇮🇳';
    if(countryName === 'United Kingdom') return '🇬🇧';
    if(countryName === 'Canada') return '🇨🇦';
    return '🌍'; 
}
