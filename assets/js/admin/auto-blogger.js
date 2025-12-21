import { db, appId, auth } from '../shared.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { updateSitemap } from './posts.js'; 

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
let isGenerating = false;
const LOG_CONTAINER_ID = 'generation-logs';
const STORAGE_KEY = 'dsh_auto_blogger_state'; // Key for LocalStorage

const LINK_MAP = {
    "TikTok": "/tiktok.html",
    "Instagram": "/instagram.html",
    "Email Extractor": "/email-tools.html",
    "Blog Writer": "/blog-tools.html",
    "SEO Tools": "/blog-tools.html",
    "Twitter": "/twitter-tools.html",
    "Pricing": "/subscription.html",
    "Contact": "/contact.html"
};

// ==========================================
// 2. RENDER UI
// ==========================================
export function render() {
    return `
    <div class="animate-fade-in max-w-4xl mx-auto">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-slate-900 mb-2">AI Auto-Blogger (Enterprise)</h1>
            <p class="text-slate-500">Generates 3,000+ word articles with <strong>Auto-Resume</strong> and <strong>Anti-Crash</strong> technology.</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div id="resume-alert" class="hidden mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <h4 class="font-bold text-amber-800">Unfinished Post Detected</h4>
                    <p class="text-sm text-amber-700">Found a saved session. Do you want to continue where you left off?</p>
                </div>
                <div class="flex gap-2">
                    <button id="discard-btn" class="px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 rounded">Discard</button>
                    <button id="resume-btn" class="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded shadow-sm">Resume</button>
                </div>
            </div>

            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Topic / Keyword</label>
                    <input type="text" id="auto-topic" class="w-full p-3 border border-slate-200 rounded-lg text-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g., The Future of Affiliate Marketing in 2025">
                </div>

                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Featured Image URL</label>
                    <input type="text" id="auto-image" class="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="https://source.unsplash.com/...">
                </div>

                <button id="start-auto-btn" class="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-3">
                    <i data-lucide="sparkles" class="w-6 h-6"></i> Start Autonomous Agent
                </button>

                <div class="mt-8 bg-slate-900 rounded-xl p-6 font-mono text-sm text-green-400 h-96 overflow-y-auto shadow-inner" id="console-window">
                    <div class="text-slate-500 italic mb-2">// Agent logs will appear here...</div>
                    <div id="${LOG_CONTAINER_ID}" class="space-y-2"></div>
                </div>
            </div>
        </div>
    </div>`;
}

// ==========================================
// 3. LOGIC & EVENTS
// ==========================================
export function init() {
    const startBtn = document.getElementById('start-auto-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const discardBtn = document.getElementById('discard-btn');

    if (startBtn) startBtn.addEventListener('click', () => startGeneration(false));
    if (resumeBtn) resumeBtn.addEventListener('click', () => startGeneration(true));
    if (discardBtn) discardBtn.addEventListener('click', clearState);

    // Check for saved state
    checkForSavedState();
    
    if(window.lucide) window.lucide.createIcons();
}

function checkForSavedState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const alert = document.getElementById('resume-alert');
    const topicInput = document.getElementById('auto-topic');
    const imageInput = document.getElementById('auto-image');

    if (saved) {
        const state = JSON.parse(saved);
        alert.classList.remove('hidden');
        if(topicInput) topicInput.value = state.topic;
        if(imageInput) imageInput.value = state.image;
        log(`📂 Found saved progress: ${state.progress}/${state.chapters.length} chapters completed.`, 'orange');
    } else {
        alert.classList.add('hidden');
    }
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('resume-alert').classList.add('hidden');
    document.getElementById('auto-topic').value = '';
    document.getElementById('auto-image').value = '';
    clearLogs();
    log("🗑️ Saved state discarded.", 'orange');
}

