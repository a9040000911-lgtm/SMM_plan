const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Ignore enums entirely (they don't contain @relation, but may contain arrays?)
  // Enum values are usually just one word, but we only want to modify `model` properties.
  
  if (line.includes('@relation') && !line.includes('@@')) {
    const match = line.match(/^(\s*)([A-Z][a-zA-Z0-9_]+)(\s+)([A-Z][a-zA-Z0-9_]+(\[\]|\?)?\s+@relation.*)$/);
    if (match) {
      const fieldName = match[2];
      const typeName = match[4].split(/\[\]|\?/)[0];
      // special cases: if the field name matches type name, lower case it.
      if (fieldName === typeName || fieldName === typeName + 's') {
          let newFieldName = fieldName.charAt(0).toLowerCase() + fieldName.substring(1);
          lines[i] = match[1] + newFieldName.padEnd(fieldName.length) + match[3] + match[4];
      }
    }
  } else if (!line.includes('@relation') && !line.includes('@@') && line.match(/^(\s+)([A-Z][a-zA-Z0-9_]+)(\s+)([A-Z][a-zA-Z0-9_]+\[\])$/)) {
     const match = line.match(/^(\s+)([A-Z][a-zA-Z0-9_]+)(\s+)([A-Z][a-zA-Z0-9_]+\[\])$/);
     if (match) {
       const fieldName = match[2];
       const typeName = match[4].replace('[]', '');
       if (fieldName === typeName) {
         let newFieldName = fieldName.charAt(0).toLowerCase() + fieldName.substring(1);
         if (newFieldName.endsWith('y')) newFieldName = newFieldName.slice(0, -1) + 'ies';
         else if (newFieldName === 'InternalServiceMapping') newFieldName = 'internalServiceMappings';
         else if (newFieldName === 'ProjectServiceOverride') newFieldName = 'projectServiceOverrides';
         else if (newFieldName.endsWith('ss')) newFieldName += 'es';
         else if (newFieldName.endsWith('s')) newFieldName += 'es';
         else newFieldName += 's';
         lines[i] = match[1] + newFieldName.padEnd(fieldName.length) + match[3] + match[4];
       }
     }
  }
}
fs.writeFileSync('prisma/schema.prisma', lines.join('\n'));
console.log('Applied strict relation fixes.');
