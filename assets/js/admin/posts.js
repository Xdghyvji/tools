import { db, appId, auth } from '../shared.js';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. RENDER UI
// ==========================================
export function render() {
    return `
    <div class="animate-fade-in max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Blog Management</h1>
                <p class="text-sm text-slate-500 mt-1">Manage articles, authors, SEO, and static generation.</p>
            </div>
            
            <div class="flex flex-wrap gap-3">
                 <button id="generate-static-btn" class="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm">
                    <i data-lucide="zap" class="w-4 h-4"></i> Generate Static Pages
                </button>

                 <button id="update-sitemap-btn" class="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                    <i data-lucide="map" class="w-4 h-4"></i> Update Sitemap
                </button>
                
                <button id="new-post-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-all flex items-center gap-2 shadow-md shadow-brand-500/20">
                    <i data-lucide="plus" class="w-4 h-4"></i> New Post
                </button>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                        <tr>
                            <th class="px-6 py-4">Article Details</th>
                            <th class="px-6 py-4">Author</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4">Published</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100" id="posts-table-body">
                        <tr><td colspan="5" class="px-6 py-12 text-center text-slate-400">Loading your content...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <div id="gen-modal" class="fixed inset-0 z-[60] hidden flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Generating Static Pages</h3>
            <p class="text-sm text-slate-500 mb-6">Converting database content to static HTML...</p>
            
            <div class="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                <div id="gen-progress-bar" class="bg-indigo-600 h-full w-0 transition-all duration-300"></div>
            </div>
            <p id="gen-status-text" class="text-xs font-bold text-indigo-600">0%</p>
        </div>
    </div>`;
}

let postsData = [];
let authorsList = [];
let originalModalClasses = ""; 
let originalParentClasses = "";

// ==========================================
// 2. INITIALIZATION
// ==========================================
export async function init() {
    try {
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.addEventListener('click', () => openModal());

        const sitemapBtn = document.getElementById('update-sitemap-btn');
        if (sitemapBtn) sitemapBtn.addEventListener('click', () => updateSitemap(true));

        const genBtn = document.getElementById('generate-static-btn');
        if (genBtn) genBtn.addEventListener('click', generateAllStaticPages);
        
        await fetchAuthors();

    } catch (e) {
        console.error("Error attaching listeners:", e);
    }

    // Path: artifacts/{appId}/public/data/posts
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), (snapshot) => {
        postsData = [];
        snapshot.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));
        postsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        const tbody = document.getElementById('posts-table-body');
        if (postsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400">No posts found. Create your first article!</td></tr>`;
            return;
        }

        tbody.innerHTML = postsData.map(p => {
            const authorName = authorsList.find(a => a.id === p.authorId)?.name || p.author || 'Admin';
            const liveLink = `/blog/${p.slug || p.id}`;
            const seoTitle = p.seo?.title ? `<span class="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100 ml-1" title="SEO Title Set">SEO</span>` : '';
            
            return `
            <tr class="hover:bg-slate-50 group transition-colors">
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <a href="${liveLink}" target="_blank" class="font-bold text-slate-900 hover:text-brand-600 hover:underline flex items-center gap-2 mb-1">
                            ${p.title} <i data-lucide="external-link" class="w-3 h-3 text-slate-300 group-hover:text-brand-400"></i>
                        </a>
                        <div class="flex items-center gap-2">
                             <span class="text-xs text-slate-500">${p.category || 'Uncategorized'}</span>
                             ${seoTitle}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                            ${authorName.charAt(0)}
                        </span>
                        <span class="text-sm text-slate-600 font-medium">${authorName}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${p.published !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}">
                        <span class="w-1.5 h-1.5 rounded-full ${p.published !== false ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                        ${p.published !== false ? 'Published' : 'Draft'}
                      </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-500 font-mono">${p.date}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors edit-btn" data-id="${p.id}" title="Edit">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors delete-btn" data-id="${p.id}" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        if(window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.currentTarget.dataset.id)));
    });

    return unsub;
}

// ==========================================
// 3. CORE LOGIC
// ==========================================

async function fetchAuthors() {
    try {
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'authors'));
        authorsList = [];
        snap.forEach(doc => authorsList.push({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Could not fetch authors:", e);
    }
}

// --- GENERATE ALL STATIC PAGES (FIXED FOR 404s & NETWORK ERRORS) ---
async function generateAllStaticPages() {
    const modal = document.getElementById('gen-modal');
    const bar = document.getElementById('gen-progress-bar');
    const status = document.getElementById('gen-status-text');
    const publishedPosts = postsData.filter(p => p.published !== false);
    
    if (publishedPosts.length === 0) return alert("No published posts to generate.");

    modal.classList.remove('hidden');
    let completed = 0;
    const total = publishedPosts.length;
    const baseUrl = window.location.origin;

    for (const post of publishedPosts) {
        try {
            const identifier = post.slug || post.id;
            
            // 1. DELAY: Wait 300ms to prevent network crash
            await new Promise(r => setTimeout(r, 300)); 

            // 2. FORCE GENERATION: Use 'GET' (not HEAD) and 'no-cors'
            await fetch(`${baseUrl}/blog/${identifier}`, { 
                method: 'GET',
                mode: 'no-cors' 
            }); 
            
            // console.log(`Triggered: ${identifier}`);
        } catch (e) {
            console.warn(`Failed to generate ${post.title}`, e);
        }
        
        completed++;
        const percent = Math.round((completed / total) * 100);
        bar.style.width = `${percent}%`;
        status.innerText = `${percent}% (${completed}/${total})`;
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        alert(`Success! Triggered generation for ${total} pages.`);
    }, 500);
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
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

// --- SITEMAP ---
export async function updateSitemap(force = false) {
    const btn = document.getElementById('update-sitemap-btn');
    if(btn) { btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Updating...`; btn.disabled = true; }

    try {
        const q = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'posts'));
        let urls = [];
        const staticPages = [ 'index.html', 'about.html', 'blog.html', 'contact.html', 'subscription.html', 'tiktok.html', 'instagram.html', 'twitter-tools.html', 'email-tools.html', 'blog-tools.html' ];

        staticPages.forEach(page => urls.push({ loc: `https://digitalserviceshub.online/${page}`, priority: '0.8' }));
        
        q.forEach(doc => {
            const d = doc.data();
            if (d.published !== false) {
                const identifier = d.slug || doc.id;
                urls.push({ loc: `https://digitalserviceshub.online/blog/${identifier}`, priority: '0.9' });
            }
        });

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><priority>${u.priority}</priority></url>`).join('')}</urlset>`;

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitemap', 'xml'), { xml: xmlContent, updatedAt: serverTimestamp() });
        if(force && btn) alert("Sitemap updated successfully!");

    } catch(e) { console.error("Sitemap Error", e); } 
    finally { if(btn) { btn.innerHTML = `<i data-lucide="map" class="w-4 h-4"></i> Update Sitemap`; btn.disabled = false; if(window.lucide) window.lucide.createIcons(); } }
}

