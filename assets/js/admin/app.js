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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Check Admin Role
            /* // Optional: Strict Admin Check
            const token = await user.getIdTokenResult();
            if(!token.claims.admin) {
                window.location.href = '/login.html';
                return;
            }
            */
            initRouter();
            renderNavigation();
            document.getElementById('admin-email').innerText = user.email;
        } else {
            window.location.href = '/login.html';
        }
    });
}

function initRouter() {
    // Handle Navigation Clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            const view = link.dataset.link;
            loadView(view);
        }
    });

    // Handle Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '/login.html');
    });

    // Mobile Menu Toggle
    const btnMenu = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    if(btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // Load Initial View
    const hash = window.location.hash.substring(1) || 'dashboard';
    loadView(hash);
}

// Global scope for onclick handlers
window.loadView = async function(viewName) {
    const content = document.getElementById('main-content');
    const module = routes[viewName];

    if (module) {
        // Update URL
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

        // Render & Init Module
        content.innerHTML = module.render(viewName);
        if (module.init) await module.init();
        
        // Initialize Icons
        if(window.lucide) window.lucide.createIcons();
    } else {
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
        <a href="#${item.id}" data-link="${item.id}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group">
            <i data-lucide="${item.icon}" class="w-5 h-5 group-hover:scale-110 transition-transform pointer-events-none"></i>
            <span class="font-medium pointer-events-none">${item.label}</span>
        </a>
    `).join('');
}
