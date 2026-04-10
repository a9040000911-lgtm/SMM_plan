import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    console.log(`Connecting to Redis at: ${redisUrl}`);

    const redis = new Redis(redisUrl, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 1
    });

    try {
        const startTime = Date.now();
        const ping = await redis.ping();
        const duration = Date.now() - startTime;
        
        console.log(`\n✅ Redis Connection Successful!`);
        console.log(`PING Result: ${ping}`);
        console.log(`Response Time: ${duration}ms`);

        // Test basic operations
        await redis.set('test_key', 'hello_smmplan');
        const val = await redis.get('test_key');
        console.log(`SET/GET Test: ${val === 'hello_smmplan' ? 'PASSED' : 'FAILED'}`);
        await redis.del('test_key');

        const info = await redis.info('server');
        const version = info.split('\n').find(l => l.startsWith('redis_version:'))?.split(':')[1].trim();
        console.log(`Redis Version: ${version}`);

    } catch (err) {
        console.error(`\n❌ Redis Connection Failed!`);
        console.error(`Error:`, err);
        process.exit(1)
    } finally {
        await redis.quit();
    }
}

main();
