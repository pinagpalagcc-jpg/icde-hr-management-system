import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "./AuthGuard";

export const metadata: Metadata = {
  title: "ICDE HR Management System",
  description: "ICDE HR Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AuthGuard>{children}</AuthGuard></body>
    </html>
  );
}
