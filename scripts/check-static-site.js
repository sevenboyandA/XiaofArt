'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'docs');
const required = ['index.html', 'about.html', '404.html', 'robots.txt', 'sitemap.xml', 'favicon.svg', '.nojekyll'];
const failures = [];

function exists(relativePath) {
    return fs.existsSync(path.join(releaseDir, relativePath));
}

for (const file of required) if (!exists(file)) failures.push(`缺少发布文件: ${file}`);

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(releaseDir, 'site-data.js'), 'utf8'), sandbox, { timeout: 1000 });
const projects = sandbox.window.XIAOFART_SITE_DATA?.projects || [];
const images = new Set();
for (const project of projects) {
    for (const image of [project.coverImage, project.heroImage, ...(project.gallery || [])]) {
        if (image) images.add(String(image).replace(/\\/g, '/'));
    }
}
function displayImagePath(imagePath) {
    if (!/\.(?:jpe?g|png|webp)$/i.test(imagePath)) return imagePath;
    return imagePath.replace(/^images\//, 'images/display/').replace(/\.(?:jpe?g|png|webp)$/i, '.webp');
}
for (const image of images) {
    if (!exists(image)) failures.push(`图片引用缺失: ${image}`);
    const displayImage = displayImagePath(image);
    if (displayImage === image) continue;
    if (!exists(displayImage)) failures.push(`展示图片引用缺失: ${displayImage}`);
}

for (const page of ['index.html', 'about.html', '404.html']) {
    const html = fs.readFileSync(path.join(releaseDir, page), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
    for (const ref of refs) {
        if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
        const clean = ref.split(/[?#]/)[0];
        if (clean && !exists(clean)) failures.push(`${page} 引用缺失: ${ref}`);
    }
}

const index = fs.readFileSync(path.join(releaseDir, 'index.html'), 'utf8');
if (!index.includes('name="xiaofart-mode" content="static"')) failures.push('静态模式标记缺失');
if (!index.includes('property="og:image"')) failures.push('Open Graph 图片信息缺失');

if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log(`静态资源检查通过: ${projects.length} 个系列，${images.size} 张图片，0 个缺失引用`);
