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
  title: "Nullscan - AI-Powered Penetration Testing",
  description:
    "Find vulnerabilities before attackers do. AI-powered penetration testing for web apps — paste your URL, get a free security scan in minutes.",
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL("https://nullscan.io"),
  openGraph: {
    title: "Nullscan - Find Vulnerabilities Before Attackers Do",
    description:
      "AI-powered penetration testing for web apps. Free automated security scan — just paste your URL.",
    url: "https://nullscan.io",
    siteName: "Nullscan",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nullscan - AI-Powered Penetration Testing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nullscan - Find Vulnerabilities Before Attackers Do",
    description:
      "AI-powered penetration testing for web apps. Free automated security scan — just paste your URL.",
    images: ["/og-image.png"],
  },
  keywords: [
    "penetration testing",
    "security scanner",
    "vulnerability scanner",
    "web app security",
    "AI security",
    "vibe coding security",
    "automated pentesting",
  ],
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
