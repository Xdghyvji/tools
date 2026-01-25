import { db, appId, auth } from '../shared.js';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. RENDER UI
// ==========================================
export function render() {
    return `
    <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900">Blog Posts</h1>
            <div class="flex gap-3">
                 <button id="update-sitemap-btn" class="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <i data-lucide="map" class="w-4 h-4"></i> Force Update Sitemap
                </button>
                <button id="new-post-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> New Post
                </button>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Author</th>
                        <th class="px-6 py-4">Status</th>
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
let authorsList = [];
let originalModalClasses = ""; 
let originalParentClasses = "";

// ==========================================
// 2. INITIALIZATION & LISTENERS
// ==========================================
export async function init() {
    try {
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.addEventListener('click', () => openModal());

        const sitemapBtn = document.getElementById('update-sitemap-btn');
        if (sitemapBtn) sitemapBtn.addEventListener('click', () => updateSitemap(true));
        
        // Fetch authors immediately so they are ready for the modal
        await fetchAuthors();

    } catch (e) {
        console.error("Error attaching listeners:", e);
    }

    // Real-time Posts Listener (Fixed Path)
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), (snapshot) => {
        postsData = [];
        snapshot.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));
        postsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const tbody = document.getElementById('posts-table-body');
        if (postsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No posts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = postsData.map(p => {
            // Find author name from ID
            const authorName = authorsList.find(a => a.id === p.authorId)?.name || p.author || 'Admin';
            
            return `
            <tr class="hover:bg-slate-50 group transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">
                    <a href="/single-blog.html?id=${p.id}" target="_blank" class="hover:text-brand-600 hover:underline flex items-center gap-2">
                        ${p.title} <i data-lucide="external-link" class="w-3 h-3 text-slate-400"></i>
                    </a>
                </td>
                <td class="px-6 py-4 text-slate-600">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">${authorName.charAt(0)}</span>
                        ${authorName}
                    </div>
                </td>
                <td class="px-6 py-4">
                     <span class="text-xs px-2 py-1 rounded-full border ${p.published !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}">
                        ${p.published !== false ? 'Published' : 'Draft'}
                     </span>
                </td>
                <td class="px-6 py-4 text-slate-600">${p.date}</td>
                <td class="px-6 py-4 text-right">
                    <button class="text-brand-600 hover:text-brand-800 mr-3 font-medium edit-btn transition-colors" data-id="${p.id}">Edit</button>
                    <button class="text-red-500 hover:text-red-700 font-medium delete-btn transition-colors" data-id="${p.id}">Delete</button>
                </td>
            </tr>
            `;
        }).join('');

        if(window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openModal(e.target.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id)));
    });

    return unsub;
}

// ==========================================
// 3. CORE LOGIC
// ==========================================

async function fetchAuthors() {
    try {
        // --- FIXED PATH: Use 'artifacts/{appId}/public/data/authors' ---
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'authors'));
        authorsList = [];
        snap.forEach(doc => authorsList.push({ id: doc.id, ...doc.data() }));
        console.log("Authors Loaded:", authorsList.length);
    } catch (e) {
        console.warn("Could not fetch authors:", e);
    }
}

async function deletePost(id) {
    if(confirm("Are you sure? This will remove the post from your live site.")) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', id));
        logAction('Delete', 'Deleted Blog Post');
        await updateSitemap();
    }
}

async function logAction(action, details) {
    if (auth.currentUser) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), {
            action, details, admin: auth.currentUser.email, createdAt: serverTimestamp()
        });
    }
}

function createSlug(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

export async function updateSitemap(force = false) {
    const btn = document.getElementById('update-sitemap-btn');
    if(btn) { btn.innerText = "Updating..."; btn.disabled = true; }

    try {
        const q = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'posts'));
        let urls = [];
        
        const staticPages = [ 'index.html', 'about.html', 'blog.html', 'contact.html', 'subscription.html', 'tiktok.html', 'instagram.html', 'twitter-tools.html', 'email-tools.html', 'blog-tools.html' ];

        staticPages.forEach(page => urls.push({ loc: `https://digitalserviceshub.online/${page}`, priority: '0.8' }));
        q.forEach(doc => {
            const d = doc.data();
            if (d.published !== false) urls.push({ loc: `https://digitalserviceshub.online/single-blog.html?id=${doc.id}`, priority: '0.9' });
        });

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><priority>${u.priority}</priority></url>`).join('')}</urlset>`;

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitemap', 'xml'), { xml: xmlContent, updatedAt: serverTimestamp() });
        console.log("Sitemap Updated Successfully!");
        if(force && btn) alert("Sitemap updated!");

    } catch(e) { console.error("Sitemap Error", e); } 
    finally { if(btn) { btn.innerHTML = `<i data-lucide="map" class="w-4 h-4"></i> Force Update Sitemap`; btn.disabled = false; if(window.lucide) window.lucide.createIcons(); } }
}

