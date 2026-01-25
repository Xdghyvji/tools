import { auth, onAuthStateChanged } from '../../js/shared.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Import View Modules
import * as DashboardView from './dashboard.js';
import * as AnalyticsView from './analytics.js'; // Added Analytics Import
import * as PostsView from './posts.js';
import * as MessagesView from './messages.js'; // Inbox, Comments, Subscribers
import * as SettingsView from './settings.js'; // Global Settings, Keys, Banners
import * as PromptsView from './prompts.js';   // Dedicated Prompts Module
import * as UsersView from './users.js';       // User Management Module
import * as AutoBloggerView from './auto-blogger.js'; // Added AutoBlogger Import
import * as AuthorsView from './authors.js';   // Added Authors Import

// Route Configuration
// Maps a string ID (from the sidebar) to a specific JS module
const routes = {
    'dashboard': DashboardView,
    'analytics': AnalyticsView, // Added Analytics Route
    'posts': PostsView,
    'inbox': MessagesView,      // Maps 'inbox' view to MessagesView module
    'subscribers': MessagesView,// Maps 'subscribers' view to MessagesView module
    'comments': MessagesView,   // Maps 'comments' view to MessagesView module
    'settings': SettingsView,
    'prompts': PromptsView,     // Route for the Prompts Manager
    'keys': SettingsView,       // Sub-view handled by SettingsView
    'banners': SettingsView,    // Sub-view handled by SettingsView
    'logs': SettingsView,       // Sub-view handled by SettingsView
    'users': UsersView,         // Route for User Management
    'auto-blogger': AutoBloggerView, // Added AutoBlogger Route
    'authors': AuthorsView      // Added Authors Route
};

let currentSubscription = null; // Stores the unsubscribe function for realtime listeners

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    // Show initial loader if it exists
    const loader = document.getElementById('global-loader');
    if(loader) loader.classList.remove('hidden');

    initAuth();
    setupSidebar();
});

/**
 * 1. Authentication & Initial Load
 * Checks if user is logged in via Firebase. If yes, loads dashboard. If no, redirects to login.
 */
function initAuth() {
    const statusBadge = document.getElementById('db-status');
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Admin UI Updates
            if (statusBadge) {
                statusBadge.innerHTML = `<div class="w-2 h-2 rounded-full bg-green-500"></div> Online`;
                statusBadge.className = "flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200";
            }
            const emailEl = document.getElementById('admin-email');
            if(emailEl) emailEl.innerText = user.email || "Admin";
            
            // Hide global loader
            const loader = document.getElementById('global-loader');
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.classList.add('hidden'), 500);
            }

            // Load View from Hash or Default to Dashboard
            const hash = window.location.hash.substring(1);
            loadView(hash || 'dashboard');

        } else {
            // Redirect if not logged in
            // Note: We use /login.html relative to root
            if (!window.location.pathname.includes('login.html')) {
                 window.location.href = '/login.html';
            }
        }
    });

    // Logout Handler
    const logoutBtn = document.getElementById('btn-logout'); // Changed ID to match HTML
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = '/login.html');
        });
    }
}

/**
 * 2. Dynamic View Loader (Router)
 * This function swaps the content of the main area without refreshing.
 * @param {string} viewName - Key from the routes object (e.g., 'dashboard', 'users')
 * @param {string} subType - Optional subtype passed to the module's render function (e.g., 'keys' for Settings)
 */
