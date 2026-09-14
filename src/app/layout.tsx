import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAILIBI - Une affaire. Chaque jour.",
  description:
    "Une courte enquête policière par jour. Observez, comparez, déduisez. Même affaire pour tout le monde, une seule accusation.",
  applicationName: "Dailibi",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e100f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col bg-felt bg-fixed font-sans text-paper-100 antialiased">
        <main className="flex-1">{children}</main>
        <footer className="px-4 py-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-paper-100/35">
          By Povik · All rights reserved.
        </footer>
      </body>
    </html>
  );
}
