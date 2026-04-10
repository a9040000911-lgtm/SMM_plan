import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/utils/proxy-logic.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Заменяем точное совпадение на startsWith для поддержки всех путей авторизации
const oldLine = "const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth';";
const newLine = "const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth');";

if (content.includes(oldLine)) {
    content = content.replace(oldLine, newLine);
    fs.writeFileSync(filePath, content);
    console.log('✅ Success: Updated proxy-logic.ts');
} else {
    // Еще одна попытка с одинарными кавычками и возможными пробелами
    const oldLineAlt = "const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth'"; // без точки с запятой
    if (content.includes(oldLineAlt)) {
        content = content.replace(oldLineAlt, "const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')");
        fs.writeFileSync(filePath, content);
        console.log('✅ Success: Updated proxy-logic.ts (alt match)');
    } else {
        console.error('❌ Error: Could not find target line in proxy-logic.ts');
        console.log('Content snippet around line 90:');
        console.log(content.split('\n').slice(85, 95).join('\n'));
    }
}
