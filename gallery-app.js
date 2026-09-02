(() => {
    'use strict';

    const staticSite = document.querySelector('meta[name="xiaofart-mode"]')?.content === 'static';

    const state = {
        projects: [],
        orbitIndex: 0,
        entryComplete: false,
        activeProjectIndex: -1,
        projectImageIndex: 0,
        lightboxIndex: 0
    };

    const elements = {};
    let projectCloseTimer = 0;
    let orbitMotionTimer = 0;
    let lightboxSwitchTimer = 0;
    let lightboxSwitchToken = 0;
    let orbitSwipeMotion = null;
    let projectSwipeMotion = null;
    let projectSuppressClickUntil = 0;
    let orbitCards = [];
    let projectFigures = [];
    let projectRenderedIndices = new Set();
    let projectViewportWidth = 0;

    function sanitizeImagePath(value, fallback = '') {
        const raw = String(value || '').trim().replace(/\\/g, '/');
        if (!raw || raw.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(raw)) return fallback;
        const parts = raw.split('/').filter(Boolean);
        if (parts.some(part => part === '.' || part === '..')) return fallback;
        const normalized = parts.join('/');
        return normalized.startsWith('images/') && /\.(jpe?g|png|gif|webp)$/i.test(normalized) ? normalized : fallback;
    }

    function displayImagePath(source) {
        if (!/\.(?:jpe?g|png|webp)$/i.test(source)) return source;
        return source.replace(/^images\//, 'images/display/').replace(/\.(?:jpe?g|png|webp)$/i, '.webp');
    }

    function prepareArtworkImage(image, source) {
        image.dataset.src = displayImagePath(source);
        image.dataset.fallbackSrc = source;
    }

    function loadArtworkImage(image, force = false) {
        if (!image) return;
        const source = image.dataset.src;
        if (!source) return;
        if (!force && ['loading', 'loaded'].includes(image.dataset.loadState)) return;

        const container = image.closest('button, .orbit-cover');
        image.dataset.loadState = 'loading';
        image.dataset.retryCount = force ? '0' : (image.dataset.retryCount || '0');
        container?.classList.remove('is-load-error');

        image.onload = () => {
            image.dataset.loadState = 'loaded';
            container?.classList.remove('is-load-error');
        };
        image.onerror = () => {
            const fallbackSource = image.dataset.fallbackSrc;
            if (fallbackSource && image.dataset.usingFallback !== 'true') {
                image.dataset.usingFallback = 'true';
                image.dataset.loadState = 'loading';
                image.src = fallbackSource;
                return;
            }
            const retryCount = Number(image.dataset.retryCount || 0);
            if (retryCount < 1) {
                image.dataset.retryCount = String(retryCount + 1);
                image.dataset.loadState = 'idle';
                window.setTimeout(() => loadArtworkImage(image), 320);
                return;
            }
            image.dataset.loadState = 'error';
            container?.classList.add('is-load-error');
        };

        const retryCount = Number(image.dataset.retryCount || 0);
        const requestedSource = image.dataset.usingFallback === 'true'
            ? image.dataset.fallbackSrc
            : source;
        image.src = retryCount > 0
            ? `${requestedSource}${requestedSource.includes('?') ? '&' : '?'}xiaofart_retry=${Date.now()}`
            : requestedSource;
    }

    function releaseArtworkImage(image) {
        if (!image || !image.hasAttribute('src')) return;
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
        image.dataset.loadState = 'idle';
        image.dataset.retryCount = '0';
        image.dataset.usingFallback = 'false';
        image.closest('button, .orbit-cover')?.classList.remove('is-load-error');
    }

    function syncProjectImages(centerIndex, radius = 1) {
        projectFigures.forEach((figure, index) => {
            const image = figure.querySelector('img[data-src]');
            if (Math.abs(index - centerIndex) <= radius) loadArtworkImage(image);
            else releaseArtworkImage(image);
        });
    }

    function syncOrbitImages() {
        if (!orbitCards.length) return;
        const radius = innerWidth < 760 ? 1 : 2;
        orbitCards.forEach((card, index) => {
            const image = card.querySelector('img[data-src]');
            const distance = Math.abs(circularOffset(index, state.orbitIndex, orbitCards.length));
            if (state.entryComplete && distance <= radius) loadArtworkImage(image);
            else releaseArtworkImage(image);
        });
    }

    function createSwipeMotion({ getIndex, getCount, getExtent, onRender, onCommit, onInteraction, loop = false }) {
        let progress = 0;
        let rawProgress = 0;
        let velocity = 0;
        let lastTime = 0;
        let active = false;
        let animating = false;
        let animationFrame = 0;
        let inputFrame = 0;

        const cancelFrame = () => {
            cancelAnimationFrame(animationFrame);
            cancelAnimationFrame(inputFrame);
            animationFrame = 0;
            inputFrame = 0;
        };
        const scheduleInputRender = () => {
            if (inputFrame) return;
            inputFrame = requestAnimationFrame(() => {
                inputFrame = 0;
                onRender(progress);
            });
        };
        const canMove = direction => {
            if (loop) return getCount() > 1;
            const index = getIndex();
            return direction < 0 ? index > 0 : index < getCount() - 1;
        };
        const finish = direction => {
            animating = false;
            onInteraction(false);
            if (direction) onCommit(direction);
            progress = 0;
            rawProgress = 0;
            velocity = 0;
            onRender(0);
        };
        const animate = (target, direction = 0) => {
            cancelFrame();
            active = false;
            animating = true;
            onInteraction(true);
            const start = progress;
            const change = target - start;
            if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(change) < .001) {
                finish(direction);
                return;
            }
            const startedAt = performance.now();
            const duration = 220 + Math.min(90, Math.abs(change) * 110);
            const tick = now => {
                const elapsed = Math.min(1, (now - startedAt) / duration);
                const eased = 1 - Math.pow(1 - elapsed, 4);
                progress = start + change * eased;
                onRender(progress);
                if (elapsed < 1) {
                    animationFrame = requestAnimationFrame(tick);
                    return;
                }
                animationFrame = 0;
                finish(direction);
            };
            animationFrame = requestAnimationFrame(tick);
        };

        return {
            begin(time = performance.now()) {
                if (active || animating) return;
                cancelFrame();
                active = true;
                progress = 0;
                rawProgress = 0;
                velocity = 0;
                lastTime = time;
                onInteraction(true);
                onRender(0);
            },
            move(deltaPixels, time = performance.now()) {
                if (animating) return;
                if (!active) this.begin(time);
                if (!active) return;
                const extent = Math.max(1, getExtent());
                const deltaProgress = deltaPixels / extent;
                const elapsed = Math.max(8, Math.min(48, time - lastTime || 16));
                velocity = velocity * .35 + (deltaProgress / elapsed) * .65;
                rawProgress = Math.max(-1, Math.min(1, rawProgress + deltaProgress));
                const direction = Math.sign(rawProgress);
                progress = direction && !canMove(direction) ? rawProgress * .22 : rawProgress;
                lastTime = time;
                scheduleInputRender();
            },
            release() {
                if (!active) return;
                const velocityThreshold = .42 / Math.max(1, getExtent());
                const intended = Math.abs(progress) >= .15 || Math.abs(velocity) >= velocityThreshold
                    ? Math.sign(progress || velocity)
                    : 0;
                const direction = intended && canMove(intended) ? intended : 0;
                animate(direction, direction);
            },
            step(direction) {
                if (animating) return;
                const normalized = Math.sign(direction);
                if (!normalized || !canMove(normalized)) {
                    animate(0, 0);
                    return;
                }
                cancelFrame();
                active = false;
                progress = 0;
                rawProgress = 0;
                velocity = 0;
                onInteraction(false);
                animate(normalized, normalized);
            },
            reset() {
                cancelFrame();
                active = false;
                animating = false;
                progress = 0;
                rawProgress = 0;
                velocity = 0;
                onInteraction(false);
                onRender(0);
            },
            get active() {
                return active;
            }
        };
    }

    function bindSwipeSurface({
        element,
        motion,
        getExtent,
        shouldHandleWheel = () => true,
        onHorizontalRelease = () => {}
    }) {
        if (!element || !motion) return;

        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let lastX = 0;
        let axis = '';
        let wheelReleaseTimer = 0;
        let wheelDrainUntil = 0;

        const wheelScale = event => event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 18
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                ? Math.max(1, getExtent())
                : 1;

        element.addEventListener('wheel', event => {
            if (event.ctrlKey || !shouldHandleWheel(event)) return;
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (Math.abs(delta) < .1) return;

            event.preventDefault();
            const now = performance.now();
            if (now < wheelDrainUntil) {
                // Trackpad momentum belongs to the gesture that just committed.
                wheelDrainUntil = now + 180;
                return;
            }

            motion.begin(now);
            motion.move(delta * wheelScale(event), now);
            clearTimeout(wheelReleaseTimer);
            wheelReleaseTimer = setTimeout(() => {
                motion.release();
                wheelDrainUntil = performance.now() + 320;
            }, 110);
        }, { passive: false });

        element.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            clearTimeout(wheelReleaseTimer);
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            lastX = startX;
            axis = '';
        });

        element.addEventListener('pointermove', event => {
            if (event.pointerId !== pointerId) return;
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            if (!axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 10) {
                axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
                if (axis === 'x') {
                    element.setPointerCapture?.(pointerId);
                    motion.begin(event.timeStamp || performance.now());
                }
            }
            if (axis !== 'x') return;
            event.preventDefault();
            motion.move(lastX - event.clientX, event.timeStamp || performance.now());
            lastX = event.clientX;
        });

        const endPointer = (event, cancelled = false) => {
            if (event.pointerId !== pointerId) return;
            if (axis === 'x') {
                onHorizontalRelease();
                cancelled ? motion.reset() : motion.release();
            }
            if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
            pointerId = null;
            axis = '';
        };

        element.addEventListener('pointerup', event => endPointer(event));
        element.addEventListener('pointercancel', event => endPointer(event, true));
    }

    function normalizeProject(project, index) {
        const gallery = (Array.isArray(project.gallery) ? project.gallery : [])
            .map(path => sanitizeImagePath(path))
            .filter(Boolean);
        const heroImage = sanitizeImagePath(project.coverImage || project.heroImage || gallery[0], 'images/project1/1.jpg');
        const dateYear = String(project.creationDate || '').match(/^\d{4}/)?.[0];
        return {
            id: Number(project.id) || index + 1,
            order: Number(project.order) || index,
            title: String(project.title || `作品 ${index + 1}`).trim(),
            category: String(project.category || '未分类').trim(),
            year: String(project.year || dateYear || ''),
            description: String(project.description || '').trim(),
            heroImage,
            gallery: gallery.length ? gallery : [heroImage],
            imageTitles: Array.isArray(project.imageTitles) ? project.imageTitles.map(String) : [],
            imageDescriptions: Array.isArray(project.imageDescriptions) ? project.imageDescriptions.map(String) : [],
            imageAlignments: Array.isArray(project.imageAlignments) ? project.imageAlignments.map(String) : []
        };
    }

    async function loadProjects() {
        let data = Array.isArray(window.XIAOFART_SITE_DATA?.projects)
            ? window.XIAOFART_SITE_DATA.projects
            : [];

        if (!staticSite && ['http:', 'https:'].includes(location.protocol)) {
            try {
                const response = await fetch('/api/public/projects', { headers: { Accept: 'application/json' } });
                if (response.ok) {
                    const remote = await response.json();
                    if (Array.isArray(remote) && remote.length) data = remote;
                }
            } catch (error) {
                // 静态快照继续作为公开站的离线降级数据。
            }
        }

        state.projects = data.map(normalizeProject).sort((a, b) => a.order - b.order);
    }

    function cacheElements() {
        Object.assign(elements, {
            entryGate: document.getElementById('entryGate'),
            exhibitionMain: document.getElementById('exhibitionMain'),
            themeToggle: document.getElementById('themeToggle'),
            projectDialog: document.getElementById('projectDialog'),
            projectClose: document.getElementById('projectClose'),
            projectMeta: document.getElementById('projectMeta'),
            projectTitle: document.getElementById('projectTitle'),
            projectDescription: document.getElementById('projectDescription'),
            projectGallery: document.getElementById('projectGallery'),
            galleryStatus: document.getElementById('galleryStatus'),
            projectSlideIndicator: document.getElementById('projectSlideIndicator'),
            previousProject: document.getElementById('previousProject'),
            nextProject: document.getElementById('nextProject'),
            lightbox: document.getElementById('lightbox'),
            lightboxImage: document.getElementById('lightboxImage'),
            lightboxCaption: document.getElementById('lightboxCaption'),
            lightboxLabel: document.getElementById('lightboxLabel'),
            lightboxClose: document.getElementById('lightboxClose'),
            lightboxPrevious: document.getElementById('lightboxPrevious'),
            lightboxNext: document.getElementById('lightboxNext'),
            orbitHero: document.getElementById('orbitHero'),
            orbitScene: document.getElementById('orbitScene'),
            orbitTrack: document.getElementById('orbitTrack'),
            orbitMeta: document.getElementById('orbitMeta'),
            orbitActiveTitle: document.getElementById('orbitActiveTitle'),
            orbitDescription: document.getElementById('orbitDescription'),
            orbitCurrent: document.getElementById('orbitCurrent'),
            orbitTotal: document.getElementById('orbitTotal'),
            orbitPrevious: document.getElementById('orbitPrevious'),
            orbitNext: document.getElementById('orbitNext'),
            orbitOpenMobile: document.getElementById('orbitOpenMobile')
        });
    }

    function initTheme() {
        const stored = localStorage.getItem('xiaofart-theme');
        const theme = stored || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        applyTheme(theme);
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const isLight = theme === 'light';
        elements.themeToggle?.setAttribute('aria-pressed', String(isLight));
        elements.themeToggle?.setAttribute('aria-label', isLight ? '切换到深色主题' : '切换到浅色主题');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f4f2ed' : '#0a0a0a');
    }

    function updateHistory(projectId = null) {
        const url = new URL(location.href);
        projectId ? url.searchParams.set('project', projectId) : url.searchParams.delete('project');
        try {
            history.pushState({ projectId }, '', url);
        } catch (error) {
            // file:// 预览环境可能限制历史记录，弹窗仍可正常使用。
        }
    }

    function clearProjectFromCurrentUrl() {
        const url = new URL(location.href);
        if (!url.searchParams.has('project')) return;

        url.searchParams.delete('project');
        try {
            history.replaceState({ projectId: null }, '', url);
        } catch (error) {
            // file:// 预览环境可能限制历史记录，不影响首页进入流程。
        }
    }

    function getRequestedProjectId() {
        const params = new URLSearchParams(location.search);
        if (!params.has('project')) return { present: false, id: 0 };

        const raw = params.get('project') || '';
        const id = /^\d+$/.test(raw) ? Number(raw) : 0;
        return {
            present: true,
            id: Number.isSafeInteger(id) && id > 0 ? id : 0
        };
    }

    function resolveRequestedProjectId() {
        const request = getRequestedProjectId();
        if (!request.present) return 0;

        // 项目数据尚未完成加载时保留深链，加载结束后再验证。
        if (request.id && !state.projects.length) return request.id;
        if (request.id && state.projects.some(project => project.id === request.id)) return request.id;

        clearProjectFromCurrentUrl();
        return 0;
    }

    function openRequestedProjectFromUrl() {
        if (!state.projects.length) return false;
        const projectId = resolveRequestedProjectId();
        return projectId ? openProject(projectId, null, false) : false;
    }

    function circularOffset(index, activeIndex, total) {
        let offset = index - activeIndex;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
        return offset;
    }

    function createOrbitCard(project, index) {
        const card = document.createElement('button');
        const book = document.createElement('span');
        const spine = document.createElement('span');
        const cover = document.createElement('span');
        const image = document.createElement('img');

        card.type = 'button';
        card.className = 'orbit-card';
        card.dataset.index = String(index);
        card.setAttribute('aria-label', `选择系列：${project.title}`);
        book.className = 'orbit-book';
        spine.className = 'orbit-spine';
        cover.className = 'orbit-cover';
        prepareArtworkImage(image, project.heroImage);
        image.alt = project.title;
        image.decoding = 'async';

        cover.append(image);
        book.append(spine, cover);
        card.append(book);
        return card;
    }

    function getOrbitPosition(offset) {
        const sign = Math.sign(offset);
        const distance = Math.abs(offset);
        const mobile = innerWidth < 600;
        const positions = mobile
            ? [
                { x: 0, z: 180, rotate: 0, scale: 1, opacity: 1, layer: 20, saturation: 1, brightness: 1 },
                { x: sign * innerWidth * .43, z: -10, rotate: sign * -58, scale: .77, opacity: .86, layer: 12, saturation: .78, brightness: .72 },
                { x: sign * innerWidth * .68, z: -250, rotate: sign * -72, scale: .59, opacity: .36, layer: 7, saturation: .55, brightness: .55 },
                { x: sign * innerWidth * .82, z: -430, rotate: sign * -78, scale: .44, opacity: .12, layer: 3, saturation: .4, brightness: .42 }
            ]
            : [
                { x: 0, z: 190, rotate: 0, scale: 1, opacity: 1, layer: 20, saturation: 1, brightness: 1 },
                { x: sign * Math.min(innerWidth * .31, 430), z: 0, rotate: sign * -58, scale: .78, opacity: .88, layer: 12, saturation: .8, brightness: .74 },
                { x: sign * Math.min(innerWidth * .49, 680), z: -250, rotate: sign * -70, scale: .61, opacity: .46, layer: 7, saturation: .58, brightness: .58 },
                { x: sign * Math.min(innerWidth * .59, 820), z: -440, rotate: sign * -77, scale: .47, opacity: .16, layer: 3, saturation: .42, brightness: .45 }
            ];
        const clamped = Math.min(distance, positions.length - 1);
        const lowerIndex = Math.floor(clamped);
        const upperIndex = Math.ceil(clamped);
        const progress = clamped - lowerIndex;
        const lower = positions[lowerIndex];
        const upper = positions[upperIndex];
        const mix = key => lower[key] + (upper[key] - lower[key]) * progress;
        return {
            x: mix('x'),
            z: mix('z'),
            rotate: mix('rotate'),
            scale: mix('scale'),
            opacity: mix('opacity'),
            layer: Math.round(mix('layer')),
            saturation: mix('saturation'),
            brightness: mix('brightness')
        };
    }

    function updateOrbitMeta() {
        const project = state.projects[state.orbitIndex];
        if (!project) return;
        elements.orbitMeta.textContent = [project.category, project.year || 'Archive'].filter(Boolean).join(' · ');
        elements.orbitActiveTitle.textContent = project.title;
        elements.orbitDescription.textContent = project.description || '绘画、角色与视觉叙事。';
        elements.orbitCurrent.textContent = String(state.orbitIndex + 1).padStart(2, '0');
        elements.orbitOpenMobile?.setAttribute('aria-label', `查看系列：${project.title}`);
    }

    function updateOrbit(animate = true, activePosition = state.orbitIndex, continuous = false) {
        if (!state.projects.length || !elements.orbitTrack) return;
        if (!continuous) {
            clearTimeout(orbitMotionTimer);
            if (animate) {
                elements.orbitScene?.classList.add('is-moving');
                orbitMotionTimer = setTimeout(() => {
                    elements.orbitScene?.classList.remove('is-moving');
                    orbitMotionTimer = 0;
                }, 420);
            } else {
                elements.orbitScene?.classList.remove('is-moving');
            }
        }
        const renderRadius = innerWidth < 760 ? 1.15 : 2.15;
        orbitCards.forEach((card, index) => {
            const offset = circularOffset(index, activePosition, orbitCards.length);
            const distance = Math.abs(offset);
            const hidden = distance > renderRadius;
            const wasHidden = card.dataset.orbitHidden === 'true';
            if (hidden && wasHidden) return;
            if (hidden !== wasHidden || !card.dataset.orbitHidden) {
                card.dataset.orbitHidden = String(hidden);
                card.classList.toggle('is-rendered', !hidden);
                card.style.visibility = hidden ? 'hidden' : 'visible';
                card.style.pointerEvents = hidden ? 'none' : 'auto';
            }
            if (hidden) {
                card.style.opacity = '0';
                return;
            }
            const position = getOrbitPosition(offset);
            card.style.transform = `translate(-50%,-50%) translate3d(${position.x}px,0,${position.z}px) rotateY(${position.rotate}deg) scale(${position.scale})`;
            card.style.opacity = String(position.opacity);
            card.style.zIndex = String(position.layer);
            if (continuous) return;

            card.style.transitionDuration = animate ? '' : '0s';
            const isActive = index === state.orbitIndex;
            card.classList.toggle('is-active', isActive);
            card.setAttribute('aria-current', isActive ? 'true' : 'false');
            card.setAttribute('aria-label', `${isActive ? '打开' : '选择'}系列：${state.projects[index].title}`);
            card.tabIndex = distance <= 2 ? 0 : -1;
        });

        if (!continuous) {
            syncOrbitImages();
            updateOrbitMeta();
        }

        if (!animate && !continuous) requestAnimationFrame(() => orbitCards.forEach(card => { card.style.transitionDuration = ''; }));
    }

    function rotateOrbitTo(index) {
        if (!state.projects.length) return;
        orbitSwipeMotion?.reset();
        state.orbitIndex = (index + state.projects.length) % state.projects.length;
        updateOrbit();
    }

    function rotateOrbit(direction) {
        rotateOrbitTo(state.orbitIndex + direction);
    }

    function initOrbitHero() {
        if (!state.projects.length || !elements.orbitTrack) return;
        state.orbitIndex = 0;
        orbitCards = state.projects.map(createOrbitCard);
        elements.orbitTrack.replaceChildren(...orbitCards);
        elements.orbitTotal.textContent = String(state.projects.length).padStart(2, '0');
        updateOrbit(false);
    }

    function resetProjectScroll() {
        elements.projectDialog.scrollTop = 0;
        elements.projectDialog.scrollLeft = 0;
        elements.projectGallery.querySelectorAll('.project-image').forEach(figure => {
            figure.scrollTop = 0;
        });
        const shell = elements.projectDialog.querySelector('.dialog-shell');
        if (shell) {
            shell.scrollTop = 0;
            shell.scrollLeft = 0;
        }
    }

    function openProject(projectId, trigger = null, updateUrl = true) {
        const index = state.projects.findIndex(project => project.id === Number(projectId));
        if (index < 0) return false;
        clearTimeout(projectCloseTimer);
        projectCloseTimer = 0;
        state.activeProjectIndex = index;
        const project = state.projects[index];

        elements.projectDialog.setAttribute('aria-label', `${project.title}，作品详情`);

        elements.projectMeta.textContent = [project.category, project.year, `${project.gallery.length} 幅作品`].filter(Boolean).join(' · ');
        elements.projectTitle.textContent = project.title;
        elements.projectDescription.textContent = project.description || '这一组作品收录了创作过程中的片段、角色与想象。';
        projectFigures = project.gallery.map((src, imageIndex) => createProjectImage(project, src, imageIndex));
        projectRenderedIndices.clear();
        elements.projectGallery.replaceChildren(...projectFigures);
        state.projectImageIndex = 0;
        renderProjectIndicator(project.gallery.length);
        updateProjectIndicator();
        syncProjectImages(0);
        elements.previousProject.disabled = state.projects.length < 2;
        elements.nextProject.disabled = state.projects.length < 2;
        resetProjectScroll();

        const show = () => {
            if (!elements.projectDialog.open) elements.projectDialog.showModal();
            projectViewportWidth = elements.projectGallery.clientWidth || innerWidth;
            resetProjectScroll();
            elements.projectDialog.dataset.triggerId = trigger?.closest('.work-card')?.dataset.projectId || '';
            elements.projectDialog.dataset.triggerIndex = trigger?.dataset.index || '';
            document.body.classList.add('is-locked');
            requestAnimationFrame(() => {
                resetProjectScroll();
                setProjectImage(0, 'auto');
                elements.projectDialog.classList.add('is-visible');
            });
        };
        show();
        if (updateUrl) updateHistory(project.id);
        return true;
    }

    function createProjectImage(project, src, imageIndex) {
        const figure = document.createElement('figure');
        const button = document.createElement('button');
        const image = document.createElement('img');
        const mobileProgress = document.createElement('div');
        const caption = document.createElement('figcaption');
        const customTitle = String(project.imageTitles[imageIndex] || '').trim();
        const description = String(project.imageDescriptions[imageIndex] || '').trim();
        const hasCustomMetadata = Boolean(customTitle || description);
        const title = customTitle || project.title;
        const defaultAlignment = ['left', 'right'][imageIndex % 2];
        const requestedAlignment = project.imageAlignments[imageIndex];
        const alignment = ['left', 'right'].includes(requestedAlignment) ? requestedAlignment : defaultAlignment;
        figure.className = `project-image is-${alignment} ${hasCustomMetadata ? 'has-metadata' : 'is-fallback'}`;
        figure.dataset.index = String(imageIndex);
        figure.classList.toggle('is-active', imageIndex === 0);
        button.type = 'button';
        button.setAttribute('aria-label', `全屏查看：${title}`);
        prepareArtworkImage(image, src);
        image.alt = title;
        image.loading = 'eager';
        image.fetchPriority = imageIndex === 0 ? 'high' : 'low';
        image.decoding = 'async';
        const count = `${String(imageIndex + 1).padStart(2, '0')} / ${String(project.gallery.length).padStart(2, '0')}`;
        const progress = ((imageIndex + 1) / project.gallery.length) * 100;
        mobileProgress.className = 'project-mobile-progress';
        mobileProgress.setAttribute('aria-label', `第 ${imageIndex + 1} 幅，共 ${project.gallery.length} 幅`);
        mobileProgress.innerHTML = `
            <span class="project-mobile-progress-track" aria-hidden="true"><i style="width:${progress}%"></i></span>
            <span class="project-mobile-progress-count">${count}</span>
        `;
        caption.innerHTML = hasCustomMetadata ? `
            <div class="project-image-copy">
                <h3>${escapeHtml(title)}</h3>
                <span class="project-image-rule" aria-hidden="true"></span>
                ${description ? `<p>${escapeHtml(description)}</p>` : ''}
                <dl class="project-image-details">
                    <div><dt>IMAGE</dt><dd>${count}</dd></div>
                    <div><dt>CATEGORY</dt><dd>${escapeHtml(project.category || '未分类')}</dd></div>
                    ${project.year ? `<div><dt>YEAR</dt><dd>${escapeHtml(project.year)}</dd></div>` : ''}
                </dl>
            </div>
        ` : `
            <div class="project-image-copy"><h3>${escapeHtml(title)}</h3></div>
            <span class="project-image-count">${count}</span>
        `;
        button.append(image);
        figure.append(button, mobileProgress, caption);
        button.addEventListener('click', () => {
            if (performance.now() < projectSuppressClickUntil) return;
            if (image.dataset.loadState === 'error') {
                loadArtworkImage(image, true);
                return;
            }
            openLightbox(imageIndex);
        });
        return figure;
    }

    function renderProjectIndicator(total) {
        const markers = Array.from({ length: total }, (_, index) => {
            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = 'project-slide-marker';
            marker.dataset.index = String(index);
            marker.setAttribute('aria-label', `查看第 ${index + 1} 幅作品`);
            marker.addEventListener('click', () => setProjectImage(index));
            return marker;
        });
        elements.projectSlideIndicator.replaceChildren(...markers);
    }

    function updateProjectIndicator() {
        [...elements.projectGallery.children].forEach((figure, index) => {
            const isActive = index === state.projectImageIndex;
            figure.classList.toggle('is-active', isActive);
            figure.setAttribute('aria-hidden', String(!isActive));
            const button = figure.querySelector('button');
            if (button) button.tabIndex = isActive ? 0 : -1;
        });

        const currentMarker = elements.projectSlideIndicator.querySelector('[aria-current="true"]');
        currentMarker?.classList.remove('is-active');
        currentMarker?.removeAttribute('aria-current');
        const nextMarker = elements.projectSlideIndicator.children[state.projectImageIndex];
        nextMarker?.classList.add('is-active');
        nextMarker?.setAttribute('aria-current', 'true');

        const project = state.projects[state.activeProjectIndex];
        if (project && elements.galleryStatus) {
            const imageTitle = String(project.imageTitles[state.projectImageIndex] || project.title).trim();
            elements.galleryStatus.textContent = `${project.title}，第 ${state.projectImageIndex + 1} 幅，共 ${project.gallery.length} 幅，${imageTitle}`;
        }
    }

    function renderProjectPosition(progress = 0) {
        const width = projectViewportWidth || innerWidth;
        const position = state.projectImageIndex + progress;
        const nextRenderedIndices = new Set([state.projectImageIndex]);
        const direction = Math.sign(progress);
        if (direction) {
            const adjacent = state.projectImageIndex + direction;
            if (adjacent >= 0 && adjacent < projectFigures.length) nextRenderedIndices.add(adjacent);
        }

        projectRenderedIndices.forEach(index => {
            if (nextRenderedIndices.has(index)) return;
            const figure = projectFigures[index];
            if (!figure) return;
            figure.classList.remove('is-rendered');
            figure.style.visibility = 'hidden';
            figure.style.opacity = '0';
            figure.style.pointerEvents = 'none';
        });

        nextRenderedIndices.forEach(index => {
            const figure = projectFigures[index];
            if (!figure) return;
            const offset = index - position;
            if (!figure.classList.contains('is-rendered')) {
                figure.classList.add('is-rendered');
                figure.style.visibility = 'visible';
            }
            figure.style.transform = `translate3d(${offset * width}px,0,0)`;
            figure.style.opacity = '1';
            figure.style.pointerEvents = Math.abs(offset) < .5 ? 'auto' : 'none';
            figure.style.zIndex = String(Math.max(0, 5 - Math.round(Math.abs(offset))));
        });
        projectRenderedIndices = nextRenderedIndices;
    }

    function commitProjectImage(direction) {
        const project = state.projects[state.activeProjectIndex];
        if (!project?.gallery.length) return;
        state.projectImageIndex = Math.max(0, Math.min(
            project.gallery.length - 1,
            state.projectImageIndex + direction
        ));
        syncProjectImages(state.projectImageIndex);
        elements.projectGallery.children[state.projectImageIndex]?.scrollTo({ top: 0, behavior: 'auto' });
        updateProjectIndicator();
    }

    function setProjectImage(index, behavior = 'smooth') {
        const project = state.projects[state.activeProjectIndex];
        if (!project?.gallery.length) return;
        const target = Math.max(0, Math.min(project.gallery.length - 1, index));
        const difference = target - state.projectImageIndex;
        if (behavior !== 'auto' && Math.abs(difference) === 1 && projectSwipeMotion) {
            projectSwipeMotion.step(difference);
            return;
        }
        projectSwipeMotion?.reset();
        state.projectImageIndex = target;
        syncProjectImages(target);
        elements.projectGallery.children[target]?.scrollTo({ top: 0, behavior: 'auto' });
        updateProjectIndicator();
        renderProjectPosition(0);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function closeProject(updateUrl = true) {
        if (!elements.projectDialog.open) return;
        projectSwipeMotion?.reset();
        clearTimeout(projectCloseTimer);
        elements.projectDialog.classList.remove('is-visible');
        projectCloseTimer = setTimeout(() => {
            projectCloseTimer = 0;
            elements.projectDialog.close();
            if (!elements.lightbox.open) document.body.classList.remove('is-locked');
            const id = elements.projectDialog.dataset.triggerId;
            const orbitIndex = elements.projectDialog.dataset.triggerIndex;
            const trigger = orbitIndex
                ? document.querySelector(`.orbit-card[data-index="${orbitIndex}"]`)
                : document.querySelector(`.work-card[data-project-id="${id}"] button`);
            trigger?.focus({ preventScroll: true });
        }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350);
        if (updateUrl) updateHistory();
    }

    function switchProject(direction) {
        if (!state.projects.length) return;
        const next = (state.activeProjectIndex + direction + state.projects.length) % state.projects.length;
        openProject(state.projects[next].id, null, true);
        elements.projectDialog.scrollTo?.({ top: 0, behavior: 'smooth' });
    }

    function openLightbox(index) {
        state.lightboxIndex = index;
        updateLightbox(true);
        if (!elements.lightbox.open) elements.lightbox.showModal();
        document.body.classList.add('is-locked');
    }

    function updateLightbox(instant = false) {
        const project = state.projects[state.activeProjectIndex];
        if (!project) return;
        const index = (state.lightboxIndex + project.gallery.length) % project.gallery.length;
        state.lightboxIndex = index;
        const token = ++lightboxSwitchToken;
        const src = project.gallery[index];
        const displaySrc = displayImagePath(src);
        const commit = () => {
            if (token !== lightboxSwitchToken) return;
            elements.lightboxImage.onerror = () => {
                elements.lightboxImage.onerror = null;
                elements.lightboxImage.src = src;
            };
            elements.lightboxImage.src = displaySrc;
            elements.lightboxImage.alt = project.imageTitles[index] || project.title;
            const imageTitle = project.imageTitles[index] || '';
            const imageDescription = project.imageDescriptions[index] || '';
            elements.lightboxCaption.textContent = [imageTitle, imageDescription].filter(Boolean).join(' — ');
            elements.lightboxLabel.textContent = `${project.title} · ${index + 1} / ${project.gallery.length}`;
            elements.lightboxImage.classList.remove('is-switching');
        };
        clearTimeout(lightboxSwitchTimer);
        if (instant) return commit();

        // 先在后台解码下一张，避免淡出后等待网络或磁盘读取造成空白闪烁。
        const preload = new Image();
        let swapStarted = false;
        const swap = () => {
            if (swapStarted || token !== lightboxSwitchToken) return;
            swapStarted = true;
            elements.lightboxImage.classList.add('is-switching');
            lightboxSwitchTimer = setTimeout(commit, 110);
        };
        preload.onload = swap;
        preload.onerror = () => {
            preload.onerror = swap;
            preload.src = src;
        };
        preload.src = displaySrc;
        if (preload.complete) swap();
    }

    function closeLightbox() {
        clearTimeout(lightboxSwitchTimer);
        lightboxSwitchToken += 1;
        elements.lightbox.close();
        if (!elements.projectDialog.open) document.body.classList.remove('is-locked');
    }

    function enterExhibition() {
        if (state.entryComplete) return;
        state.entryComplete = true;
        syncOrbitImages();
        elements.entryGate.classList.add('is-leaving');
        elements.entryGate.setAttribute('aria-hidden', 'true');
        elements.exhibitionMain.removeAttribute('aria-hidden');
        document.body.classList.remove('is-at-entry');

        const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => {
            elements.entryGate.hidden = true;
            openRequestedProjectFromUrl();
        }, motionReduced ? 0 : 680);
    }

    function initEvents() {
        let swipeStartX = 0;
        let swipeStartY = 0;
        let orbitSuppressClickUntil = 0;
        let resizeFrame = 0;
        const orbitGestureDistance = () => Math.max(180, Math.min(innerWidth * .46, 520));

        orbitSwipeMotion = createSwipeMotion({
            getIndex: () => state.orbitIndex,
            getCount: () => state.projects.length,
            getExtent: orbitGestureDistance,
            onRender: progress => updateOrbit(false, state.orbitIndex + progress, true),
            onCommit: direction => {
                state.orbitIndex = (state.orbitIndex + direction + state.projects.length) % state.projects.length;
                updateOrbit(false);
            },
            onInteraction: active => elements.orbitScene?.classList.toggle('is-interacting', active),
            loop: true
        });
        projectSwipeMotion = createSwipeMotion({
            getIndex: () => state.projectImageIndex,
            getCount: () => state.projects[state.activeProjectIndex]?.gallery.length || 0,
            getExtent: () => projectViewportWidth || innerWidth,
            onRender: renderProjectPosition,
            onCommit: commitProjectImage,
            onInteraction: active => elements.projectGallery.classList.toggle('is-interacting', active)
        });
        document.querySelectorAll('a[data-skip-entry]').forEach(link => {
            link.addEventListener('click', () => {
                try { sessionStorage.setItem('xiaofart-skip-entry-once', '1'); } catch (error) {}
            });
        });
        elements.themeToggle?.addEventListener('click', () => {
            const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
            const apply = () => applyTheme(theme);
            document.startViewTransition ? document.startViewTransition(apply) : apply();
            localStorage.setItem('xiaofart-theme', theme);
        });
        elements.entryGate.addEventListener('pointerup', enterExhibition);
        elements.orbitTrack?.addEventListener('click', event => {
            if (performance.now() < orbitSuppressClickUntil) return;
            const card = event.target.closest('.orbit-card');
            if (!card) return;
            const index = Number(card.dataset.index);
            if (matchMedia('(max-width: 600px)').matches) {
                rotateOrbitTo(index);
                return;
            }
            if (index === state.orbitIndex) openProject(state.projects[index]?.id, card);
            else rotateOrbitTo(index);
        });
        elements.orbitOpenMobile?.addEventListener('click', () => {
            const project = state.projects[state.orbitIndex];
            if (!project) return;
            const card = elements.orbitTrack?.querySelector(`[data-index="${state.orbitIndex}"]`);
            openProject(project.id, card);
        });
        elements.orbitPrevious?.addEventListener('click', () => rotateOrbit(-1));
        elements.orbitNext?.addEventListener('click', () => rotateOrbit(1));
        bindSwipeSurface({
            element: elements.orbitScene,
            motion: orbitSwipeMotion,
            getExtent: orbitGestureDistance,
            onHorizontalRelease: () => { orbitSuppressClickUntil = performance.now() + 450; }
        });
        addEventListener('resize', () => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
                projectViewportWidth = elements.projectGallery?.clientWidth || innerWidth;
                orbitSwipeMotion?.reset();
                if (elements.projectDialog.open) setProjectImage(state.projectImageIndex, 'auto');
            });
        }, { passive: true });
        elements.projectClose.addEventListener('click', () => closeProject());
        elements.projectDialog.addEventListener('cancel', event => {
            event.preventDefault();
            closeProject();
        });
        elements.projectDialog.addEventListener('click', event => { if (event.target === elements.projectDialog) closeProject(); });
        bindSwipeSurface({
            element: elements.projectGallery,
            motion: projectSwipeMotion,
            getExtent: () => projectViewportWidth || innerWidth,
            shouldHandleWheel: event => !(
                matchMedia('(max-width: 760px)').matches &&
                Math.abs(event.deltaY) > Math.abs(event.deltaX)
            ),
            onHorizontalRelease: () => { projectSuppressClickUntil = performance.now() + 450; }
        });
        elements.previousProject.addEventListener('click', () => switchProject(-1));
        elements.nextProject.addEventListener('click', () => switchProject(1));
        elements.lightboxClose.addEventListener('click', closeLightbox);
        elements.lightbox.addEventListener('cancel', event => {
            event.preventDefault();
            closeLightbox();
        });
        elements.lightbox.addEventListener('click', event => { if (event.target === elements.lightbox) closeLightbox(); });
        elements.lightboxPrevious.addEventListener('click', () => { state.lightboxIndex--; updateLightbox(); });
        elements.lightboxNext.addEventListener('click', () => { state.lightboxIndex++; updateLightbox(); });
        elements.lightbox.addEventListener('touchstart', event => {
            if (event.touches.length !== 1) return;
            swipeStartX = event.touches[0].clientX;
            swipeStartY = event.touches[0].clientY;
        }, { passive: true });
        elements.lightbox.addEventListener('touchend', event => {
            const touch = event.changedTouches[0];
            if (!touch) return;
            const deltaX = touch.clientX - swipeStartX;
            const deltaY = touch.clientY - swipeStartY;
            if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
            state.lightboxIndex += deltaX > 0 ? -1 : 1;
            updateLightbox();
        }, { passive: true });
        addEventListener('keydown', event => {
            if (!state.entryComplete) {
                event.preventDefault();
                enterExhibition();
                return;
            }
            if (elements.lightbox.open) {
                if (event.key === 'ArrowLeft') { state.lightboxIndex--; updateLightbox(); }
                if (event.key === 'ArrowRight') { state.lightboxIndex++; updateLightbox(); }
                return;
            }
            if (elements.projectDialog.open) {
                if (event.key === 'ArrowLeft') { event.preventDefault(); setProjectImage(state.projectImageIndex - 1); }
                if (event.key === 'ArrowRight') { event.preventDefault(); setProjectImage(state.projectImageIndex + 1); }
                return;
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                rotateOrbit(1);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                rotateOrbit(-1);
            }
        });
        addEventListener('popstate', () => {
            if (!state.entryComplete) {
                resolveRequestedProjectId();
                return;
            }

            const projectId = resolveRequestedProjectId();
            if (projectId) openProject(projectId, null, false);
            else closeProject(false);
        });
    }

    async function trackVisit() {
        if (staticSite || !['http:', 'https:'].includes(location.protocol)) return;
        try {
            const storageKey = 'xiaofart-visitor-id';
            let visitorId = localStorage.getItem(storageKey);
            if (!visitorId) {
                visitorId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                localStorage.setItem(storageKey, visitorId);
            }
            await fetch('/api/public/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    visitorId,
                    path: location.pathname,
                    referrer: document.referrer,
                    language: navigator.language,
                    viewport: `${innerWidth}x${innerHeight}`
                })
            });
        } catch (error) {
            // 统计不可用不影响公开浏览。
        }
    }

    async function init() {
        cacheElements();
        initTheme();
        const skipEntry = document.documentElement.classList.contains('skip-entry');
        if (skipEntry) {
            state.entryComplete = true;
            elements.entryGate.hidden = true;
            elements.entryGate.setAttribute('aria-hidden', 'true');
            elements.exhibitionMain.removeAttribute('aria-hidden');
            document.body.classList.remove('is-at-entry');
        }
        initEvents();
        await loadProjects();
        initOrbitHero();
        const requestedProjectId = resolveRequestedProjectId();
        if (state.entryComplete) {
            if (requestedProjectId) openRequestedProjectFromUrl();
        } else {
            elements.entryGate.focus({ preventScroll: true });
        }
        trackVisit();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
