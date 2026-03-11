const util = require('util');
const { prisma: mockPrisma } = require('./src/lib/prisma');

/*
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = util.TextDecoder;
}

global.Request = globalThis.Request || class {};
global.Response = globalThis.Response || class {};
global.Headers = globalThis.Headers || class {};
global.fetch = globalThis.fetch || (() => Promise.resolve());

global.setImmediate = (callback, ...args) => {
  return setTimeout(callback, 0, ...args);
};
*/

// Mock jose to avoid ESM issues in Jest
jest.mock('jose', () => ({
  SignJWT: class {
    constructor(payload) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() {
      // Encode payload in "token" for the mock to read back
      return Promise.resolve('mock-token.' + Buffer.from(JSON.stringify(this.payload)).toString('base64'));
    }
  },
  jwtVerify: jest.fn().mockImplementation((token) => {
    try {
      if (token.startsWith('mock-token.')) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return Promise.resolve({ payload });
      }
      // Fallback for direct JSON tokens if used in tests
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

// Global mock for Prisma to ensure we always use the configured adapter
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
}, { virtual: true });
