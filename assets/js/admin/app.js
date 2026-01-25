import { auth, onAuthStateChanged } from '../../js/shared.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Import View Modules
import * as DashboardView from './dashboard.js';
import * as AnalyticsView from './analytics.js';     // [NEW] Analytics Module
import * as PostsView from './posts.js';
import * as AutoBloggerView from './auto-blogger.js'; // [NEW] Auto Blogger Module
import * as MessagesView from './messages.js';       // Inbox, Comments, Subscribers
import * as AuthorsView from './authors.js';         // [NEW] Authors Module
import * as SettingsView from './settings.js';       // Global Settings, Keys, Banners
import * as PromptsView from './prompts.js';         // Dedicated Prompts Module
import * as UsersView from './users.js';             // User Management Module

// Route Configuration
// Maps a string ID (from the sidebar) to a specific JS module
const routes = {
    'dashboard': DashboardView,
    'analytics': AnalyticsView,     // [NEW] Route
    'posts': PostsView,
    'autoblogger': AutoBloggerView, // [NEW] Route
    'inbox': MessagesView,
    'subscribers': MessagesView,
    'comments': MessagesView,
    'settings': SettingsView,
    'prompts': PromptsView,
    'authors': AuthorsView,         // [NEW] Route
    'keys': SettingsView,
    'banners': SettingsView,
    'logs': SettingsView,
    'users': UsersView
};

let currentSubscription = null; // Stores the unsubscribe function for realtime listeners

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
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
            
            // Load Dashboard by default if no specific view is requested
            loadView('dashboard');
        } else {
            // Redirect if not logged in
            window.location.href = "../login.html";
        }
    });

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = '../login.html');
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
    const mainView = document.getElementById('main-view');
    const module = routes[viewName];

    if (!module) {
        console.error(`Route not found: ${viewName}`);
        mainView.innerHTML = `<div class="p-8 text-center text-red-500">Error: Module ${viewName} not found.</div>`;
        return;
    }

    // A. Cleanup: Unsubscribe from previous Firestore listeners
    try {
        if (currentSubscription && typeof currentSubscription === 'function') {
            currentSubscription(); 
            currentSubscription = null;
        }
    } catch (e) { 
        console.warn("Cleanup warning:", e); 
    }

    // B. Render: Inject HTML into the main container
    const targetType = subType || viewName;
    
    try {
        mainView.innerHTML = module.render(targetType);
    } catch (e) {
        console.error(`Render Error in ${viewName}:`, e);
        mainView.innerHTML = `<div class="p-8 text-center text-red-500">Error rendering view: ${e.message}</div>`;
        return;
    }

    // C. UI: Update Sidebar Active State
    updateSidebarActiveState(targetType);

    // D. Logic: Initialize module logic (attach listeners, fetch data)
    if (module.init) {
        try {
            currentSubscription = await module.init(targetType);
        } catch (error) {
            console.error(`Error initializing ${viewName}:`, error);
            mainView.innerHTML += `<div class="p-4 bg-red-50 text-red-600 text-sm rounded-lg mt-4 border border-red-100">
                <strong>Error loading data:</strong> ${error.message}. <br>
                <span class="text-xs opacity-75">Check your browser console or Firestore security rules.</span>
            </div>`;
        }
    }

    // E. Icons: Re-scan DOM for Lucide icons
    if(window.lucide) window.lucide.createIcons();
};

/**
 * 3. Sidebar Generator
 * Renders the navigation menu dynamically.
 */
function setupSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    
    // Menu Configuration
    const menuItems = [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'analytics', icon: 'bar-chart-3', label: 'Analytics' }, // [NEW] Added Analytics
        { id: 'users', icon: 'users', label: 'User Manager' },
        { id: 'authors', icon: 'pen-tool', label: 'Authors' },        // [NEW] Added Authors
        { id: 'inbox', icon: 'inbox', label: 'Inbox', badge: 'inbox-badge' },
        { id: 'subscribers', icon: 'mail', label: 'Subscribers' },
        { divider: true },
        { id: 'autoblogger', icon: 'bot', label: 'Auto Blogger' },    // [NEW] Added Auto Blogger
        { id: 'posts', icon: 'file-text', label: 'Blog Posts' },
        { id: 'prompts', icon: 'terminal', label: 'AI Prompts' },
        { id: 'banners', icon: 'megaphone', label: 'Ad Banners' },
        { id: 'comments', icon: 'message-square', label: 'Comments', badge: 'comment-badge' },
        { divider: true },
        { id: 'keys', icon: 'key', label: 'API Keys' },
        { id: 'logs', icon: 'activity', label: 'Audit Logs' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
    ];

    // Render Menu HTML
    nav.innerHTML = menuItems.map(item => {
        if(item.divider) return `<div class="my-2 border-t border-slate-800 mx-2"></div>`;
        return `
            <button onclick="loadView('${item.id}')" id="nav-${item.id}" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                <i data-lucide="${item.icon}" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> 
                ${item.label}
                ${item.badge ? `<span class="ml-auto bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full hidden shadow-sm" id="${item.badge}">0</span>` : ''}
            </button>
        `;
    }).join('');

    // Mobile Sidebar Toggle Logic
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            sb.classList.toggle('-translate-x-full');
            sb.classList.toggle('absolute');
            sb.classList.toggle('h-full');
        });
    }
}

/**
 * 4. UI Helper: Active State
 * Highlights the current tab in the sidebar.
 */
function updateSidebarActiveState(id) {
    // Reset all buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-300');
        const icon = btn.querySelector('i');
        if(icon) icon.classList.add('text-slate-400');
    });
    
    // Set active button
    const active = document.getElementById(`nav-${id}`);
    if(active) {
        active.classList.add('bg-slate-800', 'text-white', 'shadow-md');
        active.classList.remove('text-slate-300');
        const icon = active.querySelector('i');
        if(icon) icon.classList.remove('text-slate-400');
    }
}
