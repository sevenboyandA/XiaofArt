const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../store');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { trimText } = require('../utils/security');

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.use(authenticateToken, requireAdmin);

// 获取用户列表
router.get('/', (req, res) => {
    const userList = store.users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    }));
    res.json(userList);
});

// 获取单个用户
router.get('/:id', (req, res) => {
    const user = store.users.find(user => user.id == req.params.id);
    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    });
});

// 更新用户
router.put('/:id', (req, res) => {
    const name = trimText(req.body.name, 60);
    const email = trimText(req.body.email, 120).toLowerCase();
    const role = trimText(req.body.role, 20);
    const user = store.users.find(user => user.id == req.params.id);

    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }

    if (email) {
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: '邮箱格式不正确' });
        }

        const existingUser = store.users.find(item => item.email === email && item.id != req.params.id);
        if (existingUser) {
            return res.status(400).json({ message: '邮箱已被使用' });
        }
    }

    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: '用户角色不正确' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    });
});

// 删除用户
router.delete('/:id', (req, res) => {
    const index = store.users.findIndex(user => user.id == req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: '用户不存在' });
    }

    if (String(req.user.id) === String(req.params.id)) {
        return res.status(400).json({ message: '不能删除当前登录账号' });
    }

    store.users.splice(index, 1);

    res.json({ message: '删除成功' });
});

// 更改密码
router.post('/:id/change-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = store.users.find(user => user.id == req.params.id);

    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }

    if (!oldPassword) {
        return res.status(400).json({ message: '请输入旧密码' });
    }

    if (!newPassword || String(newPassword).length < 8) {
        return res.status(400).json({ message: '新密码至少需要 8 位' });
    }

    // 验证旧密码
    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: '旧密码错误' });
    }

    // 更新密码
    user.password = bcrypt.hashSync(newPassword, 10);

    res.json({ message: '密码更新成功' });
});

module.exports = router;
