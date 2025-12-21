import { db, appId, auth } from '../shared.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { updateSitemap } from './posts.js'; // Reuse sitemap logic if exported, otherwise we'll handle it locally

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
let isGenerating = false;
const LOG_CONTAINER_ID = 'generation-logs';

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
            <h1 class="text-3xl font-bold text-slate-900 mb-2">AI Auto-Blogger (Pro)</h1>
            <p class="text-slate-500">Generates 3,000+ word, SEO-optimized articles autonomously using a multi-agent workflow.</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
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
    const btn = document.getElementById('start-auto-btn');
    if (btn) btn.addEventListener('click', startGeneration);
    if(window.lucide) window.lucide.createIcons();
}

async function startGeneration() {
    if (isGenerating) return;
    
    const topic = document.getElementById('auto-topic').value;
    const image = document.getElementById('auto-image').value;
    
    if (!topic || !image) return alert("Please provide both a Topic and an Image URL.");

    isGenerating = true;
    toggleUI(true);
    clearLogs();

    try {
        log("🚀 Initializing Auto-Blogger Agent v2.0...");
        log(`🎯 Target Topic: "${topic}"`);

        // STEP 1: GENERATE OUTLINE
        log("🧠 Phase 1: Architecting Outline (10 Chapters)...");
        const outline = await callAI(`Create a comprehensive 10-chapter outline for a 3000-word blog post about "${topic}". Return ONLY a JSON array of strings. Example: ["Chapter 1: Title", "Chapter 2: Title"]`);
        const chapters = parseJSON(outline);
        
        if (!chapters || chapters.length < 5) throw new Error("Failed to generate valid outline.");
        log(`✅ Outline Approved: ${chapters.length} Chapters locked in.`);

        // STEP 2: WRITE CHAPTERS (The Loop)
        let fullHtmlContent = "";
        
        // Intro
        log("✍️ Phase 2: Writing Introduction...");
        const intro = await callAI(`Write a powerful, hook-filled HTML introduction (approx 300 words) for a guide about "${topic}". Use <h1> for the main title (create a catchy one) and <p class="lead"> for the opening paragraph. Do not include <html> or <body> tags.`);
        fullHtmlContent += intro;

        // Chapters
        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            log(`✍️ Phase 2 (${i+1}/${chapters.length}): Writing "${chapter}"...`);
            
            const prompt = `
                Write a detailed, high-value blog section (approx 400 words) for the chapter: "${chapter}".
                Context: This is part of a guide about "${topic}".
                Format: Use <h2> for the chapter title. Use <p>, <ul>, <li>, <strong>.
                Style: Professional, authoritative, data-driven. Include 1 external link reference to a high-authority site (like Wikipedia, Forbes) if relevant.
                Output: HTML only. No markdown code blocks.
            `;
            
            const content = await callAI(prompt);
            fullHtmlContent += `\n${content}\n`;
            
            // Random delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 1000)); 
        }

        // Conclusion
        log("✍️ Phase 2: Writing Conclusion...");
        const conclusion = await callAI(`Write a motivating conclusion for the article "${topic}". Summarize key points and end with a Call to Action to check out the "Digital Services Hub Tools". Format in HTML.`);
        fullHtmlContent += conclusion;

        // STEP 3: SEO METADATA
        log("🔍 Phase 3: Generating SEO Metadata...");
        const metaJson = await callAI(`
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
            category: "AI Generated", // Could be dynamic
            readTime: "25", // Estimated for 3000 words
            image: image,
            excerpt: meta.excerpt,
            content: finalContent,
            published: true,
            author: "AI Editor",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), postData);
        
        log("✨ SUCCESS! Post Published Successfully.");
        alert("Blog Post Generated & Published!");

    } catch (error) {
        log(`❌ CRITICAL ERROR: ${error.message}`, 'red');
        console.error(error);
    } finally {
        isGenerating = false;
        toggleUI(false);
    }
}

// ==========================================
// 4. HELPERS
// ==========================================

async function callAI(prompt) {
    try {
        const response = await fetch('/.netlify/functions/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI API Failed");
        
        // Clean up markdown code blocks if present
        let text = data.text;
        text = text.replace(/```html/g, '').replace(/```json/g, '').replace(/```/g, '');
        return text.trim();
    } catch (e) {
        throw e;
    }
}

function processSEO(html, meta) {
    // 1. Internal Linking
    let processed = html;
    Object.keys(LINK_MAP).forEach(keyword => {
        const regex = new RegExp(`(${keyword})(?![^<]*>|[^<>]*<\/a>)`, 'gi');
        processed = processed.replace(regex, `<a href="${LINK_MAP[keyword]}" class="text-brand-600 font-bold hover:underline">$1</a>`);
    });

    // 2. Schema Injection
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
        // Simple heuristic fix for common AI JSON errors
        const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        return null;
    }
}

function log(msg, color = 'green') {
    const container = document.getElementById(LOG_CONTAINER_ID);
    const div = document.createElement('div');
    div.innerHTML = `<span class="opacity-50 mr-2">[${new Date().toLocaleTimeString()}]</span> <span style="color:${color === 'red' ? '#ef4444' : '#4ade80'}">${msg}</span>`;
    container.appendChild(div);
    // Auto scroll
    const window = document.getElementById('console-window');
    window.scrollTop = window.scrollHeight;
}

function clearLogs() {
    document.getElementById(LOG_CONTAINER_ID).innerHTML = '';
}

function toggleUI(disabled) {
    const btn = document.getElementById('start-auto-btn');
    const input1 = document.getElementById('auto-topic');
    const input2 = document.getElementById('auto-image');
    
    if (disabled) {
        btn.disabled = true;
        btn.innerHTML = `<i class="animate-spin" data-lucide="loader-2"></i> Generating... (This takes ~2 mins)`;
        input1.disabled = true;
        input2.disabled = true;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles" class="w-6 h-6"></i> Start Autonomous Agent`;
        input1.disabled = false;
        input2.disabled = false;
    }
    if(window.lucide) window.lucide.createIcons();
}
