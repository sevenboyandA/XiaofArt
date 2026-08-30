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
    let projectScrollTargetIndex = null;
    let projectScrollSettleTimer = 0;

    function sanitizeImagePath(value, fallback = '') {
        const raw = String(value || '').trim().replace(/\\/g, '/');
        if (!raw || raw.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(raw)) return fallback;
        const parts = raw.split('/').filter(Boolean);
        if (parts.some(part => part === '.' || part === '..')) return fallback;
        const normalized = parts.join('/');
        return normalized.startsWith('images/') && /\.(jpe?g|png|gif|webp)$/i.test(normalized) ? normalized : fallback;
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
        image.src = retryCount > 0
            ? `${source}${source.includes('?') ? '&' : '?'}xiaofart_retry=${Date.now()}`
            : source;
    }

    function primeProjectImages(centerIndex, radius = 1) {
        if (!elements.projectGallery) return;
        const start = Math.max(0, centerIndex - radius);
        const end = Math.min(elements.projectGallery.children.length - 1, centerIndex + radius);
        for (let index = start; index <= end; index += 1) {
            const image = elements.projectGallery.children[index]?.querySelector('img[data-src]');
            loadArtworkImage(image);
        }
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
        image.dataset.src = project.heroImage;
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
        return positions[Math.min(distance, positions.length - 1)];
    }

    function updateOrbit(animate = true) {
        if (!state.projects.length || !elements.orbitTrack) return;
        clearTimeout(orbitMotionTimer);
        if (animate) {
            elements.orbitScene?.classList.add('is-moving');
            orbitMotionTimer = setTimeout(() => {
                elements.orbitScene?.classList.remove('is-moving');
                orbitMotionTimer = 0;
            }, 680);
        } else {
            elements.orbitScene?.classList.remove('is-moving');
        }
        const cards = [...elements.orbitTrack.children];
        cards.forEach((card, index) => {
            const offset = circularOffset(index, state.orbitIndex, cards.length);
            const distance = Math.abs(offset);
            const position = getOrbitPosition(offset);
            const hidden = distance > 3;
            card.style.setProperty('--orbit-x', `${position.x}px`);
            card.style.setProperty('--orbit-z', `${position.z}px`);
            card.style.setProperty('--orbit-rotate', `${position.rotate}deg`);
            card.style.setProperty('--orbit-scale', position.scale);
            card.style.setProperty('--orbit-opacity', hidden ? 0 : position.opacity);
            card.style.setProperty('--orbit-layer', hidden ? 0 : position.layer);
            card.style.setProperty('--orbit-pointer', hidden ? 'none' : 'auto');
            card.style.transitionDuration = animate ? '' : '0s';
            card.classList.toggle('is-active', offset === 0);
            card.setAttribute('aria-current', offset === 0 ? 'true' : 'false');
            card.setAttribute('aria-label', `${offset === 0 ? '打开' : '选择'}系列：${state.projects[index].title}`);
            card.tabIndex = distance <= 2 ? 0 : -1;

            const image = card.querySelector('img[data-src]');
            if (distance <= 3) loadArtworkImage(image);
        });

        const project = state.projects[state.orbitIndex];
        elements.orbitMeta.textContent = [project.category, project.year || 'Archive'].filter(Boolean).join(' · ');
        elements.orbitActiveTitle.textContent = project.title;
        elements.orbitDescription.textContent = project.description || '绘画、角色与视觉叙事。';
        elements.orbitCurrent.textContent = String(state.orbitIndex + 1).padStart(2, '0');
        elements.orbitOpenMobile?.setAttribute('aria-label', `查看系列：${project.title}`);

        if (!animate) requestAnimationFrame(() => cards.forEach(card => { card.style.transitionDuration = ''; }));
    }

    function rotateOrbitTo(index) {
        if (!state.projects.length) return;
        state.orbitIndex = (index + state.projects.length) % state.projects.length;
        updateOrbit();
    }

    function rotateOrbit(direction) {
        rotateOrbitTo(state.orbitIndex + direction);
    }

    function initOrbitHero() {
        if (!state.projects.length || !elements.orbitTrack) return;
        state.orbitIndex = 0;
        elements.orbitTrack.replaceChildren(...state.projects.map(createOrbitCard));
        elements.orbitTotal.textContent = String(state.projects.length).padStart(2, '0');
        updateOrbit(false);
    }

    function resetProjectScroll() {
        clearTimeout(projectScrollSettleTimer);
        projectScrollTargetIndex = null;
        elements.projectDialog.scrollTop = 0;
        elements.projectDialog.scrollLeft = 0;
        elements.projectGallery.scrollLeft = 0;
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
        elements.projectGallery.replaceChildren(...project.gallery.map((src, imageIndex) => createProjectImage(project, src, imageIndex)));
        state.projectImageIndex = 0;
        renderProjectIndicator(project.gallery.length);
        updateProjectIndicator();
        elements.previousProject.disabled = state.projects.length < 2;
        elements.nextProject.disabled = state.projects.length < 2;
        resetProjectScroll();

        const show = () => {
            if (!elements.projectDialog.open) elements.projectDialog.showModal();
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
        document.startViewTransition ? document.startViewTransition(show) : show();
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
        image.dataset.src = src;
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
            if (image.dataset.loadState === 'error') {
                loadArtworkImage(image, true);
                return;
            }
            openLightbox(imageIndex);
        });
        if (imageIndex <= 1) loadArtworkImage(image);
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
        elements.projectGallery.querySelector('.project-image.is-active')?.classList.remove('is-active');
        elements.projectGallery.children[state.projectImageIndex]?.classList.add('is-active');

        const currentMarker = elements.projectSlideIndicator.querySelector('[aria-current="true"]');
        currentMarker?.classList.remove('is-active');
        currentMarker?.removeAttribute('aria-current');
        const nextMarker = elements.projectSlideIndicator.children[state.projectImageIndex];
        nextMarker?.classList.add('is-active');
        nextMarker?.setAttribute('aria-current', 'true');
    }

    function setProjectImage(index, behavior = 'smooth') {
        const project = state.projects[state.activeProjectIndex];
        if (!project?.gallery.length) return;
        state.projectImageIndex = Math.max(0, Math.min(project.gallery.length - 1, index));
        primeProjectImages(state.projectImageIndex);
        if (matchMedia('(max-width: 760px)').matches) {
            elements.projectGallery.children[state.projectImageIndex]?.scrollTo({ top: 0, behavior: 'auto' });
        }
        updateProjectIndicator();
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scrollBehavior = reducedMotion ? 'auto' : behavior;
        projectScrollTargetIndex = state.projectImageIndex;
        clearTimeout(projectScrollSettleTimer);
        elements.projectGallery.scrollTo({
            left: state.projectImageIndex * elements.projectGallery.clientWidth,
            behavior: scrollBehavior
        });
        projectScrollSettleTimer = setTimeout(() => {
            projectScrollTargetIndex = null;
            projectScrollSettleTimer = 0;
        }, scrollBehavior === 'auto' ? 40 : 700);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function closeProject(updateUrl = true) {
        if (!elements.projectDialog.open) return;
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
        const commit = () => {
            if (token !== lightboxSwitchToken) return;
            elements.lightboxImage.src = src;
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
        preload.onerror = swap;
        preload.src = src;
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
        let orbitTouchStartX = 0;
        let orbitTouchStartY = 0;
        let orbitWheelLocked = false;
        let orbitWheelReleaseTimer = 0;
        let orbitSuppressClickUntil = 0;
        let projectWheelLocked = false;
        let projectWheelReleaseTimer = 0;
        let projectScrollFrame = 0;
        let resizeFrame = 0;
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
        elements.orbitScene?.addEventListener('wheel', event => {
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (Math.abs(delta) < 10) return;
            event.preventDefault();
            clearTimeout(orbitWheelReleaseTimer);
            orbitWheelReleaseTimer = setTimeout(() => {
                orbitWheelLocked = false;
                orbitWheelReleaseTimer = 0;
            }, 280);
            if (orbitWheelLocked) return;
            orbitWheelLocked = true;
            rotateOrbit(delta > 0 ? 1 : -1);
        }, { passive: false });
        elements.orbitScene?.addEventListener('touchstart', event => {
            if (event.touches.length !== 1) return;
            orbitTouchStartX = event.touches[0].clientX;
            orbitTouchStartY = event.touches[0].clientY;
        }, { passive: true });
        elements.orbitScene?.addEventListener('touchend', event => {
            const touch = event.changedTouches[0];
            if (!touch) return;
            const deltaX = touch.clientX - orbitTouchStartX;
            const deltaY = touch.clientY - orbitTouchStartY;
            if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
                orbitSuppressClickUntil = performance.now() + 450;
                rotateOrbit(deltaX < 0 ? 1 : -1);
            }
        }, { passive: true });
        addEventListener('resize', () => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
                updateOrbit(false);
                if (elements.projectDialog.open) setProjectImage(state.projectImageIndex, 'auto');
            });
        }, { passive: true });
        elements.projectClose.addEventListener('click', () => closeProject());
        elements.projectDialog.addEventListener('cancel', event => {
            event.preventDefault();
            closeProject();
        });
        elements.projectDialog.addEventListener('click', event => { if (event.target === elements.projectDialog) closeProject(); });
        elements.projectGallery.addEventListener('wheel', event => {
            if (
                matchMedia('(max-width: 760px)').matches &&
                Math.abs(event.deltaY) > Math.abs(event.deltaX)
            ) {
                return;
            }

            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            event.preventDefault();

            clearTimeout(projectWheelReleaseTimer);
            projectWheelReleaseTimer = setTimeout(() => {
                projectWheelLocked = false;
                projectWheelReleaseTimer = 0;
            }, 300);

            if (Math.abs(delta) < 8) return;
            if (projectWheelLocked) return;
            projectWheelLocked = true;
            setProjectImage(state.projectImageIndex + (delta > 0 ? 1 : -1));
        }, { passive: false });
        elements.projectGallery.addEventListener('scroll', () => {
            cancelAnimationFrame(projectScrollFrame);
            projectScrollFrame = requestAnimationFrame(() => {
                const width = elements.projectGallery.clientWidth;
                if (!width) return;
                if (projectScrollTargetIndex !== null) {
                    const targetLeft = projectScrollTargetIndex * width;
                    if (Math.abs(elements.projectGallery.scrollLeft - targetLeft) <= 2) {
                        clearTimeout(projectScrollSettleTimer);
                        projectScrollTargetIndex = null;
                        projectScrollSettleTimer = 0;
                    }
                    return;
                }
                const index = Math.round(elements.projectGallery.scrollLeft / width);
                if (index !== state.projectImageIndex) {
                    state.projectImageIndex = index;
                    primeProjectImages(index);
                    if (matchMedia('(max-width: 760px)').matches) {
                        elements.projectGallery.children[index]?.scrollTo({ top: 0, behavior: 'auto' });
                    }
                    updateProjectIndicator();
                }
            });
        }, { passive: true });
        elements.projectGallery.addEventListener('touchstart', () => {
            clearTimeout(projectScrollSettleTimer);
            projectScrollTargetIndex = null;
            projectScrollSettleTimer = 0;
        }, { passive: true });
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
