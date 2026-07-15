import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Absensi MTS AL-RIYADL",
  description: "Dashboard Absensi Guru MTS AL-RIYADL",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Absensi MTS AL-RIYADL",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b8659",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
