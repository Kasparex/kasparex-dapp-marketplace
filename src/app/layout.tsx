import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackToTop } from "@/components/BackToTop";
import { CanonicalNavProvider } from "@/components/CanonicalNavContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kasparex dApps - Kaspa dApp Marketplace",
  description:
    "Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions.",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host");

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <CanonicalNavProvider host={host}>
          <Providers>
            <ThemeProvider>
              {children}
              <BackToTop />
            </ThemeProvider>
          </Providers>
        </CanonicalNavProvider>
      </body>
    </html>
  );
}
