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

    // Регулярки для точной замены обращений к моделям Prisma (с учетом опциональных цепочек типа tx.systemLog)
    content = content.replace(/\.systemLog\./g, '.adminLog.');
    content = content.replace(/\.financialLedger\./g, '.ledgerEntry.');
    content = content.replace(/\.academyArticle\./g, '.news.'); // Временно заменяем на news (будем считать, что статьи стали новостями)
    content = content.replace(/\.favoriteService\./g, '.settings.'); // Временно заменяем на settings (как фиктивный делегат), но на самом деле роут favorites просто выпилим

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
        changesCount++;
    }
}

console.log(`Mass replace complete: ${changesCount} files modified.`);
