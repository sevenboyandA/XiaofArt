const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { Project, Image, Group, Metric } = require('../models');
const {
    getVerifiedImageExtension,
    isValidDateString,
    parseJsonArray,
    safeJoin,
    sanitizeImagePathArray,
    sanitizePublicImagePath,
    trimText
} = require('../utils/security');

const workspaceRoot = path.resolve(__dirname, '../../..');
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

function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join('/');
}

function normalizeProjectForPublic(project) {
    const fallbackGallery = getProjectGallery(1);
    const gallery = sanitizeImagePathArray(project.gallery || []);
    const heroImage = sanitizePublicImagePath(project.heroImage) || gallery[0] || fallbackGallery[0];
    const coverImage = sanitizePublicImagePath(project.coverImage) || heroImage;

    return {
        id: Number(project.id),
        order: Number(project.order || 0),
        title: trimText(project.title, 120),
        category: trimText(project.category, 80),
        description: trimText(project.description, 3000),
        creationDate: project.creationDate,
        year: project.year,
        heroImage,
        coverImage,
        gallery: gallery.length > 0 ? gallery : fallbackGallery,
        imageTitles: normalizeImageTitles(project.imageTitles, [], gallery.length),
        imageDescriptions: normalizeImageDescriptions(project.imageDescriptions, [], gallery.length),
        imageAlignments: normalizeImageAlignments(project.imageAlignments, [], gallery.length)
    };
}

