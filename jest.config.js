// const nextJest = require('next/jest');

// const createJestConfig = nextJest({
//   // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
//   dir: './',
// });

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a glob of [ROOT_DIR]/src, then you'll need d:\Smmplan\src
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'node', // Use node for service/unit tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/src/generated/client/index.js',
    '^bullmq$': '<rootDir>/src/tests/mocks/bullmq.js',
    '^@auth/prisma-adapter$': '<rootDir>/src/tests/mocks/auth-prisma-adapter.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: ['@babel/preset-env', '@babel/preset-typescript', ['@babel/preset-react', { runtime: 'automatic' }]],
    }],
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/tests/e2e/",
    "\\.spec\\.ts$",
    "/\\.next/"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/dist/",
    "<rootDir>/out/",
    "<rootDir>/scripts/"
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(bullmq|decimal\\.js|axios|jose|@auth/prisma-adapter|@noble/hashes|@paralleldrive/cuid2|undici)/)"
  ],
};

module.exports = customJestConfig;
