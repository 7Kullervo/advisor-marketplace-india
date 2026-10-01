import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdvisorHub",
  description: "Book trusted advisors for one-on-one consultations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}