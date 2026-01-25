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

// ==========================================
// 2. INITIALIZATION & LISTENERS
// ==========================================
export async function init() {
    try {
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.addEventListener('click', () => openModal());

        const sitemapBtn = document.getElementById('update-sitemap-btn');
        if (sitemapBtn) sitemapBtn.addEventListener('click', () => updateSitemap(true));
        
        // Pre-fetch authors for the dropdown
        await fetchAuthors();

    } catch (e) {
        console.error("Error attaching listeners:", e);
    }

    // Real-time Posts Listener
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
        // Fetch from Root Authors collection
        const snap = await getDocs(collection(db, 'authors'));
        authorsList = [];
        snap.forEach(doc => authorsList.push({ id: doc.id, ...doc.data() }));
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

// --- SEO: URL SLUG GENERATOR ---
function createSlug(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

// --- DYNAMIC SITEMAP GENERATOR ---
export async function updateSitemap(force = false) {
    const btn = document.getElementById('update-sitemap-btn');
    if(btn) { btn.innerText = "Updating..."; btn.disabled = true; }

    try {
        const q = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'posts'));
        let urls = [];
        
        const staticPages = [
            'index.html', 'about.html', 'blog.html', 'contact.html', 
            'subscription.html', 'tiktok.html', 'instagram.html',
            'twitter-tools.html', 'email-tools.html', 'blog-tools.html'
        ];

        staticPages.forEach(page => {
            urls.push({ loc: `https://digitalserviceshub.online/${page}`, priority: '0.8' });
        });

        q.forEach(doc => {
            const d = doc.data();
            if (d.published !== false) {
                // Use ID to match single-blog.html logic
                urls.push({ loc: `https://digitalserviceshub.online/single-blog.html?id=${doc.id}`, priority: '0.9' });
            }
        });

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitemap', 'xml'), { 
            xml: xmlContent, 
            updatedAt: serverTimestamp() 
        });

        console.log("Sitemap Updated Successfully!");
        if(force && btn) alert("Sitemap updated!");

    } catch(e) {
        console.error("Sitemap Error", e);
        if(force) alert("Error updating sitemap");
    } finally {
        if(btn) { 
            btn.innerHTML = `<i data-lucide="map" class="w-4 h-4"></i> Force Update Sitemap`; 
            btn.disabled = false;
            if(window.lucide) window.lucide.createIcons();
        }
    }
}

// ==========================================
// 4. EDITOR MODAL (TinyMCE)
// ==========================================

// Helper: Lazy Load TinyMCE
async function loadTinyMCE() {
    if (window.tinymce) return;
    return new Promise((resolve) => {
        const script = document.createElement('script');
        // Using generic no-api-key CDN (works for basic use, might show banner)
        script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
        script.referrerPolicy = "origin";
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

async function openModal(id = null) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    const post = id ? postsData.find(p => p.id === id) : null;

    // Ensure TinyMCE is loaded
    await loadTinyMCE();

    // Generate Author Options
    const authorOptions = authorsList.map(a => 
        `<option value="${a.id}" ${post?.authorId === a.id ? 'selected' : ''}>${a.name}</option>`
    ).join('');

    // Default "Admin" if no authors found
    const defaultOption = `<option value="admin" ${!post?.authorId ? 'selected' : ''}>Admin (Me)</option>`;

    content.innerHTML = `
        <div class="flex flex-col h-[90vh]">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Edit Post' : 'Create New Post'}</h3>
                <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                <input type="hidden" id="post-id" value="${id || ''}">
                <input type="hidden" id="post-slug" value="${post?.slug || ''}">
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="md:col-span-3 space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Post Title</label>
                            <input type="text" id="post-title" class="w-full p-3 text-lg font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none shadow-sm" placeholder="Enter an engaging title..." value="${post?.title || ''}">
                        </div>

                        <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <textarea id="post-content-editor" class="w-full h-[500px]">${post?.content || ''}</textarea>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm sticky top-0">
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Publishing</label>
                            <select id="post-status" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm mb-3">
                                <option value="true" ${post?.published !== false ? 'selected' : ''}>Published</option>
                                <option value="false" ${post?.published === false ? 'selected' : ''}>Draft</option>
                            </select>
                            <button id="save-post-btn" class="w-full py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 mb-3">
                                ${id ? 'Update Post' : 'Publish Post'}
                            </button>
                            <p class="text-xs text-center text-slate-400">Autosaves are off</p>
                        </div>

                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author</label>
                                <select id="post-author" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50">
                                    ${authorOptions || defaultOption}
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                                <select id="post-category" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50">
                                    ${['AI Tools','SEO','YouTube','Instagram','TikTok','Marketing','Updates'].map(c => `<option ${post?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Featured Image URL</label>
                                <input type="text" id="post-image" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https://..." value="${post?.image || ''}">
                                <div class="aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                                    <img id="preview-image" src="${post?.image || ''}" class="w-full h-full object-cover ${post?.image ? '' : 'hidden'}" onerror="this.classList.add('hidden')">
                                    <span class="text-slate-400 text-xs ${post?.image ? 'hidden' : ''}">Image Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
    if(window.lucide) window.lucide.createIcons();

    // Initialize TinyMCE
    initTinyMCE();

    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('save-post-btn').onclick = savePost;

    // Image Preview Logic
    document.getElementById('post-image').addEventListener('input', (e) => {
        const img = document.getElementById('preview-image');
        const span = img.nextElementSibling;
        if(e.target.value) {
            img.src = e.target.value;
            img.classList.remove('hidden');
            span.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            span.classList.remove('hidden');
        }
    });
}

function initTinyMCE() {
    // Remove existing if any
    if (tinymce.get('post-content-editor')) {
        tinymce.get('post-content-editor').remove();
    }

    tinymce.init({
        selector: '#post-content-editor',
        height: 500,
        menubar: true,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | code | image media link',
        content_style: 'body { font-family:Inter,sans-serif; font-size:16px; color:#334155 }',
        branding: false,
        promotion: false // Hides "Upgrade" button
    });
}

function closeModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    
    // Destroy Editor to prevent leaks
    if (window.tinymce && tinymce.get('post-content-editor')) {
        tinymce.get('post-content-editor').remove();
    }

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// ==========================================
// 5. SAVE POST LOGIC
// ==========================================
async function savePost() {
    const id = document.getElementById('post-id').value;
    const btn = document.getElementById('save-post-btn');
    const title = document.getElementById('post-title').value;
    
    // Get Content from TinyMCE
    const content = tinymce.get('post-content-editor').getContent();
    
    // Get Author
    const authorSelect = document.getElementById('post-author');
    const authorId = authorSelect.value;
    const authorName = authorSelect.options[authorSelect.selectedIndex].text;

    let slug = document.getElementById('post-slug').value;
    if (!slug || slug === 'undefined') {
        slug = createSlug(title);
    }

    const data = {
        title: title,
        slug: slug, 
        category: document.getElementById('post-category').value,
        image: document.getElementById('post-image').value,
        content: content,
        published: document.getElementById('post-status').value === 'true',
        authorId: authorId, // Save ID for linking
        author: authorName, // Save Name for quick display
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: serverTimestamp()
    };

    if (!title) return alert("Please enter a post title.");

    btn.innerText = "Saving...";
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
        closeModal();
    } catch(e) {
        alert("Error saving post: " + e.message);
        btn.innerText = "Save Post";
        btn.disabled = false;
    }
}
