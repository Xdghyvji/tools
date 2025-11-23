import { db, appId, auth } from '../../js/shared.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900">Blog Posts</h1>
            <button id="new-post-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i> New Post
            </button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Category</th>
                        <th class="px-6 py-4">Author</th>
                        <th class="px-6 py-4">Date</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200" id="posts-table-body">
                    <tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading posts...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

let postsData = [];

export async function init() {
    // Setup Modal Logic (Attach to Window for global scope access if needed, or local event listeners)
    document.getElementById('new-post-btn').addEventListener('click', () => openModal());

    // Listener
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), (snapshot) => {
        postsData = [];
        snapshot.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));
        
        // Sort by date descending
        postsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const tbody = document.getElementById('posts-table-body');
        if (postsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No posts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = postsData.map(p => `
            <tr class="hover:bg-slate-50 group">
                <td class="px-6 py-4 font-medium text-slate-900">${p.title}</td>
                <td class="px-6 py-4"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">${p.category}</span></td>
                <td class="px-6 py-4 text-slate-600">${p.author}</td>
                <td class="px-6 py-4 text-slate-500">${p.date}</td>
                <td class="px-6 py-4 text-right">
                    <button class="text-brand-600 hover:text-brand-800 mr-3 font-medium edit-btn" data-id="${p.id}">Edit</button>
                    <button class="text-red-500 hover:text-red-700 font-medium delete-btn" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `).join('');

        // Attach Listeners to dynamic buttons
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openModal(e.target.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id)));
    });

    return unsub;
}

// --- Internal Functions ---

async function deletePost(id) {
    if(confirm("Are you sure you want to delete this post?")) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', id));
        logAction('Delete', 'Deleted Blog Post');
    }
}

async function logAction(action, details) {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), {
        action, details, admin: auth.currentUser.email, createdAt: serverTimestamp()
    });
}

function openModal(id = null) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    const post = id ? postsData.find(p => p.id === id) : null;

    content.innerHTML = `
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 class="text-xl font-bold text-slate-900">${id ? 'Edit Post' : 'Create New Post'}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>
        <div class="p-6 space-y-4">
            <input type="hidden" id="post-id" value="${id || ''}">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" id="post-title" class="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value="${post?.title || ''}">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select id="post-category" class="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                        ${['AI Tools','SEO','YouTube','Instagram','TikTok','Marketing'].map(c => `<option ${post?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Read Time</label>
                    <input type="text" id="post-readTime" class="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value="${post?.readTime || ''}">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input type="text" id="post-image" class="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value="${post?.image || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Content (HTML supported)</label>
                <textarea id="post-content" rows="10" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm">${post?.content || ''}</textarea>
            </div>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button id="cancel-btn" class="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
            <button id="save-post-btn" class="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium">Save Post</button>
        </div>
    `;

    // Show Modal
    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
    if(window.lucide) window.lucide.createIcons();

    // Attach Modal Listeners
    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('cancel-btn').onclick = closeModal;
    document.getElementById('save-post-btn').onclick = savePost;
}

function closeModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

async function savePost() {
    const id = document.getElementById('post-id').value;
    const data = {
        title: document.getElementById('post-title').value,
        category: document.getElementById('post-category').value,
        readTime: document.getElementById('post-readTime').value,
        image: document.getElementById('post-image').value,
        content: document.getElementById('post-content').value,
        author: "Admin",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: serverTimestamp()
    };

    if (!data.title) return alert("Title required");

    const btn = document.getElementById('save-post-btn');
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        if(id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', id), data);
            logAction('Update', `Updated Post: ${data.title}`);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), data);
            logAction('Create', `Created Post: ${data.title}`);
        }
        closeModal();
    } catch(e) {
        alert("Error saving post: " + e.message);
        btn.innerText = "Save Post";
        btn.disabled = false;
    }
}