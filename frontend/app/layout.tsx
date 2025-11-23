import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imalody.vercel.app"),
  title: "Imalody — Turn Images Into Music",
  description: "Upload an image and generate music using AI.",
  keywords: ["image to music", "AI music", "image sound", "visual audio"],
  openGraph: {
    title: "Imalody",
    description: "Upload an image and convert it into music.",
    url: "https://imalody.vercel.app"
  },
  alternates: {
    canonical: "/", // homepage canonical URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
