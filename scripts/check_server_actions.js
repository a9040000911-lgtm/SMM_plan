const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/app/admin');
const vulnerable = [];

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    if (content.includes('use server') || content.includes('\'use server\'') || content.includes('"use server"')) {
        // Exclude the sign-in / login actions because they don't have session yet
        if (f.includes('auth-actions.ts')) return;
        
        // Find exported async functions
        const functionRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const funcName = match[1];
            const funcBodyStartIndex = content.indexOf('{', match.index);
            
            // Extract roughly the function body (we search the next 500 characters)
            const funcSnippet = content.substring(funcBodyStartIndex, funcBodyStartIndex + 1000);
            
            // Check if it calls getAdminContext, verifyAdmin, getAdminSession etc
            if (!funcSnippet.includes('getAdminContext') && !funcSnippet.includes('getAdminSession') && !funcSnippet.includes('checkAdmin')) {
                vulnerable.push(`${f} -> ${funcName}`);
            }
        }
        
        // Also check const exported arrow functions
        const arrowRegex = /export\s+const\s+([a-zA-Z0-9_]+)\s*=\s*(async)?\s*\([^)]*\)\s*=>/g;
        while ((match = arrowRegex.exec(content)) !== null) {
            const funcName = match[1];
            const funcBodyStartIndex = content.indexOf('{', match.index);
            const funcSnippet = content.substring(funcBodyStartIndex, Math.max(content.length, funcBodyStartIndex + 1000));
            if (!funcSnippet.includes('getAdminContext') && !funcSnippet.includes('getAdminSession') && !funcSnippet.includes('checkAdmin')) {
                vulnerable.push(`${f} -> ${funcName}`);
            }
        }
    }
});

console.log('Unprotected Admin Server Actions:');
console.log(vulnerable.join('\n'));
