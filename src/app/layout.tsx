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
    title: "Kasparex Hub",
    description:
      "Kasparex Hub: dApps, Games, Chronicles, tokens, and on-chain tools for the Kaspa BlockDAG ecosystem.",
    path: "/",
  }),
  title: {
    default: "Kasparex Hub",
    template: "Kasparex Hub - %s",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
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
