import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaperCredCheck - Research Integrity Analysis Tool",
  description: "Independent academic database aggregator for educational research purposes. Compiles publicly available information about journal credibility indicators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Linux+Libertine+Display+O&family=Linux+Libertine+O:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-libertine antialiased">{children}</body>
    </html>
  );
}
