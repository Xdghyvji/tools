import { db, appId, auth } from '../shared.js';
import { collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { updateSitemap } from './posts.js'; 

// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================
let isRunning = false;
let apiKeys = [];
let currentKeyIndex = 0;
const LOG_CONTAINER_ID = 'generation-logs';

// Smart Link Mapping
const LINK_MAP = {
    "TikTok": "/tiktok.html",
    "Instagram": "/instagram.html",
    "Email Extractor": "/email-tools.html",
    "Blog Writer": "/blog-tools.html",
    "SEO": "/blog-tools.html",
    "Twitter": "/twitter-tools.html",
    "Pricing": "/subscription.html",
    "Contact": "/contact.html"
};

// Fallback Models (If one 404s, it tries the next)
const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest", 
    "gemini-1.5-pro",
    "gemini-pro"
];

// ==========================================
// 2. UI RENDERER
// ==========================================
export function render() {
    return `
    <div class="animate-fade-in max-w-5xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold text-slate-900 mb-1">Infinity Vlogger Machine v5.0</h1>
                <p class="text-slate-500">Autonomous, Multi-Model, Anti-Crash Content Engine.</p>
            </div>
            <div id="status-indicator" class="px-4 py-2 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center gap-2 border border-slate-200">
                <div class="w-3 h-3 rounded-full bg-slate-400"></div> IDLE
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Target Niche / Context</label>
                    <textarea id="auto-niche" rows="4" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="e.g., Digital Marketing, SaaS Tools, AI Growth Hacking..."></textarea>
                    <p class="text-xs text-slate-400 mt-2">The machine will invent topics based on this context.</p>
                </div>

                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-900 mb-4">Machine Controls</h3>
                    <button id="start-machine-btn" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 mb-3">
                        <i data-lucide="play" class="w-5 h-5"></i> START INFINITE LOOP
                    </button>
                    <button id="stop-machine-btn" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2 hidden">
                        <i data-lucide="square" class="w-5 h-5"></i> EMERGENCY STOP
                    </button>
                    <div class="mt-4 text-xs text-center text-slate-500">
                        Delay set to <span class="font-mono bg-slate-100 px-1 rounded">70s</span> to prevent rate limits.
                    </div>
                </div>

                <div class="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-xs">
                    <div class="flex justify-between mb-2 border-b border-slate-800 pb-2">
                        <span>API Keys Loaded:</span>
                        <span id="key-count">0</span>
                    </div>
                    <div>Active Model: <span id="active-model" class="text-white">Auto-Detecting...</span></div>
                </div>
            </div>

            <div class="lg:col-span-2">
                <div class="bg-slate-950 rounded-xl p-6 font-mono text-sm text-slate-300 h-[600px] overflow-y-auto shadow-inner border border-slate-800 relative" id="console-window">
                    <div class="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 text-xs text-slate-500">
                        TERMINAL OUTPUT
                    </div>
                    <div id="${LOG_CONTAINER_ID}" class="mt-6 space-y-2">
                        <div class="opacity-50">System Ready... Waiting for input.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ==========================================
// 3. INITIALIZATION & EVENTS
// ==========================================
export async function init() {
    const startBtn = document.getElementById('start-machine-btn');
    const stopBtn = document.getElementById('stop-machine-btn');

    if (startBtn) startBtn.addEventListener('click', startMachine);
    if (stopBtn) stopBtn.addEventListener('click', stopMachine);

    await loadApiKeys();

    if(window.lucide) window.lucide.createIcons();
}

async function loadApiKeys() {
    try {
        const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'api_keys'));
        apiKeys = [];
        snapshot.forEach(doc => {
            if (doc.data().key) apiKeys.push(doc.data().key);
        });
        document.getElementById('key-count').innerText = apiKeys.length;
        if(apiKeys.length === 0) log("⚠️ WARNING: No API Keys found. Please add keys in Settings.", "orange");
    } catch (e) {
        log("❌ Error loading API Keys: " + e.message, "red");
    }
}

// ==========================================
// 4. THE INFINITE MACHINE LOOP
// ==========================================
async function startMachine() {
    const niche = document.getElementById('auto-niche').value;
    if (!niche) return alert("Please enter a Niche/Context.");
    if (apiKeys.length === 0) return alert("No API Keys available.");

    isRunning = true;
    updateStatus("RUNNING", "emerald");
    toggleControls(true);
    log("🚀 MACHINE STARTED. Infinite Loop Engaged.", "emerald");

    while (isRunning) {
        try {
            // --- STEP 1: GENERATE TOPIC ---
            log("🧠 Ideation: Inventing a new blog topic...", "blue");
            const topic = await callGeminiWithRotation(`
                Generate a single, highly click-worthy, unique blog post title related to this niche: "${niche}".
                The title should be specific and SEO optimized. 
                Do not use quotes. Just return the title string.
            `);
            log(`🎯 New Topic Generated: "${topic}"`, "white");

            // --- STEP 2: GENERATE THUMBNAIL URL ---
            const encodedTopic = encodeURIComponent(topic.substring(0, 50));
            const imageUrl = `https://image.pollinations.ai/prompt/realistic_4k_photo_of_${encodedTopic}?nologo=true`;
            log(`🖼️ Thumbnail Generated.`, "blue");

            // --- STEP 3: CREATE OUTLINE ---
            log("📝 Structuring: Creating 8-Chapter Outline...", "blue");
            const outlineJson = await callGeminiWithRotation(`
                Create an 8-chapter outline for a 3000-word article titled "${topic}".
                Return ONLY a JSON array of strings. Example: ["Chapter 1: Title", "Chapter 2: Title"]
                Strict JSON format.
            `);
            const chapters = parseJSON(outlineJson);
            if (!chapters) throw new Error("Failed to generate outline.");

            // --- STEP 4: WRITE CONTENT ---
            let fullHtml = "";
            const intro = await callGeminiWithRotation(`Write a 300-word HTML introduction for "${topic}". Use <h1> for title. HTML format only.`);
            fullHtml += intro;

            for (let i = 0; i < chapters.length; i++) {
                if (!isRunning) break;
                log(`✍️ Writing ${i+1}/${chapters.length}: ${chapters[i]}...`, "gray");
                
                const content = await callGeminiWithRotation(`
                    Write a detailed 400-word blog section for "${chapters[i]}" in article "${topic}".
                    Use <h2> for the title. Use HTML tags <p>, <ul>, <li>, <strong>.
                    Make it sound human and professional.
                `);
                fullHtml += `\n${content}\n`;
                
                await new Promise(r => setTimeout(r, 5000)); 
            }

            if (!isRunning) { log("🛑 Machine Stopped mid-write.", "red"); break; }

            const conclusion = await callGeminiWithRotation(`Write a conclusion for "${topic}" with a CTA.`);
            fullHtml += conclusion;

            // --- STEP 5: SEO & PUBLISH ---
            log("💾 Publishing...", "blue");
            const metaJson = await callGeminiWithRotation(`Generate JSON: { "excerpt": "150 chars", "slug": "kebab-case-slug" } for "${topic}"`);
            const meta = parseJSON(metaJson);
            const finalContent = processSEO(fullHtml, topic, meta?.excerpt || "");

            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
                title: topic,
                slug: meta?.slug || createSlug(topic),
                category: "AI Auto-Blog",
                readTime: "20",
                image: imageUrl,
                excerpt: meta?.excerpt || "",
                content: finalContent,
                published: true,
                author: "Auto-Vlogger",
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                createdAt: serverTimestamp()
            });

            await updateSitemap();
            log(`✨ POST PUBLISHED: "${topic}"`, "emerald");

            log("⏳ Cooling down for 70 seconds...", "orange");
            await wait(70000); 

        } catch (error) {
            log(`❌ ERROR: ${error.message}. Retrying loop in 30s...`, "red");
            await wait(30000);
        }
    }

    updateStatus("IDLE", "slate");
    toggleControls(false);
}

