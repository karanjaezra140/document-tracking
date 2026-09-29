import type { Metadata } from "next";
// Self-hosted fonts (via @fontsource) rather than a live Google Fonts
// fetch - no third-party request at page-load time, and it works in
// network-restricted environments. Three roles: serif for headings
// (the "official letterhead" voice), plain sans for UI/body, and mono
// reserved ONLY for tracking codes and timestamps.
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Tracking System",
  description: "Track physical and digital documents from submission to completion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
