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
      <body className="font-libertine antialiased">{children}</body>
    </html>
  );
}
