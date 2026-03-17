import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET should be at least 32 characters"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET should be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  TELEGRAM_BOT_TOKEN: z.string().regex(/^\d+:[\w-]+$/, "Invalid Telegram Bot Token format"),
  REDIS_URL: z.string().url().optional(),
});

function validate() {
  console.log('🔍 Validating environment variables...');
  
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Environment variables are valid and meet complexity requirements.');
}

validate();
