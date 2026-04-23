import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

// Body / UI sans-serif
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
        className={`${dmSans.variable} ${cormorant.variable} ${geistMono.variable} antialiased`}
      >
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
