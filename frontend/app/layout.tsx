import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lynx.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title:
    "Lynx — Run every unit like it's your only one.",
  description:
    "The operations command center for multi-unit operators. Real-time unit performance, automated vendor payouts, and a P&L you can defend — across every location, in one dashboard.",
  openGraph: {
    title: "Lynx — Run every unit like it's your only one.",
    description:
      "The operations command center for multi-unit operators. Live unit performance, automated vendor payouts, and a portfolio P&L you can defend.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lynx — Multi-unit operations, all in one place.",
    description:
      "Live unit performance, automated vendor payouts, and a portfolio P&L you can defend.",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4F6" },
    { media: "(prefers-color-scheme: dark)", color: "#F3F4F6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-[#F3F4F6] font-sans text-zinc-900">
        {children}
      </body>
    </html>
  );
}
