const fs = require('fs');
const path = require('path');

const WATERMARK = '/**\n' +
    ' * (c) 2024-2026 Smmplan. All rights reserved.\n' +
    ' * Created by Artem (http://artmspektr.ru)\n' +
    ' * Unauthorized copying of this file is strictly prohibited.\n' +
    ' */\n';

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            let content = fs.readFileSync(fullPath, 'utf8');

            if (content.includes('(c) 2024-2026 Smmplan. All rights reserved.')) {
                // Find if file has "use client" or "use server"
                // Wait, since we ALREADY inserted the watermark at the top,
                // it looks like:
                // /**
                //  * (c) 2024-2026 Smmplan. All rights reserved.
                //  ...
                //  */
                // "use client";
                //
                // We need to reorder it so "use client" / "use server" is at the very top.

                let newContent = content;

                // Remove the watermark entirely
                const watermarkRegex = /\/\*\*\r?\n \* \(c\) 2024-2026 Smmplan\. All rights reserved\.\r?\n \* Created by Artem \(http:\/\/artmspektr\.ru\)\r?\n \* Unauthorized copying of this file is strictly prohibited\.\r?\n \*\/\r?\n/g;
                newContent = newContent.replace(watermarkRegex, '');

                // Now, if we need to put it back AFTER any directives:
                let directive = '';
                const clientMatch = newContent.match(/^\s*(["']use client["'];?)\r?\n/i);
                const serverMatch = newContent.match(/^\s*(["']use server["'];?)\r?\n/i);

                if (clientMatch) {
                    directive = clientMatch[1] + '\n';
                    newContent = newContent.substring(clientMatch[0].length);
                } else if (serverMatch) {
                    directive = serverMatch[1] + '\n';
                    newContent = newContent.substring(serverMatch[0].length);
                }

                // Put directive first, then watermark, then content
                newContent = directive + WATERMARK + newContent;

                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log('Fixed watermark order in: ' + fullPath);
                }
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcDir)) {
    console.log('Fixing watermark application in src/ directory...');
    processDirectory(srcDir);
    console.log('Fix complete.');
}
