const TOTAL_PROJECT_IMAGES = 12;

function getProjectImage(index) {
    return `images/project1/${index}.jpg`;
}

function getProjectGallery(startIndex, size = 4) {
    return Array.from({ length: size }, (_, offset) => {
        const imageIndex = ((startIndex - 1 + offset) % TOTAL_PROJECT_IMAGES) + 1;
        return getProjectImage(imageIndex);
    });
}

function getProjectUrl(id) {
    return `project1.html?id=${id}`;
}

function sanitizeImagePath(src, fallback = '') {
    const value = String(src || '').trim().replace(/\\/g, '/');

    if (!value || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) {
        return fallback;
    }

    const parts = value.split('/').filter(Boolean);
    if (parts.some(part => part === '.' || part === '..')) {
        return fallback;
    }

    const normalized = parts.join('/');
    if (!normalized.startsWith('images/') || !/\.(jpe?g|png|gif|webp)$/i.test(normalized)) {
        return fallback;
    }

    return normalized;
}

const defaultProjects = [
    {
        id: 1,
        title: "Full in Love with You",
        category: "十三周年快乐",
        year: "2026",
        creationDate: "2026-01-01",
        description: "A exploration of form and color through abstract compositions. This project challenges traditional boundaries between digital and physical art, creating a visual language that speaks to the essence of modern brand expression.",
        heroImage: getProjectImage(1),
        gallery: getProjectGallery(1),
        services: ["Brand Strategy", "Visual Identity", "Art Direction"],
        client: "Private Collection",
        location: "New York, USA"
    },
    {
        id: 2,
        title: "Geometric Harmony",
        category: "Visual Design",
        year: "2024",
        creationDate: "2024-01-01",
        description: "An exploration of geometric forms and their harmonious relationships. Through precise mathematical principles and intuitive design sense, this project creates a visual system that balances complexity with simplicity.",
        heroImage: getProjectImage(2),
        gallery: getProjectGallery(2),
        services: ["Graphic Design", "UI/UX", "Motion Graphics"],
        client: "Tech Startup",
        location: "Berlin, Germany"
    },
    {
        id: 3,
        title: "Minimal Space",
        category: "Interior Design",
        year: "2023",
        creationDate: "2023-01-01",
        description: "A celebration of negative space and minimal aesthetics. This interior design project transforms ordinary spaces into serene environments where every element serves a purpose and nothing is superfluous.",
        heroImage: getProjectImage(3),
        gallery: getProjectGallery(3),
        services: ["Space Planning", "Material Selection", "Lighting Design"],
        client: "Private Residence",
        location: "Tokyo, Japan"
    },
    {
        id: 4,
        title: "Color Study",
        category: "Art Direction",
        year: "2024",
        creationDate: "2024-01-01",
        description: "A deep dive into the psychology and emotion of color. Through careful curation and placement, this art direction project demonstrates how color can transform perception and evoke specific emotional responses.",
        heroImage: getProjectImage(4),
        gallery: getProjectGallery(4),
        services: ["Color Theory", "Creative Direction", "Visual Storytelling"],
        client: "Fashion Brand",
        location: "Paris, France"
    },
    {
        id: 5,
        title: "Portrait Series",
        category: "Photography",
        year: "2023",
        creationDate: "2023-01-01",
        description: "An intimate exploration of human expression through portrait photography. Each image captures a moment of vulnerability and strength, revealing the complex narratives written on every face.",
        heroImage: getProjectImage(5),
        gallery: getProjectGallery(5),
        services: ["Portrait Photography", "Post-Production", "Print Design"],
        client: "Gallery Exhibition",
        location: "London, UK"
    },
    {
        id: 6,
        title: "Digital Form",
        category: "3D Design",
        year: "2024",
        creationDate: "2024-01-01",
        description: "A fusion of technology and artistry through three-dimensional digital design. This project explores the boundaries of virtual space, creating immersive experiences that challenge our understanding of physical form.",
        heroImage: getProjectImage(6),
        gallery: getProjectGallery(6),
        services: ["3D Modeling", "Motion Design", "Interactive Installation"],
        client: "Digital Agency",
        location: "Los Angeles, USA"
    },
    {
        id: 7,
        title: "Creative Direction",
        category: "Brand Strategy",
        year: "2024",
        creationDate: "2024-01-01",
        description: "Strategic creative direction that aligns brand vision with audience perception. This project demonstrates how cohesive creative direction can elevate a brand's market position and emotional resonance.",
        heroImage: getProjectImage(7),
        gallery: getProjectGallery(7),
        services: ["Brand Strategy", "Creative Direction", "Campaign Planning"],
        client: "Luxury Brand",
        location: "Milan, Italy"
    },
    {
        id: 8,
        title: "Visual Identity",
        category: "Graphic Design",
        year: "2023",
        creationDate: "2023-01-01",
        description: "A comprehensive visual identity system that captures brand essence through typography, color, and imagery. This project showcases how consistent visual language creates memorable brand experiences.",
        heroImage: getProjectImage(8),
        gallery: getProjectGallery(8),
        services: ["Logo Design", "Typography", "Brand Guidelines"],
        client: "Boutique Agency",
        location: "Copenhagen, Denmark"
    },
    {
        id: 9,
        title: "Motion Graphics",
        category: "Animation",
        year: "2024",
        creationDate: "2024-01-01",
        description: "Dynamic motion graphics that bring static designs to life. This project explores the art of movement, timing, and narrative through animated visual storytelling.",
        heroImage: getProjectImage(9),
        gallery: getProjectGallery(9),
        services: ["Motion Design", "Animation", "Video Production"],
        client: "Media Company",
        location: "San Francisco, USA"
    },
    {
        id: 10,
        title: "Web Design",
        category: "UI/UX",
        year: "2024",
        creationDate: "2024-01-01",
        description: "User-centered web design that balances aesthetics with functionality. This project demonstrates how thoughtful interface design can create seamless and engaging digital experiences.",
        heroImage: getProjectImage(10),
        gallery: getProjectGallery(10),
        services: ["UI Design", "UX Research", "Prototyping"],
        client: "SaaS Platform",
        location: "Austin, USA"
    },
    {
        id: 11,
        title: "Product Design",
        category: "Industrial",
        year: "2023",
        creationDate: "2023-01-01",
        description: "Industrial design that bridges form and function. This project explores how thoughtful product design can enhance daily life through beautiful and practical objects.",
        heroImage: getProjectImage(11),
        gallery: getProjectGallery(11),
        services: ["Product Design", "3D Modeling", "Material Selection"],
        client: "Furniture Brand",
        location: "Stockholm, Sweden"
    },
    {
        id: 12,
        title: "Brand Campaign",
        category: "Marketing",
        year: "2024",
        creationDate: "2024-01-01",
        description: "Integrated brand campaigns that connect with audiences across multiple touchpoints. This project showcases how strategic messaging and creative execution drive brand engagement.",
        heroImage: getProjectImage(12),
        gallery: getProjectGallery(12),
        services: ["Campaign Strategy", "Content Creation", "Social Media"],
        client: "Consumer Brand",
        location: "Sydney, Australia"
    }
];