// ==========================================
// 4. FULL SCREEN EDITOR MODAL
// ==========================================

async function loadTinyMCE() {
    if (window.tinymce) return;
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.tiny.cloud/1/7ljj288xo7ekxabldpx0j9gmxvzw7l3ao5riv578q9vi1c9s/tinymce/6/tinymce.min.js';
        script.referrerPolicy = "origin";
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

async function openModal(id = null) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    
    // Save state
    if (!originalModalClasses) originalModalClasses = content.className;
    if (!originalParentClasses) originalParentClasses = content.parentElement.className;

    // Apply Full Screen
    content.parentElement.className = "absolute inset-0 flex items-center justify-center p-0"; 
    content.className = "bg-white w-full h-full shadow-none rounded-none overflow-hidden flex flex-col transform transition-all opacity-0 scale-95";

    const post = id ? postsData.find(p => p.id === id) : null;
    await loadTinyMCE();

    // Re-fetch authors to ensure list is fresh
    if(authorsList.length === 0) await fetchAuthors();

    // Build Dropdown
    const authorOptions = authorsList.map(a => 
        `<option value="${a.id}" ${post?.authorId === a.id ? 'selected' : ''}>${a.name}</option>`
    ).join('');
    
    // Admin Fallback
    const defaultOption = `<option value="admin" ${!post?.authorId ? 'selected' : ''}>Admin (Me)</option>`;

    content.innerHTML = `
        <div class="h-16 px-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 z-20">
            <div class="flex items-center gap-4">
                <button id="close-modal-btn" class="p-2 -ml-2 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-colors group" title="Close Editor">
                    <i data-lucide="x" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                </button>
                <div class="h-6 w-px bg-slate-200"></div>
                <h3 class="text-lg font-bold text-slate-900">${id ? 'Editing Post' : 'New Article'}</h3>
                ${id ? '<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Live Edit</span>' : ''}
            </div>
            
            <div class="flex items-center gap-3">
                <p class="text-xs text-slate-400 hidden sm:block mr-2" id="save-status">Unsaved changes</p>
                <button id="save-post-btn" class="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>${id ? 'Update' : 'Publish'}</span>
                </button>
            </div>
        </div>
        
        <div class="flex-1 flex overflow-hidden bg-slate-50">
            <div class="flex-1 flex flex-col h-full overflow-hidden relative">
                <div class="p-6 pb-2 shrink-0 bg-white">
                    <input type="text" id="post-title" class="w-full text-3xl font-bold placeholder-slate-300 border-none outline-none ring-0 p-0 text-slate-900" placeholder="Type your title here..." value="${post?.title || ''}">
                    <input type="hidden" id="post-id" value="${id || ''}">
                    <input type="hidden" id="post-slug" value="${post?.slug || ''}">
                </div>
                <div class="flex-1 overflow-hidden bg-white relative">
                    <textarea id="post-content-editor" class="w-full h-full border-0 outline-none">${post?.content || ''}</textarea>
                </div>
            </div>

            <div class="w-80 bg-white border-l border-slate-200 overflow-y-auto shrink-0 z-10 hidden lg:block">
                <div class="p-5 space-y-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Publish Status</label>
                        <div class="bg-slate-50 p-1 rounded-lg border border-slate-200 flex">
                            <button type="button" class="flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-slate-800" id="btn-status-pub">Public</button>
                            <button type="button" class="flex-1 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-700" id="btn-status-draft">Draft</button>
                        </div>
                        <input type="hidden" id="post-status" value="${post?.published !== false ? 'true' : 'false'}">
                    </div>

                    <div class="space-y-3">
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Settings</label>
                        <div>
                            <span class="text-xs text-slate-400 mb-1 block">Author</span>
                            <select id="post-author" class="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-500 outline-none">
                                ${authorOptions || defaultOption}
                            </select>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 mb-1 block">Category</span>
                            <select id="post-category" class="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-500 outline-none">
                                ${['AI Tools','SEO','YouTube','Instagram','TikTok','Marketing','Updates'].map(c => `<option ${post?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Featured Image</label>
                        <div class="space-y-2">
                            <input type="text" id="post-image" class="w-full p-2 border border-slate-200 rounded-lg text-xs" placeholder="Paste Image URL..." value="${post?.image || ''}">
                            <div class="aspect-video bg-slate-50 rounded-lg border border-slate-200 border-dashed flex items-center justify-center overflow-hidden relative group">
                                <img id="preview-image" src="${post?.image || ''}" class="w-full h-full object-cover absolute inset-0 ${post?.image ? '' : 'hidden'}">
                                <div class="text-center p-4 ${post?.image ? 'hidden' : ''}" id="preview-placeholder">
                                    <i data-lucide="image" class="w-6 h-6 text-slate-300 mx-auto mb-1"></i>
                                    <span class="text-[10px] text-slate-400">Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => { 
        content.classList.remove('opacity-0', 'scale-95'); 
        content.classList.add('opacity-100', 'scale-100'); 
    }, 50);

    if(window.lucide) window.lucide.createIcons();
    initTinyMCE(); 

    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('save-post-btn').onclick = savePost;

    // Status UI
    const btnPub = document.getElementById('btn-status-pub');
    const btnDraft = document.getElementById('btn-status-draft');
    const inputStatus = document.getElementById('post-status');
    const updateStatusUI = (isPub) => {
        if(isPub) {
            btnPub.className = "flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-emerald-600";
            btnDraft.className = "flex-1 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-slate-600";
            inputStatus.value = "true";
        } else {
            btnPub.className = "flex-1 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-slate-600";
            btnDraft.className = "flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-amber-600";
            inputStatus.value = "false";
        }
    };
    updateStatusUI(inputStatus.value === 'true');
    btnPub.onclick = () => updateStatusUI(true);
    btnDraft.onclick = () => updateStatusUI(false);

    // Image Preview
    document.getElementById('post-image').addEventListener('input', (e) => {
        const img = document.getElementById('preview-image');
        const placeholder = document.getElementById('preview-placeholder');
        if(e.target.value) {
            img.src = e.target.value;
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    });
}

function initTinyMCE() {
    if (tinymce.get('post-content-editor')) tinymce.get('post-content-editor').remove();

    tinymce.init({
        selector: '#post-content-editor',
        height: "100%", 
        menubar: false,
        statusbar: false,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic forecolor | ' +
            'alignleft aligncenter alignright | bullist numlist outdent indent | ' +
            'link image media table | code fullscreen',
        content_style: `body { font-family:Inter,sans-serif; font-size:16px; color:#334155; max-width: 800px; margin: 0 auto; padding: 20px; } img { max-width: 100%; height: auto; border-radius: 8px; }`,
        branding: false,
        resize: false
    });
}

function closeModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    
    if (window.tinymce && tinymce.get('post-content-editor')) tinymce.get('post-content-editor').remove();

    content.classList.remove('opacity-100', 'scale-100');
    content.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
        if (originalModalClasses) content.className = originalModalClasses;
        if (originalParentClasses) content.parentElement.className = originalParentClasses;
    }, 200);
}

