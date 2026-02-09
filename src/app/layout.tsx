import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "react-hot-toast"; // ✅ 1. استيراد التوستر

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zenith Life OS",
  description: "Gamified Life Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          {children}
          {/* ✅ 2. إضافة مكون التوستر هنا */}
          <Toaster 
            position="bottom-center"
            toastOptions={{
              // ستايل "سيبراني" يناسب تطبيقك
              style: {
                background: '#121212',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981', // لون أخضر نيون
                  secondary: '#000',
                },
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}