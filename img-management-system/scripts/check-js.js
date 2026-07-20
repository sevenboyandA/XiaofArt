const fs = require('fs');
const path = require('path');
const vm = require('vm');

const portfolioDir = path.resolve(__dirname, '../..');
const ignoredDirectories = new Set(['.git', 'data', 'images', 'node_modules', 'uploads']);
const javascriptFiles = [];
const htmlFiles = [];

function collectSourceFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) {
                collectSourceFiles(path.join(dir, entry.name));
            }
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
            javascriptFiles.push(path.join(dir, entry.name));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            htmlFiles.push(path.join(dir, entry.name));
        }
    }
}

collectSourceFiles(portfolioDir);

for (const file of javascriptFiles) {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
}

let inlineScriptCount = 0;
for (const file of htmlFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const scriptPattern = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
    for (const match of source.matchAll(scriptPattern)) {
        const script = match[1].trim();
        if (!script) continue;
        new vm.Script(script, { filename: `${file}#inline-${inlineScriptCount + 1}` });
        inlineScriptCount += 1;
    }
}

console.log(`Checked ${javascriptFiles.length} JavaScript files and ${inlineScriptCount} inline scripts`);
