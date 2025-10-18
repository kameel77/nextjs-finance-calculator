import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Izzy Finance Calculator",
  description: "Next.js migration of the Izzy automotive financing calculator"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
