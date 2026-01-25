import { auth, db } from '../../js/shared.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Import Modules
import * as Dashboard from './dashboard.js';
import * as Analytics from './analytics.js';
import * as Posts from './posts.js';
import * as Messages from './messages.js';
import * as Prompts from './prompts.js';
import * as Users from './users.js';
import * as Settings from './settings.js';
import * as AutoBlogger from './auto-blogger.js';
import * as Authors from './authors.js';

const routes = {
    'dashboard': Dashboard,
    'analytics': Analytics,
    'posts': Posts,
    'messages': Messages,
    'prompts': Prompts,
    'users': Users,
    'settings': Settings,
    'auto-blogger': AutoBlogger,
    'authors': Authors
};

let currentUser = null;
let isRouterInitialized = false;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function startApp() {
    console.log("App starting...");
    // Show initial loader if it exists
    const loader = document.getElementById('global-loader');
    if(loader) loader.classList.remove('hidden');
    
    initAuth();
}

function initAuth() {
    console.log("Initializing Auth Listener...");
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User authenticated:", user.email);
            currentUser = user;
            
            // Render basic layout parts that depend on auth
            renderNavigation();
            const emailEl = document.getElementById('admin-email');
            if (emailEl) emailEl.innerText = user.email;

            // Initialize routing *after* auth is confirmed
            if (!isRouterInitialized) {
                initRouter();
                isRouterInitialized = true;
            }
            
            // Hide global loader if it exists
            const loader = document.getElementById('global-loader');
            if(loader) loader.classList.add('hidden');

        } else {
            console.log("User not authenticated.");
            // Not authenticated, redirect to login
            if (!window.location.pathname.includes('login.html')) {
                 window.location.href = '/login.html';
            }
        }
    });
}

function initRouter() {
    console.log("Initializing Router...");
    
    // Handle Navigation Clicks via Event Delegation
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            const view = link.dataset.link;
            console.log("Navigating to:", view);
            loadView(view);
        }
    });

    // Handle Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = '/login.html');
        });
    }

    // Mobile Menu Toggle
    const btnMenu = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    if(btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // Load Initial View based on Hash
    const hash = window.location.hash.substring(1) || 'dashboard';
    loadView(hash);
}

// Global scope for onclick handlers
window.loadView = async function(viewName) {
    console.log("Loading View:", viewName);
    const content = document.getElementById('main-content');
    if (!content) {
        console.error("Critical Error: 'main-content' element not found in DOM.");
        return;
    }

    const module = routes[viewName];

    if (module) {
        // Update URL Hash
        window.location.hash = viewName;

        // Update Active Nav State
        document.querySelectorAll('[data-link]').forEach(el => {
            if(el.dataset.link === viewName) {
                el.classList.add('bg-slate-800', 'text-white');
                el.classList.remove('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            } else {
                el.classList.remove('bg-slate-800', 'text-white');
                el.classList.add('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            }
        });

        // Show a local loader in content area while fetching module
        content.innerHTML = `
            <div class="flex items-center justify-center h-full min-h-[400px]">
                <div class="flex flex-col items-center gap-4">
                    <i data-lucide="loader-2" class="w-10 h-10 animate-spin text-brand-500"></i>
                    <p class="text-slate-400 font-medium">Loading ${viewName}...</p>
                </div>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();

        // Render & Init Module
        try {
            // 1. Render HTML
            console.log(`Rendering ${viewName}...`);
            const html = module.render(viewName);
            content.innerHTML = html;
            
            // 2. Initialize Logic with Timeout Safety
            if (module.init) {
                console.log(`Initializing ${viewName}...`);
                
                // Timeout promise to prevent infinite hanging
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Module initialization timed out (5s)")), 5000)
                );

                // Race the module init against the timeout
                await Promise.race([module.init(), timeout]);
                console.log(`${viewName} initialized successfully.`);
            }
            
            // 3. Re-initialize Icons
            if(window.lucide) window.lucide.createIcons();
            
        } catch (error) {
            console.error(`Error loading module ${viewName}:`, error);
            content.innerHTML = `
                <div class="p-10 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800">Error Loading Module</h3>
                    <p class="text-slate-500 mt-2">${error.message}</p>
                    <button onclick="loadView('${viewName}')" class="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Retry</button>
                </div>
            `;
            if(window.lucide) window.lucide.createIcons();
        }
    } else {
        console.warn(`Module not found: ${viewName}`);
        content.innerHTML = `<div class="p-10 text-center text-slate-400">Module not found: ${viewName}</div>`;
    }
};

function renderNavigation() {
    const nav = document.getElementById('admin-nav');
    if(!nav) return;

    const items = [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'analytics', icon: 'bar-chart-2', label: 'Analytics' },
        { id: 'auto-blogger', icon: 'sparkles', label: 'Auto Blogger' },
        { id: 'posts', icon: 'file-text', label: 'Blog Posts' },
        { id: 'authors', icon: 'users', label: 'Authors' },
        { id: 'prompts', icon: 'terminal', label: 'AI Prompts' },
        { id: 'messages', icon: 'message-square', label: 'Messages' },
        { id: 'users', icon: 'users', label: 'Users' },
        { id: 'settings', icon: 'settings', label: 'Settings' }
    ];

    nav.innerHTML = items.map(item => `
        <a href="#${item.id}" data-link="${item.id}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group cursor-pointer">
            <i data-lucide="${item.icon}" class="w-5 h-5 group-hover:scale-110 transition-transform pointer-events-none"></i>
            <span class="font-medium pointer-events-none">${item.label}</span>
        </a>
    `).join('');
    
    if(window.lucide) window.lucide.createIcons();
}