const projectDefaultsById = new Map(defaultProjects.map(project => [project.id, project]));

function getProjectYear(project, fallbackYear) {
    if (project.year) {
        return String(project.year);
    }

    if (project.creationDate) {
        const matchedYear = String(project.creationDate).match(/^(\d{4})/);
        if (matchedYear) {
            return matchedYear[1];
        }

        const parsedDate = new Date(project.creationDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            return String(parsedDate.getFullYear());
        }
    }

    return fallbackYear;
}

function normalizeProject(project) {
    const fallbackProject = projectDefaultsById.get(Number(project.id)) || defaultProjects[0];
    const rawGallery = Array.isArray(project.gallery) && project.gallery.length > 0 ? project.gallery : fallbackProject.gallery;
    const gallery = rawGallery
        .map(img => sanitizeImagePath(img))
        .filter(Boolean);
    const heroImage = sanitizeImagePath(project.coverImage || project.heroImage || gallery[0], fallbackProject.heroImage);

    return {
        ...fallbackProject,
        ...project,
        id: Number(project.id || fallbackProject.id),
        year: getProjectYear(project, fallbackProject.year),
        coverImage: sanitizeImagePath(project.coverImage, heroImage),
        heroImage,
        gallery: gallery.length > 0 ? gallery : fallbackProject.gallery,
        services: Array.isArray(project.services) && project.services.length > 0 ? project.services : fallbackProject.services
    };
}

const injectedProjects = Array.isArray(window.XIAOFART_SITE_DATA?.projects) ? window.XIAOFART_SITE_DATA.projects : [];
const projects = (injectedProjects.length > 0 ? injectedProjects : defaultProjects).map(normalizeProject);

let currentIndex = 0;
let isAnimating = false;
let startX = 0;
let scrollLeft = 0;
let isDragging = false;
let progressBar = null;
let totalSections = 0;
let isProjectTransitioning = false;

const ThemeSystem = {
    isDark: true,
    isManualOverride: false,
    manualOverrideValue: null,
    dayStart: 6,
    dayEnd: 18,
    checkInterval: null,
    lastMode: null,

    init() {
        this.loadPreferences();
        this.applyTheme(this.isDark);
        this.startAutoCheck();
        this.setupManualToggle();
        this.lastMode = this.isDark ? 'dark' : 'light';
    },

    loadPreferences() {
        const saved = localStorage.getItem('themePreference');
        if (saved) {
            const pref = JSON.parse(saved);
            if (pref.isManualOverride && pref.manualOverrideValue !== null) {
                this.isManualOverride = true;
                this.manualOverrideValue = pref.manualOverrideValue;
                this.isDark = pref.manualOverrideValue;
                return;
            }
        }

        this.isDark = this.isNightTime();
    },

    savePreferences() {
        const pref = {
            isManualOverride: this.isManualOverride,
            manualOverrideValue: this.manualOverrideValue
        };
        localStorage.setItem('themePreference', JSON.stringify(pref));
    },

    isNightTime() {
        const hour = new Date().getHours();
        return hour < this.dayStart || hour >= this.dayEnd;
    },

    getCurrentMode() {
        return this.isDark ? 'dark' : 'light';
    },

    shouldAutoSwitch() {
        const currentMode = this.getCurrentMode();
        if (this.lastMode !== currentMode) {
            this.lastMode = currentMode;
            if (!this.isManualOverride) {
                return true;
            }
        }
        return false;
    },

    applyTheme(isDark, instant = false) {
        this.isDark = isDark;
        const root = document.documentElement;

        if (instant) {
            root.style.transition = 'none';
        } else {
            root.style.transition = 'background-color 0.8s ease, color 0.8s ease';
        }

        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            root.setAttribute('data-theme', 'light');
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }

        if (instant) {
            root.offsetHeight;
            root.style.transition = 'background-color 0.8s ease, color 0.8s ease';
        }

        this.updateUI();
    },

    toggle() {
        this.isManualOverride = true;
        this.manualOverrideValue = !this.isDark;
        this.applyTheme(!this.isDark);
        this.savePreferences();
    },

    updateUI() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        }
    },

    startAutoCheck() {
        this.checkInterval = setInterval(() => {
            if (this.isManualOverride) return;

            const shouldSwitch = this.shouldAutoSwitch();
            if (shouldSwitch) {
                const newIsDark = this.isNightTime();
                if (newIsDark !== this.isDark) {
                    this.applyTheme(newIsDark);
                }
            }
        }, 60000);
    },

    setupManualToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
    },

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
};

