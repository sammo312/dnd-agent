import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// DESIGN.md: Geist Sans for body, JetBrains Mono for display + terminal.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "DM Workbench",
  description: "AI-powered Dungeon Master workbench for D&D campaign creation",
};

export const viewport: Viewport = {
  themeColor: "oklch(0.11 0.01 70)",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
