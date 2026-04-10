import * as fs from 'fs';
import * as path from 'path';

function walkSync(dir: string, filelist: string[] = []) {
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

    // Specifically looking for ProviderServiceInclude object properties that have wrong casing
    // We are only doing this near `prisma.providerService.findMany` or `findUnique`, but a regex is easier
    // We know ProviderService does not have serviceCategory relation, only category (enum)
    // Wait, let's just make sure we only match inside include: { ... } or select: { ... }
    
    // Instead of wide regex, let's just replace specific known wrong strings that TS complained about:
    // In src/services/admin/admin-data.service.ts(670,70): error TS2353: 'serviceCategory'
    
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
