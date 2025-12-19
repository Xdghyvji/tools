<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | DigitalServicesHub.online</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: { brand: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb' } }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased flex flex-col min-h-screen">

    <header class="fixed w-full top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm h-20" id="main-header"></header>

    <main class="flex-grow pt-48 pb-20 flex items-center justify-center px-4">
        <div class="w-full max-w-md animate-fade-in">
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div class="text-center mb-8">
                    <div class="inline-flex bg-brand-600 p-3 rounded-xl text-white shadow-lg mb-4">
                        <i data-lucide="lock" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-bold font-heading">Welcome Back</h2>
                </div>

                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="email" class="w-full p-3 border rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Password</label>
                        <input type="password" id="password" class="w-full p-3 border rounded-lg" required>
                    </div>
                    <div id="error-message" class="hidden text-red-500 text-sm text-center"></div>
                    <button type="submit" class="w-full py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-500 transition-colors">Sign In</button>
                </form>

                <div class="relative my-8">
                    <div class="absolute inset-0 flex items-center"><div class="w-full border-t"></div></div>
                    <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-slate-500">Or</span></div>
                </div>

                <button id="google-btn" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium hover:bg-slate-50 transition-colors">
                    <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    </main>

    <footer id="main-footer"></footer>

    <script type="module">
        import { loadHeader, loadFooter, auth } from './assets/js/shared.js';
        import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

        document.addEventListener("DOMContentLoaded", () => {
             loadHeader();
             loadFooter();
             if(window.lucide) lucide.createIcons();
         });

        // Email Login Logic
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value;
            const passwordInput = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            
            try {
                await signInWithEmailAndPassword(auth, emailInput, passwordInput);
                
                // *** FIX APPLIED HERE: Removing '/tools/' prefix ***
                if (emailInput === "admin@dsh.online") {
                    window.location.href = '/admin/index.html'; // Go to Admin Dashboard
                } else {
                    window.location.href = '/index.html'; // Go to Home
                }

             } catch (error) {
                 console.error(error);
                 errorDiv.textContent = "Invalid credentials. Please try again.";
                 errorDiv.classList.remove('hidden');
             }
        });

        // Google Login Logic
        document.getElementById('google-btn').addEventListener('click', async () => {
            try {
                 const result = await signInWithPopup(auth, new GoogleAuthProvider());
                 const user = result.user;

                 // *** FIX APPLIED HERE: Removing '/tools/' prefix ***
                 if (user.email === "admin@dsh.online") {
                     window.location.href = '/admin/index.html';
                 } else {
                     window.location.href = '/index.html';
                 }

             } catch(e) {
                console.error(e);
                document.getElementById('error-message').textContent = "Google sign-in failed.";
                document.getElementById('error-message').classList.remove('hidden');
            }
        });
    </script>
</body>
</html>
