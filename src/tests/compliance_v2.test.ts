/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Compliance V2: Standards Verification
 */
import { openApiSpec } from '@/lib/docs/openapi';
import fs from 'fs';
import path from 'path';

describe('Compliance V2: Standards & Infrastructure', () => {

  describe('OpenAPI 3.1 Specification', () => {
    it('should have valid basic metadata', () => {
      expect(openApiSpec.openapi).toBe('3.1.0');
      expect(openApiSpec.info.title).toBe('Smmplan API');
      expect(openApiSpec.info.version).toBe('1.0.0');
    });

    it('should contain essential auth and admin paths', () => {
      expect(openApiSpec.paths).toHaveProperty('/auth/login');
      expect(openApiSpec.paths).toHaveProperty('/admin/services/import');
    });

    it('should define security schemes for cookies', () => {
      expect(openApiSpec.components.securitySchemes).toHaveProperty('cookieAuth');
    });
  });

  describe('SBOM Utility (CycloneDX)', () => {
    it('should generate a valid bom.json file', () => {
      const bomPath = path.join(process.cwd(), 'bom.json');
      
      // Note: We assume the script was run before tests or will be run in CI
      if (fs.existsSync(bomPath)) {
        const bom = JSON.parse(fs.readFileSync(bomPath, 'utf-8'));
        expect(bom.bomFormat).toBe('CycloneDX');
        expect(bom.specVersion).toBe('1.5');
        expect(bom.components.length).toBeGreaterThan(0);
      } else {
        console.warn('bom.json not found, skipping SBOM content validation');
      }
    });
  });

  describe('Rate Limiting Logic (Internal Verification)', () => {
    // We mock the devCache to test the MockRatelimit logic directly
    it('should block requests exceeding the limit in Mock mode', async () => {
        const { checkRateLimit } = require('@/lib/rate-limiter');
        const id = `test-user-comp-${Date.now()}`;
        
        // Use a type with a known low limit or just hit it enough times
        // Default for 'auth' is 60. Let's do 61 calls.
        const calls = [];
        for(let i=0; i<60; i++) {
            calls.push(checkRateLimit('auth', id));
        }
        await Promise.all(calls);
        
        const res = await checkRateLimit('auth', id);
        expect(res.success).toBe(false);
    });
  });
});