function init() {
    initLoader();
    renderHomeProjects();
    initCursor();
    initIncomingProjectTransition();
    initProjectTransitionReset();
    initInlineProjectRouting();
    initScrollProgress();
    initHorizontalScroll();
    initHoverEffects();
    initClickHandlers();
    initScrollHint();
    ThemeSystem.init();
    trackWebsiteView();
}

function resetProjectListTransitionState() {
    document.body.classList.remove('is-leaving-project-list');
    document.querySelectorAll('.project-frame').forEach(frame => {
        frame.style.opacity = '';
        frame.querySelector('.frame-overlay')?.style.removeProperty('display');
    });
}

function initProjectTransitionReset() {
    if (!document.getElementById('horizontalContainer')) return;

    window.addEventListener('pageshow', () => {
        isProjectTransitioning = false;
        document.documentElement.classList.remove('project-transition-primed');
        document.documentElement.style.removeProperty('--transition-image-src');
        resetProjectListTransitionState();
        document.querySelectorAll('.page-transition-layer').forEach(layer => layer.remove());
    });
}

function initInlineProjectRouting() {
    if (!document.getElementById('horizontalContainer')) return;

    window.addEventListener('popstate', syncInlineProjectWithLocation);
}

function renderHomeProjects() {
    const sections = document.querySelectorAll('.scroll-section');
    if (!sections.length) return;

    sections.forEach((section, index) => {
        const project = projects[index];
        if (!project) {
            section.remove();
            return;
        }

        const frame = section.querySelector('.project-frame');
        const image = section.querySelector('.project-image');
        const title = section.querySelector('.project-title');
        const meta = section.querySelector('.project-meta');

        if (frame) {
            frame.dataset.id = project.id;
        }

        if (image) {
            image.dataset.src = project.heroImage;
            image.loading = index === 0 ? 'eager' : 'lazy';
            image.decoding = 'async';
            image.fetchPriority = index === 0 ? 'high' : 'low';
            image.alt = project.title;
            image.removeAttribute('src');
        }

        if (title) {
            title.textContent = project.title;
        }

        if (meta) {
            meta.textContent = `${project.category} / ${project.year}`;
        }
    });

    loadNearbyHomeImages(0);
}

function loadHomeProjectImage(index) {
    const section = document.querySelector(`.scroll-section[data-index="${index}"]`);
    const image = section?.querySelector('.project-image');
    const src = image?.dataset.src;

    if (!image || !src || image.hasAttribute('src')) return;

    image.src = src;
}

function loadNearbyHomeImages(index) {
    const candidates = [index, index + 1, index - 1];
    candidates.forEach(loadHomeProjectImage);
}

function trackWebsiteView() {
    if (!['http:', 'https:'].includes(window.location.protocol)) {
        return;
    }

    if (window.location.hostname.endsWith('github.io')) {
        return;
    }

    // 使用 navigator.sendBeacon 发送统计请求
    // 这样即使页面关闭，请求也能完成，并且不会阻塞页面加载
    if (navigator.sendBeacon) {
        const url = '/api/views/track';
        const data = new Blob(['{}'], { type: 'application/json' });
        navigator.sendBeacon(url, data);
    } else {
        // 回退到 fetch 方法
        fetch('/api/views/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            keepalive: true
        }).catch(() => {
            // 静默处理错误，避免控制台报错
        });
    }
}

function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const isInitialLoad = !sessionStorage.getItem('initialLoad');

    if (isInitialLoad) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                sessionStorage.setItem('initialLoad', 'true');
            }, 800);
        });
    } else {
        loader.classList.add('hidden');
    }
}