window.loadView = async function(viewName, subType = null) {
    const mainView = document.getElementById('main-content'); // Changed ID to match HTML
    
    // Fallback if viewName is empty or invalid
    if (!viewName || !routes[viewName]) {
        if(routes['dashboard']) {
             viewName = 'dashboard';
        } else {
             console.error(`Route not found: ${viewName}`);
             if(mainView) mainView.innerHTML = `<div class="p-8 text-center text-red-500">Error: Module ${viewName} not found.</div>`;
             return;
        }
    }

    const module = routes[viewName];

    // Update URL Hash
    window.location.hash = viewName;

    // A. Cleanup: Unsubscribe from previous Firestore listeners to prevent memory leaks/performance issues
    try {
        if (currentSubscription && typeof currentSubscription === 'function') {
            currentSubscription(); 
            currentSubscription = null;
        }
    } catch (e) { 
        console.warn("Cleanup warning:", e); 
    }

    // B. Render: Inject HTML into the main container
    // Some modules (like Settings/Messages) handle multiple sub-views, so we pass the viewName/targetType
    const targetType = subType || viewName;
    
    try {
        if (mainView) {
            mainView.innerHTML = module.render(targetType);
        }
    } catch (e) {
        console.error(`Render Error in ${viewName}:`, e);
        if(mainView) mainView.innerHTML = `<div class="p-8 text-center text-red-500">Error rendering view: ${e.message}</div>`;
        return;
    }

    // C. UI: Update Sidebar Active State
    updateSidebarActiveState(targetType);

    // D. Logic: Initialize module logic (attach listeners, fetch data)
    // The init() function typically returns an unsubscribe function for Firestore
    if (module.init) {
        try {
            // We await init in case it needs to fetch initial data before setting up listeners
            currentSubscription = await module.init(targetType);
        } catch (error) {
            console.error(`Error initializing ${viewName}:`, error);
            if(mainView) mainView.innerHTML += `<div class="p-4 bg-red-900/20 text-red-400 text-sm rounded-lg mt-4 border border-red-900/30">
                <strong>Error loading data:</strong> ${error.message}. <br>
                <span class="text-xs opacity-75">Check your browser console or Firestore security rules.</span>
            </div>`;
        }
    }

    // E. Icons: Re-scan DOM for Lucide icons (crucial for newly injected HTML)
    if(window.lucide) window.lucide.createIcons();
};

/**
 * 3. Sidebar Generator
 * Renders the navigation menu dynamically.
 */
function setupSidebar() {
    const nav = document.getElementById('admin-nav'); // Changed ID to match HTML
    if (!nav) return;
    
    // Menu Configuration matching routes
    const menuItems = [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'analytics', icon: 'bar-chart-2', label: 'Analytics' },
        { id: 'auto-blogger', icon: 'sparkles', label: 'Auto Blogger' },
        { id: 'posts', icon: 'file-text', label: 'Blog Posts' },
        { id: 'authors', icon: 'users', label: 'Authors' }, // Ensure this ID matches route key
        { id: 'prompts', icon: 'terminal', label: 'AI Prompts' },
        { id: 'users', icon: 'users', label: 'User Manager' },
        { divider: true },
        { id: 'inbox', icon: 'inbox', label: 'Inbox', badge: 'inbox-badge' },
        { id: 'subscribers', icon: 'mail', label: 'Subscribers' },
        { id: 'comments', icon: 'message-square', label: 'Comments', badge: 'comment-badge' },
        { divider: true },
        { id: 'banners', icon: 'megaphone', label: 'Ad Banners' },
        { id: 'keys', icon: 'key', label: 'API Keys' },
        { id: 'logs', icon: 'activity', label: 'Audit Logs' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
    ];

    // Render Menu HTML
    nav.innerHTML = menuItems.map(item => {
        if(item.divider) return `<div class="my-2 border-t border-slate-800 mx-2"></div>`;
        return `
            <button onclick="loadView('${item.id}')" id="nav-${item.id}" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                <i data-lucide="${item.icon}" class="w-5 h-5 group-hover:scale-110 transition-transform pointer-events-none"></i> 
                ${item.label}
                ${item.badge ? `<span class="ml-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full hidden shadow-sm" id="${item.badge}">0</span>` : ''}
            </button>
        `;
    }).join('');

    // Re-init icons for sidebar
    if(window.lucide) window.lucide.createIcons();

    // Mobile Sidebar Toggle Logic
    const toggleBtn = document.getElementById('btn-menu'); // Changed ID to match HTML
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            sb.classList.toggle('-translate-x-full'); 
        });
    }
}

/**
 * 4. UI Helper: Active State
 * Highlights the current tab in the sidebar.
 */
function updateSidebarActiveState(id) {
    // Reset all buttons to default state
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-400');
        // Reset icon color inside
        const icon = btn.querySelector('i');
        if(icon) {
            icon.classList.remove('text-white');
            // icon.classList.add('text-slate-400'); // Lucide might reset classes, best to rely on inheritance
        }
    });
    
    // Set active button state
    const active = document.getElementById(`nav-${id}`);
    if(active) {
        active.classList.add('bg-slate-800', 'text-white', 'shadow-md');
        active.classList.remove('text-slate-400');
        const icon = active.querySelector('i');
        if(icon) icon.classList.add('text-white');
    }
}
