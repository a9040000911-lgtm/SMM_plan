import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Check Database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'Connected',
        version: '1.0.0-prod'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'CRITICAL',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}


