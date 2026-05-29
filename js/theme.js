// =====================
// THEME — résolution & application
// Préférence explicite (localStorage) > préférence système > clair
// =====================

(function () {
    "use strict";

    function systemPrefersDark() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function resolveDarkMode() {
        try {
            const stored = localStorage.getItem("theme");
            if (stored === "dark") return true;
            if (stored === "light") return false;
            return systemPrefersDark();
        } catch (e) {
            return false;
        }
    }

    function persistInitialTheme() {
        try {
            if (localStorage.getItem("theme") === null && resolveDarkMode()) {
                localStorage.setItem("theme", "dark");
            }
        } catch (e) {
            /* localStorage indisponible */
        }
    }

    function syncColorScheme() {
        document.documentElement.style.colorScheme = resolveDarkMode()
            ? "dark"
            : "light only";
    }

    function applyThemeClass() {
        if (!document.body) return;
        document.body.classList.toggle("dark", resolveDarkMode());
        syncColorScheme();
    }

    window.resolveDarkMode = resolveDarkMode;
    window.applyThemeClass = applyThemeClass;
    window.syncColorScheme = syncColorScheme;
    window.persistInitialTheme = persistInitialTheme;

    persistInitialTheme();
    applyThemeClass();
})();
