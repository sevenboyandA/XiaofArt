'use strict';

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const root = path.resolve(__dirname, '..');
const requireFromManagementSystem = createRequire(path.join(root, 'img-management-system/package.json'));
const sharp = requireFromManagementSystem('sharp');
const dataPath = path.join(root, 'site-data.js');
const supportedExtensions = /\.(?:jpe?g|png|webp)$/i;

function readProjects() {
    const source = fs.readFileSync(dataPath, 'utf8');
    const json = source
        .replace(/^\s*window\.XIAOFART_SITE_DATA\s*=\s*/, '')
        .replace(/;?\s*$/, '');
    const data = JSON.parse(json);
    return Array.isArray(data.projects) ? data.projects : [];
}

function collectImages(projects) {
    const images = new Set();
    projects.forEach(project => {
        [project.coverImage, project.heroImage, ...(project.gallery || [])].forEach(image => {
            const normalized = String(image || '').trim().replace(/\\/g, '/');
            if (normalized.startsWith('images/') && supportedExtensions.test(normalized)) images.add(normalized);
        });
    });
    return [...images];
}

function displayImagePath(imagePath) {
    return imagePath.replace(/^images\//, 'images/display/').replace(supportedExtensions, '.webp');
}

async function buildImage(imagePath) {
    const source = path.join(root, imagePath);
    const target = path.join(root, displayImagePath(imagePath));
    const sourceStat = await fs.promises.stat(source);
    try {
        const targetStat = await fs.promises.stat(target);
        if (targetStat.size > 0 && targetStat.mtimeMs >= sourceStat.mtimeMs) {
            return { created: false, sourceBytes: sourceStat.size, targetBytes: targetStat.size };
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.tmp-${process.pid}`;
    await sharp(source, { failOn: 'error' })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86, alphaQuality: 100, effort: 4, smartSubsample: true })
        .toFile(temporary);
    await fs.promises.rename(temporary, target);
    const targetStat = await fs.promises.stat(target);
    return { created: true, sourceBytes: sourceStat.size, targetBytes: targetStat.size };
}

async function buildDisplayImages() {
    const images = collectImages(readProjects());
    let cursor = 0;
    let created = 0;
    let sourceBytes = 0;
    let targetBytes = 0;
    const worker = async () => {
        while (cursor < images.length) {
            const imagePath = images[cursor];
            cursor += 1;
            const result = await buildImage(imagePath);
            if (result.created) created += 1;
            sourceBytes += result.sourceBytes;
            targetBytes += result.targetBytes;
        }
    };
    await Promise.all(Array.from({ length: Math.min(3, images.length) }, worker));
    const reduction = sourceBytes ? (1 - targetBytes / sourceBytes) * 100 : 0;
    console.log(`展示图片就绪: ${images.length} 张，更新 ${created} 张，体积减少 ${reduction.toFixed(1)}%`);
}

module.exports = { buildDisplayImages, displayImagePath };

if (require.main === module) {
    buildDisplayImages().catch(error => {
        console.error('生成展示图片失败:', error);
        process.exit(1);
    });
}
