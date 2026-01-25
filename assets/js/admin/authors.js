import { db, appId } from '../../js/shared.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export function render() {
    return `
    <div class="animate-fade-in space-y-8 pb-24">
        <div class="flex justify-between items-center border-b border-slate-200/60 pb-6">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Author Profiles</h1>
                <p class="text-slate-500 font-medium mt-2">Manage the writers displayed on your blog posts.</p>
            </div>
            <button id="btn-add-author" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-2">
                <i data-lucide="plus" class="w-5 h-5"></i> New Author
            </button>
        </div>

        <!-- Author List -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="authors-grid">
            <!-- Cards injected via JS -->
            <div class="col-span-full py-12 text-center">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-slate-300"></i>
                <p class="text-slate-400 font-bold mt-2">Loading profiles...</p>
            </div>
        </div>

        <!-- Add/Edit Modal (Hidden) -->
        <div id="author-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 class="text-lg font-black text-slate-900" id="modal-title">Create Profile</h3>
                    <button id="btn-close-modal" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <i data-lucide="x" class="w-5 h-5 text-slate-400"></i>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <input type="hidden" id="author-id">
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input type="text" id="author-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Sarah Jenkins">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Title / Role</label>
                        <input type="text" id="author-role" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Senior Tech Editor">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Profile Photo URL</label>
                        <input type="text" id="author-photo" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://...">
                        <p class="text-[10px] text-slate-400 mt-1 font-medium">Tip: Use a square image URL.</p>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Short Bio</label>
                        <textarea id="author-bio" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none" placeholder="Brief description..."></textarea>
                    </div>

                    <button id="btn-save-author" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-2">
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

export async function init() {
    loadAuthors();

    // Event Listeners
    document.getElementById('btn-add-author')?.addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-save-author')?.addEventListener('click', saveAuthor);
    
    // Close on backdrop click
    document.getElementById('author-modal')?.addEventListener('click', (e) => {
        if(e.target === document.getElementById('author-modal')) closeModal();
    });

    if(window.lucide) window.lucide.createIcons();
}

async function loadAuthors() {
    const grid = document.getElementById('authors-grid');
    if(!grid) return;

    try {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'authors'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                        <i data-lucide="users" class="w-8 h-8 text-slate-300"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">No Authors Yet</h3>
                    <p class="text-slate-500 max-w-xs mt-1 mb-6 text-sm font-medium">Create your first author profile to attach to blog posts.</p>
                    <button onclick="document.getElementById('btn-add-author').click()" class="text-blue-600 font-bold hover:underline text-sm">Create Profile</button>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
            return;
        }

        grid.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const author = docSnap.data();
            const id = docSnap.id;
            
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative group hover:border-blue-200 transition-colors";
            card.innerHTML = `
                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100 transition-colors btn-edit" data-id="${id}">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl shadow-sm border border-slate-100 transition-colors btn-delete" data-id="${id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>

                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                        <img src="${author.photo || 'https://ui-avatars.com/api/?name='+author.name+'&background=random'}" 
                             alt="${author.name}" 
                             class="w-full h-full object-cover"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=f1f5f9&color=64748b'">
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 leading-tight">${author.name}</h3>
                        <p class="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">${author.role || 'Writer'}</p>
                    </div>
                </div>
                
                <p class="text-sm font-medium text-slate-500 line-clamp-3 leading-relaxed">
                    ${author.bio || 'No bio available.'}
                </p>
            `;
            
            // Bind events for this card
            card.querySelector('.btn-edit').addEventListener('click', () => openModal(id, author));
            card.querySelector('.btn-delete').addEventListener('click', () => deleteAuthor(id));
            
            grid.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading authors:", e);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500 font-bold">Failed to load authors.</div>`;
    }
    
    if(window.lucide) window.lucide.createIcons();
}

// Modal Logic
function openModal(id = null, data = null) {
    const modal = document.getElementById('author-modal');
    const title = document.getElementById('modal-title');
    
    document.getElementById('author-id').value = id || '';
    document.getElementById('author-name').value = data?.name || '';
    document.getElementById('author-role').value = data?.role || '';
    document.getElementById('author-photo').value = data?.photo || '';
    document.getElementById('author-bio').value = data?.bio || '';
    
    title.innerText = id ? 'Edit Profile' : 'Create Profile';
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('author-modal').classList.add('hidden');
}

async function saveAuthor() {
    const id = document.getElementById('author-id').value;
    const name = document.getElementById('author-name').value;
    const role = document.getElementById('author-role').value;
    const photo = document.getElementById('author-photo').value;
    const bio = document.getElementById('author-bio').value;

    if (!name) return alert("Name is required");

    const btn = document.getElementById('btn-save-author');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        const payload = { name, role, photo, bio, updatedAt: new Date() };
        
        if (id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authors', id), payload);
        } else {
            payload.createdAt = new Date();
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'authors'), payload);
        }
        
        closeModal();
        loadAuthors();
    } catch (e) {
        console.error("Save failed:", e);
        alert("Error saving author.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function deleteAuthor(id) {
    if(!confirm("Delete this author profile?")) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authors', id));
        loadAuthors();
    } catch(e) {
        alert("Delete failed.");
    }
}