function serializeForPublic(siteContent) {
    const projects = (siteContent.projects || []).map(normalizeProjectForPublic);

    return `window.XIAOFART_SITE_DATA = ${JSON.stringify({ projects }, null, 2)};
`;
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

function parsePublicSiteData() {
    if (!fs.existsSync(publicScriptFile)) {
        return [];
    }

    try {
        const fileContent = fs.readFileSync(publicScriptFile, 'utf8');
        const match = fileContent.match(/window\.XIAOFART_SITE_DATA\s*=\s*({[\s\S]*?});?\s*$/);
        if (!match) {
            return [];
        }

        const parsed = JSON.parse(match[1]);
        return Array.isArray(parsed.projects) ? parsed.projects : [];
    } catch (error) {
        console.error('读取前台作品数据失败:', error);
        return [];
    }
}

function normalizeProjectForDatabase(project, index) {
    const fallbackGallery = getProjectGallery(1);
    const id = Number.isInteger(Number(project.id)) ? Number(project.id) : index + 1;
    const mongoId = /^[a-f\d]{24}$/i.test(String(project._id || '')) ? String(project._id) : undefined;
    const gallery = sanitizeImagePathArray(project.gallery || []);
    const heroImage = sanitizePublicImagePath(project.heroImage) || gallery[0] || fallbackGallery[0];
    const coverImage = sanitizePublicImagePath(project.coverImage) || heroImage;
    const creationDate = isValidDateString(project.creationDate)
        ? project.creationDate
        : new Date().toISOString().slice(0, 10);
    const normalizedGallery = gallery.length > 0 ? gallery : [heroImage].filter(Boolean);
    const updatedAt = project.updatedAt && !Number.isNaN(new Date(project.updatedAt).getTime())
        ? new Date(project.updatedAt)
        : new Date();
    const createdAt = project.createdAt && !Number.isNaN(new Date(project.createdAt).getTime())
        ? new Date(project.createdAt)
        : new Date();

    return {
        ...(mongoId ? { _id: mongoId } : {}),
        id,
        order: Number.isFinite(Number(project.order)) ? Number(project.order) : index,
        title: trimText(project.title, 120) || `Project ${id}`,
        category: trimText(project.category, 80) || '未分类',
        description: trimText(project.description, 3000),
        creationDate,
        year: Number(extractYear(creationDate, project.year)) || Number(new Date().getFullYear()),
        heroImage,
        coverImage,
        gallery: normalizedGallery,
        imageTitles: normalizeImageTitles(project.imageTitles, [], normalizedGallery.length),
        imageDescriptions: normalizeImageDescriptions(project.imageDescriptions, [], normalizedGallery.length),
        imageAlignments: normalizeImageAlignments(project.imageAlignments, [], normalizedGallery.length),
        published: project.published !== false,
        publishedSnapshot: project.publishedSnapshot || null,
        hasUnpublishedChanges: Boolean(project.hasUnpublishedChanges),
        publishedAt: project.publishedAt || updatedAt,
        createdAt,
        updatedAt
    };
}

function looksLikeDefaultProjects(projects = []) {
    const defaultProjects = buildDefaultProjects();
    if (projects.length !== defaultProjects.length) {
        return false;
    }

    const defaultById = new Map(defaultProjects.map(project => [Number(project.id), project]));
    return projects.every(project => {
        const defaultProject = defaultById.get(Number(project.id));
        if (!defaultProject) {
            return false;
        }

        return project.title === defaultProject.title &&
            project.category === defaultProject.category &&
            project.heroImage === defaultProject.heroImage &&
            JSON.stringify(project.gallery || []) === JSON.stringify(defaultProject.gallery || []);
    });
}

async function replaceProjectsFromPublicData(publicProjects) {
    const projects = publicProjects
        .map(normalizeProjectForDatabase)
        .filter(project => Number.isInteger(project.id))
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    if (projects.length === 0) {
        return false;
    }

    await Project.deleteMany({});
    await Group.deleteMany({});
    await Project.insertMany(projects);
    console.log(`已从前台数据导入 ${projects.length} 个项目到数据库`);
    return true;
}

async function initializeProjects() {
    // 旧版本中的项目都已经展示在前台，升级时保持原有可见状态。
    await Project.updateMany(
        { published: { $exists: false } },
        { $set: { published: true, hasUnpublishedChanges: false } }
    );
    const existingProjects = await Project.find().sort({ order: 1, id: 1 });
    const publicProjects = parsePublicSiteData();

    if (
        publicProjects.length > 0 &&
        (existingProjects.length === 0 || looksLikeDefaultProjects(existingProjects.map(project => project.toObject())))
    ) {
        await replaceProjectsFromPublicData(publicProjects);
    } else if (existingProjects.length === 0) {
        const defaultProjects = buildDefaultProjects().map((project, index) => ({
            ...project,
            order: index,
            published: true
        }));
        await Project.insertMany(defaultProjects);
        console.log('初始化默认项目完成');
    } else {
        console.log(`数据库已有 ${existingProjects.length} 个项目，保持数据库为同步源`);
    }

    const projects = await Project.find();
    await Promise.all(projects.map(async project => {
        if (project.published === false || project.publishedSnapshot) return;
        project.published = true;
        project.publishedSnapshot = normalizeProjectForPublic(project.toObject());
        project.hasUnpublishedChanges = false;
        project.publishedAt = project.publishedAt || project.updatedAt || new Date();
        await project.save();
    }));
    const categoryNames = [...new Set(projects.map(project => project.category).filter(Boolean))];
    await Promise.all(categoryNames.map(name => Group.updateOne(
        { name },
        { $setOnInsert: { name, createdAt: new Date() } },
        { upsert: true }
    )));
}

async function listProjects() {
    const projects = await Project.find().sort({ order: 1, id: 1 });
    return projects.map(project => project.toObject());
}

async function listPublishedProjects() {
    const projects = await Project.find({ published: true }).sort({ order: 1, id: 1 });
    return projects.map(project => {
        const source = project.publishedSnapshot || project.toObject();
        return normalizeProjectForPublic({
            ...source,
            id: project.id,
            order: project.order
        });
    });
}

async function getProjectById(id) {
    const project = await Project.findOne({ id: Number(id) });
    return project ? project.toObject() : null;
}

function getProjectVisualImages(project) {
    const gallery = Array.isArray(project.gallery) && project.gallery.length > 0
        ? project.gallery
        : (project.heroImage ? [project.heroImage] : []);

    return sanitizeImagePathArray(gallery);
}

async function getDashboardSummary() {
    const [projects, groups] = await Promise.all([
        Project.find(),
        Group.find()
    ]);

    const uniqueImages = new Set();
    projects.forEach(project => {
        getProjectVisualImages(project).forEach(imagePath => uniqueImages.add(imagePath));
    });

    const categories = new Set([
        ...groups.map(group => group.name).filter(Boolean),
        ...projects.map(project => project.category).filter(Boolean)
    ]);

    return {
        totalImages: uniqueImages.size,
        totalGroups: categories.size,
        totalProjects: projects.length
    };
}

async function getSiteViews() {
    const metric = await Metric.findOne({ key: 'siteViews' });
    return metric ? Number(metric.value || 0) : 0;
}

async function incrementSiteViews() {
    const metric = await Metric.findOneAndUpdate(
        { key: 'siteViews' },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return Number(metric.value || 0);
}

async function getRecentImages(limit = 6) {
    const resolvedLimit = Math.min(Math.max(Number(limit) || 6, 1), 12);
    const projects = await Project.find().sort({ updatedAt: -1 }).limit(resolvedLimit);
    return projects.map(project => ({
        _id: String(project.id),
        projectId: project.id,
        filename: project.title,
        src: project.heroImage,
        category: project.category,
        updatedAt: project.updatedAt || project.creationDate
    }));
}

async function listCategories() {
    const [projects, groups] = await Promise.all([
        Project.find(),
        Group.find()
    ]);
    const categories = [...new Set([
        ...groups.map(group => group.name).filter(Boolean),
        ...projects.map(project => project.category).filter(Boolean)
    ])];

    return categories.map(name => {
        const relatedProjects = projects.filter(project => project.category === name);
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

function getManagedProjectDirectory(projectId) {
    const projectDir = path.join(managedImagesRoot, `project-${projectId}`);
    ensureDirectory(projectDir);
    return projectDir;
}

async function optimizeImageBuffer(buffer, extension) {
    if (extension === '.gif') {
        return buffer;
    }

    let pipeline = sharp(buffer, { failOn: 'error' })
        .rotate()
        .resize({
            width: 3200,
            height: 3200,
            fit: 'inside',
            withoutEnlargement: true
        });

    if (extension === '.png') {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (extension === '.webp') {
        pipeline = pipeline.webp({ quality: 92, effort: 4 });
    } else {
        pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
    }

    const optimized = await pipeline.toBuffer();
    return optimized.length < buffer.length ? optimized : buffer;
}

async function saveUploadedImages(projectId, files, existingGallery = []) {
    const projectDir = getManagedProjectDirectory(projectId);

    const existingPaths = sanitizeImagePathArray(existingGallery);

    const existingHashes = new Set();
    for (const galleryPath of existingGallery) {
        const safeGalleryPath = sanitizePublicImagePath(galleryPath);
        if (!safeGalleryPath) {
            continue;
        }

        const fullPath = safeJoin(workspaceRoot, safeGalleryPath);
        if (fs.existsSync(fullPath)) {
            try {
                const hash = crypto.createHash('md5').update(await fs.promises.readFile(fullPath)).digest('hex');
                existingHashes.add(hash);
            } catch (e) {
                console.error('计算文件哈希失败:', e);
            }
        }
    }

    const newPaths = [];
    let savedCount = 0;

    for (const file of files) {
        try {
            const extension = getVerifiedImageExtension(file);
            if (!extension) {
                console.error('跳过无法识别的图片文件:', file.originalname);
                continue;
            }

            const optimizedBuffer = await optimizeImageBuffer(file.buffer, extension);
            const fileHash = crypto.createHash('md5').update(optimizedBuffer).digest('hex');

            if (existingHashes.has(fileHash)) {
                console.log(`跳过重复文件: ${file.originalname} (hash: ${fileHash})`);
                continue;
            }
            existingHashes.add(fileHash);

            savedCount++;
            const fileCounter = existingPaths.length + savedCount;
            const fileName = `image-${Date.now()}-${fileCounter}${extension}`;
            const absolutePath = path.join(projectDir, fileName);
            await fs.promises.writeFile(absolutePath, optimizedBuffer);
            newPaths.push(normalizePath(path.relative(workspaceRoot, absolutePath)));
        } catch (e) {
            console.error('保存文件失败:', e);
        }
    }

    return [...existingPaths, ...newPaths];
}

function collectProjectImageReferences(project, references) {
    if (!project) return;

    [project.heroImage, project.coverImage, ...(project.gallery || [])]
        .map(sanitizePublicImagePath)
        .filter(Boolean)
        .forEach(imagePath => references.add(imagePath));
}

async function listManagedFiles(directory = managedImagesRoot) {
    if (!fs.existsSync(directory)) return [];

    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    const nestedFiles = await Promise.all(entries.map(async entry => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? listManagedFiles(entryPath) : [entryPath];
    }));
    return nestedFiles.flat();
}

async function cleanupUnreferencedManagedImages() {
    const projects = await Project.find().select('gallery heroImage coverImage publishedSnapshot').lean();
    const references = new Set();
    projects.forEach(project => {
        collectProjectImageReferences(project, references);
        collectProjectImageReferences(project.publishedSnapshot, references);
    });

    const managedFiles = await listManagedFiles();
    const unreferencedFiles = managedFiles.filter(filePath => {
        const publicPath = normalizePath(path.relative(workspaceRoot, filePath));
        return !references.has(publicPath);
    });

    await Promise.all(unreferencedFiles.map(filePath => fs.promises.unlink(filePath).catch(error => {
        if (error.code !== 'ENOENT') throw error;
    })));

    if (fs.existsSync(managedImagesRoot)) {
        const directories = (await fs.promises.readdir(managedImagesRoot, { withFileTypes: true }))
            .filter(entry => entry.isDirectory())
            .map(entry => path.join(managedImagesRoot, entry.name));
        await Promise.all(directories.map(directory => fs.promises.rmdir(directory).catch(error => {
            if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) throw error;
        })));
    }

    return unreferencedFiles.length;
}

function normalizeImageTitles(value, fallback = [], galleryLength = 0) {
    const titles = parseJsonArray(value, fallback)
        .map(title => trimText(title, 120));

    while (titles.length < galleryLength) {
        titles.push('');
    }

    return galleryLength > 0 ? titles.slice(0, galleryLength) : titles;
}

function normalizeImageDescriptions(value, fallback = [], galleryLength = 0) {
    const descriptions = parseJsonArray(value, fallback)
        .map(description => trimText(description, 1000));

    while (descriptions.length < galleryLength) {
        descriptions.push('');
    }

    return galleryLength > 0 ? descriptions.slice(0, galleryLength) : descriptions;
}

function normalizeImageAlignments(value, fallback = [], galleryLength = 0) {
    const submitted = parseJsonArray(value, []);
    const fallbackValues = Array.isArray(fallback) ? fallback : [];
    const defaultPattern = ['left', 'right'];

    return Array.from({ length: galleryLength }, (_, index) => {
        const candidate = submitted[index] || fallbackValues[index] || defaultPattern[index % defaultPattern.length];
        return ['left', 'right'].includes(candidate) ? candidate : defaultPattern[index % defaultPattern.length];
    });
}

function normalizeGalleryOrder(value, galleryLength) {
    const seen = new Set();

    return parseJsonArray(value, [])
        .map(index => Number(index))
        .filter(index => {
            if (!Number.isInteger(index) || index < 0 || index >= galleryLength || seen.has(index)) {
                return false;
            }

            seen.add(index);
            return true;
        });
}

async function updateProject(projectId, payload, files = []) {
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
        return null;
    }

    const currentGallery = sanitizeImagePathArray(project.gallery || []);
    const submittedGallery = payload.gallery ? sanitizeImagePathArray(parseJsonArray(payload.gallery, [])) : null;
    const galleryBase = submittedGallery || currentGallery;
    let imageTitles = normalizeImageTitles(payload.imageTitles, project.imageTitles || [], galleryBase.length);
    let imageDescriptions = normalizeImageDescriptions(payload.imageDescriptions, project.imageDescriptions || [], galleryBase.length);
    let imageAlignments = normalizeImageAlignments(payload.imageAlignments, project.imageAlignments || [], galleryBase.length);

    const title = trimText(payload.title, 120);
    const category = trimText(payload.category, 80);
    const description = trimText(payload.description, 3000);
    const creationDate = trimText(payload.creationDate, 20);
    const requestedCoverImage = sanitizePublicImagePath(payload.coverImage);

    if (project.published && !project.publishedSnapshot) {
        project.publishedSnapshot = normalizeProjectForPublic(project.toObject());
        await project.save();
    }

    const updateData = {
        title: title || project.title,
        category: category || project.category,
        description,
        creationDate: isValidDateString(creationDate) ? creationDate : project.creationDate,
        coverImage: requestedCoverImage || project.coverImage,
        imageTitles: imageTitles,
        imageDescriptions,
        imageAlignments,
        updatedAt: new Date(),
        hasUnpublishedChanges: Boolean(project.published)
    };

    updateData.year = extractYear(updateData.creationDate, project.year);

    if (files.length > 0) {
        const relativePaths = await saveUploadedImages(projectId, files, galleryBase);
        updateData.gallery = relativePaths;
        updateData.imageTitles = normalizeImageTitles(imageTitles, [], relativePaths.length);
        updateData.imageDescriptions = normalizeImageDescriptions(imageDescriptions, [], relativePaths.length);
        updateData.imageAlignments = normalizeImageAlignments(imageAlignments, [], relativePaths.length);
    } else {
        const galleryOrder = normalizeGalleryOrder(payload.galleryOrder, galleryBase.length);

        if (galleryOrder.length > 0) {
            updateData.gallery = galleryOrder.map(index => galleryBase[index]).filter(Boolean);
            updateData.imageTitles = normalizeImageTitles(
                galleryOrder.map(index => imageTitles[index] || ''),
                [],
                updateData.gallery.length
            );
            updateData.imageDescriptions = normalizeImageDescriptions(
                galleryOrder.map(index => imageDescriptions[index] || ''),
                [],
                updateData.gallery.length
            );
            updateData.imageAlignments = normalizeImageAlignments(
                galleryOrder.map(index => imageAlignments[index]),
                [],
                updateData.gallery.length
            );
        } else if (submittedGallery) {
            updateData.gallery = galleryBase;
            updateData.imageTitles = normalizeImageTitles(imageTitles, [], galleryBase.length);
            updateData.imageDescriptions = normalizeImageDescriptions(imageDescriptions, [], galleryBase.length);
            updateData.imageAlignments = normalizeImageAlignments(imageAlignments, [], galleryBase.length);
        }
    }

    if (updateData.gallery) {
        updateData.heroImage = updateData.gallery[0] || '';
        updateData.coverImage = requestedCoverImage && updateData.gallery.includes(requestedCoverImage)
            ? requestedCoverImage
            : updateData.heroImage;
    }

    const updatedProject = await Project.findOneAndUpdate(
        { id: Number(projectId) },
        updateData,
        { new: true }
    );

    if (updatedProject.category) {
        await Group.updateOne(
            { name: updatedProject.category },
            { $setOnInsert: { name: updatedProject.category, createdAt: new Date() } },
            { upsert: true }
        );
    }

    await cleanupUnreferencedManagedImages();

    return updatedProject.toObject();
}

async function updateProjectImageMetadata(projectId, payload) {
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
        return null;
    }

    if (project.published && !project.publishedSnapshot) {
        project.publishedSnapshot = normalizeProjectForPublic(project.toObject());
        await project.save();
    }

    const galleryLength = sanitizeImagePathArray(project.gallery || []).length;
    const imageTitles = normalizeImageTitles(payload.imageTitles, project.imageTitles || [], galleryLength);
    const imageDescriptions = normalizeImageDescriptions(
        payload.imageDescriptions,
        project.imageDescriptions || [],
        galleryLength
    );
    const imageAlignments = normalizeImageAlignments(
        payload.imageAlignments,
        project.imageAlignments || [],
        galleryLength
    );

    const updatedProject = await Project.findOneAndUpdate(
        { id: Number(projectId) },
        {
            imageTitles,
            imageDescriptions,
            imageAlignments,
            updatedAt: new Date(),
            hasUnpublishedChanges: Boolean(project.published)
        },
        { new: true }
    );

    return updatedProject.toObject();
}

async function publishProject(projectId) {
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) return null;

    const gallery = sanitizeImagePathArray(project.gallery || []);
    if (gallery.length === 0) {
        const error = new Error('请先上传至少一张图片并保存，再添加到前台');
        error.statusCode = 400;
        throw error;
    }

    if (!project.published) {
        const lastPublished = await Project.findOne({ published: true }).sort({ order: -1, id: -1 });
        project.order = lastPublished ? Number(lastPublished.order || 0) + 1 : 0;
    }

    project.published = true;
    project.hasUnpublishedChanges = false;
    project.publishedAt = new Date();
    project.publishedSnapshot = normalizeProjectForPublic(project.toObject());
    await project.save();
    await syncPublicData();
    await cleanupUnreferencedManagedImages();
    return project.toObject();
}

async function unpublishProject(projectId) {
    const project = await Project.findOneAndUpdate(
        { id: Number(projectId) },
        { published: false, hasUnpublishedChanges: false, updatedAt: new Date() },
        { new: true }
    );
    if (!project) return null;
    await syncPublicData();
    return project.toObject();
}

async function deleteProject(projectId) {
    const project = await Project.findOneAndDelete({ id: Number(projectId) });
    if (!project) return null;

    await syncPublicData();
    await cleanupUnreferencedManagedImages();
    return project.toObject();
}

async function syncPublicData() {
    const projects = await listPublishedProjects();
    const siteContent = { projects };
    const temporaryFile = `${publicScriptFile}.tmp`;
    fs.writeFileSync(temporaryFile, serializeForPublic(siteContent));
    fs.renameSync(temporaryFile, publicScriptFile);
    console.log('同步公共数据完成');
}

module.exports = {
    cleanupUnreferencedManagedImages,
    deleteProject,
    getDashboardSummary,
    getProjectById,
    getRecentImages,
    getSiteViews,
    incrementSiteViews,
    initializeProjects,
    listCategories,
    listProjects,
    listPublishedProjects,
    publishProject,
    unpublishProject,
    updateProject,
    updateProjectImageMetadata,
    syncPublicData
};
