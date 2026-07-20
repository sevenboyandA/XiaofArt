(() => {
    'use strict';

    const state = {
        projects: [],
        selectedProjectId: null,
        draftTitles: [],
        draftDescriptions: [],
        draftAlignments: [],
        dirty: false,
        saving: false
    };

    const elements = {};

    function getToken() {
        return localStorage.getItem('token');
    }

    function checkAuth() {
        if (getToken()) return true;
        location.href = 'login.html';
        return false;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function assetUrl(src) {
        const normalized = String(src || '').replace(/^[/\\]+/, '');
        return '/portfolio-assets/' + normalized.split('/').map(encodeURIComponent).join('/');
    }

    function selectedProject() {
        return state.projects.find(project => Number(project.id) === Number(state.selectedProjectId)) || null;
    }

    function showToast(message, type = 'success') {
        elements.toast.textContent = message;
        elements.toast.dataset.type = type;
        elements.toast.className = 'toast show';
        clearTimeout(Number(elements.toast.dataset.hideTimer || 0));
        const hideTimer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
        elements.toast.dataset.hideTimer = String(hideTimer);
    }

    function setNotice(message = '', type = '') {
        elements.editorNotice.textContent = message;
        elements.editorNotice.dataset.type = type;
    }

    async function parseResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            location.href = 'login.html';
            throw new Error('登录已过期');
        }
        if (!response.ok) throw new Error(data.message || '请求失败');
        return data;
    }

    function padMetadata(project) {
        const length = Array.isArray(project.gallery) ? project.gallery.length : 0;
        const titles = Array.isArray(project.imageTitles) ? project.imageTitles.map(String) : [];
        const descriptions = Array.isArray(project.imageDescriptions) ? project.imageDescriptions.map(String) : [];
        const alignments = Array.isArray(project.imageAlignments) ? project.imageAlignments.map(String) : [];
        const defaultAlignments = ['left', 'right'];
        while (titles.length < length) titles.push('');
        while (descriptions.length < length) descriptions.push('');
        while (alignments.length < length) alignments.push(defaultAlignments[alignments.length % defaultAlignments.length]);
        return {
            titles: titles.slice(0, length),
            descriptions: descriptions.slice(0, length),
            alignments: alignments.slice(0, length).map((alignment, index) =>
                ['left', 'right'].includes(alignment) ? alignment : defaultAlignments[index % defaultAlignments.length]
            )
        };
    }

    function setDirty(dirty) {
        state.dirty = dirty;
        elements.saveButton.disabled = !dirty || state.saving || !selectedProject();
        elements.saveButton.classList.toggle('is-dirty', dirty);
        setNotice(dirty ? '有尚未保存的修改' : '', dirty ? 'pending' : '');
    }

    function renderSeriesOptions() {
        elements.seriesSelect.replaceChildren();
        if (!state.projects.length) {
            const option = new Option('暂无图片系列', '');
            elements.seriesSelect.add(option);
            elements.seriesSelect.disabled = true;
            return;
        }

        state.projects.forEach((project, index) => {
            const imageCount = Array.isArray(project.gallery) ? project.gallery.length : 0;
            const status = project.published !== false
                ? (project.hasUnpublishedChanges ? '已发布·待更新' : '已发布')
                : '后台草稿';
            const option = new Option(`${String(index + 1).padStart(2, '0')} · ${project.title}（${imageCount} 张 / ${status}）`, String(project.id));
            elements.seriesSelect.add(option);
        });
        elements.seriesSelect.disabled = false;
        elements.seriesSelect.value = String(state.selectedProjectId);
    }

    function imageCard(project, src, index) {
        const title = state.draftTitles[index] || '';
        const description = state.draftDescriptions[index] || '';
        const alignment = ['left', 'right'].includes(state.draftAlignments[index])
            ? state.draftAlignments[index]
            : ['left', 'right'][index % 2];
        const isCover = index === 0;
        return `
            <article class="image-meta-card panel bg-white" data-index="${index}">
                <div class="image-meta-preview">
                    <img src="${escapeAttribute(assetUrl(src))}" alt="${escapeAttribute(title || `${project.title} 第 ${index + 1} 张`)}" loading="lazy">
                    <span class="image-meta-index">${String(index + 1).padStart(2, '0')}</span>
                    ${isCover ? '<span class="image-meta-cover">系列封面</span>' : ''}
                </div>
                <div class="image-meta-fields">
                    <label>
                        <span>图片名称</span>
                        <input type="text" maxlength="120" data-field="title" data-index="${index}" value="${escapeAttribute(title)}" placeholder="为这幅画命名">
                    </label>
                    <label>
                        <span>图片简介</span>
                        <textarea rows="5" maxlength="1000" data-field="description" data-index="${index}" placeholder="记录创作想法、角色故事或画面细节">${escapeHtml(description)}</textarea>
                    </label>
                    <fieldset class="image-alignment-field">
                        <legend>前台排版</legend>
                        <div class="image-alignment-options">
                            ${[
                                ['left', '居左'],
                                ['right', '居右']
                            ].map(([value, label]) => `
                                <label>
                                    <input type="radio" name="alignment-${index}" value="${value}" data-field="alignment" data-index="${index}" ${alignment === value ? 'checked' : ''}>
                                    <span>${label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </fieldset>
                    <div class="image-meta-hint">
                        <span>名称与简介会显示在前台画作旁边</span>
                        <span data-count-for="${index}">${description.length} / 1000</span>
                    </div>
                </div>
            </article>
        `;
    }

    function renderSelectedProject() {
        const project = selectedProject();
        if (!project) {
            elements.grid.innerHTML = '';
            elements.empty.hidden = false;
            elements.seriesTitle.textContent = '尚未选择系列';
            elements.seriesCategory.textContent = '—';
            elements.seriesCount.textContent = '0 张图片';
            setDirty(false);
            return;
        }

        const metadata = padMetadata(project);
        state.draftTitles = metadata.titles;
        state.draftDescriptions = metadata.descriptions;
        state.draftAlignments = metadata.alignments;
        const gallery = Array.isArray(project.gallery) ? project.gallery : [];

        elements.seriesTitle.textContent = project.title || '未命名系列';
        elements.seriesCategory.textContent = [project.category, project.year].filter(Boolean).join(' · ') || '未分类';
        elements.seriesCount.textContent = `${gallery.length} 张图片`;
        elements.empty.hidden = gallery.length > 0;
        elements.empty.querySelector('h3').textContent = gallery.length ? '选择一个图片系列' : '这个系列还没有图片';
        elements.empty.querySelector('p').textContent = gallery.length
            ? '系列中的全部画作会显示在这里，并保持当前展示顺序。'
            : '请先到“上传图片”页面为该系列添加画作。';
        elements.grid.innerHTML = gallery.map((src, index) => imageCard(project, src, index)).join('');
        setDirty(false);
    }

    async function loadProjects() {
        setNotice('正在载入图片系列…');
        const response = await fetch('/api/site/projects', {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        state.projects = await parseResponse(response);
        state.selectedProjectId = state.projects[0]?.id ?? null;
        renderSeriesOptions();
        renderSelectedProject();
    }

    async function saveMetadata() {
        const project = selectedProject();
        if (!project || !state.dirty || state.saving) return;

        state.saving = true;
        elements.saveButton.disabled = true;
        elements.saveButton.querySelector('span').textContent = '正在保存…';
        setNotice('正在保存到后台…');

        try {
            const response = await fetch(`/api/site/projects/${project.id}/image-metadata`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageTitles: state.draftTitles,
                    imageDescriptions: state.draftDescriptions,
                    imageAlignments: state.draftAlignments
                })
            });
            const data = await parseResponse(response);
            const projectIndex = state.projects.findIndex(item => Number(item.id) === Number(project.id));
            if (projectIndex >= 0) state.projects[projectIndex] = data.project;
            state.dirty = false;
            setNotice('全部修改已保存到后台；请在“上传图片”页面发布更新。', 'success');
            showToast('图片资料保存成功');
        } catch (error) {
            setNotice(error.message || '保存失败，请稍后重试', 'error');
            showToast(error.message || '保存失败', 'error');
        } finally {
            state.saving = false;
            elements.saveButton.querySelector('span').textContent = '保存全部修改';
            elements.saveButton.disabled = !state.dirty;
        }
    }

    function handleEditorInput(event) {
        const field = event.target.dataset.field;
        const index = Number(event.target.dataset.index);
        if (!field || !Number.isInteger(index)) return;

        if (field === 'title') state.draftTitles[index] = event.target.value;
        if (field === 'alignment') state.draftAlignments[index] = event.target.value;
        if (field === 'description') {
            state.draftDescriptions[index] = event.target.value;
            const counter = elements.grid.querySelector(`[data-count-for="${index}"]`);
            if (counter) counter.textContent = `${event.target.value.length} / 1000`;
        }
        setDirty(true);
    }

    function bindEvents() {
        elements.seriesSelect.addEventListener('change', event => {
            const nextId = Number(event.target.value);
            if (state.dirty && !confirm('当前系列还有未保存的修改，确定要切换系列吗？')) {
                event.target.value = String(state.selectedProjectId);
                return;
            }
            state.selectedProjectId = nextId;
            renderSelectedProject();
        });
        elements.grid.addEventListener('input', handleEditorInput);
        elements.saveButton.addEventListener('click', saveMetadata);
        elements.logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            location.href = 'login.html';
        });
        addEventListener('beforeunload', event => {
            if (!state.dirty) return;
            event.preventDefault();
            event.returnValue = '';
        });
    }

    async function init() {
        if (!checkAuth()) return;
        Object.assign(elements, {
            seriesSelect: document.getElementById('seriesSelect'),
            seriesCategory: document.getElementById('seriesCategory'),
            seriesTitle: document.getElementById('seriesTitle'),
            seriesCount: document.getElementById('seriesCount'),
            saveButton: document.getElementById('saveMetadataBtn'),
            editorNotice: document.getElementById('editorNotice'),
            empty: document.getElementById('imageEditorEmpty'),
            grid: document.getElementById('imageMetadataGrid'),
            toast: document.getElementById('toast'),
            logoutButton: document.getElementById('logoutBtn')
        });

        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.name) document.getElementById('userName').textContent = user.name;
        bindEvents();
        try {
            await loadProjects();
        } catch (error) {
            setNotice(error.message || '载入图片系列失败', 'error');
            showToast(error.message || '载入失败', 'error');
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
