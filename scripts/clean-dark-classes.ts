import fs from 'fs';
import path from 'path';

const filesToClean = [
  'd:/Smmplan/src/components/client/StoreLayout.tsx',
  'd:/Smmplan/src/app/error.tsx',
  'd:/Smmplan/src/app/global-error.tsx',
];

filesToClean.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Remove dark classes like dark:bg-slate-900, dark:text-white, etc.
    // This regex looks for dark: followed by word chars, hyphens, slashes, or brackets
    const cleanedContent = content.replace(/\s+dark:[\w\-\[\]\/:%]+/g, '');
    fs.writeFileSync(file, cleanedContent);
    console.log(`Cleaned: ${file}`);
  }
});