function initCursor() {
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursorFollower');

    if (!cursor || !cursorFollower) return;

    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        document.documentElement.classList.add('is-touch-device');
        cursor.remove();
        cursorFollower.remove();
        return;
    }

    const savedPosition = readSavedCursorPosition();
    let mouseX = savedPosition?.x || 0;
    let mouseY = savedPosition?.y || 0;
    let followerX = mouseX;
    let followerY = mouseY;
    let hasCursorPosition = Boolean(savedPosition);

    function readSavedCursorPosition() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('xiaofartCursorPosition') || 'null');
            if (
                saved &&
                Number.isFinite(saved.x) &&
                Number.isFinite(saved.y) &&
                saved.x >= 0 &&
                saved.y >= 0 &&
                saved.x <= window.innerWidth &&
                saved.y <= window.innerHeight
            ) {
                return saved;
            }
        } catch (error) {
            sessionStorage.removeItem('xiaofartCursorPosition');
        }

        return null;
    }

    function setCursorPosition(x, y) {
        mouseX = x;
        mouseY = y;

        cursor.style.left = mouseX - 10 + 'px';
        cursor.style.top = mouseY - 10 + 'px';

        if (!hasCursorPosition) {
            followerX = mouseX;
            followerY = mouseY;
            cursorFollower.style.left = followerX - 4 + 'px';
            cursorFollower.style.top = followerY - 4 + 'px';
        }

        hasCursorPosition = true;
        cursor.classList.add('is-visible');
        cursorFollower.classList.add('is-visible');
        sessionStorage.setItem('xiaofartCursorPosition', JSON.stringify({ x: mouseX, y: mouseY }));
    }

    if (hasCursorPosition) {
        cursor.style.left = mouseX - 10 + 'px';
        cursor.style.top = mouseY - 10 + 'px';
        cursorFollower.style.left = followerX - 4 + 'px';
        cursorFollower.style.top = followerY - 4 + 'px';
        cursor.classList.add('is-visible');
        cursorFollower.classList.add('is-visible');
    }

    document.addEventListener('mousemove', (e) => {
        setCursorPosition(e.clientX, e.clientY);
    });

    function animateFollower() {
        if (!hasCursorPosition) {
            requestAnimationFrame(animateFollower);
            return;
        }

        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        cursorFollower.style.left = followerX - 4 + 'px';
        cursorFollower.style.top = followerY - 4 + 'px';

        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-visible');
        cursorFollower.classList.remove('is-visible');
    });

    document.addEventListener('mouseenter', () => {
        if (hasCursorPosition) {
            cursor.classList.add('is-visible');
            cursorFollower.classList.add('is-visible');
        }
    });

    const hoverElements = document.querySelectorAll('.project-frame, a, .nav-links a');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });

    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
    });
}

function initHorizontalScroll() {
    const container = document.getElementById('horizontalContainer');
    const track = document.getElementById('scrollTrack');

    if (!container || !track) return;

    const sections = track.querySelectorAll('.scroll-section');
    const totalSections = sections.length;
    let currentIndex = 0;
    let isScrolling = false;
    let scrollTimeout;
    let wheelAccumulator = 0;

    const scrollLockMs = 220;
    const wheelThreshold = 24;
    const dragResistance = 1;
    const dragThreshold = 0.06;

    function getSectionWidth() {
        return container.offsetWidth || window.innerWidth;
    }

    function clampPosition(position) {
        return Math.max(0, Math.min(totalSections - 1, position));
    }

    function setTrackPosition(position, animated = false) {
        const sectionWidth = getSectionWidth();
        track.style.transition = animated
            ? 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none';
        track.style.transform = `translateX(-${position * sectionWidth}px)`;
        updateProgress(position, totalSections);
    }

    function scrollToSection(index, force = false) {
        if (index < 0 || index >= totalSections) return;
        if (isScrolling && !force) return;

        isScrolling = true;
        currentIndex = clampPosition(index);
        loadNearbyHomeImages(currentIndex);
        setTrackPosition(currentIndex, true);

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            wheelAccumulator = 0;
        }, scrollLockMs);
    }

    function handleNavigation(direction) {
        if (isScrolling) return;

        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < totalSections) {
            scrollToSection(newIndex);
        }
    }

    container.addEventListener('wheel', (e) => {
        e.preventDefault();

        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (isScrolling || Math.abs(delta) < 1) {
            return;
        }

        wheelAccumulator += delta;

        if (Math.abs(wheelAccumulator) >= wheelThreshold) {
            handleNavigation(wheelAccumulator > 0 ? 1 : -1);
            wheelAccumulator = 0;
        }
    }, { passive: false });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isTouching = false;
    let touchStartIndex = 0;

    function getDampedPosition(startIndex, deltaX) {
        const rawProgress = deltaX / getSectionWidth();
        const boundedProgress = Math.max(-1, Math.min(1, rawProgress));
        return clampPosition(startIndex + boundedProgress * dragResistance);
    }

    function finishGesture(startIndex, deltaX, deltaY) {
        const sectionWidth = getSectionWidth();
        const shouldMove = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > sectionWidth * dragThreshold;
        const direction = shouldMove ? (deltaX > 0 ? 1 : -1) : 0;
        scrollToSection(clampPosition(startIndex + direction), true);
    }

    container.addEventListener('touchstart', (e) => {
        if (isScrolling) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchEndX = touchStartX;
        touchEndY = touchStartY;
        touchStartIndex = currentIndex;
        isTouching = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isTouching || isScrolling) return;
        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;

        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            setTrackPosition(getDampedPosition(touchStartIndex, deltaX));
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        if (!isTouching) return;
        isTouching = false;

        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;
        finishGesture(touchStartIndex, deltaX, deltaY);
    }, { passive: true });

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragStartIndex = 0;
    let hasDragged = false;

    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || isScrolling) return;
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        startY = e.clientY;
        dragStartIndex = currentIndex;
        container.style.cursor = 'grabbing';
    });

    function finishMouseDrag(endX, endY) {
        const deltaX = startX - endX;
        const deltaY = startY - endY;

        isDragging = false;
        container.style.cursor = 'grab';
        finishGesture(dragStartIndex, deltaX, deltaY);

        if (hasDragged) {
            container.dataset.suppressClick = 'true';
            setTimeout(() => {
                delete container.dataset.suppressClick;
            }, 120);
        }
    }

    container.addEventListener('mouseleave', (e) => {
        if (isDragging) {
            finishMouseDrag(e.clientX, e.clientY);
        }
    });

    container.addEventListener('mouseup', (e) => {
        if (isDragging) {
            finishMouseDrag(e.clientX, e.clientY);
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDragging || isScrolling) return;
        e.preventDefault();

        const deltaX = startX - e.clientX;
        const deltaY = startY - e.clientY;

        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
            hasDragged = true;
        }

        setTrackPosition(getDampedPosition(dragStartIndex, deltaX));
    });

    window.addEventListener('resize', () => {
        setTrackPosition(currentIndex);
    });
}