async function startGeneration(isResuming = false) {
    if (isGenerating) return;
    
    const topic = document.getElementById('auto-topic').value;
    const image = document.getElementById('auto-image').value;
    
    if (!topic || !image) return alert("Please provide both a Topic and an Image URL.");

    isGenerating = true;
    toggleUI(true);
    
    if (!isResuming) clearLogs();

    // STATE VARIABLES
    let chapters = [];
    let fullHtmlContent = "";
    let currentChapterIndex = 0;

    try {
        if (isResuming) {
            // LOAD STATE
            const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
            chapters = state.chapters;
            fullHtmlContent = state.fullHtmlContent;
            currentChapterIndex = state.progress;
            log(`🔄 Resuming from Chapter ${currentChapterIndex + 1}...`, 'blue');
        } else {
            // FRESH START
            log("🚀 Initializing Auto-Blogger Agent v3.0 (Enterprise)...");
            log(`🎯 Target Topic: "${topic}"`);

            // STEP 1: GENERATE OUTLINE
            log("🧠 Phase 1: Architecting Outline (10 Chapters)...");
            const outline = await callAIWithRetry(`Create a comprehensive 10-chapter outline for a 3000-word blog post about "${topic}". Return ONLY a JSON array of strings. Example: ["Chapter 1: Title", "Chapter 2: Title"]`);
            chapters = parseJSON(outline);
            
            if (!chapters || chapters.length < 5) throw new Error("Failed to generate valid outline.");
            log(`✅ Outline Approved: ${chapters.length} Chapters locked in.`);

            // INTRO
            log("✍️ Phase 2: Writing Introduction...");
            const intro = await callAIWithRetry(`Write a powerful, hook-filled HTML introduction (approx 300 words) for a guide about "${topic}". Use <h1> for the main title (create a catchy one) and <p class="lead"> for the opening paragraph. Do not include <html> or <body> tags.`);
            fullHtmlContent += intro;
        }

        // STEP 2: WRITE CHAPTERS (The Loop)
        for (let i = currentChapterIndex; i < chapters.length; i++) {
            const chapter = chapters[i];
            log(`✍️ Phase 2 (${i+1}/${chapters.length}): Writing "${chapter}"...`);
            
            const prompt = `
                Write a detailed, high-value blog section (approx 450 words) for the chapter: "${chapter}".
                Context: This is part of a guide about "${topic}".
                Format: Use <h2> for the chapter title. Use <p>, <ul>, <li>, <strong>.
                Style: Professional, authoritative, data-driven. Include 1 external link reference if relevant.
                Output: HTML only. No markdown.
            `;
            
            const content = await callAIWithRetry(prompt);
            fullHtmlContent += `\n${content}\n`;
            
            // SAVE STATE
            const state = {
                topic,
                image,
                chapters,
                fullHtmlContent,
                progress: i + 1
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            
            // DELAY: Wait 10 seconds to be safe
            await new Promise(r => setTimeout(r, 10000)); 
        }

        // CONCLUSION
        log("✍️ Phase 2: Writing Conclusion...");
        const conclusion = await callAIWithRetry(`Write a motivating conclusion for the article "${topic}". Summarize key points and end with a Call to Action to check out the "Digital Services Hub Tools". Format in HTML.`);
        fullHtmlContent += conclusion;

        // STEP 3: SEO METADATA
        log("🔍 Phase 3: Generating SEO Metadata...");
        const metaJson = await callAIWithRetry(`
            Based on the topic "${topic}", generate:
            1. A catchy Title (max 60 chars).
            2. An engaging Excerpt (max 160 chars).
            3. A SEO-friendly Slug (kebab-case).
            Return JSON: { "title": "...", "excerpt": "...", "slug": "..." }
        `);
        const meta = parseJSON(metaJson);

        // STEP 4: SMART LINKING & SCHEMA
        log("🔗 Phase 4: Injecting Internal Links & Schema...");
        const finalContent = processSEO(fullHtmlContent, meta);

        // STEP 5: UPLOAD
        log("💾 Phase 5: Saving to Firestore...");
        const postData = {
            title: meta.title,
            slug: meta.slug,
            category: "AI Generated", 
            readTime: "30", 
            image: image,
            excerpt: meta.excerpt,
            content: finalContent,
            published: true,
            author: "AI Editor",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), postData);
        await updateSitemap();
        
        // CLEAR STATE ON SUCCESS
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('resume-alert').classList.add('hidden');

        log("✨ SUCCESS! Post Published Successfully.");
        alert("Blog Post Generated & Published!");

    } catch (error) {
        log(`❌ ERROR: ${error.message}`, 'red');
        console.error(error);
        
        // On error, we DO NOT clear local storage so user can resume
        log("💾 Progress saved locally. Refresh page to Resume.", 'orange');
    } finally {
        isGenerating = false;
        toggleUI(false);
    }
}

