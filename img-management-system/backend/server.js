const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 加载环境变量
dotenv.config();

const connectDB = require('./config/db');
const { authenticateToken } = require('./middleware/auth');
const {
    getDashboardSummary,
    getSiteViews,
    incrementSiteViews,
    initializeProjects,
    syncPublicData
} = require('./services/dbSiteContentService');
const { createRateLimiter, getAnalyticsSalt, getJwtSecret, safeJoin } = require('./utils/security');

// 初始化应用
const app = express();
getJwtSecret();
getAnalyticsSalt();

// 中间件
const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
    : false;
app.use(cors({
    origin: corsOrigin,
    credentials: Boolean(corsOrigin)
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    });
    next();
});

// 路径配置
const rootDir = path.resolve(__dirname, '..');
const portfolioDir = path.resolve(rootDir, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const frontendDir = path.join(rootDir, 'frontend');
const portfolioImagesDir = path.join(portfolioDir, 'images');

function sendFileInside(baseDir, targetPath, res, notFoundMessage = '页面不存在') {
    const relativePath = String(targetPath || '').replace(/^[/\\]+/, '');
    const resolvedPath = safeJoin(baseDir, relativePath);

    if (!resolvedPath || !fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        return res.status(404).send(notFoundMessage);
    }

    return res.sendFile(resolvedPath);
}

// 静态文件服务
app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny', index: false }));
app.use('/static', express.static(frontendDir, { dotfiles: 'deny', index: false }));
app.use('/images', express.static(portfolioImagesDir, { dotfiles: 'deny', index: false }));
app.use('/portfolio-assets/images', express.static(portfolioImagesDir, { dotfiles: 'deny', index: false }));

['/style.css', '/script.js', '/site-data.js', '/site-transition.js', '/gallery.css', '/gallery-app.js', '/page-shell.js'].forEach(publicPath => {
    app.get(publicPath, (req, res) => sendFileInside(portfolioDir, publicPath, res, '文件不存在'));
});

// Project1 页面路由 - 从主项目目录提供
app.get('/project1.html', (req, res) => {
    sendFileInside(portfolioDir, 'project1.html', res, 'project1.html not found');
});

app.get(['/', '/index.html', '/portfolio.html'], (req, res) => {
    sendFileInside(portfolioDir, 'index.html', res, '页面不存在');
});

app.get(['/project.html', '/about.html', '/contact.html'], (req, res) => {
    const fileName = req.path.slice(1);
    sendFileInside(portfolioDir, fileName, res, '页面不存在');
});

// 后台入口和前台作品页使用不同路径，避免 index.html 串到管理系统
app.get('/admin.html', (req, res) => {
    res.redirect(302, '/login.html');
});

console.log('系统使用MongoDB数据库模式运行');
console.log('静态文件目录:', frontendDir);

// 路由
const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/site');
const publicRoutes = require('./routes/public');
const analyticsRoutes = require('./routes/analytics');
const publicViewLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

app.use('/api/auth', authRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// 仪表盘路由
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [summary, totalViews] = await Promise.all([
            getDashboardSummary(),
            getSiteViews()
        ]);
        res.json({
            totalImages: summary.totalImages,
            totalGroups: summary.totalGroups,
            totalProjects: summary.totalProjects,
            totalViews
        });
    } catch (error) {
        console.error('获取仪表盘统计失败:', error);
        res.status(500).json({ message: '获取仪表盘统计失败' });
    }
});

// 获取浏览量
app.get('/api/views', async (req, res) => {
    try {
        res.json({ views: await getSiteViews() });
    } catch (error) {
        console.error('获取浏览量失败:', error);
        res.status(500).json({ message: '获取浏览量失败' });
    }
});

// 增加浏览量（可由外部调用）
app.post('/api/views/track', publicViewLimiter, async (req, res) => {
    try {
        res.json({ views: await incrementSiteViews() });
    } catch (error) {
        console.error('记录浏览量失败:', error);
        res.status(500).json({ message: '记录浏览量失败' });
    }
});

// API 错误统一返回 JSON，避免前端把 HTML 错误页当 JSON 解析
app.use('/api', (err, req, res, next) => {
    if (!err) {
        return next();
    }

    console.error('API 请求失败:', err);

    if (err instanceof multer.MulterError) {
        const message = {
            LIMIT_FILE_SIZE: '单张图片不能超过 10MB',
            LIMIT_FILE_COUNT: '一次最多只能上传 20 张图片',
            LIMIT_UNEXPECTED_FILE: '上传字段异常，请重新选择图片后再保存'
        }[err.code] || '图片上传失败';

        return res.status(400).json({ message });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: '提交内容过大，请减少图片数量或压缩图片后重试' });
    }

    return res.status(500).json({ message: err.message || '服务器处理失败' });
});

app.use('/api', (req, res) => {
    res.status(404).json({ message: '接口不存在' });
});

// 前端页面路由
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(frontendDir, 'login.html'));
});

app.get('/register.html', (req, res) => {
    if (process.env.ALLOW_REGISTRATION === 'true') {
        return res.sendFile(path.join(frontendDir, 'register.html'));
    }
    return res.redirect(302, '/login.html');
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(frontendDir, 'dashboard.html'));
});

// 其他前端路由
app.get('*', (req, res) => {
    sendFileInside(frontendDir, req.path, res);
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1');
async function startServer() {
    const isLoopback = ['127.0.0.1', '::1', 'localhost'].includes(HOST);
    if (!isProduction && !isLoopback && process.env.ALLOW_LAN_ACCESS !== 'true') {
        throw new Error('开发环境默认只允许本机访问；如需局域网访问，请显式设置 ALLOW_LAN_ACCESS=true');
    }
    await connectDB();
    await initializeProjects();
    await syncPublicData();

    app.listen(PORT, HOST, () => {
        console.log(`服务器运行在 http://${HOST}:${PORT}`);
    });
}

startServer().catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
});