function initHoverEffects() {
    const frames = document.querySelectorAll('.project-frame');

    frames.forEach(frame => {
        frame.addEventListener('mouseenter', () => {
            frame.classList.add('hovered');
        });

        frame.addEventListener('mouseleave', () => {
            frame.classList.remove('hovered');
        });
    });
}

function initClickHandlers() {
    const frames = document.querySelectorAll('.project-frame');
    const container = document.getElementById('horizontalContainer');

    frames.forEach(frame => {
        frame.addEventListener('click', (e) => {
            if (container?.dataset.suppressClick === 'true') {
                e.preventDefault();
                return;
            }

            if (e.target.closest('a[href^="mailto:"]') || e.target.closest('a[href^="tel:"]')) {
                return;
            }

            const id = frame.dataset.id;
            navigateToProject(id);
        });
    });
}

function getTransitionTargetRect() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(viewportWidth * 0.54, 560);
    const height = Math.min(viewportHeight * 0.68, 680);

    return {
        left: (viewportWidth - width) / 2,
        top: (viewportHeight - height) / 2 - Math.min(viewportHeight * 0.03, 24),
        width,
        height
    };
}

function applyRectToElement(element, rect) {
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
}

function createProjectTransitionLayer(title = '', variant = 'cover') {
    const layer = document.createElement('div');
    const titleElement = document.createElement('div');

    layer.className = 'page-transition-layer';
    if (variant === 'soft') {
        layer.classList.add('page-transition-layer--soft');
    }
    titleElement.className = 'page-transition-title';
    titleElement.textContent = title;
    layer.appendChild(titleElement);
    document.body.appendChild(layer);

    return layer;
}

function getProjectGalleryData(project) {
    const gallery = Array.isArray(project.gallery) && project.gallery.length > 0
        ? project.gallery
        : [project.heroImage || 'images/project1/1.jpg'];

    return gallery.map((src, index) => ({
        src: sanitizeImagePath(src, project.heroImage || 'images/project1/1.jpg'),
        title: project.imageTitles && project.imageTitles[index] ? project.imageTitles[index] : project.title,
        description: project.description || ''
    })).filter(item => item.src);
}

function bindGallerySwipe(container, onNext, onPrev) {
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;

        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        isSwiping = true;
    }, { passive: true });

    container.addEventListener('touchmove', (event) => {
        if (!isSwiping || event.touches.length !== 1) return;

        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;

        const deltaX = startX - currentX;
        const deltaY = startY - currentY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
            event.preventDefault();
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        if (!isSwiping) return;

        const deltaX = startX - currentX;
        const deltaY = startY - currentY;
        const threshold = Math.min(90, Math.max(44, window.innerWidth * 0.12));

        isSwiping = false;

        if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < threshold) {
            return;
        }

        if (deltaX > 0) {
            onNext();
        } else {
            onPrev();
        }
    }, { passive: true });
}

