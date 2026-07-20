const express = require('express');
const multer = require('multer');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { isAllowedImageUpload, isValidDateString, trimText } = require('../utils/security');
const {
    deleteProject,
    getProjectById,
    getDashboardSummary,
    getRecentImages,
    listCategories,
    listProjects,
    publishProject,
    unpublishProject,
    updateProject,
    updateProjectImageMetadata
} = require('../services/dbSiteContentService');

// 导入数据库模型
const { Group, Project } = require('../models');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 20
    },
    fileFilter: (req, file, cb) => {
        if (isAllowedImageUpload(file)) {
            cb(null, true);
        } else {
            cb(new Error('只支持上传图片文件'));
        }
    }
});

router.use(authenticateToken);

router.get('/projects', async (req, res) => {
    try {
        const projects = await listProjects();
        res.json(projects);
    } catch (error) {
        console.error('获取项目列表失败:', error);
        res.status(500).json({ message: '获取项目列表失败' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await listCategories();
        res.json(categories);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({ message: '获取分类列表失败' });
    }
});

router.get('/projects/:id', async (req, res) => {
    try {
        const project = await getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: '项目不存在' });
        }
        res.json(project);
    } catch (error) {
        console.error('获取项目失败:', error);
        res.status(500).json({ message: '获取项目失败' });
    }
});

// 删除项目
router.delete('/projects/:id', requireAdmin, async (req, res) => {
    try {
        const project = await deleteProject(req.params.id);
        if (!project) {
            return res.status(404).json({ message: '项目不存在' });
        }

        const projects = await listProjects();
        res.json({ message: '项目删除成功', projects });
    } catch (error) {
        console.error('删除项目失败:', error);
        res.status(500).json({ message: '删除项目失败' });
    }
});

// 创建项目
router.post('/projects', requireAdmin, async (req, res) => {
    try {
        const title = trimText(req.body.title, 120);
        const category = trimText(req.body.category, 80) || '未分类';
        const creationDate = isValidDateString(req.body.creationDate)
            ? req.body.creationDate
            : new Date().toISOString().slice(0, 10);

        if (!title) {
            return res.status(400).json({ message: '项目名称不能为空' });
        }

        if (await Project.exists({ category })) {
            return res.status(409).json({ message: '该分类已经有项目内容，请直接编辑现有内容' });
        }

        // 获取最大ID
        const maxProject = await Project.findOne().sort({ id: -1 });
        const newId = (maxProject ? maxProject.id : 0) + 1;
        const maxOrderProject = await Project.findOne().sort({ order: -1, id: -1 });
        const newOrder = (maxOrderProject ? Number(maxOrderProject.order || 0) : -1) + 1;

        const newProject = new Project({
            id: newId,
            order: newOrder,
            title,
            category,
            creationDate,
            year: creationDate.substring(0, 4),
            gallery: [],
            imageTitles: [],
            published: false,
            hasUnpublishedChanges: false
        });

        await newProject.save();
        await Group.updateOne(
            { name: category },
            { $setOnInsert: { name: category, createdAt: new Date() } },
            { upsert: true }
        );

        res.status(201).json({ message: '后台草稿已创建', project: newProject.toObject() });
    } catch (error) {
        console.error('创建项目失败:', error);
        res.status(400).json({ message: '创建项目失败' });
    }
});

router.put('/projects/:id/publish', requireAdmin, async (req, res) => {
    try {
        const project = await publishProject(req.params.id);
        if (!project) return res.status(404).json({ message: '项目不存在' });
        res.json({ message: '项目已发布到前台', project });
    } catch (error) {
        console.error('发布项目失败:', error);
        res.status(error.statusCode || 500).json({ message: error.message || '发布项目失败' });
    }
});

router.put('/projects/:id/unpublish', requireAdmin, async (req, res) => {
    try {
        const project = await unpublishProject(req.params.id);
        if (!project) return res.status(404).json({ message: '项目不存在' });
        res.json({ message: '项目已从前台撤下，后台内容仍然保留', project });
    } catch (error) {
        console.error('撤下项目失败:', error);
        res.status(500).json({ message: '撤下项目失败' });
    }
});

// 更新项目顺序
router.put('/projects/order', requireAdmin, async (req, res) => {
    try {
        const { projectIds } = req.body;
        if (!Array.isArray(projectIds)) {
            return res.status(400).json({ message: '无效的项目 ID 列表' });
        }

        const ids = projectIds.map(id => Number(id));
        if (ids.some(id => !Number.isInteger(id))) {
            return res.status(400).json({ message: '无效的项目 ID 列表' });
        }

        await Promise.all(ids.map((id, index) => Project.updateOne(
            { id },
            { order: index, updatedAt: new Date() }
        )));

        const { syncPublicData } = require('../services/dbSiteContentService');
        await syncPublicData();

        const projects = await listProjects();
        res.json({ message: '项目顺序已更新', projects });
    } catch (error) {
        console.error('更新项目顺序失败:', error);
        res.status(500).json({ message: '更新项目顺序失败' });
    }
});

