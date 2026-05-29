// =====================
// THEME — résolution & application (avant paint)
// Mode par défaut : clair. Sombre uniquement si localStorage.theme === "dark".
// =====================

(function () {
    "use strict";

    function resolveDarkMode() {
        try {
            return localStorage.getItem("theme") === "dark";
        } catch (e) {
            return false;
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

    applyThemeClass();
})();
