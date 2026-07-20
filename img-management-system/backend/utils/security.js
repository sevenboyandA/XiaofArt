const path = require('path');

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const PLACEHOLDER_SECRETS = new Set([
    'secret_key',
    'your_jwt_secret_key',
    'change_me',
    'replace_with_a_random_secret_at_least_32_characters',
    'replace_with_a_different_random_secret'
]);

function getJwtSecret() {
    const secret = String(process.env.JWT_SECRET || '').trim();

    if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
        throw new Error('JWT_SECRET must be set to a strong, non-placeholder value in .env');
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }

    return secret;
}

function getAnalyticsSalt() {
    const salt = String(process.env.ANALYTICS_SALT || '').trim();

    if (!salt || PLACEHOLDER_SECRETS.has(salt)) {
        throw new Error('ANALYTICS_SALT must be set independently in .env');
    }

    if (salt.length < 32) {
        throw new Error('ANALYTICS_SALT must be at least 32 characters');
    }

    return salt;
}

function safeJoin(baseDir, unsafePath) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(resolvedBase, String(unsafePath || ''));

    if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + path.sep)) {
        return null;
    }

    return resolvedPath;
}

function trimText(value, maxLength = 200) {
    return String(value || '').trim().slice(0, maxLength);
}

function isValidDateString(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function sanitizePublicImagePath(value) {
    const raw = String(value || '').trim().replace(/\\/g, '/');

    if (!raw || raw.includes('\0')) {
        return null;
    }

    if (raw.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(raw)) {
        return null;
    }

    const parts = raw.split('/').filter(Boolean);
    if (parts.some(part => part === '.' || part === '..')) {
        return null;
    }

    const normalized = parts.join('/');
    if (!normalized.startsWith('images/')) {
        return null;
    }

    const ext = path.extname(normalized).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
        return null;
    }

    return normalized;
}

function sanitizeImagePathArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(sanitizePublicImagePath)
        .filter(Boolean);
}

function parseJsonArray(value, fallback = []) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value !== 'string' || value.trim() === '') {
        return fallback;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
}

function detectImageExtension(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return null;
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return '.jpg';
    }

    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return '.png';
    }

    const header = buffer.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') {
        return '.gif';
    }

    if (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return '.webp';
    }

    return null;
}

function isAllowedImageUpload(file) {
    const ext = path.extname(file?.originalname || '').toLowerCase();
    const mimetype = String(file?.mimetype || '').toLowerCase();

    return ALLOWED_IMAGE_EXTENSIONS.has(ext) && ALLOWED_IMAGE_MIME_TYPES.has(mimetype);
}

function getVerifiedImageExtension(file) {
    return detectImageExtension(file?.buffer);
}

function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
    const clients = new Map();
    let lastSweep = Date.now();

    return (req, res, next) => {
        const now = Date.now();
        if (now - lastSweep >= windowMs) {
            for (const [key, record] of clients) {
                if (record.resetAt <= now) clients.delete(key);
            }
            lastSweep = now;
        }

        const key = req.socket?.remoteAddress || 'unknown';
        const record = clients.get(key);
        if (!record || record.resetAt <= now) {
            clients.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        record.count += 1;
        if (record.count > max) {
            res.set('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
            return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
        }

        return next();
    };
}

module.exports = {
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_MIME_TYPES,
    createRateLimiter,
    detectImageExtension,
    getAnalyticsSalt,
    getJwtSecret,
    getVerifiedImageExtension,
    isAllowedImageUpload,
    isValidDateString,
    parseJsonArray,
    safeJoin,
    sanitizeImagePathArray,
    sanitizePublicImagePath,
    trimText
};
