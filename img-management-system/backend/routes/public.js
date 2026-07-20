const express = require('express');
const crypto = require('crypto');
const { listPublishedProjects } = require('../services/dbSiteContentService');
const { Visit } = require('../models');
const { createRateLimiter, getAnalyticsSalt, trimText } = require('../utils/security');

const router = express.Router();
const visitLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

router.get('/projects', async (req, res) => {
    try {
        const projects = await listPublishedProjects();
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
        res.json(projects.map(project => ({
            id: project.id,
            order: project.order,
            title: project.title,
            category: project.category,
            description: project.description || '',
            creationDate: project.creationDate,
            year: project.year,
            coverImage: project.coverImage,
            heroImage: project.heroImage,
            gallery: project.gallery,
            imageTitles: project.imageTitles,
            imageDescriptions: project.imageDescriptions,
            imageAlignments: project.imageAlignments
        })));
    } catch (error) {
        console.error('获取公开作品列表失败:', error);
        res.status(500).json({ message: '暂时无法加载作品' });
    }
});

function detectDevice(userAgent) {
    const value = String(userAgent || '').toLowerCase();
    if (/ipad|tablet|kindle|silk/.test(value)) return 'tablet';
    if (/mobile|iphone|ipod|android/.test(value)) return 'mobile';
    return value ? 'desktop' : 'unknown';
}

router.post('/visit', visitLimiter, async (req, res) => {
    try {
        const visitorId = trimText(req.body.visitorId, 160);
        if (!visitorId) return res.status(204).end();

        const userAgent = trimText(req.get('user-agent'), 500);
        const visitorHash = crypto
            .createHash('sha256')
            .update(`${visitorId}:${getAnalyticsSalt()}`)
            .digest('hex');

        const recentCutoff = new Date(Date.now() - 30 * 60 * 1000);
        const duplicate = await Visit.exists({
            visitorHash,
            path: trimText(req.body.path, 240) || '/',
            visitedAt: { $gte: recentCutoff }
        });
        if (duplicate) return res.status(204).end();

        await Visit.create({
            visitorHash,
            path: trimText(req.body.path, 240) || '/',
            referrer: trimText(req.body.referrer, 500),
            language: trimText(req.body.language, 32),
            viewport: trimText(req.body.viewport, 32),
            userAgent,
            device: detectDevice(userAgent)
        });
        res.status(204).end();
    } catch (error) {
        console.error('记录匿名访问失败:', error);
        res.status(204).end();
    }
});

module.exports = router;
