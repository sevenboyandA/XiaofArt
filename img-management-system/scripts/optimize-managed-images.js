const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesRoot = path.resolve(__dirname, '../../images/managed');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function collectImages(directory) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectImages(entryPath);
        return supportedExtensions.has(path.extname(entry.name).toLowerCase()) ? [entryPath] : [];
    });
}

async function optimizeImage(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const original = await fs.promises.readFile(filePath);
    let pipeline = sharp(original, { failOn: 'error' })
        .rotate()
        .resize({ width: 3200, height: 3200, fit: 'inside', withoutEnlargement: true });

    if (extension === '.png') {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (extension === '.webp') {
        pipeline = pipeline.webp({ quality: 92, effort: 4 });
    } else {
        pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
    }

    const optimized = await pipeline.toBuffer();
    if (optimized.length >= original.length) return { before: original.length, after: original.length };

    const temporaryFile = `${filePath}.optimize-tmp`;
    await fs.promises.writeFile(temporaryFile, optimized);
    await fs.promises.rename(temporaryFile, filePath);
    return { before: original.length, after: optimized.length };
}

async function main() {
    const files = collectImages(imagesRoot);
    let before = 0;
    let after = 0;
    let changed = 0;

    for (const file of files) {
        try {
            const result = await optimizeImage(file);
            before += result.before;
            after += result.after;
            if (result.after < result.before) changed += 1;
        } catch (error) {
            console.error(`无法优化 ${path.relative(imagesRoot, file)}:`, error.message);
            process.exitCode = 1;
        }
    }

    const savedMegabytes = (before - after) / 1024 / 1024;
    console.log(`已检查 ${files.length} 张图片，优化 ${changed} 张，节省 ${savedMegabytes.toFixed(1)} MB`);
}

main().catch(error => {
    console.error('图片优化失败:', error);
    process.exit(1);
});
