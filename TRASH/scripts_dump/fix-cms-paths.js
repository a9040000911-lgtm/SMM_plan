const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    walkDir('./src', (filePath) => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/\/admin\/cms-studio/g, '/admin/cms/studio')
            .replace(/\/admin\/editor/g, '/admin/cms/editor-projects')
            .replace(/\/admin\/content/g, '/admin/cms/content');
            
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed:', Math.abs(content.length - newContent.length), filePath);
        }
    });
}

processFiles();
