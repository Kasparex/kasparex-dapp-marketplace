import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import stylesheet from "~/styles/globals.css?url";
import { Providers } from "~/components/Providers";

export const links = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];

export const meta = () => {
  return [
    { title: "Kasparex Hub - Kaspa dApp Marketplace" },
    {
      name: "description",
      content:
        "Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions. Explore modular dApps, media, games, and infrastructure built around Kaspa.",
    },
    { name: "keywords", content: "Kaspa, dApps, blockchain, Web3, Kasplex, Kasparex" },
    { property: "og:title", content: "Kasparex Hub - Kaspa dApp Marketplace" },
    {
      property: "og:description",
      content:
        "Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, publishing tools, and infrastructure built around Kaspa.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Kasparex Hub" },
    {
      name: "twitter:description",
      content:
        "Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, and infrastructure built around Kaspa.",
    },
  ];
};

export default function App() {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Providers>
          <Outlet />
        </Providers>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

