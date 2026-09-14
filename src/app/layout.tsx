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
      <body className="min-h-screen bg-felt bg-fixed font-sans text-paper-100 antialiased">
        {children}
      </body>
    </html>
  );
}
