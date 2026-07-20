const express = require('express');
const { Visit } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last30Days = new Date(now);
        last30Days.setDate(last30Days.getDate() - 30);

        const [totalViews, todayViews, uniqueResult, deviceStats] = await Promise.all([
            Visit.countDocuments(),
            Visit.countDocuments({ visitedAt: { $gte: today } }),
            Visit.aggregate([
                { $match: { visitedAt: { $gte: last30Days } } },
                { $group: { _id: '$visitorHash' } },
                { $count: 'count' }
            ]),
            Visit.aggregate([
                { $match: { visitedAt: { $gte: last30Days } } },
                { $group: { _id: '$device', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            totalViews,
            todayViews,
            uniqueVisitors30d: uniqueResult[0]?.count || 0,
            deviceStats: deviceStats.map(item => ({ device: item._id, count: item.count }))
        });
    } catch (error) {
        console.error('获取访客汇总失败:', error);
        res.status(500).json({ message: '获取访客汇总失败' });
    }
});

router.get('/visitors', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const visitors = await Visit.aggregate([
            { $sort: { visitedAt: -1 } },
            {
                $group: {
                    _id: '$visitorHash',
                    lastSeen: { $first: '$visitedAt' },
                    path: { $first: '$path' },
                    referrer: { $first: '$referrer' },
                    language: { $first: '$language' },
                    viewport: { $first: '$viewport' },
                    device: { $first: '$device' },
                    visits: { $sum: 1 }
                }
            },
            { $sort: { lastSeen: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    anonymousId: { $substrBytes: ['$_id', 0, 10] },
                    lastSeen: 1,
                    path: 1,
                    referrer: 1,
                    language: 1,
                    viewport: 1,
                    device: 1,
                    visits: 1
                }
            }
        ]);
        res.json(visitors);
    } catch (error) {
        console.error('获取最近访客失败:', error);
        res.status(500).json({ message: '获取最近访客失败' });
    }
});

module.exports = router;