function createGallerySwitcher({ imageData, currentImage, galleryTitle, imageCounter, slideDots, titleFallback = '' }) {
    const imageWrap = currentImage?.closest('.gallery-image');
    const content = galleryTitle?.closest('.gallery-content');
    let currentIndex = 0;
    let isSwitching = false;

    function normalizeIndex(index) {
        const total = imageData.length;
        return ((index % total) + total) % total;
    }

    function preload(index) {
        if (!imageData.length) return;

        [index, index + 1, index - 1].forEach(candidate => {
            const image = imageData[normalizeIndex(candidate)];
            if (!image || image.isPreloaded) return;

            const preloadImage = new Image();
            preloadImage.decoding = 'async';
            preloadImage.src = image.src;
            image.preloadImage = preloadImage;
            image.isPreloaded = true;
        });
    }

    function getDirection(targetIndex, direction) {
        if (direction) return direction;
        if (targetIndex === currentIndex) return 0;
        if (targetIndex === normalizeIndex(currentIndex + 1)) return 1;
        if (targetIndex === normalizeIndex(currentIndex - 1)) return -1;
        return targetIndex > currentIndex ? 1 : -1;
    }

    function commit(index) {
        const image = imageData[index] || imageData[0];
        if (!image) return;

        currentIndex = index;
        currentImage.src = image.src;
        currentImage.alt = `${titleFallback || image.title || 'Project'} - Image ${index + 1}`;
        galleryTitle.textContent = image.title || titleFallback;
        imageCounter.textContent = `${index + 1} / ${imageData.length}`;
        slideDots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });
        preload(index);
    }

    function update(index, direction = 0, instant = false) {
        if (!imageData.length || !currentImage || !galleryTitle || !imageCounter) {
            return false;
        }
        if (isSwitching && !instant) return false;

        const targetIndex = normalizeIndex(index);
        const hasCurrentImage = currentImage.hasAttribute('src');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const resolvedDirection = getDirection(targetIndex, direction);

        preload(targetIndex);

        if (instant || !hasCurrentImage || prefersReducedMotion) {
            commit(targetIndex);
            return true;
        }

        isSwitching = true;
        imageWrap?.style.setProperty('--gallery-switch-x', resolvedDirection >= 0 ? '-8px' : '8px');
        content?.style.setProperty('--gallery-switch-y', '4px');
        imageWrap?.classList.add('is-switching');
        content?.classList.add('is-switching');

        window.requestAnimationFrame(() => {
            commit(targetIndex);
            imageWrap?.style.setProperty('--gallery-switch-x', '0px');
            content?.style.setProperty('--gallery-switch-y', '0px');

            window.requestAnimationFrame(() => {
                imageWrap?.classList.remove('is-switching');
                content?.classList.remove('is-switching');
            });

            window.setTimeout(() => {
                isSwitching = false;
            }, 180);
        });

        return true;
    }

    return {
        update,
        next() {
            return update(currentIndex + 1, 1);
        },
        prev() {
            return update(currentIndex - 1, -1);
        },
        getCurrentIndex() {
            return currentIndex;
        }
    };
}

function createInfoItem(label, value) {
    const item = document.createElement('div');
    const labelElement = document.createElement('span');
    const valueElement = document.createElement('span');

    item.className = 'info-item';
    labelElement.className = 'info-label';
    valueElement.className = 'info-value';
    labelElement.textContent = label;
    valueElement.textContent = value;
    item.append(labelElement, valueElement);

    return item;
}

function createInlineProjectPage(project) {
    const page = document.createElement('div');
    const section = document.createElement('section');
    const container = document.createElement('div');
    const imageWrap = document.createElement('div');
    const currentImage = document.createElement('img');
    const content = document.createElement('div');
    const title = document.createElement('h1');
    const info = document.createElement('div');
    const controls = document.createElement('div');
    const prevBtn = document.createElement('div');
    const indicator = document.createElement('div');
    const nextBtn = document.createElement('div');
    const modal = document.createElement('div');
    const modalContent = document.createElement('div');
    const modalImage = document.createElement('img');
    const modalClose = document.createElement('div');

    page.id = 'inlineProjectPage';
    page.className = 'inline-project-page';
    section.className = 'project-gallery';
    container.className = 'gallery-container';
    imageWrap.className = 'gallery-image';
    currentImage.alt = `${project.title} - Image 1`;
    content.className = 'gallery-content';
    title.className = 'gallery-title';
    info.className = 'gallery-info';
    controls.className = 'gallery-controls';
    prevBtn.className = 'control-btn';
    nextBtn.className = 'control-btn';
    indicator.className = 'slide-indicator';
    modal.className = 'image-modal';
    modalContent.className = 'modal-content';
    modalImage.className = 'modal-image';
    modalImage.alt = 'Full size image';
    modalClose.className = 'modal-close';
    modalClose.textContent = '\u00d7';

    prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
    nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

    title.textContent = project.title;
    info.append(
        createInfoItem('Image', '1 / 1'),
        createInfoItem('Category', project.category || ''),
        createInfoItem('Year', project.year || '')
    );

    imageWrap.appendChild(currentImage);
    content.append(title, info);
    controls.append(prevBtn, indicator, nextBtn);
    container.append(imageWrap, controls, content);
    section.append(container);
    modalContent.append(modalImage, modalClose);
    modal.appendChild(modalContent);
    page.append(section, modal);

    return page;
}

