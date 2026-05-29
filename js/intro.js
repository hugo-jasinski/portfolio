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

    function isDarkMode() {
        return typeof resolveDarkMode === "function"
            ? resolveDarkMode()
            : false;
    }

    function applyIntroTheme() {
        if (typeof applyThemeClass === "function") {
            applyThemeClass();
            return;
        }
        document.body.classList.toggle("dark", isDarkMode());
    }

    function clearIntroShell() {
        document.documentElement.classList.remove("intro-active", "theme-dark-pending");
        document.body.style.overflow = "";
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

    function buildIntroText() {
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

        return textEl;
    }

    // --- Build & Run ---
    async function runIntro() {
        const dark = isDarkMode();

        applyIntroTheme();
        document.body.style.overflow = "hidden";

        // Overlay tout de suite — ne pas attendre le preload (1ère visite en ligne = cache vide)
        const overlay = document.createElement("div");
        overlay.id = "intro-overlay";
        overlay.className = dark ? "intro-dark" : "";
        document.body.insertBefore(overlay, document.body.firstChild);

        const logoSrc = dark ? "assets/logo-light.png" : "assets/logo-dark.png";
        await preloadImage(logoSrc);

        const logoEl = document.createElement("img");
        logoEl.id = "intro-logo";
        logoEl.src = logoSrc;
        logoEl.alt = "Hugo Jasinski";

        overlay.appendChild(logoEl);
        overlay.appendChild(buildIntroText());

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                logoEl.classList.add("intro-logo-animate");
            });
        });

        const totalLetterTime = ANIM_TEXT_DELAY + "Hugo Jasinski".length * ANIM_LETTER_STAGGER + 500;
        const totalTime = Math.max(ANIM_LOGO_DURATION, totalLetterTime) + ANIM_FADEOUT_DELAY;

        setTimeout(() => {
            overlay.classList.add("intro-fadeout");

            setTimeout(() => {
                overlay.remove();
                finishIntro();
            }, ANIM_FADEOUT_DURATION);
        }, totalTime);
    }

    function emitIntroComplete() {
        window.dispatchEvent(new CustomEvent("introcomplete"));
    }

    function finishIntro() {
        clearIntroShell();
        applyIntroTheme();
        markIntroSeen();
        window.dispatchEvent(new CustomEvent("introcomplete"));
    }

    // --- Init ---
    if (!shouldPlayIntro()) {
        clearIntroShell();
        applyIntroTheme();
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", emitIntroComplete);
        } else {
            emitIntroComplete();
        }
        return;
    }

    if (document.body) {
        runIntro();
    } else {
        document.addEventListener("DOMContentLoaded", runIntro);
    }
})();
