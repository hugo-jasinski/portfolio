// =====================
// HERO TITLE — entrée (réutilise introLetterBounce, sync introcomplete)
// Enregistré tout de suite : si l’intro est ignorée, intro.js émet introcomplete
// au DOMContentLoaded avant initApp — un listener tardif raterait l’événement.
// =====================

(function initHeroTitleEntranceBinding() {
    const title = document.querySelector(".hero-title");
    if (!title) return;

    function reveal() {
        title.classList.add("hero-title--ready");
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        reveal();
        return;
    }

    window.addEventListener("introcomplete", reveal, { once: true });

    window.addEventListener(
        "load",
        function heroTitleEntranceFallback() {
            if (title.classList.contains("hero-title--ready")) return;
            if (!document.getElementById("intro-overlay")) reveal();
        },
        { once: true }
    );
})();

// =====================
// SAFE INIT WRAPPER
// =====================

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    initHeader();
    loadComponent("footer", "components/footer.html");
    initThemeToggle();
    initBurgerMenu();
    initAccordion();
    initMouseBackground();
    initTimelines();
    initHomeProjectsPreview();
}

// =====================
// SHARED COMPONENTS
// =====================

function loadComponent(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) return Promise.resolve();

    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`Composant introuvable : ${url}`);
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
        })
        .catch(err => {
            console.error("Component error:", url, err);
        });
}

function initHeader() {
    loadComponent("header", "components/header.html").then(() => {
        requestAnimationFrame(bootstrap);
    });
}

// =====================
// BOOTSTRAP AFTER HEADER
// =====================

function bootstrap() {
    initThemeToggle();
    initBurgerMenu();
}

// =====================
// THEME TOGGLE
// =====================

function initThemeToggle() {
    const toggle = document.getElementById("themeToggle");

    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = "true";

    if (typeof applyThemeClass === "function") {
        applyThemeClass();
    }

    toggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");

        try {
            sessionStorage.setItem("theme", isDark ? "dark" : "light");
        } catch (e) {
            /* Keep the selected theme usable without browser storage. */
        }

        if (typeof syncColorScheme === "function") {
            syncColorScheme();
        } else {
            document.documentElement.style.colorScheme = isDark ? "dark" : "light only";
        }
    });
}

// =====================
// BURGER MENU
// =====================

function initBurgerMenu() {
    const burger = document.getElementById("burger");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!burger || !mobileMenu || burger.dataset.bound) return;
    burger.dataset.bound = "true";

    burger.addEventListener("click", (e) => {
        e.stopPropagation();

        burger.classList.toggle("active");
        mobileMenu.classList.toggle("active");
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            burger.classList.remove("active");
            mobileMenu.classList.remove("active");
        });
    });

    document.addEventListener("click", (e) => {
        if (!mobileMenu.classList.contains("active")) return;

        if (!mobileMenu.contains(e.target) && !burger.contains(e.target)) {
            burger.classList.remove("active");
            mobileMenu.classList.remove("active");
        }
    });
}

// =====================
// ACCORDION SAFE
// =====================

function initAccordion() {
    const card = document.getElementById("aboutCard");
    if (!card) return;

    card.addEventListener("click", (e) => {
        if (e.target.closest(".accordion-toggle")) {
            e.stopPropagation();
            card.classList.toggle("open");
            return;
        }

        if (!card.classList.contains("open") && e.target.closest(".accordion-header")) {
            card.classList.add("open");
        }
    });
}

// =====================
// BACKGROUND MOUSE EFFECT
// =====================

function initMouseBackground() {
    let x = 50, y = 50;
    let targetX = 50, targetY = 50;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
        document.body.style.setProperty("--x", "50%");
        document.body.style.setProperty("--y", "50%");
        return; // SAFE ici car dans une fonction
    }

    document.addEventListener("mousemove", (e) => {
        targetX = (e.clientX / window.innerWidth) * 100;
        targetY = (e.clientY / window.innerHeight) * 100;
    });

    function animate() {
        x += (targetX - x) * 0.08;
        y += (targetY - y) * 0.08;

        document.body.style.setProperty("--x", x + "%");
        document.body.style.setProperty("--y", y + "%");

        requestAnimationFrame(animate);
    }

    animate();
}

// =====================
// HOME — APERÇU PROJETS (données : projects-data.js)
// =====================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function homeProjectThumbnail(category, project) {
    if (category === "montage" && project.homeThumbnail) {
        return project.homeThumbnail;
    }
    if (category === "montage" && project.videoId) {
        return "assets/texture.png";
    }
    if (category === "design") return project.image || "assets/texture.png";
    if (category === "devWeb") return project.logo || "assets/texture.png";
    if (category === "wireframing") return project.thumbnail || "assets/texture.png";
    return "assets/texture.png";
}

