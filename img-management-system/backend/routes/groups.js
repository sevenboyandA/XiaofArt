const express = require('express');
const router = express.Router();
const store = require('../store');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { trimText } = require('../utils/security');

router.get('/stats', authenticateToken, (req, res) => {
    if (store.images.length === 0) {
        return res.json([]);
    }

    const stats = store.groups
        .map(group => {
            const count = store.images.filter(image => String(image.groupId) === String(group.id)).length;
            return {
                name: group.name,
                count,
                percentage: Math.round((count / store.images.length) * 100)
            };
        })
        .filter(group => group.count > 0);

    res.json(stats);
});

// 创建分类
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const name = trimText(req.body.name, 80);

    if (!name) {
        return res.status(400).json({ message: '分类名称不能为空' });
    }

    const existingGroup = store.groups.find(group => group.name === name);
    if (existingGroup) {
        return res.status(400).json({ message: '分类已存在' });
    }

    const newGroup = {
        id: Math.max(...store.groups.map(group => Number(group.id) || 0), 0) + 1,
        name,
        createdAt: new Date()
    };

    store.groups.push(newGroup);

    res.status(201).json(newGroup);
});

// 获取分类列表
router.get('/', authenticateToken, (req, res) => {
    res.json(store.groups);
});

// 获取单个分类
router.get('/:id', authenticateToken, (req, res) => {
    const group = store.groups.find(item => item.id == req.params.id);
    if (!group) {
        return res.status(404).json({ message: '分类不存在' });
    }

    res.json(group);
});

// 更新分类
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const name = trimText(req.body.name, 80);
    const group = store.groups.find(item => item.id == req.params.id);

    if (!group) {
        return res.status(404).json({ message: '分类不存在' });
    }

    if (!name) {
        return res.status(400).json({ message: '分类名称不能为空' });
    }

    const existingGroup = store.groups.find(item => item.name === name && item.id != req.params.id);
    if (existingGroup) {
        return res.status(400).json({ message: '分类已存在' });
    }

    group.name = name;

    res.json(group);
});

// 删除分类
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const index = store.groups.findIndex(item => item.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: '分类不存在' });
    }

    store.groups.splice(index, 1);

    res.json({ message: '删除成功' });
});

module.exports = router;
