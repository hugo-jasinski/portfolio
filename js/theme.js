// =====================
// THEME — résolution & application
// Mode par défaut : clair. Sombre uniquement si localStorage.theme === "dark".
// Les fonctions peuvent déjà exister (script inline dans <head>).
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
