/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/services/core/rate-limiter";




export async function authorizeUser(credentials: any) {
  // --- MAGIC TOKEN AUTH ---
  if (credentials?.magicToken) {
    console.log("[Auth] Attempting MagicToken login...");
    const { verifyMagicToken } = await import("@/services/core/magic-auth");
    const payload = await verifyMagicToken(credentials.magicToken);
    console.log("[Auth] MagicToken payload:", payload);

    if (payload) {
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          projectId: payload.projectId
        }
      });

      if (user) {
        // --- BAN CHECK ---
        const isBanned = user.isPermanentlyBanned || (user.banExpiresAt && user.banExpiresAt > new Date());
        if (isBanned) {
          throw new Error("Ваш аккаунт заблокирован администратором.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          projectId: user.projectId
        };
      }
    }
    throw new Error("Invalid or expired magic link");
  }

  if (!credentials?.email || !credentials?.password) return null;

  // --- BRUTE FORCE PROTECTION ---
  const identifier = `login:${credentials.email.toLowerCase()}`;
  const ratelimit = await checkRateLimit('auth', identifier);

  if (!ratelimit.success) {
    throw new Error("Слишком много попыток входа. Пожалуйста, подождите.");
  }

  const { getClientProjectId } = await import("@/utils/project-resolver");
  let projectId = await getClientProjectId();

  const user = await prisma.user.findFirst({
    where: {
      email: credentials.email.toLowerCase(),
      OR: [
        { isGlobalAdmin: true },
        ...(projectId ? [{ projectId: projectId }] : [])
      ]
    },
    orderBy: [
      { isGlobalAdmin: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  console.log('[Auth Debug] Searching for:', credentials.email, 'Project:', projectId);
  console.log('[Auth Debug] Found user:', user ? user.email : 'null', 'Has password:', !!user?.password);

  if (!user || !user.password) {
    throw new Error("User not found or password not set");
  }

  // Ensure we have a projectId for the session if resolved
  if (!projectId && user.projectId) {
    projectId = user.projectId;
  }


  // --- BAN CHECK ---
  const isBanned = user.isPermanentlyBanned || (user.banExpiresAt && user.banExpiresAt > new Date());
  if (isBanned) {
    throw new Error("Ваш аккаунт заблокирован администратором.");
  }

  const isValid = await bcrypt.compare(credentials.password, user.password);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  /* 
  // --- 2FA CHECK ---
  if (user.twoFactorEnabled && credentials.twoFactorVerified !== 'true') {
    // Generate 6-digit code, send via email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: code, twoFactorExpires: expires }
    });

    // Send code via email
    try {
      const { send2FACodeEmail } = await import("@/services/mail.service");
      await send2FACodeEmail(user.email!, code);
    } catch (err) {
      console.error("[2FA] Failed to send email:", err);
    }

    throw new Error("2FA_REQUIRED");
  }
  */

  return {
    id: user.id,
    email: user.email,
    name: user.username,
    role: user.role,
    projectId: user.projectId,
    isGlobalAdmin: user.isGlobalAdmin
  };
}


