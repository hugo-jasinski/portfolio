// =====================
// INTRO LOADER
// =====================

(function () {
    "use strict";

    // --- Config ---
    const STORAGE_KEY = "introSeenDate";
    const ANIM_LOGO_DURATION = 1500; // ms
    const ANIM_TEXT_DELAY = 600;     // ms after logo starts
    const ANIM_LETTER_STAGGER = 60;  // ms between letters
    const ANIM_FADEOUT_DELAY = 800;  // ms after last letter
    const ANIM_FADEOUT_DURATION = 600; // ms

    // --- Should we play? ---
    function shouldPlayIntro() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== today;
    }

    function markIntroSeen() {
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    }

    // --- Dark mode detection ---
    function isDarkMode() {
        // Check localStorage first (matches the site's theme toggle)
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") return true;
        if (savedTheme === "light") return false;
        // Fallback: system preference
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    // --- Preload logo ---
    function preloadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    // --- Build & Run ---
    async function runIntro() {
        const dark = isDarkMode();

        // Apply dark class to body immediately (before site JS runs)
        if (dark) {
            document.body.classList.add("dark");
        }

        const logoSrc = dark ? "assets/logo-light.png" : "assets/logo-dark.png";

        // Preload logo
        await preloadImage(logoSrc);

        // Build overlay
        const overlay = document.createElement("div");
        overlay.id = "intro-overlay";
        overlay.className = dark ? "intro-dark" : "";

        // Logo
        const logoEl = document.createElement("img");
        logoEl.id = "intro-logo";
        logoEl.src = logoSrc;
        logoEl.alt = "Hugo Jasinski";

        // Text container
        const textEl = document.createElement("div");
        textEl.id = "intro-text";

        const name = "Hugo Jasinski";
        name.split("").forEach((char, i) => {
            const span = document.createElement("span");
            span.className = "intro-letter";
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.animationDelay = `${ANIM_TEXT_DELAY + i * ANIM_LETTER_STAGGER}ms`;
            textEl.appendChild(span);
        });

        overlay.appendChild(logoEl);
        overlay.appendChild(textEl);

        // Hide site content while intro plays
        document.body.style.overflow = "hidden";
        document.body.insertBefore(overlay, document.body.firstChild);

        // Trigger logo animation on next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                logoEl.classList.add("intro-logo-animate");
            });
        });

        // Total animation time
        const totalLetterTime = ANIM_TEXT_DELAY + name.length * ANIM_LETTER_STAGGER + 500;
        const totalTime = Math.max(ANIM_LOGO_DURATION, totalLetterTime) + ANIM_FADEOUT_DELAY;

        // Fade out
        setTimeout(() => {
            overlay.classList.add("intro-fadeout");

            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = "";
                markIntroSeen();
                window.dispatchEvent(new CustomEvent("introcomplete"));
            }, ANIM_FADEOUT_DURATION);
        }, totalTime);
    }

    function emitIntroComplete() {
        window.dispatchEvent(new CustomEvent("introcomplete"));
    }

    // --- Init ---
    if (!shouldPlayIntro()) {
        // Already seen today — laisser le reste du site (ex. hero) se synchroniser
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", emitIntroComplete);
        } else {
            emitIntroComplete();
        }
        return;
    }

    // Run as early as possible
    if (document.body) {
        runIntro();
    } else {
        // Body not yet available, wait for it
        document.addEventListener("DOMContentLoaded", runIntro);
    }
})();