function stopMachine() {
    isRunning = false;
    log("🛑 STOP COMMAND RECEIVED. Finishing current step...", "red");
    document.getElementById('stop-machine-btn').innerText = "STOPPING...";
}

// ==========================================
// 5. ROBUST API ENGINE (Multi-Model + Multi-Key)
// ==========================================
async function callGeminiWithRotation(prompt) {
    const maxAttempts = apiKeys.length * MODELS.length; 
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        // Round Robin: Rotate keys first, then models
        const apiKey = apiKeys[currentKeyIndex];
        
        // Try current model (if it fails 404, we switch model)
        for (const model of MODELS) {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            // Update UI
            const modelBadge = document.getElementById('active-model');
            if(modelBadge) modelBadge.innerText = model;

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) throw new Error("Empty Response");
                    return text.replace(/```html|```json|```/g, '').trim();
                }

                // Handle Specific Errors
                if (response.status === 404) {
                    log(`⚠️ Model ${model} not found (404). Trying next model...`, "orange");
                    continue; // Try next model in the loop
                }
                
                if (response.status === 429) {
                    throw new Error("RateLimit"); // Throw to trigger Key Rotation
                }

                throw new Error(`API ${response.status}`);

            } catch (e) {
                if (e.message === "RateLimit") break; // Break model loop to rotate KEY
                if (e.message.includes("404")) continue; // Try next model
            }
        }

        // If we get here, either RateLimit hit OR all models failed for this key
        log(`⚠️ Key ...${apiKey.slice(-4)} exhausted. Switching keys...`, "orange");
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("ALL KEYS & MODELS FAILED");
}

// ==========================================
// 6. HELPERS
// ==========================================
function processSEO(html, title, excerpt) {
    let processed = html;
    Object.keys(LINK_MAP).forEach(keyword => {
        const regex = new RegExp(`(${keyword})(?![^<]*>|[^<>]*<\/a>)`, 'gi');
        processed = processed.replace(regex, `<a href="${LINK_MAP[keyword]}" class="text-brand-600 font-bold hover:underline">$1</a>`);
    });

    const schema = {
        "@context": "[https://schema.org](https://schema.org)",
        "@type": "BlogPosting",
        "headline": title,
        "description": excerpt,
        "datePublished": new Date().toISOString(),
        "author": { "@type": "Organization", "name": "DigitalServicesHub" }
    };
    
    return `${processed}\n<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`;
}

function parseJSON(str) {
    try { return JSON.parse(str); } 
    catch (e) { 
        const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return match ? JSON.parse(match[0]) : null;
    }
}

function createSlug(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

function wait(ms) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (!isRunning) { clearInterval(interval); resolve(); }
        }, 1000);
        setTimeout(() => { clearInterval(interval); resolve(); }, ms);
    });
}

function log(msg, color) {
    const c = document.getElementById(LOG_CONTAINER_ID);
    if (!c) return;
    const colorClass = { 'emerald': 'text-emerald-400', 'blue': 'text-blue-400', 'red': 'text-rose-400', 'orange': 'text-amber-400', 'gray': 'text-slate-400', 'white': 'text-white' }[color] || 'text-slate-300';
    c.innerHTML += `<div class="font-mono text-xs py-1 border-l-2 border-slate-800 pl-2 ml-1 ${colorClass}"><span class="opacity-30 mr-2">${new Date().toLocaleTimeString()}</span> ${msg}</div>`;
    document.getElementById('console-window').scrollTop = 99999;
}

function updateStatus(text, color) {
    const el = document.getElementById('status-indicator');
    if(color === 'emerald') {
        el.innerHTML = `<div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div> RUNNING`;
        el.className = "px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center gap-2 border border-emerald-200 shadow-sm";
    } else {
        el.innerHTML = `<div class="w-3 h-3 rounded-full bg-slate-400"></div> IDLE`;
        el.className = "px-4 py-2 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center gap-2 border border-slate-200";
    }
}

function toggleControls(active) {
    const start = document.getElementById('start-machine-btn');
    const stop = document.getElementById('stop-machine-btn');
    if (active) { start.classList.add('hidden'); stop.classList.remove('hidden'); stop.innerText = "EMERGENCY STOP"; } 
    else { start.classList.remove('hidden'); stop.classList.add('hidden'); }
}
