'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs');
const scratch = path.join(root, `.docs-build-${process.pid}`);
const defaultSiteUrl = 'https://sevenboyandA.github.io/XiaofArt/';
const publicFiles = [
    'index.html',
    'about.html',
    'gallery.css',
    'gallery-app.js',
    'page-shell.js',
    'site-transition.js',
    'site-data.js',
    'favicon.svg'
];

function normalizeSiteUrl(value) {
    const url = new URL(value || defaultSiteUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SITE_URL 必须是 http(s) 地址');
    url.hash = '';
    url.search = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
}

function readProjects() {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'site-data.js'), 'utf8'), sandbox, {
        filename: 'site-data.js',
        timeout: 1000
    });
    const projects = sandbox.window.XIAOFART_SITE_DATA?.projects;
    if (!Array.isArray(projects) || projects.length === 0) throw new Error('site-data.js 中没有公开作品系列');
    return projects;
}

function normalizeImagePath(value) {
    const normalized = String(value || '').trim().replace(/\\/g, '/');
    if (!/^images\/[\w./-]+\.(?:jpe?g|png|gif|webp)$/i.test(normalized)) {
        throw new Error(`不安全或不支持的图片路径: ${normalized || '(空)'}`);
    }
    if (normalized.split('/').includes('..')) throw new Error(`图片路径不能包含 ..: ${normalized}`);
    return normalized;
}

function collectImages(projects) {
    const images = new Set();
    for (const project of projects) {
        const candidates = [project.coverImage, project.heroImage, ...(Array.isArray(project.gallery) ? project.gallery : [])];
        for (const candidate of candidates) {
            if (candidate) images.add(normalizeImagePath(candidate));
        }
    }
    for (const image of images) {
        const source = path.join(root, image);
        if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error(`公开图片不存在: ${image}`);
    }
    return [...images].sort();
}

function copy(relativePath) {
    const source = path.join(root, relativePath);
    const target = path.join(scratch, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

function pageMetadata({ title, description, pageUrl, imageUrl }) {
    const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return [
        `    <link rel="canonical" href="${escape(pageUrl)}">`,
        '    <link rel="icon" href="favicon.svg" type="image/svg+xml">',
        '    <meta name="xiaofart-mode" content="static">',
        '    <meta property="og:type" content="website">',
        '    <meta property="og:locale" content="zh_CN">',
        '    <meta property="og:site_name" content="林小肥作品展">',
        `    <meta property="og:title" content="${escape(title)}">`,
        `    <meta property="og:description" content="${escape(description)}">`,
        `    <meta property="og:url" content="${escape(pageUrl)}">`,
        `    <meta property="og:image" content="${escape(imageUrl)}">`,
        '    <meta name="twitter:card" content="summary_large_image">'
    ].join('\n');
}

function enhanceHtml(fileName, metadata) {
    const filePath = path.join(scratch, fileName);
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace('</head>', `${pageMetadata(metadata)}\n</head>`);
    fs.writeFileSync(filePath, html);
}

function buildErrorPage(siteUrl) {
    const home = siteUrl.href;
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><meta name="theme-color" content="#0a0a0a"><title>页面未找到 — 林小肥作品展</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml"><style>html{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#f4f2ed;font:16px/1.6 system-ui,sans-serif}main{padding:2rem;text-align:center}p{color:#aaa}a{color:inherit;text-underline-offset:.35em}</style></head>
<body><main><p>404 · PAGE NOT FOUND</p><h1>这幅画不在这里。</h1><a href="${home}">返回作品展 →</a></main></body></html>\n`;
}

function main() {
    const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
    const projects = readProjects();
    const images = collectImages(projects);
    const coverUrl = new URL(images[0], siteUrl).href;

    fs.rmSync(scratch, { recursive: true, force: true });
    fs.mkdirSync(scratch, { recursive: true });
    try {
        for (const file of publicFiles) copy(file);
        for (const image of images) copy(image);

        enhanceHtml('index.html', {
            title: '林小肥作品展',
            description: '林小肥个人绘画与视觉艺术作品展。',
            pageUrl: siteUrl.href,
            imageUrl: coverUrl
        });
        enhanceHtml('about.html', {
            title: '作者介绍 — 林小肥作品展',
            description: '林小肥作品展作者介绍。',
            pageUrl: new URL('about.html', siteUrl).href,
            imageUrl: coverUrl
        });

        fs.writeFileSync(path.join(scratch, '404.html'), buildErrorPage(siteUrl));
        fs.writeFileSync(path.join(scratch, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n`);
        fs.writeFileSync(path.join(scratch, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl.href}</loc></url>\n  <url><loc>${new URL('about.html', siteUrl).href}</loc></url>\n</urlset>\n`);
        fs.writeFileSync(path.join(scratch, '.nojekyll'), '');

        fs.rmSync(output, { recursive: true, force: true });
        fs.renameSync(scratch, output);
        console.log(`静态站已生成: ${projects.length} 个系列，${images.length} 张公开图片 -> docs/`);
        console.log(`站点地址: ${siteUrl.href}`);
    } catch (error) {
        fs.rmSync(scratch, { recursive: true, force: true });
        throw error;
    }
}

main();
