import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, DM_Sans, Inter } from "next/font/google";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";
import { APP_STORE_ID } from "@/lib/app-store";

// Body / UI sans-serif
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Labels: eyebrows, section headers, record labels, counts. Inter Light
// replaced IBM Plex Mono here, as it did in the app.
const interLabel = Inter({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-inter-label",
  display: "swap",
});

// Editorial serif (piece names, headings)
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Code / UI mono (local, no network request)
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Threadology",
  description: "Your personal wardrobe vault",
  // Safari's Smart App Banner, once the app has an App Store ID. Until then
  // the visitor pages' own get-the-app banner does the job.
  ...(APP_STORE_ID ? { itunes: { appId: APP_STORE_ID } } : {}),
};

export const viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${interLabel.variable} ${cormorant.variable} ${geistMono.variable} font-mono-display antialiased`}
      >
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
