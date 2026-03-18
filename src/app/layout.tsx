/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { Plus_Jakarta_Sans } from 'next/font/google';
import { CookieBanner } from '@/components/stitch/ui/CookieBanner';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

const siteConfig = {
  name: "Smmplan",
  description: "Профессиональная SMM-платформа №1 для мгновенного продвижения в Telegram, Instagram, VK и YouTube. Только качественные услуги с гарантией.",
  url: "https://smmplan.ru", // Replace with actual production domain
  ogImage: "https://smmplan.ru/og-image.png", // We'll need to create this asset or use a placeholder
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "SMM продвижение",
    "накрутка подписчиков",
    "купить лайки",
    "просмотры телеграм",
    "раскрутка инстаграм",
    "smm услуги",
    "продвижение вконтакте",
    "тик ток продвижение",
    "smmplan"
  ],
  authors: [
    {
      name: "Smmplan Team",
      url: siteConfig.url,
    },
  ],
  creator: "Smmplan",
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@smmplan",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: '/site.webmanifest',
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={jakarta.variable}>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-jakarta antialiased selection:bg-blue-500/10 selection:text-blue-600" suppressHydrationWarning={true}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}