// ==========================================
// 4. ROBUST API CALLER (65s Cool-Down)
// ==========================================
async function callAIWithRetry(prompt) {
    const MAX_RETRIES = 5; 
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const response = await fetch('/.netlify/functions/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();

            // Success
            if (response.ok) {
                let text = data.text;
                text = text.replace(/```html/g, '').replace(/```json/g, '').replace(/```/g, '');
                return text.trim();
            }

            // Server Busy
            if (response.status === 503 || response.status === 429) {
                throw new Error("Server busy");
            }

            throw new Error(data.error || "AI API Failed");

        } catch (e) {
            attempt++;
            
            // RETRY LOGIC
            if (e.message.includes("Server busy") || e.message.includes("Failed to fetch")) {
                if (attempt >= MAX_RETRIES) throw new Error("Max retries exceeded. API exhausted.");
                
                // CRITICAL FIX: Wait 65 seconds to clear 1-minute quota limits
                const waitTime = 65000; 
                log(`⚠️ API Limit Hit. Cooling down for 65s... (Attempt ${attempt}/${MAX_RETRIES})`, 'orange');
                
                await new Promise(r => setTimeout(r, waitTime));
            } else {
                throw e; // Fatal error
            }
        }
    }
}

function processSEO(html, meta) {
    let processed = html;
    Object.keys(LINK_MAP).forEach(keyword => {
        const regex = new RegExp(`(${keyword})(?![^<]*>|[^<>]*<\/a>)`, 'gi');
        processed = processed.replace(regex, `<a href="${LINK_MAP[keyword]}" class="text-brand-600 font-bold hover:underline">$1</a>`);
    });

    const schema = {
        "@context": "[https://schema.org](https://schema.org)",
        "@type": "BlogPosting",
        "headline": meta.title,
        "description": meta.excerpt,
        "datePublished": new Date().toISOString(),
        "author": { "@type": "Organization", "name": "DigitalServicesHub" }
    };
    
    return `${processed}\n<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`;
}

function parseJSON(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        return null;
    }
}

function log(msg, color = 'green') {
    const container = document.getElementById(LOG_CONTAINER_ID);
    const div = document.createElement('div');
    const colorCode = color === 'red' ? '#ef4444' : (color === 'orange' ? '#f59e0b' : (color === 'blue' ? '#3b82f6' : '#4ade80'));
    
    div.innerHTML = `<span class="opacity-50 mr-2">[${new Date().toLocaleTimeString()}]</span> <span style="color:${colorCode}">${msg}</span>`;
    container.appendChild(div);
    const window = document.getElementById('console-window');
    window.scrollTop = window.scrollHeight;
}

function clearLogs() {
    document.getElementById(LOG_CONTAINER_ID).innerHTML = '';
}

function toggleUI(disabled) {
    const btn = document.getElementById('start-auto-btn');
    if(btn) {
        btn.disabled = disabled;
        btn.innerHTML = disabled ? `<i class="animate-spin" data-lucide="loader-2"></i> Working... (Do not close tab)` : `<i data-lucide="sparkles"></i> Start Autonomous Agent`;
    }
}
