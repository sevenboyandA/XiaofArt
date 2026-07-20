const mongoose = require('mongoose');

// 用户模型
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 分组模型
const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 图片模型
const ImageSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isCover: {
        type: Boolean,
        default: false
    }
});

// 项目模型
const ProjectSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    order: {
        type: Number,
        default: 0,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    creationDate: {
        type: String,
        required: true
    },
    year: {
        type: Number
    },
    coverImage: {
        type: String
    },
    heroImage: {
        type: String
    },
    gallery: {
        type: [String],
        default: []
    },
    imageTitles: {
        type: [String],
        default: []
    },
    imageDescriptions: {
        type: [String],
        default: []
    },
    imageAlignments: {
        type: [String],
        default: []
    },
    published: {
        type: Boolean,
        default: false,
        index: true
    },
    publishedSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    hasUnpublishedChanges: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 站点指标模型
const MetricSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// 匿名访问记录：只保存随机访客标识的哈希，不保存姓名、邮箱等身份信息。
const VisitSchema = new mongoose.Schema({
    visitorHash: { type: String, required: true, index: true },
    path: { type: String, default: '/' },
    referrer: { type: String, default: '' },
    language: { type: String, default: '' },
    viewport: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
    visitedAt: { type: Date, default: Date.now, index: true }
});

VisitSchema.index({ visitorHash: 1, visitedAt: -1 });

// 导出模型
const User = mongoose.model('User', UserSchema);
const Group = mongoose.model('Group', GroupSchema);
const Image = mongoose.model('Image', ImageSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Metric = mongoose.model('Metric', MetricSchema);
const Visit = mongoose.model('Visit', VisitSchema);

module.exports = { User, Group, Image, Project, Metric, Visit };
