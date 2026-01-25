<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Author Profile | DigitalServicesHub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'], heading: ['Plus Jakarta Sans', 'sans-serif'] },
                    colors: { brand: { 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' } }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased flex flex-col min-h-screen">

    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <a href="index.html" class="flex items-center gap-2">
                    <span class="font-heading font-bold text-xl text-slate-900">DSH.</span>
                </a>
                <div class="hidden md:flex gap-8">
                    <a href="index.html" class="text-slate-600 hover:text-brand-600 font-medium transition">Home</a>
                    <a href="blog.html" class="text-slate-600 hover:text-brand-600 font-medium transition">Blog</a>
                    <a href="authors.html" class="text-slate-600 hover:text-brand-600 font-medium transition">All Authors</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="flex-grow">
        
        <div id="loading" class="text-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p class="text-slate-500">Loading profile...</p>
        </div>

        <section id="profile-header" class="bg-white border-b border-slate-200 hidden">
            <div class="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
                <div class="relative inline-block mb-6">
                    <img id="p-image" src="assets/img/default-avatar.png" alt="Profile" class="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-slate-50 shadow-lg">
                    <div class="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-sm" title="Verified Author">
                        <i data-lucide="check" class="w-5 h-5"></i>
                    </div>
                </div>
                
                <h1 id="p-name" class="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-2"></h1>
                <p id="p-role" class="text-brand-600 font-medium text-lg mb-6"></p>
                
                <div class="max-w-2xl mx-auto mb-8">
                    <p id="p-bio" class="text-slate-600 leading-relaxed text-lg"></p>
                </div>

                <div id="p-socials" class="flex justify-center gap-4">
                    </div>
            </div>
        </section>

        <section id="author-posts" class="py-16 hidden">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center gap-3 mb-10 border-b border-slate-200 pb-4">
                    <i data-lucide="pen-tool" class="text-brand-600"></i>
                    <h2 class="text-2xl font-bold text-slate-900">Articles by <span id="p-firstname">Author</span></h2>
                </div>

                <div id="posts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    </div>
                
                <div id="no-posts" class="hidden text-center py-10 bg-slate-100 rounded-xl border border-slate-200 border-dashed">
                    <p class="text-slate-500">This author hasn't published any articles yet.</p>
                </div>
            </div>
        </section>

    </main>

    <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; 2024 DigitalServicesHub. All rights reserved.</p>
        </div>
    </footer>

    <script type="module">
        import { db } from './assets/js/shared.js';
        import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Get Author ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const authorId = urlParams.get('id');

        async function loadAuthorProfile() {
            if (!authorId) {
                window.location.href = 'authors.html';
                return;
            }

            try {
                // 1. Fetch Author Details
                const docRef = doc(db, "authors", authorId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    document.getElementById('loading').innerHTML = `<p class="text-red-500">Author not found.</p>`;
                    return;
                }

                const data = docSnap.data();
                
                // Render Header
                document.title = `${data.name} - Profile | DSH`;
                document.getElementById('p-name').innerText = data.name;
                document.getElementById('p-firstname').innerText = data.name.split(' ')[0];
                document.getElementById('p-role').innerText = data.role || "Content Creator";
                document.getElementById('p-bio').innerText = data.bio || "No bio available.";
                document.getElementById('p-image').src = data.photoURL || 'assets/img/default-avatar.png';

                // Render Socials
                let socialHtml = '';
                if(data.socials) {
                    const s = data.socials;
                    if(s.twitter) socialHtml += `<a href="${s.twitter}" target="_blank" class="p-3 bg-slate-100 rounded-full hover:bg-blue-50 hover:text-blue-500 transition"><i data-lucide="twitter" class="w-5 h-5"></i></a>`;
                    if(s.linkedin) socialHtml += `<a href="${s.linkedin}" target="_blank" class="p-3 bg-slate-100 rounded-full hover:bg-blue-50 hover:text-blue-700 transition"><i data-lucide="linkedin" class="w-5 h-5"></i></a>`;
                    if(s.website) socialHtml += `<a href="${s.website}" target="_blank" class="p-3 bg-slate-100 rounded-full hover:bg-green-50 hover:text-green-600 transition"><i data-lucide="globe" class="w-5 h-5"></i></a>`;
                }
                document.getElementById('p-socials').innerHTML = socialHtml;

                // Show Section
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('profile-header').classList.remove('hidden');
                document.getElementById('author-posts').classList.remove('hidden');

                // 2. Fetch Author's Posts
                await loadAuthorPosts(authorId);

                lucide.createIcons();

            } catch (error) {
                console.error("Error:", error);
            }
        }

        async function loadAuthorPosts(id) {
            const grid = document.getElementById('posts-grid');
            try {
                // Query posts where 'authorId' matches
                const q = query(
                    collection(db, "posts"), 
                    where("authorId", "==", id)
                    // Note: 'orderBy' might require a composite index in Firestore if combined with 'where'
                    // For now, we sort client-side or assume default order to avoid index errors
                );
                
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    document.getElementById('no-posts').classList.remove('hidden');
                    return;
                }

                let html = '';
                querySnapshot.forEach(doc => {
                    const post = doc.data();
                    html += `
                        <article class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group h-full flex flex-col">
                            <a href="single-blog.html?id=${doc.id}" class="block overflow-hidden h-48 relative">
                                <img src="${post.image || 'assets/img/blog-placeholder.jpg'}" alt="${post.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </a>
                            <div class="p-6 flex flex-col flex-1">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">Article</span>
                                    <span class="text-xs text-slate-400">&bull;</span>
                                    <span class="text-xs text-slate-500">${new Date(post.date).toLocaleDateString()}</span>
                                </div>
                                <h3 class="text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-brand-600 transition">
                                    <a href="single-blog.html?id=${doc.id}">${post.title}</a>
                                </h3>
                                <p class="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">${post.excerpt || 'Click to read more...'}</p>
                                <a href="single-blog.html?id=${doc.id}" class="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700">
                                    Read Article <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                                </a>
                            </div>
                        </article>
                    `;
                });

                grid.innerHTML = html;

            } catch (e) {
                console.warn("Error loading posts:", e);
                // If index error occurs, it usually logs a link to create it in the console
            }
        }

        loadAuthorProfile();
    </script>
</body>
</html>
