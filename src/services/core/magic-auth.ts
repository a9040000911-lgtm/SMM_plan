/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { SignJWT, jwtVerify } from 'jose';

const getSecretKey = () => {
    const SECRET_KEY = process.env.NEXTAUTH_SECRET;
    if (!SECRET_KEY) {
        throw new Error('CRITICAL: NEXTAUTH_SECRET environment variable is missing.');
    }
    return new TextEncoder().encode(SECRET_KEY);
};

export interface MagicTokenPayload {
    userId: string;
    tgId: string;
    projectId: string;
}

/**
 * Signs a short-lived magic token for a user.
 * Expires in 5 minutes.
 */
export async function signMagicToken(payload: MagicTokenPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(getSecretKey());
}

/**
 * Verifies a magic token and returns the payload.
 */
export async function verifyMagicToken(token: string): Promise<MagicTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return {
            userId: payload.userId as string,
            tgId: payload.tgId as string,
            projectId: payload.projectId as string,
        };
    } catch (error) {
        console.error('[MagicAuth] Token verification failed:', error);
        return null;
    }
}


