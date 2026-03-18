/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'FALLBACK_SECRET_DO_NOT_USE_IN_PROD';
const key = new TextEncoder().encode(SECRET_KEY);

export interface AdminSessionPayload {
    id: string;
    tgId: string | null;
    role: string;
    username: string;
    isGlobalAdmin: boolean;
    allowedProjects: string[];
    permissions?: string[];
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key);
        // Explicitly construct the AdminSessionPayload to include permissions
        return {
            id: payload.id as string,
            tgId: (payload.tgId as string) || null,
            role: payload.role as string,
            username: payload.username as string,
            isGlobalAdmin: payload.isGlobalAdmin as boolean,
            allowedProjects: (payload.allowedProjects as string[]) || [],
            permissions: (payload.permissions as string[]) || [], // Populate permissions
        };
    } catch (_error) {
        // console.error('JWT Verify Error:', error); // Original comment was partially replaced
        return null; // Invalid token
    }
}