// ==========================================
// 5. SAVE LOGIC
// ==========================================
async function savePost() {
    const id = document.getElementById('post-id').value;
    const btn = document.getElementById('save-post-btn');
    const title = document.getElementById('post-title').value;
    const content = tinymce.get('post-content-editor').getContent();
    
    const authorSelect = document.getElementById('post-author');
    const authorId = authorSelect.value;
    const authorName = authorSelect.options[authorSelect.selectedIndex].text;

    let slug = document.getElementById('post-slug').value;
    if (!slug || slug === 'undefined') slug = createSlug(title);

    const data = {
        title: title,
        slug: slug, 
        category: document.getElementById('post-category').value,
        image: document.getElementById('post-image').value,
        content: content,
        published: document.getElementById('post-status').value === 'true',
        authorId: authorId, 
        author: authorName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: serverTimestamp()
    };

    if (!title) return alert("Please enter a post title.");

    const originalBtn = btn.innerHTML;
    btn.innerHTML = `<span class="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white mr-2"></span> Saving...`;
    btn.disabled = true;

    try {
        if(id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', id), data);
            logAction('Update', `Updated Post: ${title}`);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), data);
            logAction('Create', `Created Post: ${title}`);
        }
        
        await updateSitemap();
        document.getElementById('save-status').innerText = "Saved just now";
        document.getElementById('save-status').className = "text-xs text-emerald-500 font-bold hidden sm:block mr-2";
        
        setTimeout(() => closeModal(), 500);

    } catch(e) {
        alert("Error saving post: " + e.message);
        btn.innerHTML = originalBtn;
        btn.disabled = false;
    }
}