router.put('/projects/:id/image-metadata', requireAdmin, async (req, res) => {
    try {
        const project = await updateProjectImageMetadata(req.params.id, {
            imageTitles: req.body.imageTitles,
            imageDescriptions: req.body.imageDescriptions,
            imageAlignments: req.body.imageAlignments
        });

        if (!project) {
            return res.status(404).json({ message: '项目不存在' });
        }

        res.json({ message: '图片资料已保存到后台', project });
    } catch (error) {
        console.error('更新图片资料失败:', error);
        res.status(500).json({ message: '更新图片资料失败' });
    }
});

router.put('/projects/:id', requireAdmin, upload.array('images', 20), async (req, res) => {
    try {
        const { title, category, description, creationDate, coverImage, galleryOrder, imageTitles, imageDescriptions, imageAlignments, gallery } = req.body;

        if (!title || !category || !creationDate) {
            return res.status(400).json({ message: '请完整填写命名、分类名和创作时间' });
        }

        const project = await updateProject(req.params.id, { title, category, description, creationDate, coverImage, galleryOrder, imageTitles, imageDescriptions, imageAlignments, gallery }, req.files || []);
        if (!project) {
            return res.status(404).json({ message: '项目不存在' });
        }

        res.json({
            message: '项目内容已保存到后台',
            project
        });
    } catch (error) {
        console.error('更新项目失败:', error);
        res.status(500).json({ message: '更新项目失败' });
    }
});

router.get('/summary', async (req, res) => {
    try {
        const summary = await getDashboardSummary();
        res.json(summary);
    } catch (error) {
        console.error('获取汇总信息失败:', error);
        res.status(500).json({ message: '获取汇总信息失败' });
    }
});

router.get('/recent-images', async (req, res) => {
    try {
        const images = await getRecentImages();
        res.json(images);
    } catch (error) {
        console.error('获取最近图片失败:', error);
        res.status(500).json({ message: '获取最近图片失败' });
    }
});

// 创建分类
router.post('/categories', requireAdmin, async (req, res) => {
    try {
        const name = trimText(req.body.name, 80);
        if (!name) {
            return res.status(400).json({ message: '分类名称不能为空' });
        }

        const existingGroup = await Group.findOne({ name });
        if (existingGroup) {
            return res.status(400).json({ message: '分类已存在' });
        }

        await Group.create({ name });

        res.json({ message: '分类创建成功', categories: await listCategories() });
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(400).json({ message: '创建分类失败' });
    }
});

// 更新分类
router.put('/categories/:name', requireAdmin, async (req, res) => {
    try {
        const oldName = trimText(req.params.name, 80);
        const newName = trimText(req.body.name, 80);

        if (!newName) {
            return res.status(400).json({ message: '新分类名称不能为空' });
        }

        const existingGroup = await Group.findOne({ name: newName });
        if (existingGroup && oldName !== newName) {
            return res.status(400).json({ message: '新的分类名称已存在' });
        }

        // 更新所有使用旧分类名的项目
        await Promise.all([
            Project.updateMany(
                { category: oldName },
                { category: newName, hasUnpublishedChanges: true, updatedAt: new Date() }
            ),
            Group.findOneAndUpdate(
                { name: oldName },
                { name: newName },
                { upsert: true }
            )
        ]);

        // 同步公共数据
        const { syncPublicData } = require('../services/dbSiteContentService');
        await syncPublicData();

        res.json({ message: '分类更新成功', categories: await listCategories() });
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(400).json({ message: '更新分类失败' });
    }
});

// 删除分类
router.delete('/categories/:name', requireAdmin, async (req, res) => {
    try {
        const name = trimText(req.params.name, 80);
        const replacementName = trimText(req.body.replacementName, 80);

        if (!replacementName) {
            return res.status(400).json({ message: '请提供替换分类名称' });
        }

        // 更新所有使用该分类的项目
        await Promise.all([
            Project.updateMany(
                { category: name },
                { category: replacementName, hasUnpublishedChanges: true, updatedAt: new Date() }
            ),
            Group.deleteOne({ name }),
            Group.updateOne(
                { name: replacementName },
                { $setOnInsert: { name: replacementName, createdAt: new Date() } },
                { upsert: true }
            )
        ]);

        // 同步公共数据
        const { syncPublicData } = require('../services/dbSiteContentService');
        await syncPublicData();

        res.json({ message: '分类删除成功', categories: await listCategories() });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(400).json({ message: '删除分类失败' });
    }
});

module.exports = router;
