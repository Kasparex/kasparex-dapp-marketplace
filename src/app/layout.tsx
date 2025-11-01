import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { kasplexChain } from "@/lib/chains";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kasparex dApps - Kaspa dApp Marketplace",
  description:
    "Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <ThirdwebProvider activeChain={kasplexChain}>
            {children}
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
