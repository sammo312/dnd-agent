import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D&D Player View",
  description: "Explore the DM's world in first person",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
