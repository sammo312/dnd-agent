import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D&D Player View",
  description: "Explore the DM's world in first person",
};

export const viewport: Viewport = {
  // Cover edge-to-edge so the joystick sits in the safe area, never
  // hidden behind a notch or home indicator.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Block pinch-zoom — it would scale the canvas while the user is
  // trying to look around, which is jarring in a first-person view.
  userScalable: false,
  themeColor: "oklch(0.11 0.01 70)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body>{children}</body>
    </html>
  );
}
