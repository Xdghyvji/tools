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
                        <th class="px-6 py-4">Category</th>
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

// ==========================================
// 2. INITIALIZATION & LISTENERS
// ==========================================
export async function init() {
    try {
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.addEventListener('click', () => openModal());

        const sitemapBtn = document.getElementById('update-sitemap-btn');
        if (sitemapBtn) sitemapBtn.addEventListener('click', () => updateSitemap(true));
    } catch (e) {
        console.error("Error attaching listeners:", e);
    }

    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), (snapshot) => {
        postsData = [];
        snapshot.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));
        postsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const tbody = document.getElementById('posts-table-body');
        if (postsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No posts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = postsData.map(p => `
            <tr class="hover:bg-slate-50 group transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">
                    <a href="/single-blog.html?slug=${p.slug || p.id}" target="_blank" class="hover:text-brand-600 hover:underline flex items-center gap-2">
                        ${p.title} <i data-lucide="external-link" class="w-3 h-3 text-slate-400"></i>
                    </a>
                </td>
                <td class="px-6 py-4"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full border border-slate-200">${p.category}</span></td>
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
        `).join('');

        if(window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openModal(e.target.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id)));
    });

    return unsub;
}

// ==========================================
// 3. CORE LOGIC
// ==========================================
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
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

// --- DYNAMIC SITEMAP GENERATOR ---
// ✅ FIX: Added 'export' so auto-blogger.js can use it
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
                const identifier = d.slug ? `slug=${d.slug}` : `id=${doc.id}`;
                urls.push({ loc: `https://digitalserviceshub.online/single-blog.html?${identifier}`, priority: '0.9' });
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
        if(force && btn) alert("Sitemap updated! Search engines will now see your SEO-friendly links.");

    } catch(e) {
        console.error("Sitemap Error", e);
        if(force) alert("Error updating sitemap: " + e.message);
    } finally {
        if(btn) { 
            btn.innerHTML = `<i data-lucide="map" class="w-4 h-4"></i> Force Update Sitemap`; 
            btn.disabled = false;
            if(window.lucide) window.lucide.createIcons();
        }
    }
}

// ==========================================
// 4. EDITOR MODAL (WYSIWYG)
// ==========================================
function openModal(id = null) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    const post = id ? postsData.find(p => p.id === id) : null;

    content.innerHTML = `
        <div class="flex flex-col h-[90vh]">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                <h3 class="text-xl font-bold text-slate-900">${id ? 'Edit Post' : 'Create New Post'}</h3>
                <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                <input type="hidden" id="post-id" value="${id || ''}">
                <input type="hidden" id="post-slug" value="${post?.slug || ''}">
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2 space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Post Title</label>
                            <input type="text" id="post-title" class="w-full p-3 text-lg font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none shadow-sm" placeholder="Enter an engaging title..." value="${post?.title || ''}">
                            <p class="text-xs text-slate-400 mt-1">Slug: <span id="slug-preview">${post?.slug || 'will-be-generated-automatically'}</span></p>
                        </div>

                        <div class="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                            <div class="flex flex-wrap gap-1 p-2 border-b border-slate-100 bg-slate-50">
                                <button type="button" onclick="document.execCommand('bold')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Bold"><i data-lucide="bold" class="w-4 h-4"></i></button>
                                <button type="button" onclick="document.execCommand('italic')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Italic"><i data-lucide="italic" class="w-4 h-4"></i></button>
                                <button type="button" onclick="document.execCommand('underline')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Underline"><i data-lucide="underline" class="w-4 h-4"></i></button>
                                <div class="w-px h-6 bg-slate-200 mx-1"></div>
                                <button type="button" onclick="document.execCommand('formatBlock', false, '<h2>')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600 font-bold" title="Heading 2">H2</button>
                                <button type="button" onclick="document.execCommand('formatBlock', false, '<h3>')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600 font-bold text-sm" title="Heading 3">H3</button>
                                <div class="w-px h-6 bg-slate-200 mx-1"></div>
                                <button type="button" onclick="document.execCommand('insertUnorderedList')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Bullet List"><i data-lucide="list" class="w-4 h-4"></i></button>
                                <button type="button" onclick="document.execCommand('insertOrderedList')" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Numbered List"><i data-lucide="list-ordered" class="w-4 h-4"></i></button>
                                <div class="w-px h-6 bg-slate-200 mx-1"></div>
                                <button type="button" onclick="promptLink()" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Insert Link"><i data-lucide="link" class="w-4 h-4"></i></button>
                                <button type="button" onclick="promptImage()" class="p-2 hover:bg-white hover:shadow rounded text-slate-600" title="Insert Image"><i data-lucide="image" class="w-4 h-4"></i></button>
                            </div>
                            <div id="post-content-editor" contenteditable="true" class="w-full p-4 min-h-[400px] outline-none prose max-w-none text-slate-700">
                                ${post?.content || '<p>Start writing your amazing content here...</p>'}
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Publishing</label>
                            <select id="post-status" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm mb-3">
                                <option value="true" ${post?.published !== false ? 'selected' : ''}>Published</option>
                                <option value="false" ${post?.published === false ? 'selected' : ''}>Draft</option>
                            </select>
                            <button id="save-post-btn" class="w-full py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30">
                                ${id ? 'Update Post' : 'Publish Post'}
                            </button>
                        </div>

                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                                <select id="post-category" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50">
                                    ${['AI Tools','SEO','YouTube','Instagram','TikTok','Marketing','Updates'].map(c => `<option ${post?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Read Time (min)</label>
                                <input type="number" id="post-readTime" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value="${post?.readTime || '5'}">
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Featured Image</label>
                            <input type="text" id="post-image" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm mb-2" placeholder="https://..." value="${post?.image || ''}">
                            <div class="aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                                <img id="preview-image" src="${post?.image || ''}" class="w-full h-full object-cover ${post?.image ? '' : 'hidden'}" onerror="this.classList.add('hidden')">
                                <span class="text-slate-400 text-xs ${post?.image ? 'hidden' : ''}">Preview</span>
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

    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('save-post-btn').onclick = savePost;

    // Live Slug Preview
    document.getElementById('post-title').addEventListener('input', (e) => {
        document.getElementById('slug-preview').innerText = createSlug(e.target.value);
    });

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

    window.promptLink = () => { const url = prompt("Enter link URL:"); if (url) document.execCommand('createLink', false, url); };
    window.promptImage = () => { const url = prompt("Enter image URL:"); if (url) document.execCommand('insertImage', false, url); };
}

function closeModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('global-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// ==========================================
// 5. SAVE POST LOGIC (With Slug Generation)
// ==========================================
async function savePost() {
    const id = document.getElementById('post-id').value;
    const btn = document.getElementById('save-post-btn');
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content-editor').innerHTML;
    
    // SEO MAGIC: CREATE OR KEEP SLUG
    let slug = document.getElementById('post-slug').value;
    if (!slug || slug === 'undefined') {
        slug = createSlug(title); // Create new slug from title
    }

    const data = {
        title: title,
        slug: slug, 
        category: document.getElementById('post-category').value,
        readTime: document.getElementById('post-readTime').value,
        image: document.getElementById('post-image').value,
        content: content,
        published: document.getElementById('post-status').value === 'true',
        author: "Admin",
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
        
        await updateSitemap(); // This will now use the new slug
        closeModal();
    } catch(e) {
        alert("Error saving post: " + e.message);
        btn.innerText = "Save Post";
        btn.disabled = false;
    }
}
