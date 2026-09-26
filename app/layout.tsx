import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/toaster";
import { ScrollToTop } from "@/components/scroll-to-top";

// next/font otomatis self-host dan subset font — tidak ada request ke Google CDN
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORTI — Forum Riset Teknologi Informasi",
  description: "Ruang belajar, berkarya, dan bertumbuh bersama teknologi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ScrollToTop />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
