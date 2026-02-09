import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Nullscan - Automated Penetration Testing",
  description:
    "Automated black-box penetration testing for web applications. Find real vulnerabilities with AI-powered security scanning.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
