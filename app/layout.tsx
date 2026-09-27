import type { Metadata } from "next";
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
