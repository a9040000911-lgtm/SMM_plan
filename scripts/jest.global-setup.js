/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Jest Global Setup — prepares the test database before all tests run.
 *
 * This script:
 * 1. Loads .env.test so DATABASE_URL points to smmplan_test
 * 2. Runs `prisma db push` to sync the schema (creates tables if missing)
 * 3. Optionally seeds minimal data
 */
const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

module.exports = async function globalSetup() {
  // Load test environment variables
  const envPath = path.resolve(__dirname, '..', '.env.test');
  dotenv.config({ path: envPath, override: true });

  console.log('\\n🧪 [Jest Global Setup] Preparing test database...');
  console.log(`   DATABASE_URL → .../${process.env.DATABASE_URL?.split('/').pop()}`);

  try {
    // Push schema to test DB (creates tables without migrations)
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env },
      timeout: 60000,
    });
    console.log('   ✅ Schema pushed to test database.');
  } catch (error) {
    console.error('   ❌ Failed to push schema:', error.message);
    // If the DB doesn't exist yet, try to create it
    if (error.message.includes('does not exist') || error.message.includes('ECONNREFUSED')) {
      console.error('   ⚠️  Make sure PostgreSQL is running and the database "smmplan_test" exists.');
      console.error('   Run: CREATE DATABASE smmplan_test;');
      process.exit(1);
    }
    throw error;
  }

  console.log('   🧪 Test database ready.\\n');
};
