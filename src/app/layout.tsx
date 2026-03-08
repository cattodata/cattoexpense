import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CattoData — Privacy-First Financial Analytics",
  description:
    "Analyze bank statements with CattoData. Privacy-first financial analysis that stays on your device. 100% local, 100% private.",
  keywords: ["bank statement analyzer", "privacy", "financial analytics", "CattoData"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