function initializeInlineProjectGallery(page, project) {
    const imageData = getProjectGalleryData(project);
    let wheelLocked = false;

    const currentImage = page.querySelector('.gallery-image img');
    const galleryTitle = page.querySelector('.gallery-title');
    const imageCounter = page.querySelector('.gallery-info .info-item:first-child .info-value');
    const slideIndicator = page.querySelector('.slide-indicator');
    const prevBtn = page.querySelector('.gallery-controls .control-btn:first-child');
    const nextBtn = page.querySelector('.gallery-controls .control-btn:last-child');
    const imageModal = page.querySelector('.image-modal');
    const modalImage = page.querySelector('.modal-image');
    const modalClose = page.querySelector('.modal-close');

    slideIndicator.innerHTML = '';
    imageData.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `slide-dot${index === 0 ? ' active' : ''}`;
        slideIndicator.appendChild(dot);
    });

    const slideDots = [...slideIndicator.querySelectorAll('.slide-dot')];
    const gallerySwitcher = createGallerySwitcher({
        imageData,
        currentImage,
        galleryTitle,
        imageCounter,
        slideDots,
        titleFallback: project.title
    });

    slideDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            gallerySwitcher.update(index);
        });
    });

    function nextImage() {
        gallerySwitcher.next();
    }

    function prevImage() {
        gallerySwitcher.prev();
    }

    prevBtn.addEventListener('click', prevImage);
    nextBtn.addEventListener('click', nextImage);
    const galleryContainer = page.querySelector('.gallery-container');

    galleryContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (wheelLocked || Math.abs(event.deltaY) < 8) return;

        wheelLocked = true;
        if (event.deltaY > 0) {
            nextImage();
        } else {
            prevImage();
        }
        setTimeout(() => {
            wheelLocked = false;
        }, 180);
    }, { passive: false });

    bindGallerySwipe(galleryContainer, nextImage, prevImage);

    currentImage.addEventListener('click', () => {
        modalImage.src = imageData[gallerySwitcher.getCurrentIndex()].src;
        imageModal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        imageModal.classList.remove('active');
    });
    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            imageModal.classList.remove('active');
        }
    });

    gallerySwitcher.update(0, 0, true);
}

function showInlineProjectPage(project, transitionLayer = null, transitionImage = null, shouldPushState = true) {
    const previousPage = document.getElementById('inlineProjectPage');
    if (previousPage) {
        previousPage.remove();
    }

    const main = document.querySelector('.main');
    const page = createInlineProjectPage(project);
    document.body.appendChild(page);
    initializeInlineProjectGallery(page, project);
    document.body.classList.add('inline-project-mode');

    if (main) {
        main.style.opacity = '0';
        main.setAttribute('aria-hidden', 'true');
    }

    document.title = `${project.title} | XiaofArt`;

    if (shouldPushState) {
        history.pushState({ xiaofartView: 'project', projectId: project.id }, '', getProjectUrl(project.id));
    }

    window.requestAnimationFrame(() => {
        page.classList.add('is-visible');
    });

    setTimeout(() => {
        page.querySelector('.gallery-image')?.classList.add('fade-in');
        page.querySelector('.gallery-content')?.classList.add('fade-in');
    }, 120);

    if (transitionLayer && transitionImage) {
        setTimeout(() => {
            transitionLayer.classList.add('is-fading');
            transitionImage.style.opacity = '0';
            transitionImage.style.filter = 'drop-shadow(0 0 0 rgba(0, 0, 0, 0))';
        }, 180);

        setTimeout(() => {
            transitionLayer.remove();
            resetProjectListTransitionState();
            isProjectTransitioning = false;
        }, 760);
    } else {
        resetProjectListTransitionState();
        isProjectTransitioning = false;
    }
}

function restorePortfolioView() {
    const page = document.getElementById('inlineProjectPage');
    const main = document.querySelector('.main');

    if (!page) return;

    page.classList.remove('is-visible');
    document.body.classList.remove('inline-project-mode');
    document.title = 'XiaofArt';
    resetProjectListTransitionState();

    if (main) {
        main.style.opacity = '';
        main.removeAttribute('aria-hidden');
    }

    setTimeout(() => {
        page.remove();
    }, 420);
}

function syncInlineProjectWithLocation() {
    const isProjectUrl = window.location.pathname.includes('project1.html') || window.location.pathname.includes('project.html');

    if (!isProjectUrl) {
        restorePortfolioView();
        return;
    }

    const projectId = Number(new URLSearchParams(window.location.search).get('id') || 1);
    const project = projects.find(item => item.id === projectId);
    if (project) {
        showInlineProjectPage(project, null, null, false);
    }
}

function initIncomingProjectTransition() {
    const isProjectPage = window.location.pathname.includes('project1.html') || window.location.pathname.includes('project.html');
    if (!isProjectPage) return;

    let transitionData = null;
    try {
        transitionData = JSON.parse(sessionStorage.getItem('xiaofartProjectTransition') || 'null');
    } catch (error) {
        sessionStorage.removeItem('xiaofartProjectTransition');
        document.documentElement.classList.remove('project-transition-primed');
        document.documentElement.style.removeProperty('--transition-image-src');
    }

    if (!transitionData?.src) {
        document.documentElement.classList.remove('project-transition-primed');
        document.documentElement.style.removeProperty('--transition-image-src');
        return;
    }

    sessionStorage.removeItem('xiaofartProjectTransition');
    document.documentElement.classList.add('project-transition-primed');
    document.body.classList.add('page-transition-entering');

    const layer = createProjectTransitionLayer(transitionData.title || '');
    const transitionImage = document.createElement('img');
    transitionImage.className = 'page-transition-image';
    transitionImage.src = transitionData.src;
    transitionImage.alt = transitionData.title || '';
    layer.appendChild(transitionImage);
    applyRectToElement(transitionImage, getTransitionTargetRect());
    layer.classList.add('is-active');

    window.requestAnimationFrame(() => {
        setTimeout(() => {
            document.documentElement.classList.remove('project-transition-primed');
            document.documentElement.style.removeProperty('--transition-image-src');
            document.body.classList.remove('page-transition-entering');
            layer.classList.add('is-fading');
            transitionImage.style.opacity = '0';
            transitionImage.style.filter = 'drop-shadow(0 0 0 rgba(0, 0, 0, 0))';
        }, 180);

        setTimeout(() => {
            layer.remove();
        }, 780);
    });
}

