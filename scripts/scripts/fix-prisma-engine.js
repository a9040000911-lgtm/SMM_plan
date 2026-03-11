const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../node_modules/.prisma/client/index.js');
if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // 1. Force engineType to library at the very end of config
    // We look for where PrismaClient is initialized and inject our overrides just before it
    const injection = '\nif (config) {\n  config.engineType = "library";\n  if (config.generator) config.generator.engineType = "library";\n  config.compilerWasm = undefined;\n}\n';

    if (indexContent.includes('const PrismaClient = getPrismaClient(config)')) {
        indexContent = indexContent.replace(
            'const PrismaClient = getPrismaClient(config)',
            injection + 'const PrismaClient = getPrismaClient(config)'
        );
        fs.writeFileSync(indexPath, indexContent);
        console.log('Successfully injected forced library engine and disabled WASM in index.js');
    } else {
        console.error('Could not find injection point in index.js');
        process.exit(1);
    }
} else {
    console.warn('Prisma index.js not found at', indexPath);
}
