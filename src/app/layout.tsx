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
  title: "CattoExpense — Privacy-First Financial Analytics",
  description:
    "Analyze bank statements with CattoExpense. Privacy-first financial analysis that stays on your device. 100% local, 100% private.",
  keywords: ["bank statement analyzer", "privacy", "financial analytics", "CattoExpense"],
  openGraph: {
    title: "CattoExpense — Privacy-First Financial Analytics",
    description: "Analyze bank statements privately. 100% local, no data leaves your browser.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "CattoExpense — Privacy-First Financial Analytics",
    description: "Analyze bank statements privately. 100% local, no data leaves your browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://generativelanguage.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';"
        />
        <meta name="referrer" content="no-referrer" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />
      </head>
      <body className={`${jakarta.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-2 focus:left-2 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold focus:text-[#2563eb]">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
