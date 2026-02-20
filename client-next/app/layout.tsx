import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RegenGarden - Visual Garden Planning & Crop Tracking",
  description: "Plan your garden with professional visual canvas tools. Track crops, manage growing areas, and plan crop rotation with our modern garden planning software.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DevModeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </DevModeProvider>
      </body>
    </html>
  );
}
