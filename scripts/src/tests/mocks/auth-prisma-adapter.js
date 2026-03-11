/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
// Mock for @auth/prisma-adapter (ESM-only package)
// Prevents SyntaxError: Unexpected token 'export' in tests
module.exports = {
    PrismaAdapter: function () { return {}; }
};
