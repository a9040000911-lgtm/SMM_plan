const fs = require('fs');

const files = [
  'd:/Smmplan/src/app/(client)/academy/[slug]/page.tsx',
  'd:/Smmplan/src/app/(client)/buy/[platform]/page.tsx',
  'd:/Smmplan/src/app/(client)/buy/[platform]/[category]/page.tsx',
  'd:/Smmplan/src/app/(client)/catalog/page.tsx',
  'd:/Smmplan/src/components/seo/Breadcrumbs.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/JSON\.stringify\(jsonLd\)/g, "JSON.stringify(jsonLd).replace(/</g, '\\\\u003c')");
    content = content.replace(/JSON\.stringify\(productSchema\)/g, "JSON.stringify(productSchema).replace(/</g, '\\\\u003c')");
    content = content.replace(/JSON\.stringify\(schema\)/g, "JSON.stringify(schema).replace(/</g, '\\\\u003c')");
    fs.writeFileSync(file, content);
  }
}

const pageFile = 'd:/Smmplan/src/app/(client)/page.tsx';
if (fs.existsSync(pageFile)) {
  let content = fs.readFileSync(pageFile, 'utf8');
  if (!content.includes('.replace(/</g,')) {
    content = content.replace(/__html: JSON\.stringify\(\{/g, "__html: JSON.stringify({");
    // just append .replace string to both blocks
    content = content.replace(/}\)\n\s+}}/g, "}).replace(/</g, '\\\\u003c')\n                }}");
    fs.writeFileSync(pageFile, content);
  }
}
console.log('Done');
