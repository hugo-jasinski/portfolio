// =====================
// PROJECTS PAGE — rendu & interactions (données : projects-data.js)
// =====================

(function () {
    "use strict";

    const PROJECTS_DATA = window.PROJECTS_DATA;
    if (!PROJECTS_DATA) {
        throw new Error("Chargez js/projects-data.js avant js/projects.js");
    }

    // =====================
    // INIT
    // =====================

    document.addEventListener("DOMContentLoaded", () => {
        initModal();

        if (!document.querySelector(".projects-page-content")) return;

        renderMontageSection();
        renderDesignSection();
        renderDevSection();
        renderWireframeSection();
        initProjectAccordions();
        initDescriptionToggles();
        refreshDescriptionTogglesVisibility();

        window.addEventListener("resize", refreshDescriptionTogglesVisibility);

        const hashId = window.location.hash.replace(/^#/, "");
        if (hashId && document.getElementById(hashId)) {
            requestAnimationFrame(() => {
                document.getElementById(hashId).scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    });

    // =====================
    // ACCORDIONS
    // =====================

    function initProjectAccordions() {
        const accordions = document.querySelectorAll(".projects-accordion");

        accordions.forEach(accordion => {
            if (accordion.dataset.accordionBound) return;
            accordion.dataset.accordionBound = "true";

            let toggleBtn = accordion.querySelector(".accordion-toggle");
            if (!toggleBtn) {
                toggleBtn = document.createElement("button");
                toggleBtn.type = "button";
                toggleBtn.className = "accordion-toggle";
                toggleBtn.setAttribute("aria-label", "Ouvrir ou fermer la section");
            }
            const headerTop = accordion.querySelector(".accordion-header-top");
            if (headerTop) {
                headerTop.appendChild(toggleBtn);
            } else {
                accordion.appendChild(toggleBtn);
            }

            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                accordion.classList.toggle("open");
            });

            accordion.addEventListener("click", (e) => {
                if (accordion.classList.contains("open")) return;

                if (e.target.closest("a, button, iframe, .desc-toggle, .dev-card-cta")) return;

                if (!e.target.closest(".accordion-header")) return;

                accordion.classList.add("open");
            });
        });
    }

    // =====================
    // RENDER — MONTAGE VIDÉO
    // =====================

    function renderMontageSection() {
        const container = document.getElementById("montage-content");
        if (!container) return;

        let html = '<div class="projects-grid-video">';

        PROJECTS_DATA.montage.forEach((project, index) => {
            const isVertical = project.orientation === "vertical";
            const wrapperClass = isVertical ? "video-wrapper vertical" : "video-wrapper";

            html += `
                <div class="project-video-card" style="animation-delay: ${index * 0.1}s">
                    <h3>${project.title}</h3>
                    <div class="${wrapperClass}">
                        ${project.videoId
                    ? `<iframe 
                                src="${getVideoEmbedSrc(project.videoId)}" 
                                title="${project.title}"
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                                loading="lazy">
                            </iframe>`
                    : `<div class="video-placeholder">
                                <span>Vidéo à venir</span>
                            </div>`
                }
                    </div>
                    <div class="project-desc-container">
                        <p class="project-desc">${project.description}</p>
                        <button class="desc-toggle" aria-label="Voir plus">Voir plus</button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function getVideoEmbedSrc(value) {
        if (!value) return "";

        const raw = value.trim();

        // Backward compatibility when only a YouTube ID is provided.
        if (!raw.includes("http")) {
            return `https://www.youtube.com/embed/${raw}`;
        }

        try {
            const url = new URL(raw);
            const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

            // YouTube URLs
            if (hostname === "youtube.com" || hostname === "youtu.be") {
                // Shorts URL: youtube.com/shorts/<id>
                const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
                if (shortsMatch?.[1]) {
                    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
                }

                // Classic URL: youtube.com/watch?v=<id>
                const watchId = url.searchParams.get("v");
                if (watchId) {
                    return `https://www.youtube.com/embed/${watchId}`;
                }

                // Short URL: youtu.be/<id>
                const pathId = url.pathname.replace(/^\/+/, "").split("/")[0];
                if (pathId) {
                    return `https://www.youtube.com/embed/${pathId}`;
                }
            }

            // Vimeo URLs (vimeo.com/<id> or player.vimeo.com/video/<id>)
            if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
                const idMatch = url.pathname.match(/\/(?:video\/)?(\d+)(?:$|[/?])/);
                if (idMatch?.[1]) {
                    return `https://player.vimeo.com/video/${idMatch[1]}`;
                }
            }
        } catch (e) {
            // Fall through to a safe default.
        }

        // Safe fallback: keep current behavior.
        return `https://www.youtube.com/embed/${raw}`;
    }

    // =====================
    // RENDER — DESIGN VISUEL
    // =====================

    function renderDesignSection() {
        const container = document.getElementById("design-content");
        if (!container) return;

        let html = '<div class="projects-grid-design">';

        PROJECTS_DATA.design.forEach((project, index) => {
            const ratioClass = getDesignRatioClass(project.ratio);
            const cardClass = project.ratio === "portrait-9-16" ? "design-card portrait-9-16" : "design-card";

            html += `
                <div class="${cardClass}" data-project-id="${project.id}" style="animation-delay: ${index * 0.1}s">
                    <div class="${ratioClass}">
                        <img src="${project.image}" 
                             alt="${project.title}" 
                             loading="lazy"
                             onerror="this.parentElement.classList.add('img-error')">
                    </div>
                    <div class="design-card-info">
                        <h3>${project.title}</h3>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Attach click handlers for modal
        container.querySelectorAll(".design-card").forEach(card => {
            card.addEventListener("click", () => {
                const projectId = card.dataset.projectId;
                const project = PROJECTS_DATA.design.find(p => p.id === projectId);
                if (project) openDesignModal(project);
            });
        });
    }

    function getDesignRatioClass(ratio) {
        switch (ratio) {
            case "square":
                return "design-img-wrapper square";
            case "widescreen-16-9":
                return "design-img-wrapper widescreen-16-9";
            case "portrait-9-16":
                return "design-img-wrapper portrait-9-16";
            default:
                return "design-img-wrapper";
        }
    }

    // =====================
    // RENDER — DÉVELOPPEMENT WEB
    // =====================

    function renderDevSection() {
        const container = document.getElementById("dev-content");
        if (!container) return;

        const singleCardClass = PROJECTS_DATA.devWeb.length === 1 ? " single-project" : "";
        let html = `<div class="projects-grid-dev${singleCardClass}">`;

        PROJECTS_DATA.devWeb.forEach((project, index) => {
            html += `
                <div class="dev-card" style="animation-delay: ${index * 0.1}s">
                    <div class="dev-card-logo">
                        <img src="${project.logo}" 
                             alt="${project.title}" 
                             loading="lazy"
                             onerror="this.style.display='none'">
                    </div>
                    <h3>${project.title}</h3>
                    <div class="project-desc-container">
                        <p class="project-desc">${project.description}</p>
                        <button class="desc-toggle" aria-label="Voir plus">Voir plus</button>
                    </div>
                    <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="dev-card-cta">
                        Voir le site
                    </a>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // =====================
    // RENDER — WIREFRAMING
    // =====================

    function renderWireframeSection() {
        const container = document.getElementById("wireframe-content");
        if (!container) return;

        let html = '<div class="projects-grid-wireframe">';

        PROJECTS_DATA.wireframing.forEach((project, index) => {
            html += `
                <div class="wireframe-card" data-project-id="${project.id}" style="animation-delay: ${index * 0.1}s">
                    <div class="wireframe-img-wrapper">
                        <img src="${project.thumbnail}" 
                             alt="${project.title}" 
                             loading="lazy"
                             onerror="this.parentElement.classList.add('img-error')">
                    </div>
                    <div class="wireframe-card-info">
                        <h3>${project.title}</h3>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Attach click handlers for modal
        container.querySelectorAll(".wireframe-card").forEach(card => {
            card.addEventListener("click", () => {
                const projectId = card.dataset.projectId;
                const project = PROJECTS_DATA.wireframing.find(p => p.id === projectId);
                if (project) openWireframeModal(project);
            });
        });
    }

    // =====================
    // EXPANDABLE DESCRIPTIONS
    // =====================

    function initDescriptionToggles() {
        document.addEventListener("click", (e) => {
            const toggle = e.target.closest(".desc-toggle");
            if (!toggle) return;

            e.stopPropagation();

            const container = toggle.closest(".project-desc-container");
            const desc = container.querySelector(".project-desc");
            if (!desc) return;

            if (desc.classList.contains("expanded")) {
                setDescriptionExpanded(desc, false);
                toggle.textContent = "Voir plus";
            } else {
                setDescriptionExpanded(desc, true);
                toggle.textContent = "Voir moins";
            }
        });

        document.addEventListener("click", (e) => {
            const container = e.target.closest(".project-desc-container");
            if (!container) return;
            if (e.target.closest(".desc-toggle")) return;

            const desc = container.querySelector(".project-desc");
            const toggle = container.querySelector(".desc-toggle");
            if (!desc || !toggle) return;

            // Only auto-expand when the "Voir plus" control is actually visible.
            if (window.getComputedStyle(toggle).display === "none") return;
            if (desc.classList.contains("expanded")) return;

            setDescriptionExpanded(desc, true);
            toggle.textContent = "Voir moins";
        });
    }

    function refreshDescriptionTogglesVisibility() {
        const descContainers = document.querySelectorAll(".project-desc-container");

        descContainers.forEach((container) => {
            const desc = container.querySelector(".project-desc");
            const toggle = container.querySelector(".desc-toggle");
            if (!desc || !toggle) return;

            const wasExpanded = desc.classList.contains("expanded");
            cancelDescCollapseAnimation(desc);
            setDescriptionExpanded(desc, false, { instant: true });

            const isOverflowing = desc.scrollHeight > desc.clientHeight + 1;
            toggle.style.display = isOverflowing ? "inline-block" : "none";

            if (isOverflowing && wasExpanded) {
                setDescriptionExpanded(desc, true, { instant: true });
                toggle.textContent = "Voir moins";
            } else {
                setDescriptionExpanded(desc, false, { instant: true });
                toggle.textContent = "Voir plus";
            }
        });
    }

    function cancelDescCollapseAnimation(desc) {
        if (!desc) return;
        const fn = desc._descCollapseTransitionEnd;
        if (fn) {
            desc.removeEventListener("transitionend", fn);
            desc._descCollapseTransitionEnd = null;
        }
        const fb = desc.dataset.descCollapseFallback;
        if (fb) {
            clearTimeout(Number(fb));
            delete desc.dataset.descCollapseFallback;
        }
    }

    function setDescriptionExpanded(desc, expanded, opts) {
        opts = opts || {};

        if (!desc) return;

        const instant = opts.instant === true;
        const collapsedPx = getCollapsedDescHeight(desc);

        cancelDescCollapseAnimation(desc);

        if (expanded) {
            if (instant) {
                desc.classList.add("expanded");
                desc.style.maxHeight = `${desc.scrollHeight}px`;
                return;
            }

            const startPx = desc.classList.contains("expanded")
                ? desc.scrollHeight
                : desc.offsetHeight;
            desc.classList.add("expanded");
            desc.style.maxHeight = `${Math.max(startPx, collapsedPx)}px`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    desc.style.maxHeight = `${desc.scrollHeight}px`;
                });
            });
            return;
        }

        if (instant) {
            desc.classList.remove("expanded");
            desc.style.maxHeight = `${collapsedPx}px`;
            return;
        }

        if (!desc.classList.contains("expanded")) {
            desc.style.maxHeight = `${collapsedPx}px`;
            return;
        }

        const fullPx = desc.scrollHeight;
        desc.style.maxHeight = `${fullPx}px`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                desc.style.maxHeight = `${collapsedPx}px`;
            });
        });

        const onEnd = (e) => {
            if (e.propertyName !== "max-height") return;
            const tid = desc.dataset.descCollapseFallback;
            if (tid) {
                clearTimeout(Number(tid));
                delete desc.dataset.descCollapseFallback;
            }
            desc.removeEventListener("transitionend", onEnd);
            desc._descCollapseTransitionEnd = null;
            desc.classList.remove("expanded");
            desc.style.maxHeight = `${collapsedPx}px`;
        };

        desc.addEventListener("transitionend", onEnd);
        desc._descCollapseTransitionEnd = onEnd;

        desc.dataset.descCollapseFallback = String(window.setTimeout(() => {
            desc.removeEventListener("transitionend", onEnd);
            desc._descCollapseTransitionEnd = null;
            desc.classList.remove("expanded");
            desc.style.maxHeight = `${collapsedPx}px`;
            delete desc.dataset.descCollapseFallback;
        }, 450));
    }

    function getCollapsedDescHeight(desc) {
        const styles = window.getComputedStyle(desc);
        const lineHeight = parseFloat(styles.lineHeight);
        const fontSize = parseFloat(styles.fontSize) || 16;
        const resolvedLineHeight = Number.isNaN(lineHeight) ? fontSize * 1.5 : lineHeight;
        return resolvedLineHeight * 2;
    }

    // =====================
    // MODAL
    // =====================

    let currentCarouselIndex = 0;
    let currentCarouselImages = [];
    let carouselAutoplayTimer = null;
    let wireframeCarouselResizeTimer = null;
    let wireframeCarouselResizeBound = false;
    let modalBackgroundScrollY = 0;

    function lockModalBackgroundScroll() {
        if (document.body.dataset.modalScrollLock === "1") return;
        document.body.dataset.modalScrollLock = "1";
        modalBackgroundScrollY = window.scrollY
            || window.pageYOffset
            || document.documentElement.scrollTop
            || 0;
        document.body.style.position = "fixed";
        document.body.style.top = `-${modalBackgroundScrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
    }

    function unlockModalBackgroundScroll() {
        if (document.body.dataset.modalScrollLock !== "1") return;
        document.body.dataset.modalScrollLock = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, modalBackgroundScrollY);
    }

    function bindWireframeCarouselResizeListener() {
        if (wireframeCarouselResizeBound) return;
        wireframeCarouselResizeBound = true;
        window.addEventListener("resize", () => {
            clearTimeout(wireframeCarouselResizeTimer);
            wireframeCarouselResizeTimer = setTimeout(syncWireframeCarouselTrackWidth, 100);
        });
    }

    function syncWireframeCarouselTrackWidth() {
        const modal = document.getElementById("project-modal");
        if (!modal || !modal.classList.contains("active")) return;

        const track = modal.querySelector(".modal-wireframe-layout .carousel-track");
        if (!track) return;

        const carousel = track.closest(".modal-carousel");
        const img = track.querySelector("img");
        const h = track.offsetHeight;
        if (!h) return;

        const wMax = h * (9 / 16);
        const wMin = h * (9 / 16) * 0.42;
        const maxAvail = carousel ? carousel.clientWidth : track.parentElement.clientWidth;

        let w = wMax;
        if (img && !track.classList.contains("img-error") && img.naturalWidth > 0 && img.naturalHeight > 0) {
            const ratio = img.naturalWidth / img.naturalHeight;
            w = h * ratio;
            w = Math.max(wMin, Math.min(wMax, w));
        }

        w = Math.min(w, maxAvail);
        track.style.width = `${Math.max(1, Math.round(w))}px`;
    }

    function scheduleWireframeCarouselSizing(img) {
        if (!img) return;
        const run = () => syncWireframeCarouselTrackWidth();
        if (img.complete && img.naturalWidth > 0) {
            requestAnimationFrame(run);
        } else {
            img.addEventListener("load", run, { once: true });
            img.addEventListener("error", run, { once: true });
        }
    }

    function initModal() {
        const modal = document.getElementById("project-modal");
        if (!modal || modal.dataset.portfolioModalInit === "1") return;
        modal.dataset.portfolioModalInit = "1";

        bindWireframeCarouselResizeListener();

        modal.addEventListener("click", (e) => {
            if (e.target === modal || e.target.classList.contains("modal-overlay")) {
                closeModal();
            }
        });

        const closeBtn = modal.querySelector(".modal-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", closeModal);
        }

        if (!window.__portfolioModalEscapeBound) {
            window.__portfolioModalEscapeBound = true;
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") closeModal();
            });
        }

        const prevBtn = modal.querySelector(".carousel-prev");
        const nextBtn = modal.querySelector(".carousel-next");

        if (prevBtn) prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigateCarousel(-1);
        });
        if (nextBtn) nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigateCarousel(1);
        });
    }

    function openMontageModal(project, opts) {
        opts = opts || {};
        stopCarouselAutoplay();
        const modal = document.getElementById("project-modal");
        if (!modal) return;

        const body = modal.querySelector(".modal-body");
        const isVertical = project.orientation === "vertical";
        const wrapClass = isVertical ? "video-wrapper vertical" : "video-wrapper";
        const embed = project.videoId
            ? `<iframe 
                                src="${getVideoEmbedSrc(project.videoId)}" 
                                title="${project.title}"
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen></iframe>`
            : `<div class="video-placeholder"><span>Vidéo à venir</span></div>`;

        const bubbleHtml = `
                <div class="modal-info-bubble">
                    <h3>${project.title}</h3>
                    <p>${project.description.replace(/\n/g, "<br>")}</p>
                </div>`;

        const useHomePortraitSplit = opts.homePortraitSplit === true && isVertical;

        if (useHomePortraitSplit) {
            body.innerHTML = `
            <div class="modal-video-layout modal-video-layout--portrait-split">
                <div class="modal-video-split-media">
                    <div class="${wrapClass}">${embed}</div>
                </div>
                ${bubbleHtml}
            </div>
        `;
        } else {
            body.innerHTML = `
            <div class="modal-video-layout">
                <div class="${wrapClass}">${embed}</div>
                ${bubbleHtml}
            </div>
        `;
        }

        modal.classList.add("active");
        lockModalBackgroundScroll();
    }

    function openDevModal(project) {
        stopCarouselAutoplay();
        const modal = document.getElementById("project-modal");
        if (!modal) return;

        const body = modal.querySelector(".modal-body");
        body.innerHTML = `
            <div class="modal-dev-layout">
                <div class="modal-dev-logo">
                    <img src="${project.logo}" alt="" loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                <div class="modal-info-bubble">
                    <h3>${project.title}</h3>
                    <p>${project.description.replace(/\n/g, "<br>")}</p>
                    <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="dev-card-cta modal-dev-cta">
                        Voir le site
                    </a>
                </div>
            </div>
        `;

        modal.classList.add("active");
        lockModalBackgroundScroll();
    }

    function openDesignModal(project) {
        stopCarouselAutoplay();
        const modal = document.getElementById("project-modal");
        if (!modal) return;

        const body = modal.querySelector(".modal-body");
        const modalRatioClass = getDesignModalRatioClass(project.ratio);
        const layoutModifierClass = project.ratio === "portrait-9-16"
            ? " modal-design-layout--portrait-split"
            : "";
        body.innerHTML = `
            <div class="modal-design-layout${layoutModifierClass}">
                <div class="modal-image-container ${modalRatioClass}">
                    <img src="${project.image}" alt="${project.title}" loading="lazy"
                         onerror="this.parentElement.classList.add('img-error')">
                </div>
                <div class="modal-info-bubble">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                </div>
            </div>
        `;

        modal.classList.add("active");
        lockModalBackgroundScroll();
    }

    function getDesignModalRatioClass(ratio) {
        switch (ratio) {
            case "square":
                return "square";
            case "widescreen-16-9":
                return "widescreen-16-9";
            case "portrait-9-16":
                return "portrait-9-16";
            default:
                return "landscape";
        }
    }

    function openWireframeModal(project) {
        stopCarouselAutoplay();
        const modal = document.getElementById("project-modal");
        if (!modal) return;

        currentCarouselImages = project.images;
        currentCarouselIndex = 0;

        const body = modal.querySelector(".modal-body");
        body.innerHTML = `
            <div class="modal-wireframe-layout">
                <div class="modal-carousel">
                    <button class="carousel-btn carousel-prev" aria-label="Précédent">‹</button>
                    <div class="carousel-track">
                        <img src="${project.images[0] || ''}" alt="${project.title}" loading="lazy"
                             onerror="this.parentElement.classList.add('img-error')">
                    </div>
                    <button class="carousel-btn carousel-next" aria-label="Suivant">›</button>
                    <div class="carousel-dots">
                        ${project.images.map((_, i) =>
                `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
            ).join('')}
                    </div>
                </div>
                <div class="modal-info-bubble">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                </div>
            </div>
        `;

        // Re-bind carousel buttons inside modal body
        const prevBtn = body.querySelector(".carousel-prev");
        const nextBtn = body.querySelector(".carousel-next");

        if (prevBtn) prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigateCarousel(-1);
            restartCarouselAutoplay();
        });
        if (nextBtn) nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigateCarousel(1);
            restartCarouselAutoplay();
        });

        // Dot navigation
        body.querySelectorAll(".carousel-dot").forEach(dot => {
            dot.addEventListener("click", (e) => {
                e.stopPropagation();
                const index = parseInt(dot.dataset.index);
                goToCarouselSlide(index);
                restartCarouselAutoplay();
            });
        });

        startCarouselAutoplay();
        bindWireframeCarouselResizeListener();

        modal.classList.add("active");
        lockModalBackgroundScroll();

        const wfImg = body.querySelector(".carousel-track img");
        scheduleWireframeCarouselSizing(wfImg);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => syncWireframeCarouselTrackWidth());
        });
    }

    function closeModal() {
        const modal = document.getElementById("project-modal");
        if (!modal) return;

        stopCarouselAutoplay();
        modal.classList.remove("active");
        unlockModalBackgroundScroll();
    }

    function navigateCarousel(direction) {
        const newIndex = currentCarouselIndex + direction;
        if (newIndex < 0 || newIndex >= currentCarouselImages.length) return;
        goToCarouselSlide(newIndex);
    }

    function goToCarouselSlide(index) {
        currentCarouselIndex = index;

        const modal = document.getElementById("project-modal");
        if (!modal) return;

        const img = modal.querySelector(".carousel-track img");
        if (img) {
            img.classList.add("is-fading");
            setTimeout(() => {
                img.src = currentCarouselImages[index];
                img.classList.remove("is-fading");
                scheduleWireframeCarouselSizing(img);
            }, 220);
        }

        // Update dots
        modal.querySelectorAll(".carousel-dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });

        // Update button states
        const prevBtn = modal.querySelector(".carousel-prev");
        const nextBtn = modal.querySelector(".carousel-next");
        if (prevBtn) prevBtn.style.opacity = index === 0 ? "0.3" : "1";
        if (nextBtn) nextBtn.style.opacity = index === currentCarouselImages.length - 1 ? "0.3" : "1";
    }

    function startCarouselAutoplay() {
        stopCarouselAutoplay();
        if (currentCarouselImages.length <= 1) return;

        carouselAutoplayTimer = window.setInterval(() => {
            const nextIndex = (currentCarouselIndex + 1) % currentCarouselImages.length;
            goToCarouselSlide(nextIndex);
        }, 4000);
    }

    function stopCarouselAutoplay() {
        if (!carouselAutoplayTimer) return;
        clearInterval(carouselAutoplayTimer);
        carouselAutoplayTimer = null;
    }

    function restartCarouselAutoplay() {
        startCarouselAutoplay();
    }

    window.portfolioProjectModal = {
        openMontage: (project, options) => openMontageModal(project, options),
        openDesign: openDesignModal,
        openWireframe: openWireframeModal,
        openDev: openDevModal
    };

})();
