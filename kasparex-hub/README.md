# Kasparex Hub

Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions. Built with Remix and optimized for Cloudflare Pages and Workers.

## Features

- 🔌 EVM wallet connection via RainbowKit + Wagmi
- 🔌 Kaspa wallet connection via Kasware and Kastle
- 🌓 Light/dark mode toggle with persistence
- 📱 Fully responsive, mobile-first design
- 🎯 Category filtering with collapsible sidebar
- 🎨 Modern, clean UI matching Kasparex brand
- ⚡ Fast and lightweight
- 🏗️ Custom Kasplex L2 Mainnet network support
- 🌐 Subdomain architecture for scalability
- 🚀 Optimized for Cloudflare Pages (unlimited bandwidth, $0/month)

## Tech Stack

- **Framework**: Remix 2.12 (Cloudflare Pages adapter)
- **Wallet**: RainbowKit + Wagmi (EVM), Custom Kaspa wallets (Kasware, Kastle)
- **Blockchain**: Kasplex L2 Mainnet/Testnet, Igra Caravel Testnet
- **Styling**: Tailwind CSS with dark mode support
- **Language**: TypeScript
- **Smart Contracts**: OpenZeppelin
- **Deployment**: Cloudflare Pages + Workers

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, or pnpm
- Cloudflare account (for deployment)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create a `.env` file in the root directory:

```env
# WalletConnect (for EVM wallets)
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Pinata IPFS (optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# Kasparex API
KASPAREX_API_URL=https://api.kasparex.com
```

3. Set up Cloudflare resources:

- Create KV namespace: `wrangler kv:namespace create "KASPAREX_CACHE"`
- Create D1 database: `wrangler d1 create kasparex-nodes`
- Create R2 bucket: `wrangler r2 bucket create kasparex-assets`
- Update `wrangler.toml` with the IDs

### Run Locally

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

Create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Deploy to Cloudflare

1. **Deploy Pages**:
   - Connect GitHub repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set output directory: `build/client`

2. **Deploy Workers**:
   ```bash
   npm run worker:deploy
   ```

3. **Configure Subdomains**:
   - Set up DNS records for subdomains (hub, dapps, tokens, api, nodes, docs)
   - Point to Cloudflare Pages/Workers

## Project Structure

```
kasparex-hub/
├── app/
│   ├── routes/          # Remix routes (file-based routing)
│   ├── components/       # React components
│   ├── lib/              # Utilities, hooks, configs
│   └── styles/           # Tailwind CSS
├── contracts/            # Smart contracts (OpenZeppelin)
├── workers/              # Cloudflare Workers (Kasparex API)
├── public/               # Static assets
└── wrangler.toml         # Cloudflare Workers config
```

## Subdomain Architecture

- `hub.kasparex.com` - Main Hub (homepage)
- `dapps.kasparex.com` - dApp marketplace
- `tokens.kasparex.com` - Token directory
- `api.kasparex.com` - Kasparex API (Workers)
- `nodes.kasparex.com` - Krex Node dashboard
- `docs.kasparex.com` - Documentation

## Krex Nodes

The system supports three types of Krex Nodes:

- **Light Node**: 2x reward multiplier
- **Mirror Node**: 3x reward multiplier
- **Super Node**: 5x reward multiplier

Nodes help decentralize asset storage and reduce bandwidth costs by serving content from community-run mirrors.

## Cost Optimization

- **Cloudflare Pages**: $0/month (unlimited bandwidth)
- **Cloudflare Workers**: $5-10/month (API endpoints)
- **Total**: ~$5-10/month vs $150-500/month on Vercel
- **Savings**: 95-98% cost reduction

## Network Configuration

The marketplace is configured with:

- **Kasplex L2 Mainnet** (Chain ID: 202555)
- **Kasplex L2 Testnet** (Chain ID: 167012)
- **Igra Caravel Testnet** (Chain ID: 19416)
- **vProgs** (Placeholder for future)

## Resources

- [Remix Documentation](https://remix.run/docs)
- [RainbowKit Documentation](https://rainbowkit.com/docs/introduction)
- [Wagmi Documentation](https://wagmi.sh/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Kasparex Website](https://www.kasparex.com)

## License

© 2025 Kasparex.com. All rights reserved.



