import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function walk(dir, callback) {
    const files = readdirSync(dir);
    for (const file of files) {
        const filepath = join(dir, file);
        if (statSync(filepath).isDirectory()) {
            walk(filepath, callback);
        } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
            callback(filepath);
        }
    }
}

walk('./src/app/api', (filepath) => {
    let content = readFileSync(filepath, 'utf-8');
    let original = content;

    // Replace { error: error.message } and { error: err.message } 
    // and { error: error.message || '...' }
    // with { error: 'Internal server error' }
    
    // Pattern 1: { error: error.message }
    content = content.replace(/\{\s*error:\s*(error|err)\.message\s*\}/g, "{ error: 'Internal server error' }");
    
    // Pattern 2: { error: error.message || 'something' }
    content = content.replace(/\{\s*error:\s*(error|err)\.message\s*\|\|\s*['"][^'"]+['"]\s*\}/g, "{ error: 'Internal server error' }");
    
    // Pattern 3: { success: false, error: error.message }
    content = content.replace(/\{\s*success:\s*false,\s*error:\s*(error|err)\.message\s*\}/g, "{ success: false, error: 'Internal server error' }");

    // Pattern 4: error: error.message (when it's part of a larger object, e.g. health check)
    if (filepath.includes('health')) {
       // Ignore health/route.ts, it's admin only
    }

    if (content !== original) {
        writeFileSync(filepath, content, 'utf-8');
        console.log('Fixed:', filepath);
    }
});
