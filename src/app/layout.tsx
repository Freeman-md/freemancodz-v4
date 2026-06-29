import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "@/components/Layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = { title: "Freeman Madudili — Software Engineer", description: "Software Engineer helping founders and teams translate ideas into reliable and scalable systems." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}><body className="font-sans antialiased"><Layout>{children}</Layout></body></html>; }
