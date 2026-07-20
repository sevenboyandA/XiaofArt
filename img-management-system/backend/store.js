const bcrypt = require('bcryptjs');

function buildUsers() {
    const users = [];
    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || '');

    if (adminEmail && adminPassword.length >= 8) {
        users.push({
            id: 1,
            name: process.env.ADMIN_NAME || '管理员',
            email: adminEmail,
            password: bcrypt.hashSync(adminPassword, 10),
            role: 'admin',
            createdAt: new Date()
        });
    }

    return users;
}

const store = {
    siteViews: 0,
    users: buildUsers(),
    groups: [
        { id: 1, name: '风景', createdAt: new Date() },
        { id: 2, name: '人物', createdAt: new Date() },
        { id: 3, name: '动物', createdAt: new Date() },
        { id: 4, name: '建筑', createdAt: new Date() },
        { id: 5, name: '美食', createdAt: new Date() },
        { id: 6, name: '其他', createdAt: new Date() }
    ],
    images: []
};

module.exports = store;
