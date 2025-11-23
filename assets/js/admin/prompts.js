import { db, appId } from '../../js/shared.js';
import { collection, doc, setDoc, onSnapshot, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONFIGURATION: 48 Templates (Standard + VIP) ---
const defaultPrompts = {
    // YOUTUBE
    'youtube_title': 'Generate 5 viral, high-CTR YouTube video titles for: "${topic}". Keep them short and punchy.',
    'youtube_title_vip': 'Generate 10 viral YouTube titles for: "${topic}". Use advanced psychology hooks (Negativity bias, Curiosity gaps). Rank them by predicted CTR.',
    
    'youtube_tags': 'Generate 20 YouTube SEO tags for: "${topic}". Comma separated.',
    'youtube_tags_vip': 'Generate 30 high-volume, low-competition keywords for: "${topic}". Group them by "Broad", "Niche", and "Long-tail".',
    
    'youtube_desc': 'Write a YouTube description for: "${topic}" with timestamps.',
    'youtube_desc_vip': 'Write a conversion-optimized YouTube description for: "${topic}". Include SEO keywords in the first 2 lines, affiliate disclaimer, and a strong CTA block.',
    
    'youtube_script': 'Write a YouTube video script for: "${topic}".',
    'youtube_script_vip': 'Write a professional YouTube script for: "${topic}" using the "Hook-Retain-Reward" structure. Include B-Roll suggestions and tone-of-voice cues.',

    // INSTAGRAM
    'insta_captions': 'Write 3 Instagram captions for: "${topic}".',
    'insta_captions_vip': 'Write 5 viral Instagram captions for: "${topic}". Styles: Storytelling, Controversial, Minimalist. Include a question to drive comments.',
    
    'insta_hashtags': 'Generate 15 Instagram hashtags for: "${topic}".',
    'insta_hashtags_vip': 'Generate a "Hashtag Ladder" strategy for: "${topic}". 10 small, 10 medium, 5 large volume tags to maximize reach.',
    
    'insta_bio': 'Create 3 Instagram Bio ideas for: "${topic}".',
    'insta_bio_vip': 'Create 3 Authority-Building Bios for: "${topic}". Focus on social proof, clear value proposition, and link-in-bio CTA.',
    
    'insta_stories': '3 Story ideas for: "${topic}".',
    'insta_stories_vip': 'Plan a 24-hour Story Sequence for: "${topic}" designed to sell or convert. Slide 1: Hook, Slide 2: Value, Slide 3: CTA.',

    // TIKTOK
    'tiktok_hooks': '3 TikTok hooks for: "${topic}".',
    'tiktok_hooks_vip': '10 Scroll-Stopping TikTok hooks for: "${topic}". Use patterns like "Stop doing this", "Secret revealed", and "I tried X so you don\'t have to".',
    
    'tiktok_scripts': 'Write a 15s TikTok script for: "${topic}".',
    'tiktok_scripts_vip': 'Write a viral TikTok script for: "${topic}". Include specific visual directions (Green screen effects, Text overlays timing) and sound suggestions.',
    
    'tiktok_trends': '2 Trend ideas for: "${topic}".',
    'tiktok_trends_vip': 'Analyze current TikTok trends suitable for: "${topic}". Explain exactly how to adapt the trend to this niche for max virality.',
    
    'tiktok_hashtags': 'TikTok hashtags for: "${topic}".',
    'tiktok_hashtags_vip': 'Generate FYP-optimized hashtags for: "${topic}". Mix trending sounds tags with niche specific tags.',

    // TWITTER
    'twitter_thread': 'Write a 5-tweet thread about: "${topic}".',
    'twitter_thread_vip': 'Write a "Masterclass" Twitter thread about: "${topic}". Use high-value formatting (bullet points, stats). Ensure the first tweet is a "Mega-Hook".',
    
    'twitter_tweet': 'Write 3 tweets about: "${topic}".',
    'twitter_tweet_vip': 'Write 5 "Hot Take" or "Contrarian" tweets about: "${topic}" designed to trigger debate and retweets.',
    
    'twitter_bio': '3 Twitter Bios for: "${topic}".',
    'twitter_bio_vip': '3 High-Converting Twitter Bios for: "${topic}". Focus on authority, credibility, and newsletter signup.',
    
    'twitter_tags': '10 Twitter hashtags for: "${topic}".',
    'twitter_tags_vip': 'List trending X topics and hashtags related to: "${topic}". Explain which wave to ride right now.',

    // BLOG
    'blog_writer': 'Write a 500-word article on: "${topic}".',
    'blog_writer_vip': 'Write a 1500-word "Ultimate Guide" on: "${topic}". Use NLP-optimized headings, short paragraphs, and include a FAQ section for Featured Snippets.',
    
    'blog_outline': 'Create a blog outline for: "${topic}".',
    'blog_outline_vip': 'Create a semantic SEO outline for: "${topic}". Analyze user intent and cover all sub-topics required to outrank competitors.',
    
    'blog_rewrite': 'Rewrite this text: "${topic}".',
    'blog_rewrite_vip': 'Rewrite this text to pass AI detection and sound more human. Tone: Conversational, witty, and authoritative: "${topic}".',
    
    'blog_keywords': '20 keywords for: "${topic}".',
    'blog_keywords_vip': 'Generate a keyword cluster for: "${topic}". Include Search Volume estimates (High/Med/Low) and Intent (Informational/Commercial).',

    // EMAIL
    'email_subject': '5 subject lines for: "${topic}".',
    'email_subject_vip': '10 High-Open-Rate Subject Lines for: "${topic}". Use curiosity gaps, urgency, and personalization tokens.',
    
    'email_newsletter': 'Write a newsletter about: "${topic}".',
    'email_newsletter_vip': 'Write a "Story-based" newsletter about: "${topic}". Start with a personal anecdote, transition to the lesson, and end with a soft sell.',
    
    'email_cold': 'Write a cold email about: "${topic}".',
    'email_cold_vip': 'Write a "Spear" cold email about: "${topic}". Extremely short, highly personalized, asking for a simple "Yes/No" interest.',
    
    'email_sequence': '3-email sequence for: "${topic}".',
    'email_sequence_vip': 'Map out a 5-day "Soap Opera" email sequence for: "${topic}". Day 1: Set the stage, Day 2: Drama, Day 3: Epiphany, Day 4: Hidden benefits, Day 5: Urgency.'
};

const toolCategories = { 'youtube': 'YouTube', 'insta': 'Instagram', 'tiktok': 'TikTok', 'twitter': 'Twitter', 'blog': 'Blog & SEO', 'email': 'Email Marketing' };

// --- RENDER FUNCTION ---
export function render() {
    return `
    <div class="animate-fade-in h-[calc(100vh-140px)] flex flex-col">
         <div class="flex justify-between items-center mb-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">System Prompts</h1>
                <p class="text-xs text-slate-500">Manage Free & VIP Logic (48 Templates)</p>
            </div>
            <div class="flex gap-2">
                <button id="seed-btn" class="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">
                    <i data-lucide="refresh-cw" class="w-3 h-3 inline"></i> Reset All
                </button>
                <button id="save-prompt-btn" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Save Changes
                </button>
            </div>
        </div>

        <div class="flex gap-6 flex-1 overflow-hidden">
            <!-- Sidebar List -->
            <div class="w-72 bg-white rounded-xl border border-slate-200 overflow-y-auto flex flex-col" id="prompt-list">
                <!-- List injected via JS -->
            </div>

            <!-- Editor Area -->
            <div class="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden relative">
                <div class="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div id="editor-header-container">
                        <h3 class="font-bold text-slate-700" id="editor-header">Select a Tool</h3>
                        <span class="text-xs text-slate-400" id="editor-sub">Click a prompt on the left to edit</span>
                    </div>
                    <button id="reset-single-btn" class="text-xs text-brand-600 hover:text-brand-800 hidden">Restore Default</button>
                </div>
                <textarea id="prompt-editor" class="flex-1 p-6 outline-none font-mono text-sm text-slate-800 resize-none leading-relaxed bg-white" placeholder="Select a tool..."></textarea>
                <div class="p-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
                    Variable: <span class="font-mono bg-slate-200 text-slate-600 px-1 rounded">\${topic}</span> will be replaced by user input.
                </div>
            </div>
        </div>
    </div>`;
}

// --- INIT FUNCTION ---
export async function init() {
    let currentId = null;
    let dbPrompts = {};

    // 1. Realtime Listener
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'system_prompts'), (snap) => {
        dbPrompts = {};
        snap.forEach(doc => { dbPrompts[doc.id] = doc.data().template; });
        renderList();
    });

    // 2. Render List logic
    function renderList() {
        const list = document.getElementById('prompt-list');
        if(!list) return;
        
        list.innerHTML = `<div class="p-3 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">Available Tools</div>`;
        
        // Sort keys to group VIP next to Standard
        const keys = Object.keys(defaultPrompts).sort();
        let currentCat = '';

        keys.forEach(key => {
            const isVip = key.endsWith('_vip');
            const baseKey = isVip ? key.replace('_vip', '') : key;
            const cat = baseKey.split('_')[0];
            const label = baseKey.split('_')[1] || baseKey;

            // Render Category Header if changed
            if(cat !== currentCat) {
                list.innerHTML += `<div class="px-4 py-2 text-[10px] font-bold text-brand-600 bg-brand-50 mt-1 uppercase tracking-wider border-t border-brand-100">${toolCategories[cat] || cat}</div>`;
                currentCat = cat;
            }

            const btn = document.createElement('button');
            // Style: VIP gets a slight gold/amber tint
            btn.className = `w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-600 border-l-4 border-transparent transition-all flex justify-between items-center ${isVip ? 'bg-amber-50/30' : ''}`;
            
            btn.innerHTML = `
                <span class="${isVip ? 'text-amber-700 font-medium' : ''}">
                    ${capitalize(label)} 
                    ${isVip ? '<span class="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 rounded ml-1 font-bold">VIP</span>' : ''}
                </span>
                ${(dbPrompts[key] && dbPrompts[key] !== defaultPrompts[key]) ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-500" title="Customized"></span>' : ''}
            `;
            
            btn.onclick = () => {
                // UI Selection state
                Array.from(list.querySelectorAll('button')).forEach(c => {
                    c.classList.remove('border-brand-600', 'bg-white', 'shadow-sm');
                    // Re-apply VIP tint if deselected
                    if(c.innerHTML.includes('VIP')) c.classList.add('bg-amber-50/30');
                });
                
                btn.classList.remove('bg-amber-50/30'); // Remove tint to show white active state
                btn.classList.add('border-brand-600', 'bg-white', 'shadow-sm');
                
                currentId = key;
                document.getElementById('editor-header').innerText = (toolCategories[cat] || cat) + ' > ' + capitalize(label);
                document.getElementById('editor-sub').innerText = isVip ? "Exclusive VIP Model Prompt" : "Standard Free Tier Prompt";
                document.getElementById('prompt-editor').value = dbPrompts[key] || defaultPrompts[key];
                document.getElementById('reset-single-btn').classList.remove('hidden');
            };
            list.appendChild(btn);
        });
    }

    // 3. Save Handler
    document.getElementById('save-prompt-btn').addEventListener('click', async () => {
        if(!currentId) return alert("Select a tool first.");
        const btn = document.getElementById('save-prompt-btn');
        btn.innerText = "Saving...";
        
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'system_prompts', currentId), { 
                template: document.getElementById('prompt-editor').value, 
                updatedAt: serverTimestamp()
            });
            btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Saved`;
            setTimeout(() => { 
                btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Save Changes`; 
                if(window.lucide) window.lucide.createIcons();
            }, 1500);
        } catch(e) { 
            alert("Error saving: " + e.message);
            btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Save Changes`;
        }
    });

    // 4. Reset Single Handler
    document.getElementById('reset-single-btn').addEventListener('click', () => {
        if(currentId && confirm("Revert this specific prompt to system default?")) {
            document.getElementById('prompt-editor').value = defaultPrompts[currentId];
        }
    });

    // 5. Seed/Reset All Handler
    document.getElementById('seed-btn').addEventListener('click', async () => {
        if(confirm("⚠️ RESET ALL: This will overwrite ALL 48 prompts in the database with defaults. This cannot be undone. Continue?")) {
            const batch = writeBatch(db);
            Object.keys(defaultPrompts).forEach(key => {
                batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_prompts', key), { template: defaultPrompts[key], updatedAt: serverTimestamp() });
            });
            await batch.commit();
            alert("All prompts reset successfully.");
        }
    });

    return unsub;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }