import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import 'leaflet/dist/leaflet.css';
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackToTop } from "@/components/BackToTop";
import { buildHubOpenGraphMetadata } from "@/lib/metadata/hubSocialPreview";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...buildHubOpenGraphMetadata({
    title: "Kasparex dApps - Kaspa dApp Marketplace",
    description:
      "Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions.",
    path: "/",
  }),
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <Providers>
          <ThemeProvider>
            {children}
            <BackToTop />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