function navigateToProject(id) {
    if (isProjectTransitioning) return;

    const projectFrame = document.querySelector(`.project-frame[data-id="${id}"]`);
    const project = projects.find(item => item.id === Number(id));

    if (!project) {
        window.location.href = getProjectUrl(id || 1);
        return;
    }

    if (!projectFrame) {
        window.location.href = getProjectUrl(id || 1);
        return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const projectImage = projectFrame.querySelector('.project-image');
    const imageRect = projectImage?.getBoundingClientRect() || projectFrame.getBoundingClientRect();
    const imageSrc = projectImage?.currentSrc || projectImage?.src || project?.heroImage || '';

    if (reduceMotion || !imageSrc) {
        showInlineProjectPage(project, null, null, true);
        return;
    }

    isProjectTransitioning = true;
    document.body.classList.add('is-leaving-project-list');

    const frameOverlay = projectFrame.querySelector('.frame-overlay');

    if (frameOverlay) {
        frameOverlay.style.display = 'none';
    }

    const transitionLayer = createProjectTransitionLayer(project?.title || '', 'soft');
    const transitionImage = document.createElement('img');
    transitionImage.className = 'page-transition-image';
    transitionImage.src = imageSrc;
    transitionImage.alt = project?.title || '';
    transitionLayer.appendChild(transitionImage);

    applyRectToElement(transitionImage, imageRect);
    projectFrame.style.opacity = '0';

    window.requestAnimationFrame(() => {
        transitionLayer.classList.add('is-active');
        applyRectToElement(transitionImage, getTransitionTargetRect());
    });

    setTimeout(() => {
        showInlineProjectPage(project, transitionLayer, transitionImage, true);
    }, 560);
}

function initScrollProgress() {
    progressBar = document.getElementById('progressBar');
    totalSections = document.querySelectorAll('.scroll-section').length;
    updateProgress(0, totalSections);
}

function updateProgress(current, total) {
    const progress = ((current + 1) / total) * 100;
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function initScrollHint() {
    const hint = document.getElementById('scrollHint');
    const container = document.getElementById('horizontalContainer');

    if (!hint || !container) return;

    let hasScrolled = false;

    container.addEventListener('wheel', () => {
        if (!hasScrolled) {
            hasScrolled = true;
            hint.classList.add('hidden');
        }
    });

    container.addEventListener('touchstart', () => {
        if (!hasScrolled) {
            hasScrolled = true;
            hint.classList.add('hidden');
        }
    });
}

function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'));
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        window.location.href = 'index.html';
        return;
    }

    initLoader();
    initCursor();
    initIncomingProjectTransition();
    ThemeSystem.init();

    document.title = `${project.title} | XiaofArt`;

    const heroImg = document.getElementById('detailHeroImg');
    const title = document.getElementById('detailTitle');
    const category = document.getElementById('detailCategory');
    const year = document.getElementById('detailYear');
    const description = document.getElementById('detailDescription');
    const services = document.getElementById('detailServices');
    const client = document.getElementById('detailClient');
    const location = document.getElementById('detailLocation');
    const gallery = document.getElementById('detailGallery');

    if (heroImg) heroImg.src = project.heroImage;
    if (title) title.textContent = project.title;
    if (category) category.textContent = project.category;
    if (year) year.textContent = project.year;
    if (description) description.textContent = project.description || '';
    if (services) services.textContent = (project.services || ['Design']).join(' / ');
    if (client) client.textContent = project.client || 'XiaofArt';
    if (location) location.textContent = project.location || 'China';

    if (gallery) {
        gallery.innerHTML = '';
        project.gallery.forEach(img => {
            const item = document.createElement('div');
            const image = document.createElement('img');

            item.className = 'detail-gallery-item';
            image.src = sanitizeImagePath(img, project.heroImage);
            image.alt = project.title;
            item.appendChild(image);
            gallery.appendChild(item);
        });
    }

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (heroImg) {
        heroImg.onload = function() {
            setTimeout(() => {
                const detailHero = document.querySelector('.detail-hero');
                const detailContent = document.querySelector('.detail-content');

                if (detailHero) {
                    detailHero.classList.add('slide-in');
                }

                if (detailContent) {
                    detailContent.classList.add('fade-in');
                }
            }, 100);
        };

        if (heroImg.complete) {
            setTimeout(() => {
                const detailHero = document.querySelector('.detail-hero');
                const detailContent = document.querySelector('.detail-content');

                if (detailHero) {
                    detailHero.classList.add('slide-in');
                }

                if (detailContent) {
                    detailContent.classList.add('fade-in');
                }
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isProjectPage = window.location.pathname.includes('project.html');
    if (isProjectPage) {
        initDetailPage();
    } else {
        init();
    }
});
