const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'data', 'mongodb');
let mongoProcess = null;

function canConnect(port, host = '127.0.0.1') {
    return new Promise(resolve => {
        const socket = net.createConnection({ port, host });
        const finish = result => {
            socket.destroy();
            resolve(result);
        };
        socket.setTimeout(500);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
    });
}

async function waitForMongo() {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await canConnect(27017)) return true;
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    return false;
}

async function start() {
    fs.mkdirSync(dbDir, { recursive: true });

    if (!(await canConnect(27017))) {
        console.log('正在启动本地 MongoDB…');
        mongoProcess = spawn('mongod', [
            '--dbpath', dbDir,
            '--bind_ip', '127.0.0.1',
            '--port', '27017',
            '--nounixsocket',
            '--quiet'
        ], { stdio: ['ignore', 'ignore', 'inherit'] });

        mongoProcess.once('error', error => {
            console.error('无法启动 MongoDB，请确认已安装 mongod：', error.message);
            process.exit(1);
        });

        if (!(await waitForMongo())) {
            console.error('MongoDB 启动超时');
            mongoProcess.kill('SIGTERM');
            process.exit(1);
        }
    }

    console.log('MongoDB 已就绪，正在启动 XiaofArt…');
    const server = spawn(process.execPath, ['backend/server.js'], {
        cwd: rootDir,
        stdio: 'inherit',
        env: process.env
    });

    const shutdown = signal => {
        if (!server.killed) server.kill(signal);
        if (mongoProcess && !mongoProcess.killed) mongoProcess.kill(signal);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    server.once('exit', code => {
        if (mongoProcess && !mongoProcess.killed) mongoProcess.kill('SIGTERM');
        process.exit(code || 0);
    });
}

start().catch(error => {
    console.error(error);
    process.exit(1);
});
