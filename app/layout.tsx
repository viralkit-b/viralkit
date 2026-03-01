import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ViralKit — AI Social Growth Studio",
  description: "Generate viral Instagram captions, hashtags, and reel hooks with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#020617] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
