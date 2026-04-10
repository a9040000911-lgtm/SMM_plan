/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { getTenantDomain, getTenantConfig } from "@/lib/tenant/server";
import { Plus_Jakarta_Sans } from 'next/font/google';
import { auth } from "@/auth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic-ext'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

const defaultSiteConfig = {
  name: "Smmplan",
  description: "Профессиональная SMM-платформа №1 для мгновенного продвижения в Telegram, Instagram, VK и YouTube. Только качественные услуги с гарантией.",
  url: "https://smmplan.pro",
  ogImage: "https://smmplan.pro/og-image.png",
};

export async function generateMetadata(): Promise<Metadata> {
  const domain = await getTenantDomain();
  const config = await getTenantConfig();

  const siteConfig = {
    ...defaultSiteConfig,
    name: config.name,
    description: config.description,
    url: `https://${domain}`,
    ogImage: `https://${domain}/og-image.png`,
  };

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "SMM продвижение",
      "накрутка подписчиков",
      "smmplan",
      config.name
    ],
    authors: [
      {
        name: `${config.name} Team`,
        url: siteConfig.url,
      },
    ],
    creator: config.name,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    manifest: '/site.webmanifest',
  };
}



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getTenantConfig();
  const themeClass = `theme-${config.theme}`;
  const session = await auth();

  return (
    <html lang="ru" suppressHydrationWarning className={`${jakarta.variable} ${themeClass}`}>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-jakarta antialiased selection:bg-blue-500/10 selection:text-blue-600" suppressHydrationWarning={true}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}


