const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const workspaceRoot = path.resolve(__dirname, '../../..');
const backendRoot = path.resolve(__dirname, '..');
const dataDir = path.join(backendRoot, 'data');
const dataFile = path.join(dataDir, 'site-content.json');
const publicScriptFile = path.join(workspaceRoot, 'site-data.js');
const managedImagesRoot = path.join(workspaceRoot, 'images', 'managed');

function getProjectImage(index) {
    return `images/project1/${index}.jpg`;
}

function getProjectGallery(startIndex, size = 4) {
    return Array.from({ length: size }, (_, offset) => {
        const imageIndex = ((startIndex - 1 + offset) % 12) + 1;
        return getProjectImage(imageIndex);
    });
}

function buildDefaultProjects() {
    return [
        {
            id: 1,
            title: 'Full in Love with You',
            category: '十三周年快乐',
            creationDate: '2026-01-01',
            year: '2026',
            heroImage: getProjectImage(1),
            gallery: getProjectGallery(1),
            updatedAt: '2026-01-01T00:00:00.000Z'
        },
        {
            id: 2,
            title: 'Geometric Harmony',
            category: 'Visual Design',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(2),
            gallery: getProjectGallery(2),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 3,
            title: 'Minimal Space',
            category: 'Interior Design',
            creationDate: '2023-01-01',
            year: '2023',
            heroImage: getProjectImage(3),
            gallery: getProjectGallery(3),
            updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
            id: 4,
            title: 'Color Study',
            category: 'Art Direction',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(4),
            gallery: getProjectGallery(4),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 5,
            title: 'Portrait Series',
            category: 'Photography',
            creationDate: '2023-01-01',
            year: '2023',
            heroImage: getProjectImage(5),
            gallery: getProjectGallery(5),
            updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
            id: 6,
            title: 'Digital Form',
            category: '3D Design',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(6),
            gallery: getProjectGallery(6),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 7,
            title: 'Creative Direction',
            category: 'Brand Strategy',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(7),
            gallery: getProjectGallery(7),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 8,
            title: 'Visual Identity',
            category: 'Graphic Design',
            creationDate: '2023-01-01',
            year: '2023',
            heroImage: getProjectImage(8),
            gallery: getProjectGallery(8),
            updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
            id: 9,
            title: 'Motion Graphics',
            category: 'Animation',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(9),
            gallery: getProjectGallery(9),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 10,
            title: 'Web Design',
            category: 'UI/UX',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(10),
            gallery: getProjectGallery(10),
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 11,
            title: 'Product Design',
            category: 'Industrial',
            creationDate: '2023-01-01',
            year: '2023',
            heroImage: getProjectImage(11),
            gallery: getProjectGallery(11),
            updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
            id: 12,
            title: 'Brand Campaign',
            category: 'Marketing',
            creationDate: '2024-01-01',
            year: '2024',
            heroImage: getProjectImage(12),
            gallery: getProjectGallery(12),
            updatedAt: '2024-01-01T00:00:00.000Z'
        }
    ];
}

function buildDefaultSettings() {
    return {
        brandName: 'ImageMaster',
        supportEmail: 'hello@xiaofart.com',
        recentImagesLimit: 6,
        defaultLandingPage: 'dashboard.html',
        adminNotice: '上传保存后会直接同步到作品站数据文件与图片资源目录。',
        lastSyncAt: new Date().toISOString()
    };
}

function buildDefaultSiteContent() {
    const projects = buildDefaultProjects();
    return {
        projects,
        categories: [...new Set(projects.map(project => project.category).filter(Boolean))],
        settings: buildDefaultSettings()
    };
}

function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join('/');
}

function serializeForPublic(siteContent) {
    return `window.XIAOFART_SITE_DATA = ${JSON.stringify({ projects: siteContent.projects }, null, 2)};\n`;
}

function extractYear(creationDate, fallbackYear) {
    if (creationDate) {
        const match = String(creationDate).match(/^(\d{4})/);
        if (match) {
            return match[1];
        }

        const parsedDate = new Date(creationDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            return String(parsedDate.getFullYear());
        }
    }

    return fallbackYear;
}

function normalizeSettings(settings = {}) {
    const defaults = buildDefaultSettings();
    const recentImagesLimit = Number(settings.recentImagesLimit);

    return {
        ...defaults,
        ...settings,
        recentImagesLimit: Number.isFinite(recentImagesLimit) ? Math.min(Math.max(recentImagesLimit, 1), 12) : defaults.recentImagesLimit
    };
}

