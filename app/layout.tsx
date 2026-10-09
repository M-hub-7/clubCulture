import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AuthProvider } from "@/app/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Club Culture — la scène afro-caribéenne",
  description:
    "Afrobeats, Dancehall, Amapiano : billetterie et événements.",
};

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@700;800;900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href={FONTS_URL} />
      </head>

      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}