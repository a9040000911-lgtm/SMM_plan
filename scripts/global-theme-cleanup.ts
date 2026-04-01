import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (file: string) => void) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
};

const srcDir = 'd:/Smmplan/src';
const extensions = ['.tsx', '.ts', '.css'];

walkDir(srcDir, (filePath) => {
    if (extensions.includes(path.extname(filePath))) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove dark: classes from className strings
        // Example: "bg-white dark:bg-black" -> "bg-white"
        // Also handles dark: modifier alone or with quotes
        const cleanedContent = content.replace(/\s+dark:[\w\-\[\]\/:%]+/g, '');
        
        if (content !== cleanedContent) {
            fs.writeFileSync(filePath, cleanedContent);
            console.log(`Cleaned: ${filePath}`);
        }
    }
});