function normalizeProjects(projects = []) {
    const defaultProjects = buildDefaultProjects();
    const defaultMap = new Map(defaultProjects.map(project => [project.id, project]));

    return defaultProjects.map(defaultProject => {
        const incoming = projects.find(project => Number(project.id) === defaultProject.id) || {};
        const gallery = Array.isArray(incoming.gallery) && incoming.gallery.length > 0 ? incoming.gallery : defaultProject.gallery;
        const creationDate = incoming.creationDate || defaultProject.creationDate;
        const imageTitles = Array.isArray(incoming.imageTitles) ? incoming.imageTitles : (defaultProject.imageTitles || []);

        return {
            ...defaultProject,
            ...incoming,
            id: defaultProject.id,
            creationDate,
            year: incoming.year || extractYear(creationDate, defaultProject.year),
            coverImage: incoming.coverImage || defaultProject.coverImage || gallery[0] || defaultProject.heroImage,
            heroImage: incoming.heroImage || gallery[0] || defaultProject.heroImage,
            gallery,
            imageTitles
        };
    }).sort((a, b) => a.id - b.id);
}

function normalizeSiteContent(siteContent = {}) {
    const projects = normalizeProjects(siteContent.projects || []);
    const categories = [...new Set([
        ...(Array.isArray(siteContent.categories) ? siteContent.categories : []),
        ...projects.map(project => project.category).filter(Boolean)
    ])].sort((a, b) => a.localeCompare(b, 'zh-CN'));

    return {
        projects,
        categories,
        settings: normalizeSettings(siteContent.settings)
    };
}

function readSiteContent() {
    ensureDirectory(dataDir);

    if (!fs.existsSync(dataFile)) {
        const defaultContent = buildDefaultSiteContent();
        fs.writeFileSync(dataFile, JSON.stringify(defaultContent, null, 2));
        fs.writeFileSync(publicScriptFile, serializeForPublic(defaultContent));
        return defaultContent;
    }

    const fileContent = fs.readFileSync(dataFile, 'utf8');
    const parsed = normalizeSiteContent(JSON.parse(fileContent));
    fs.writeFileSync(publicScriptFile, serializeForPublic(parsed));
    return parsed;
}

function writeSiteContent(siteContent) {
    ensureDirectory(dataDir);
    console.log('writeSiteContent - before normalize, first project imageTitles:', siteContent.projects[0]?.imageTitles);
    const normalized = normalizeSiteContent(siteContent);
    console.log('writeSiteContent - after normalize, first project imageTitles:', normalized.projects[0]?.imageTitles);
    fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2));
    console.log('writeSiteContent - written to dataFile:', dataFile);
    fs.writeFileSync(publicScriptFile, serializeForPublic(normalized));
    console.log('writeSiteContent - written to publicScriptFile:', publicScriptFile);
    return normalized;
}

function listProjects() {
    const content = readSiteContent();
    return [...content.projects];
}

function getProjectById(id) {
    return listProjects().find(project => project.id === Number(id));
}

function getSettings() {
    return readSiteContent().settings;
}

function updateSettings(payload = {}) {
    const content = readSiteContent();
    content.settings = {
        ...content.settings,
        ...payload
    };
    return writeSiteContent(content).settings;
}

function getDashboardSummary() {
    const content = readSiteContent();
    const totalImages = content.projects.reduce((sum, project) => {
        return sum + (Array.isArray(project.gallery) && project.gallery.length ? project.gallery.length : project.heroImage ? 1 : 0);
    }, 0);

    return {
        totalImages,
        totalGroups: content.categories.length,
        totalProjects: content.projects.length
    };
}

function getRecentImages(limit) {
    const content = readSiteContent();
    const resolvedLimit = Number.isFinite(Number(limit)) ? Number(limit) : content.settings.recentImagesLimit;

    return [...content.projects]
        .sort((a, b) => new Date(b.updatedAt || b.creationDate || 0) - new Date(a.updatedAt || a.creationDate || 0))
        .slice(0, resolvedLimit)
        .map(project => ({
            _id: String(project.id),
            projectId: project.id,
            filename: project.title,
            src: project.heroImage,
            category: project.category,
            updatedAt: project.updatedAt || project.creationDate
        }));
}

