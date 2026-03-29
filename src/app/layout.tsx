import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cruxo — The app that argues back",
  description:
    "Type a decision. Swipe through arguments. Get your thinking stress-tested. Cruxo forces you to engage with both sides and surfaces what you're ignoring.",
  openGraph: {
    title: "Cruxo — The app that argues back",
    description: "Stop asking AI to confirm what you already believe.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