// ==========================================
// 4. EDITOR MODAL (Full Screen)
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

    // Full Screen Styles
    content.parentElement.className = "absolute inset-0 flex items-center justify-center p-0"; 
    content.className = "bg-white w-full h-full shadow-none rounded-none overflow-hidden flex flex-col transform transition-all opacity-0 scale-95";

    const post = id ? postsData.find(p => p.id === id) : null;
    await loadTinyMCE();

    if(authorsList.length === 0) await fetchAuthors();

    const authorOptions = authorsList.map(a => `<option value="${a.id}" ${post?.authorId === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
    const defaultOption = `<option value="admin" ${!post?.authorId ? 'selected' : ''}>Admin (Me)</option>`;

    // --- SEO VALUES & COUNTERS ---
    const seoTitle = post?.seo?.title || '';
    const seoDesc = post?.seo?.description || '';
    const seoKey = post?.seo?.keywords || '';
    const canonical = post?.seo?.canonical || '';
    const noIndex = post?.seo?.noIndex || false;
    const noFollow = post?.seo?.noFollow || false;
    const schema = post?.seo?.schema || 'Article';

    content.innerHTML = `
        <div class="h-16 px-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 z-20">
            <div class="flex items-center gap-4">
                <button id="close-modal-btn" class="p-2 -ml-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors group">
                    <i data-lucide="arrow-left" class="w-6 h-6"></i>
                </button>
                <div class="h-6 w-px bg-slate-200"></div>
                <h3 class="text-lg font-bold text-slate-900">${id ? 'Edit Article' : 'New Article'}</h3>
                ${id ? '<span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">Live Mode</span>' : ''}
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
            <!-- Main Content -->
            <div class="flex-1 flex flex-col h-full overflow-hidden relative">
                <div class="p-6 pb-2 shrink-0 bg-white">
                    <input type="text" id="post-title" class="w-full text-4xl font-extrabold placeholder-slate-300 border-none outline-none ring-0 p-0 text-slate-900 tracking-tight" placeholder="Article Title (H1)..." value="${post?.title || ''}">
                    <input type="hidden" id="post-id" value="${id || ''}">
                    <input type="hidden" id="post-slug" value="${post?.slug || ''}">
                </div>
                <div class="flex-1 overflow-hidden bg-white relative border-t border-slate-100">
                    <textarea id="post-content-editor" class="w-full h-full border-0 outline-none">${post?.content || ''}</textarea>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="w-80 bg-white border-l border-slate-200 overflow-y-auto shrink-0 z-10 hidden lg:block scrollbar-thin scrollbar-thumb-slate-200">
                <div class="p-5 space-y-6">
                    
                    <!-- Publishing -->
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Publishing</label>
                        <div class="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
                            <button type="button" class="flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-slate-800 transition-all" id="btn-status-pub">Public</button>
                            <button type="button" class="flex-1 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-700 transition-all" id="btn-status-draft">Draft</button>
                        </div>
                        <input type="hidden" id="post-status" value="${post?.published !== false ? 'true' : 'false'}">
                    </div>

                    <!-- Metadata -->
                    <div class="space-y-4 pt-4 border-t border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Metadata</label>
                        <div>
                            <span class="text-xs text-slate-400 mb-1.5 block font-medium">Author</span>
                            <select id="post-author" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all">
                                ${authorOptions || defaultOption}
                            </select>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 mb-1.5 block font-medium">Category</span>
                            <select id="post-category" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all">
                                ${['AI Tools','SEO','YouTube','Instagram','TikTok','Marketing','Updates','Tutorials'].map(c => `<option ${post?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Cover Image -->
                    <div class="pt-4 border-t border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cover Image</label>
                        <div class="space-y-3">
                            <input type="text" id="post-image" class="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" placeholder="https://example.com/image.jpg" value="${post?.image || ''}">
                            <div class="aspect-video bg-slate-50 rounded-lg border border-slate-200 border-dashed flex items-center justify-center overflow-hidden relative group">
                                <img id="preview-image" src="${post?.image || ''}" class="w-full h-full object-cover absolute inset-0 ${post?.image ? '' : 'hidden'}">
                                <div class="text-center p-4 ${post?.image ? 'hidden' : ''}" id="preview-placeholder">
                                    <i data-lucide="image" class="w-6 h-6 text-slate-300 mx-auto mb-1"></i>
                                    <span class="text-[10px] text-slate-400">Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SEO SECTION -->
                    <div class="pt-4 border-t border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            SEO & Social
                            <span class="text-[10px] font-normal text-slate-400 normal-case ml-1">(Search Engine Optimization)</span>
                        </label>
                        <div class="space-y-4">
                            <!-- SEO Title -->
                            <div>
                                <div class="flex justify-between items-center mb-1.5">
                                    <span class="text-xs text-slate-400 block font-medium">Meta Title</span>
                                    <span id="title-count" class="text-[10px] text-slate-400">0/60</span>
                                </div>
                                <input type="text" id="post-seo-title" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value="${seoTitle}" placeholder="Page title in search results">
                            </div>

                            <!-- Meta Description -->
                            <div>
                                <div class="flex justify-between items-center mb-1.5">
                                    <span class="text-xs text-slate-400 block font-medium">Meta Description</span>
                                    <span id="desc-count" class="text-[10px] text-slate-400">0/160</span>
                                </div>
                                <textarea id="post-seo-desc" rows="3" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none" placeholder="Brief summary for search snippets...">${seoDesc}</textarea>
                            </div>

                            <!-- Keywords -->
                            <div>
                                <span class="text-xs text-slate-400 mb-1.5 block font-medium">Keywords <span class="text-slate-300 font-normal">(Comma separated)</span></span>
                                <input type="text" id="post-seo-keywords" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value="${seoKey}" placeholder="e.g. ai, marketing, seo">
                            </div>

                            <!-- Canonical URL -->
                            <div>
                                <span class="text-xs text-slate-400 mb-1.5 block font-medium">Canonical URL <span class="text-slate-300 font-normal">(Optional)</span></span>
                                <input type="text" id="post-seo-canonical" class="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value="${canonical}" placeholder="https://...">
                            </div>

                             <!-- Robots -->
                            <div class="grid grid-cols-2 gap-3">
                                 <div>
                                    <span class="text-xs text-slate-400 mb-1.5 block font-medium">Indexing</span>
                                    <select id="post-seo-index" class="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none">
                                        <option value="index" ${!noIndex ? 'selected' : ''}>Index</option>
                                        <option value="noindex" ${noIndex ? 'selected' : ''}>No Index</option>
                                    </select>
                                 </div>
                                 <div>
                                    <span class="text-xs text-slate-400 mb-1.5 block font-medium">Following</span>
                                     <select id="post-seo-follow" class="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none">
                                        <option value="follow" ${!noFollow ? 'selected' : ''}>Follow</option>
                                        <option value="nofollow" ${noFollow ? 'selected' : ''}>No Follow</option>
                                    </select>
                                 </div>
                            </div>
                            
                             <!-- Schema Type -->
                             <div>
                                <span class="text-xs text-slate-400 mb-1.5 block font-medium">Schema Type</span>
                                <select id="post-seo-schema" class="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none">
                                    <option value="Article" ${schema === 'Article' ? 'selected' : ''}>Article</option>
                                    <option value="BlogPosting" ${schema === 'BlogPosting' ? 'selected' : ''}>Blog Posting</option>
                                    <option value="NewsArticle" ${schema === 'NewsArticle' ? 'selected' : ''}>News Article</option>
                                </select>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('opacity-0', 'scale-95'); content.classList.add('opacity-100', 'scale-100'); }, 50);

    if(window.lucide) window.lucide.createIcons();
    initTinyMCE(); 

    // Listeners
    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('save-post-btn').onclick = savePost;
    
    // SEO Char Counters
    const updateCount = (id, target, max) => {
        const el = document.getElementById(id);
        const count = document.getElementById(target);
        if(el && count) {
            const len = el.value.length;
            count.innerText = `${len}/${max}`;
            if(len > max) count.classList.add('text-red-500'); else count.classList.remove('text-red-500');
        }
    }
    
    const titleInput = document.getElementById('post-seo-title');
    const descInput = document.getElementById('post-seo-desc');
    
    if(titleInput) {
        updateCount('post-seo-title', 'title-count', 60);
        titleInput.addEventListener('input', () => updateCount('post-seo-title', 'title-count', 60));
    }
    if(descInput) {
        updateCount('post-seo-desc', 'desc-count', 160);
        descInput.addEventListener('input', () => updateCount('post-seo-desc', 'desc-count', 160));
    }


    // Status UI Toggle
    const btnPub = document.getElementById('btn-status-pub');
    const btnDraft = document.getElementById('btn-status-draft');
    const inputStatus = document.getElementById('post-status');
    const updateStatusUI = (isPub) => {
        if(isPub) {
            btnPub.className = "flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-emerald-600 border border-slate-200";
            btnDraft.className = "flex-1 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-slate-600";
            inputStatus.value = "true";
        } else {
            btnPub.className = "flex-1 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-slate-600";
            btnDraft.className = "flex-1 py-1.5 text-xs font-bold rounded-md shadow-sm bg-white text-amber-600 border border-slate-200";
            inputStatus.value = "false";
        }
    };
    updateStatusUI(inputStatus.value === 'true');
    btnPub.onclick = () => updateStatusUI(true);
    btnDraft.onclick = () => updateStatusUI(false);

    // Image Preview
    document.getElementById('post-image').addEventListener('input', (e) => {
        const img = document.getElementById('preview-image');
        const ph = document.getElementById('preview-placeholder');
        if(e.target.value) { img.src = e.target.value; img.classList.remove('hidden'); ph.classList.add('hidden'); }
        else { img.classList.add('hidden'); ph.classList.remove('hidden'); }
    });
}

function initTinyMCE() {
    if (tinymce.get('post-content-editor')) tinymce.get('post-content-editor').remove();
    tinymce.init({
        selector: '#post-content-editor',
        height: "100%", 
        menubar: false,
        statusbar: false,
        plugins: [ 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount' ],
        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | link image media table | code fullscreen',
        content_style: `body { font-family:Inter,sans-serif; font-size:17px; line-height:1.7; color:#334155; max-width: 800px; margin: 0 auto; padding: 20px; } img { max-width: 100%; height: auto; border-radius: 8px; } blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #64748b; font-style: italic; }`,
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

    // --- GATHER SEO DATA ---
    const seoData = {
        title: document.getElementById('post-seo-title').value.trim() || title, // Fallback to main title
        description: document.getElementById('post-seo-desc').value.trim(),
        keywords: document.getElementById('post-seo-keywords').value.trim(),
        canonical: document.getElementById('post-seo-canonical').value.trim(),
        noIndex: document.getElementById('post-seo-index').value === 'noindex',
        noFollow: document.getElementById('post-seo-follow').value === 'nofollow',
        schema: document.getElementById('post-seo-schema').value || 'Article'
    };

    const data = {
        title: title,
        slug: slug, 
        category: document.getElementById('post-category').value,
        image: document.getElementById('post-image').value,
        content: content,
        published: document.getElementById('post-status').value === 'true',
        authorId: authorId, 
        author: authorName,
        seo: seoData, // <--- SAVING SEO DATA HERE
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

        document.getElementById('save-status').innerText = "Saved successfully";
        document.getElementById('save-status').className = "text-xs text-emerald-600 font-bold hidden sm:block mr-2";
        
        setTimeout(() => closeModal(), 500);

    } catch(e) {
        alert("Error saving post: " + e.message);
        btn.innerHTML = originalBtn;
        btn.disabled = false;
    }
}
