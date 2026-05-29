(function () {
    "use strict";

    function resolveDarkMode() {
        try {
            const stored = localStorage.getItem("theme");
            if (stored === "dark") return true;
            if (stored === "light") return false;
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        } catch (e) {
            return false;
        }
    }

    function persistThemePreference() {
        try {
            if (localStorage.getItem("theme") === null) {
                localStorage.setItem("theme", resolveDarkMode() ? "dark" : "light");
            }
        } catch (e) {
            /* ignore */
        }
    }

    function syncColorScheme() {
        document.documentElement.style.colorScheme = resolveDarkMode()
            ? "dark"
            : "light only";
    }

    function applyThemeClass() {
        if (document.body) {
            document.body.classList.toggle("dark", resolveDarkMode());
        }
        syncColorScheme();
    }

    window.resolveDarkMode = resolveDarkMode;
    window.applyThemeClass = applyThemeClass;
    window.syncColorScheme = syncColorScheme;

    persistThemePreference();
    syncColorScheme();
})();
