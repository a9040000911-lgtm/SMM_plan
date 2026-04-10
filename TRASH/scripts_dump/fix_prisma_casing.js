const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (!filepath.includes('node_modules') && !filepath.includes('.next') && !filepath.includes('generated')) {
                filelist = walkSync(filepath, filelist);
            }
        } else {
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
}

const files = walkSync(path.join(process.cwd(), 'src'));
let changesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    if (file.includes('admin-data.service.ts') || file.includes('service-engine.ts')) {
        content = content.replace(/serviceCategory:\s*true/g, '/* removed serviceCategory */');
        content = content.replace(/socialPlatform:\s*true/g, 'SocialPlatform: true');
        content = content.replace(/provider:\s*true/g, 'Provider: true');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated casing in: ${file}`);
        changesCount++;
    }
}

console.log(`Fixes complete: ${changesCount} files modified.`);
