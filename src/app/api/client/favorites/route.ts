import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    return NextResponse.json({ success: true, data: [] });
}

export async function POST(req: Request) {
    return NextResponse.json({ success: true, action: 'added', serviceId: null });
}

export async function PUT(req: Request) {
    return NextResponse.json({ success: true, data: [] });
}
