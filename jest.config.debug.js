
/** @type {import('jest').Config} */
const config = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleDirectories: ['node_modules', '<rootDir>/'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@prisma/client$': '<rootDir>/src/generated/client',
        '^bullmq$': '<rootDir>/src/tests/mocks/bullmq.js',
        '^@auth/prisma-adapter$': '<rootDir>/src/tests/mocks/auth-prisma-adapter.js',
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "/src/tests/e2e/",
        "\\.spec\\.ts$"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(bullmq|decimal\\.js|axios|jose|@auth/prisma-adapter|@noble/hashes|@paralleldrive/cuid2|undici)/)"
    ],
};

module.exports = config;
