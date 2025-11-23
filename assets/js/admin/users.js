import { db, appId } from '../../js/shared.js';
import { collection, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in pb-20">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">User Management</h1>
                <p class="text-sm text-slate-500">Manage VIP access and user status.</p>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-1 flex text-xs font-bold text-slate-600">
                <span class="px-3 py-1.5 bg-slate-100 rounded-md">All Users</span>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                    <tr>
                        <th class="px-6 py-4">User Profile</th>
                        <th class="px-6 py-4">Tier</th>
                        <th class="px-6 py-4">Generations</th>
                        <th class="px-6 py-4">Last Active</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200" id="users-table-body">
                    <tr><td colspan="5" class="p-8 text-center text-slate-400">Loading users...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

export async function init() {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
        const users = [];
        snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        
        // Sort: VIPs first, then by usage
        users.sort((a, b) => (b.vip === true ? 1 : 0) - (a.vip === true ? 1 : 0) || (b.usageCount || 0) - (a.usageCount || 0));

        const tbody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => {
            const isVip = u.vip === true;
            
            const tierBadge = isVip 
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><i data-lucide="crown" class="w-3 h-3 fill-current"></i> VIP</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Free Tier</span>`;

            return `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${isVip ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-slate-100 text-slate-500'} flex items-center justify-center font-bold text-sm uppercase">
                            ${u.email ? u.email.charAt(0) : 'U'}
                        </div>
                        <div>
                            <div class="font-bold text-slate-900 flex items-center gap-2">
                                ${u.displayName || 'Anonymous'}
                                ${u.blocked ? '<span class="text-xs text-red-500 bg-red-50 px-1 rounded">BLOCKED</span>' : ''}
                            </div>
                            <div class="text-xs text-slate-500">${u.email || u.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">${tierBadge}</td>
                <td class="px-6 py-4">
                    <span class="font-bold text-slate-700">${u.usageCount || 0}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-slate-600 text-xs">${u.lastActive ? new Date(u.lastActive.seconds * 1000).toLocaleDateString() : 'Never'}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        <button onclick="toggleVip('${u.id}', ${!isVip})" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${isVip ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'}">
                            ${isVip ? 'Remove VIP' : 'Upgrade to VIP'}
                        </button>
                        <button onclick="toggleBlock('${u.id}', ${!u.blocked})" class="p-1.5 text-slate-400 hover:text-red-600" title="${u.blocked ? 'Unblock' : 'Block'}">
                            <i data-lucide="${u.blocked ? 'unlock' : 'ban'}" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        if(window.lucide) window.lucide.createIcons();
    });

    // Window Functions
    window.toggleVip = async (uid, setVip) => {
        if(confirm(setVip ? "Upgrade this user to VIP? They will get exclusive model access." : "Downgrade user to Free Tier?")) {
            try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { vip: setVip }); } 
            catch(e) { alert("Error: " + e.message); }
        }
    };

    window.toggleBlock = async (uid, setBlocked) => {
        if(confirm(setBlocked ? "Block access for this user?" : "Restore access?")) {
            try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { blocked: setBlocked }); } 
            catch(e) { alert("Error: " + e.message); }
        }
    };

    return unsub;
}