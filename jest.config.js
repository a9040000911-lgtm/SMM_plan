/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require('path');

// Load .env.test BEFORE anything else
require('dotenv').config({ path: path.resolve(__dirname, '.env.test'), override: true });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Global setup — pushes schema to test DB before tests
  globalSetup: '<rootDir>/scripts/jest.global-setup.js',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/scripts/jest.setup.js'],

  // Module resolution (Path Aliases)
  moduleDirectories: ['node_modules', '<rootDir>/'],
  modulePathIgnorePatterns: ['<rootDir>/scripts/', '<rootDir>/deploy_lean/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/src/generated/client',
    '^bullmq$': '<rootDir>/src/tests/mocks/bullmq.js',
    '^@auth/prisma-adapter$': '<rootDir>/src/tests/mocks/auth-prisma-adapter.js',
  },

  // Transform
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },

  // Ignore
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/src/tests/e2e/",
    "/_trash/",
    "/deploy_lean/",
    "\\.spec\\.ts$"
  ],

  // Coverage
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!**/node_modules/**"
  ]
};
