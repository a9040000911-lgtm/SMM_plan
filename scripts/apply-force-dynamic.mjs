import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                if (filePath.endsWith('route.ts') || filePath.endsWith('page.tsx')) {
                    results.push(filePath);
                }
            }
        }
    });
    return results;
}

const projectRoot = process.cwd();
const dirsToPatch = [
    path.join(projectRoot, 'src', 'app', 'api'),
    path.join(projectRoot, 'src', 'app', 'admin'),
    path.join(projectRoot, 'src', 'app', 'client'),
];

let files = [];
dirsToPatch.forEach(dir => {
    files = files.concat(walk(dir));
});

console.log(`Found ${files.length} possible files to patch.`);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Check if it's already patched or doesn't need it
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
        // If it includes prisma or import from @/lib/prisma
        if (content.includes('prisma') || content.includes('@/lib/prisma')) {
            content = "export const dynamic = 'force-dynamic';\n" + content;
            fs.writeFileSync(file, content);
            console.log(`Applied to ${path.relative(projectRoot, file)}`);
        }
    }
});
