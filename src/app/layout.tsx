import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 👇 1. استيراد ملف البروفايدرز
import Providers from "@/components/AuthProvider";
// 👇 استيراد سياق اللغة إذا كان لديك
import { LanguageProvider } from "@/context/LanguageContext"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zenith OS",
  description: "Operating System for Life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* رابط الخطوط الماينكرافتية */}
      <head>
        <link rel="icon" href="/icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&family=Changa:wght@500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* 👇 2. تغليف التطبيق بالكامل */}
        <Providers>
           <LanguageProvider> {/* إذا كان لديك سياق لغة */}
              {children}
           </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}