/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * API Documentation Integration Test
 */
import { GET } from '@/app/api/docs/route';

describe('API Documentation Integration', () => {
  it('should return 200 OK for the Scalar documentation route', async () => {
    const request = new Request('http://localhost:3000/api/docs');
    const response = await (GET as any)();
    
    expect(response.status).toBe(200);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/html');
    
    const body = await response.text();
    expect(body).toContain('scalar');
    expect(body).toContain('Smmplan API');
  });
});
