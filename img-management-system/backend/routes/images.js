const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const store = require('../store');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { detectImageExtension, isAllowedImageUpload } = require('../utils/security');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 20
    },
    fileFilter: (req, file, cb) => {
        if (isAllowedImageUpload(file)) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片格式'));
        }
    }
});

router.get('/recent', authenticateToken, (req, res) => {
    const recentImages = [...store.images]
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 6)
        .map(image => ({
            _id: String(image.id),
            filename: image.filename
        }));

    res.json(recentImages);
});

// 上传图片
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 20), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const invalidFiles = req.files.filter(file => {
        const buffer = fs.readFileSync(file.path);
        return !detectImageExtension(buffer);
    });

    if (invalidFiles.length > 0) {
        req.files.forEach(file => {
            fs.unlink(file.path, () => {});
        });

        return res.status(400).json({ message: '上传文件不是有效图片' });
    }

    const uploadedImages = req.files.map(file => ({
        id: Date.now() + Math.random(),
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        uploadedAt: new Date(),
        groupId: req.body.groupId || null
    }));

    store.images.push(...uploadedImages);

    res.json({
        message: '上传成功',
        images: uploadedImages
    });
});

// 获取图片列表
router.get('/', authenticateToken, (req, res) => {
    res.json(store.images);
});

// 获取单个图片
router.get('/:id', (req, res) => {
    const image = store.images.find(item => item.id == req.params.id);
    if (!image) {
        return res.status(404).json({ message: '图片不存在' });
    }

    res.sendFile(image.path);
});

// 删除图片
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const index = store.images.findIndex(item => item.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: '图片不存在' });
    }

    const image = store.images[index];

    fs.unlink(image.path, err => {
        if (err) {
            console.error('删除文件失败:', err);
        }
    });

    store.images.splice(index, 1);

    res.json({ message: '删除成功' });
});

// 批量删除
router.post('/batch-delete', authenticateToken, requireAdmin, (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
        return res.status(400).json({ message: '参数格式不正确' });
    }

    ids.forEach(id => {
        const index = store.images.findIndex(item => item.id == id);
        if (index !== -1) {
            const image = store.images[index];
            fs.unlink(image.path, err => {
                if (err) {
                    console.error('删除文件失败:', err);
                }
            });
            store.images.splice(index, 1);
        }
    });

    res.json({ message: '批量删除成功' });
});

module.exports = router;
