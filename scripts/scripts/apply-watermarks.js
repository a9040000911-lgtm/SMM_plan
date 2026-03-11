const fs = require('fs');
const path = require('path');

const WATERMARK = '/**\n' +
    ' * (c) 2024-2026 Smmplan. All rights reserved.\n' +
    ' * Created by Artem (http://artmspektr.ru)\n' +
    ' * Unauthorized copying of this file is strictly prohibited.\n' +
    ' */\n';

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            let content = fs.readFileSync(fullPath, 'utf8');

            if (!content.includes('(c) 2024-2026 Smmplan. All rights reserved.')) {
                fs.writeFileSync(fullPath, WATERMARK + content, 'utf8');
                console.log('Added watermark to: ' + fullPath);
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcDir)) {
    console.log('Starting watermark application in src/ directory...');
    processDirectory(srcDir);
    console.log('Watermark application complete.');
} else {
    console.error('src directory not found.');
}
