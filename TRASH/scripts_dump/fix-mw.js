const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/utils/proxy-logic.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Use a regex to be more robust against quotes and escaping
const regex = /const isAdminApi = pathname\.startsWith\('\/api\/admin'\) && pathname !== '\/api\/admin\/auth';?/g;
const replacement = "const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth');";

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log('✅ Success: Updated proxy-logic.ts with regex');
} else {
    // Try double quotes version just in case
    const regex2 = /const isAdminApi = pathname\.startsWith\("\/api\/admin"\) && pathname !== "\/api\/admin\/auth";?/g;
    if (regex2.test(content)) {
        content = content.replace(regex2, "const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth');");
        fs.writeFileSync(filePath, content);
        console.log('✅ Success: Updated proxy-logic.ts with regex (double quotes)');
    } else {
        console.error('❌ Error: Could not find target line for regex matching.');
        // Print surrounding lines to find exact format
        const lines = content.split('\n');
        const index = lines.findIndex(l => l.includes('isAdminApi'));
        if (index !== -1) {
            console.log(`Matching line ${index + 1}: [${lines[index].trim()}]`);
            // Fallback: search for only isAdminApi and replace whole line
            lines[index] = `  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth');`;
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log('✅ Fixed using index fallback.');
        }
    }
}