function listCategories() {
    const content = readSiteContent();

    return content.categories.map(name => {
        const relatedProjects = content.projects.filter(project => project.category === name);
        const imageCount = relatedProjects.reduce((sum, project) => sum + (project.gallery?.length || (project.heroImage ? 1 : 0)), 0);

        return {
            name,
            projectCount: relatedProjects.length,
            imageCount,
            projects: relatedProjects.map(project => ({
                id: project.id,
                title: project.title,
                heroImage: project.heroImage,
                year: project.year
            }))
        };
    }).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

function getCategoryStats() {
    const content = readSiteContent();
    const totalImages = content.projects.reduce((sum, project) => sum + (project.gallery?.length || 0), 0);

    return listCategories().map(category => ({
        name: category.name,
        count: category.imageCount,
        percentage: totalImages > 0 ? Math.round((category.imageCount / totalImages) * 100) : 0
    }));
}

function createCategory(name) {
    const categoryName = String(name || '').trim();
    if (!categoryName) {
        throw new Error('分类名称不能为空');
    }

    const content = readSiteContent();
    if (content.categories.includes(categoryName)) {
        throw new Error('分类已存在');
    }

    content.categories.push(categoryName);
    content.settings.lastSyncAt = new Date().toISOString();
    return writeSiteContent(content);
}

function renameCategory(oldName, nextName) {
    const previousName = String(oldName || '').trim();
    const replacementName = String(nextName || '').trim();

    if (!previousName || !replacementName) {
        throw new Error('分类名称不能为空');
    }

    if (previousName === replacementName) {
        return readSiteContent();
    }

    const content = readSiteContent();
    if (!content.categories.includes(previousName)) {
        throw new Error('分类不存在');
    }

    if (content.categories.includes(replacementName)) {
        throw new Error('新的分类名称已存在');
    }

    content.categories = content.categories.map(category => category === previousName ? replacementName : category);
    content.projects = content.projects.map(project => project.category === previousName ? {
        ...project,
        category: replacementName,
        updatedAt: new Date().toISOString()
    } : project);
    content.settings.lastSyncAt = new Date().toISOString();

    return writeSiteContent(content);
}

function deleteCategory(name, replacementName) {
    const categoryName = String(name || '').trim();
    const replacement = String(replacementName || '').trim();

    if (!categoryName) {
        throw new Error('分类不存在');
    }

    const content = readSiteContent();
    if (!content.categories.includes(categoryName)) {
        throw new Error('分类不存在');
    }

    const usedProjects = content.projects.filter(project => project.category === categoryName);
    if (usedProjects.length > 0) {
        if (!replacement) {
            throw new Error('该分类已关联前台项目，请先选择替代分类');
        }

        if (replacement === categoryName) {
            throw new Error('替代分类不能与当前分类相同');
        }

        if (!content.categories.includes(replacement)) {
            throw new Error('替代分类不存在');
        }

        content.projects = content.projects.map(project => project.category === categoryName ? {
            ...project,
            category: replacement,
            updatedAt: new Date().toISOString()
        } : project);
    }

    content.categories = content.categories.filter(category => category !== categoryName);
    content.settings.lastSyncAt = new Date().toISOString();

    return writeSiteContent(content);
}

function getManagedProjectDirectory(projectId) {
    const projectDir = path.join(managedImagesRoot, `project-${projectId}`);
    ensureDirectory(projectDir);
    return projectDir;
}

function saveUploadedImages(projectId, files, existingGallery = []) {
    const projectDir = getManagedProjectDirectory(projectId);

    const existingPaths = [...existingGallery];

    const existingHashes = new Set();
    for (const galleryPath of existingGallery) {
        const fullPath = path.join(workspaceRoot, galleryPath);
        if (fs.existsSync(fullPath)) {
            const hash = crypto.createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
            existingHashes.add(hash);
        }
    }

    const newPaths = [];
    let savedCount = 0;

    for (const file of files) {
        const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');

        if (existingHashes.has(fileHash)) {
            console.log(`跳过重复文件: ${file.originalname} (hash: ${fileHash})`);
            continue;
        }
        existingHashes.add(fileHash);

        savedCount++;
        const fileCounter = existingPaths.length + savedCount;
        const originalExtension = path.extname(file.originalname || '').toLowerCase();
        const extension = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(originalExtension) ? originalExtension : '.jpg';
        const fileName = `image-${fileCounter}${extension}`;
        const absolutePath = path.join(projectDir, fileName);
        fs.writeFileSync(absolutePath, file.buffer);
        newPaths.push(normalizePath(path.relative(workspaceRoot, absolutePath)));
    }

    return [...existingPaths, ...newPaths];
}

function updateProject(projectId, payload, files = []) {
    const content = readSiteContent();
    const targetIndex = content.projects.findIndex(project => project.id === Number(projectId));

    if (targetIndex === -1) {
        return null;
    }

    const currentProject = content.projects[targetIndex];
    console.log('updateProject - currentProject.imageTitles:', currentProject.imageTitles);
    console.log('updateProject - payload.imageTitles:', payload.imageTitles);

    let imageTitles = currentProject.imageTitles;
    if (payload.imageTitles && typeof payload.imageTitles === 'string' && payload.imageTitles.trim() !== '') {
        try {
            imageTitles = JSON.parse(payload.imageTitles);
            console.log('updateProject - 解析后 imageTitles:', imageTitles);
        } catch (e) {
            console.error('解析 imageTitles 失败:', e);
        }
    }

    let galleryBase = currentProject.gallery || [];
    if (payload.gallery && typeof payload.gallery === 'string' && payload.gallery.trim() !== '') {
        try {
            galleryBase = JSON.parse(payload.gallery);
            console.log('updateProject - 使用前端传来的 gallery:', galleryBase);
        } catch (e) {
            console.error('解析 gallery 失败:', e);
        }
    }

    const nextProject = {
        ...currentProject,
        title: payload.title || currentProject.title,
        category: payload.category || currentProject.category,
        creationDate: payload.creationDate || currentProject.creationDate,
        coverImage: payload.coverImage || currentProject.coverImage,
        imageTitles: imageTitles,
        updatedAt: new Date().toISOString()
    };

    nextProject.year = extractYear(nextProject.creationDate, currentProject.year);

    if (files.length > 0) {
        const relativePaths = saveUploadedImages(projectId, files, galleryBase);
        nextProject.heroImage = relativePaths[0];
        nextProject.gallery = relativePaths;
    } else if (payload.galleryOrder) {
        // 处理图片顺序更新
        try {
            const galleryOrder = JSON.parse(payload.galleryOrder);
            if (Array.isArray(galleryOrder) && galleryOrder.length > 0) {
                // 重新排序 gallery
                const newGallery = galleryOrder.map(index => currentProject.gallery[index]);
                nextProject.gallery = newGallery;
                // 重新排序 imageTitles（使用已更新的nextProject.imageTitles）
                if (nextProject.imageTitles && Array.isArray(nextProject.imageTitles)) {
                    const newImageTitles = galleryOrder.map(index => nextProject.imageTitles[index] || '');
                    nextProject.imageTitles = newImageTitles;
                }
                // 更新封面图片
                if (nextProject.coverImage) {
                    nextProject.coverImage = newGallery[0];
                }
            }
        } catch (error) {
            console.error('解析 galleryOrder 失败:', error);
        }
    } else if (payload.gallery) {
        // 处理删除图片的情况
        try {
            const gallery = JSON.parse(payload.gallery);
            if (Array.isArray(gallery)) {
                nextProject.gallery = gallery;
                // 更新封面图片
                if (gallery.length > 0) {
                    nextProject.coverImage = gallery[0];
                    nextProject.heroImage = gallery[0];
                }
            }
        } catch (error) {
            console.error('解析 gallery 失败:', error);
        }
    }

    if (!content.categories.includes(nextProject.category)) {
        content.categories.push(nextProject.category);
    }

    content.projects[targetIndex] = nextProject;
    console.log('updateProject - nextProject.imageTitles before writeSiteContent:', nextProject.imageTitles);
    content.settings.lastSyncAt = nextProject.updatedAt;

    return writeSiteContent(content).projects[targetIndex];
}

function deleteProject(projectId) {
    const content = readSiteContent();
    const targetIndex = content.projects.findIndex(project => project.id === Number(projectId));

    if (targetIndex === -1) {
        return null;
    }

    // 删除项目
    content.projects.splice(targetIndex, 1);
    content.settings.lastSyncAt = new Date().toISOString();

    return writeSiteContent(content);
}

function createProject(payload) {
    const content = readSiteContent();
    const newId = Math.max(...content.projects.map(p => p.id), 0) + 1;

    const newProject = {
        id: newId,
        title: payload.title || `项目 ${newId}`,
        category: payload.category || '未分类',
        creationDate: payload.creationDate || new Date().toISOString().split('T')[0],
        year: payload.year || new Date().getFullYear().toString(),
        heroImage: 'images/project1/1.jpg',
        gallery: ['images/project1/1.jpg', 'images/project1/2.jpg', 'images/project1/3.jpg', 'images/project1/4.jpg'],
        updatedAt: new Date().toISOString()
    };

    content.projects.push(newProject);
    content.settings.lastSyncAt = newProject.updatedAt;

    const result = writeSiteContent(content);
    return result.projects.find(p => p.id === newId);
}

function updateProjectOrder(projectIds) {
    const content = readSiteContent();

    // 根据提供的 ID 顺序重新排序项目
    const orderedProjects = projectIds.map(id => content.projects.find(p => p.id === id)).filter(Boolean);

    if (orderedProjects.length === content.projects.length) {
        content.projects = orderedProjects;
        content.settings.lastSyncAt = new Date().toISOString();
        return writeSiteContent(content);
    }

    return content;
}

readSiteContent();

module.exports = {
    createCategory,
    deleteCategory,
    getCategoryStats,
    getDashboardSummary,
    getProjectById,
    getRecentImages,
    getSettings,
    listCategories,
    listProjects,
    renameCategory,
    updateProject,
    updateSettings,
    deleteProject,
    createProject,
    updateProjectOrder
};
