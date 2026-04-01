/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Jest Setup — runs before each test file.
 *
 * This setup:
 * 1. Mocks ESM-only packages (jose, @auth/prisma-adapter) for CJS Jest
 * 2. Does NOT mock @prisma/client — tests use a real test database
 * 3. Increases timeout for integration tests hitting real DB
 */

// Increase default timeout for integration tests (real DB queries)
jest.setTimeout(30000);

// Mock jose to avoid ESM issues in Jest
jest.mock('jose', () => ({
  SignJWT: class {
    constructor(payload) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() {
      return Promise.resolve('mock-token.' + Buffer.from(JSON.stringify(this.payload)).toString('base64'));
    }
  },
  jwtVerify: jest.fn().mockImplementation((token) => {
    try {
      if (token.startsWith('mock-token.')) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return Promise.resolve({ payload });
      }
      const payload = JSON.parse(token);
      return Promise.resolve({ payload });
    } catch (e) {
      return Promise.reject(new Error('Invalid token'));
    }
  }),
  compactDecrypt: jest.fn(),
  EncryptJWT: class {
    constructor() { }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    encrypt() { return Promise.resolve('mocked-encrypted'); }
  }
}), { virtual: true });
