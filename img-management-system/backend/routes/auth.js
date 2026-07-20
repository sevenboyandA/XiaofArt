const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createRateLimiter, getJwtSecret, trimText } = require('../utils/security');

const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10 });

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 注册
router.post('/register', async (req, res) => {
    if (process.env.ALLOW_REGISTRATION !== 'true') {
        return res.status(403).json({ message: '个人作品站不开放公开注册' });
    }

    const { name, email, password } = req.body;
    const normalizedName = trimText(name, 60);
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
        return res.status(400).json({ message: '请完整填写注册信息' });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: '邮箱格式不正确' });
    }

    if (String(password).length < 8) {
        return res.status(400).json({ message: '密码至少需要 8 位' });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { name: normalizedName }] });
    if (existingUser) {
        return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 密码加密
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建新用户
    const newUser = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date()
    });

    res.status(201).json({ message: '注册成功' });
});

// 登录
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !isValidEmail(normalizedEmail)) {
        return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 查找用户
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        getJwtSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        landingPage: process.env.DEFAULT_LANDING_PAGE || 'dashboard.html'
    });
});

module.exports = router;
