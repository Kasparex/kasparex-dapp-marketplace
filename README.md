# Kasparex dApps - Kaspa dApp Marketplace

Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions.

**Status:** ✅ Ready for deployment

## Features

- 🔌 EVM wallet connection via RainbowKit + Wagmi
- 🌓 Light/dark mode toggle with persistence
- 📱 Responsive design (mobile-first)
- 🎯 Category filtering with collapsible sidebar
- 🎨 Modern, clean UI matching Kasparex brand
- ⚡ Fast and lightweight
- 🏗️ Custom Kasplex L2 Mainnet network support

## Tech Stack

- **Framework**: Next.js 15.4.6 (App Router)
- **Wallet**: RainbowKit + Wagmi
- **Blockchain**: Kasplex L2 Mainnet (Custom EVM-compatible chain)
- **Styling**: Tailwind CSS with dark mode support
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. (Optional) Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

To get a WalletConnect Project ID (optional but recommended):
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project or use an existing one
3. Copy your project ID from the project settings
4. Add it to your `.env.local` file as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

Note: The app will work without this, but having a WalletConnect Project ID enables better wallet connection features.

3. Add your Kaspa logo:
   - Place your Kaspa logo PNG file in the `public` directory as `kaspa-logo.png`
   - The logo will be displayed in the header

### Run locally

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

Create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Deployment

### Deploy to Vercel

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. (Optional) Add the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable
4. Deploy!

### Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Configure GitHub Actions for deployment
3. Set environment variables in GitHub repository settings

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main marketplace page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Header with logo, wallet, theme toggle
│   ├── Sidebar.tsx         # Collapsible category filters
│   ├── DAppGrid.tsx        # Grid view of dApps
│   ├── DAppCard.tsx        # Individual dApp card
│   ├── DAppDetail.tsx      # Detailed dApp view
│   ├── Footer.tsx          # Footer with links
│   └── ThemeProvider.tsx   # Theme context provider
└── lib/
    ├── wagmi.ts            # Wagmi config and Kasplex L2 Mainnet chain
    ├── dapps.ts            # dApp data structure and types
    ├── categories.ts       # Category definitions
    └── theme.ts            # Theme utilities
```

## Adding dApps

Edit `src/lib/dapps.ts` to add new dApps to the marketplace. Each dApp should follow the `DApp` interface structure.

## Customization

- **Categories**: Edit `src/lib/categories.ts` to modify category filters
- **Styling**: Modify `tailwind.config.ts` and `src/app/globals.css` for custom colors and themes
- **Metadata**: Update `src/app/layout.tsx` for SEO and page metadata

## Wallet Integration for dApps

Once a user connects their wallet, any dApp in the marketplace can access the connected wallet using Wagmi hooks:

```typescript
import { useAccount, useChainId } from 'wagmi';

function YourDApp() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Access wallet address and connection state
  if (isConnected) {
    console.log('Connected wallet:', address);
    console.log('Current chain:', chainId);
  }
}
```

The wallet connection state is globally available throughout the React component tree, making it easy for dApps to detect and interact with the connected wallet.

## Network Configuration

The marketplace is configured with **Kasplex L2 Mainnet** as the default network:

- **Name**: Kasplex L2 Mainnet
- **Chain ID**: 202555
- **RPC URL**: https://evmrpc.kasplex.org
- **Native Currency**: KAS
- **Block Explorer**: https://explorer.kasplex.org

You can add additional Kaspa-related networks by editing `src/lib/wagmi.ts`.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Documentation](https://rainbowkit.com/docs/introduction)
- [Wagmi Documentation](https://wagmi.sh/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Kasparex Website](https://www.kasparex.com)

## License

© 2024 Kasparex.com. All rights reserved.
