import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Analytics } from "@vercel/analytics/next"
import { siteConfig } from "@/lib/site-metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: siteConfig.url,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  authors: [{ name: siteConfig.shortName, url: siteConfig.url }],
  creator: siteConfig.shortName,
  publisher: siteConfig.shortName,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: siteConfig.shortName,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.shortName} portfolio hero section`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        alt: `${siteConfig.shortName} portfolio hero section`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${playfairDisplay.variable}`}
    >
      <body className="font-sans antialiased">
        <SiteLayout>{children}</SiteLayout>
        <Analytics />
      </body>
    </html>
  );
}
