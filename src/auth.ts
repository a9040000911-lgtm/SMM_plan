/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeUser } from "@/services/core/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
    basePath: "/api/auth",
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                magicToken: { label: "Magic Token", type: "text" },
                twoFactorVerified: { label: "2FA Verified", type: "text" }
            },
            authorize: authorizeUser as any
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.projectId = (user as any).projectId;
                token.isGlobalAdmin = (user as any).isGlobalAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).projectId = token.projectId;
                (session.user as any).isGlobalAdmin = token.isGlobalAdmin;
            }
            return session;
        }
    },
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: true,
            },
        },
    },
});


