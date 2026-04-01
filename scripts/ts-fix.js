const fs = require('fs');
const path = require('path');

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
            files_.push(name);
        }
    }
    return files_;
}

const allFiles = getFiles('src');

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix remaining adminLog fields
    content = content.replace(/adminLog\.create\(\{\s*data:\s*\{([\s\S]*?)userId:\s*([^\n,]+)([\s\S]*?)\}/g, 'adminLog.create({ data: {$1adminId: $2$3}');
    
    // Fix providerLogs
    content = content.replace(/providerLogs:\s*\{[^}]+\},?/g, '');
    content = content.replace(/providerLogs:\s*\[[^\]]+\],?/g, '');
    content = content.replace(/providerLogs:\s*true,?/g, '');
    
    // Some places had providerLogs: { create: ... }
    content = content.replace(/providerLogs:\s*\{\s*create:\s*(?:\[[^\]]*\]|{[^}]*})\s*\},?/g, '');

    // smart-analyzer.logic category labels? We will do that manually.

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
