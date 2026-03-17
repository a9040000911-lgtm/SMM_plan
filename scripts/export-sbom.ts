/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * SBOM Generator (CycloneDX style)
 */
import fs from 'fs';
import path from 'path';

async function generateSBOM() {
  console.log('--- GENERATING SBOM (MARCH 2026) ---');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        name: packageJson.name,
        version: packageJson.version,
        type: 'application'
      }
    },
    components: Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      version: String(version),
      type: 'library'
    }))
  };

  fs.writeFileSync('bom.json', JSON.stringify(sbom, null, 2));
  console.log('SBOM saved to bom.json');
}

generateSBOM().catch(console.error);
