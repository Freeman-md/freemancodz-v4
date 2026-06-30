import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Layout } from "@/components/Layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = { title: "Freeman Madudili — Software Engineer", description: "Software Engineer helping founders and teams translate ideas into reliable and scalable systems." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${playfairDisplay.variable}`}><body className="font-sans antialiased"><Layout>{children}</Layout></body></html>; }