function collectHomeProjectPools(data) {
    const horizontal = [];
    const vertical = [];

    data.montage.forEach((project) => {
        const target = project.orientation === "vertical" ? vertical : horizontal;
        target.push({ category: "montage", project });
    });

    data.design.forEach((project) => {
        const target = project.ratio === "portrait-9-16" ? vertical : horizontal;
        target.push({ category: "design", project });
    });

    data.devWeb.forEach((project) => {
        horizontal.push({ category: "devWeb", project });
    });

    data.wireframing.forEach((project) => {
        vertical.push({ category: "wireframing", project });
    });

    return { horizontal, vertical };
}

const HOME_PROJECT_META = {
    montage: { label: "Montage vidéo", hash: "accordionMontage" },
    design: { label: "Design visuel", hash: "accordionDesign" },
    devWeb: { label: "Développement web", hash: "accordionDev" },
    wireframing: { label: "Wireframing", hash: "accordionWireframe" }
};

function bindHomeProjectsPreviewModal(root) {
    const pm = window.portfolioProjectModal;
    if (!pm || !root) return;

    root.querySelectorAll("[data-home-preview]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const cat = btn.dataset.category;
            const id = btn.dataset.projectId;
            const pdata = window.PROJECTS_DATA;
            if (!pdata || !id || !cat) return;

            let project = null;
            if (cat === "montage") project = pdata.montage.find((p) => p.id === id);
            else if (cat === "design") project = pdata.design.find((p) => p.id === id);
            else if (cat === "devWeb") project = pdata.devWeb.find((p) => p.id === id);
            else if (cat === "wireframing") project = pdata.wireframing.find((p) => p.id === id);

            if (!project) return;

            if (cat === "montage") {
                const homePortraitSplit = project.id === "montage-3";
                pm.openMontage(project, { homePortraitSplit });
            }
            else if (cat === "design") pm.openDesign(project);
            else if (cat === "devWeb") pm.openDev(project);
            else if (cat === "wireframing") pm.openWireframe(project);
        });
    });
}

function initHomeProjectsPreview() {
    const root = document.getElementById("homeProjectsPreview");
    if (!root) return;

    const data = window.PROJECTS_DATA;
    if (!data) {
        root.innerHTML = '<p class="home-projects-fallback">Projets indisponibles.</p>';
        return;
    }

    const { horizontal, vertical } = collectHomeProjectPools(data);
    const rowH = horizontal.slice(0, 2);
    const rowV = vertical.slice(0, 2);

    const paix = data.design.find((p) => p.id === "design-1");
    const hypno = data.design.find((p) => p.id === "design-5");
    if (paix) {
        if (rowH.length >= 2) rowH[1] = { category: "design", project: paix };
        else if (rowH.length === 1) rowH.push({ category: "design", project: paix });
        else rowH[0] = { category: "design", project: paix };
    }
    if (hypno) {
        if (rowV.length >= 2) rowV[1] = { category: "design", project: hypno };
        else if (rowV.length === 1) rowV.push({ category: "design", project: hypno });
        else rowV[0] = { category: "design", project: hypno };
    }

    function cardHtml(entry, layoutMod) {
        const meta = HOME_PROJECT_META[entry.category];
        const thumb = homeProjectThumbnail(entry.category, entry.project);
        const pid = entry.project.id;
        const aria = `Ouvrir l'aperçu : ${entry.project.title}`;
        return `
            <button type="button" class="home-project-card ${layoutMod}"
                data-home-preview
                data-category="${entry.category}"
                data-project-id="${escapeHtml(pid)}"
                aria-label="${escapeHtml(aria)}">
                <div class="home-project-card-media">
                    <img src="${thumb}" alt="" loading="lazy"
                         onerror="this.src='assets/texture.png'">
                </div>
                <div class="home-project-card-info">
                    <span class="home-project-card-meta">${escapeHtml(meta.label)}</span>
                    <h3 class="home-project-card-title">${escapeHtml(entry.project.title)}</h3>
                </div>
            </button>`;
    }

    root.innerHTML = `
        <div class="home-projects-row home-projects-row--horizontal">
            ${rowH.map((e) => cardHtml(e, "home-project-card--horizontal")).join("")}
        </div>
        <div class="home-projects-row home-projects-row--vertical">
            ${rowV.map((e) => cardHtml(e, "home-project-card--vertical")).join("")}
        </div>`;

    bindHomeProjectsPreviewModal(root);
}

// =====================
// TIMELINES ANIMATION
// =====================

function initTimelines() {
    const timelines = document.querySelectorAll('.timeline');
    const items = document.querySelectorAll('.timeline-item');
    
    if (!timelines.length && !items.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    timelines.forEach(t => observer.observe(t));
    items.forEach(i => observer.observe(i));
}
