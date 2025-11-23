import { db, appId } from '../../js/shared.js';
import { collection, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render(type) {
    const titles = { 'inbox': 'Inbox Messages', 'subscribers': 'Newsletter Subscribers', 'comments': 'User Comments' };
    
    return `
    <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900">${titles[type] || 'Messages'}</h1>
             ${type === 'subscribers' ? `<button id="export-csv-btn" class="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><i data-lucide="download" class="w-4 h-4"></i> CSV</button>` : ''}
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr id="table-header">
                        <!-- Injected based on type -->
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200" id="table-body">
                    <tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

let currentData = [];

export async function init(type) {
    // Set Header
    const headerRow = document.getElementById('table-header');
    if (type === 'inbox') headerRow.innerHTML = `<th class="px-6 py-4">Name</th><th class="px-6 py-4">Subject</th><th class="px-6 py-4">Message</th><th class="px-6 py-4">Date</th><th class="px-6 py-4 text-right">Action</th>`;
    else if (type === 'subscribers') headerRow.innerHTML = `<th class="px-6 py-4">Email</th><th class="px-6 py-4">Source</th><th class="px-6 py-4">Date</th>`;
    else if (type === 'comments') headerRow.innerHTML = `<th class="px-6 py-4">User</th><th class="px-6 py-4">Comment</th><th class="px-6 py-4">Date</th><th class="px-6 py-4 text-right">Action</th>`;

    if(type === 'subscribers') {
        document.getElementById('export-csv-btn')?.addEventListener('click', () => exportCSV(currentData));
    }

    const colName = type === 'inbox' ? 'messages' : type;

    // Listener
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', colName), (snapshot) => {
        currentData = [];
        snapshot.forEach(doc => currentData.push({ id: doc.id, ...doc.data() }));
        currentData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const tbody = document.getElementById('table-body');
        if (currentData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No data found.</td></tr>`;
            return;
        }

        tbody.innerHTML = currentData.map(item => {
            if (type === 'inbox') return `
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 font-medium">${item.name}</td>
                    <td class="px-6 py-4 text-slate-600">${item.subject}</td>
                    <td class="px-6 py-4 text-slate-500 truncate max-w-xs">${item.message}</td>
                    <td class="px-6 py-4 text-xs text-slate-400">${formatDate(item.createdAt)}</td>
                    <td class="px-6 py-4 text-right">
                        <a href="mailto:${item.email}" class="text-brand-600 mr-3"><i data-lucide="reply" class="w-4 h-4 inline"></i></a>
                        <button class="text-red-500 delete-btn" data-id="${item.id}" data-col="messages"><i data-lucide="trash-2" class="w-4 h-4 inline"></i></button>
                    </td>
                </tr>`;
            if (type === 'subscribers') return `
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 font-medium">${item.email}</td>
                    <td class="px-6 py-4 text-slate-600">${item.source || 'Blog'}</td>
                    <td class="px-6 py-4 text-slate-500">${formatDate(item.createdAt)}</td>
                </tr>`;
            if (type === 'comments') return `
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 font-medium">${item.user}</td>
                    <td class="px-6 py-4 text-slate-600 truncate max-w-xs">${item.text}</td>
                    <td class="px-6 py-4 text-slate-500">${item.date}</td>
                    <td class="px-6 py-4 text-right">
                        <button class="text-red-500 delete-btn" data-id="${item.id}" data-col="comments"><i data-lucide="trash-2" class="w-4 h-4 inline"></i></button>
                    </td>
                </tr>`;
        }).join('');

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteItem(e.currentTarget.dataset.col, e.currentTarget.dataset.id));
        });
        
        if(window.lucide) window.lucide.createIcons();
    });

    return unsub;
}

function formatDate(timestamp) {
    return timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
}

async function deleteItem(collectionName, id) {
    if(confirm("Delete this item permanently?")) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
    }
}

function exportCSV(data) {
    if(data.length === 0) return alert("No data");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `export_${new Date().toISOString()}.csv`;
    link.click();
}