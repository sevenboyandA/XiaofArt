const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/security');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: '未授权访问' });
    }

    try {
        req.user = jwt.verify(token, getJwtSecret());
        next();
    } catch (error) {
        return res.status(401).json({ message: '登录状态已失效，请重新登录' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: '无权限执行该操作' });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
