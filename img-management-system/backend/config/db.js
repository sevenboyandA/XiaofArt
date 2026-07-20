const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

dotenv.config();

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI 未配置');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB 连接成功');

        const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const adminPassword = String(process.env.ADMIN_PASSWORD || '');
        if (adminEmail && adminPassword.length >= 8) {
            const existingAdmin = await User.findOne({ email: adminEmail });
            if (!existingAdmin) {
                await User.create({
                    name: process.env.ADMIN_NAME || '管理员',
                    email: adminEmail,
                    password: bcrypt.hashSync(adminPassword, 12),
                    role: 'admin'
                });
                console.log('管理员账号初始化完成');
            } else if (!bcrypt.compareSync(adminPassword, existingAdmin.password) || existingAdmin.role !== 'admin') {
                existingAdmin.password = bcrypt.hashSync(adminPassword, 12);
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('管理员账号已按环境变量更新');
            }
        } else if (!await User.exists({ role: 'admin' })) {
            console.warn('尚未配置管理员账号，请在 .env 中设置 ADMIN_EMAIL 和至少 8 位的 ADMIN_PASSWORD');
        }
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
