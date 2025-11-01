# Kasparex dApps - Kaspa dApp Marketplace

Super simple and fast EVM-compatible dApp marketplace for Kaspa, supporting both Layer 1 and Layer 2 solutions.

**Status:** ✅ Ready for deployment

## Features

- 🔌 EVM wallet connection via thirdweb
- 🌓 Light/dark mode toggle with persistence
- 📱 Responsive design (mobile-first)
- 🎯 Category filtering with collapsible sidebar
- 🎨 Modern, clean UI matching Kasparex brand
- ⚡ Fast and lightweight

## Tech Stack

- **Framework**: Next.js 15.4.6 (App Router)
- **Wallet**: thirdweb v5
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

2. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id_here
```

To get a thirdweb client ID:
1. Visit [thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project or use an existing one
3. Copy your client ID from the project settings
4. Refer to [thirdweb client documentation](https://portal.thirdweb.com/typescript/v5/client) for more details

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
3. Add the `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` environment variable
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
│   ├── globals.css         # Global styles
│   └── client.ts           # thirdweb client configuration
├── components/
│   ├── Header.tsx          # Header with logo, wallet, theme toggle
│   ├── Sidebar.tsx         # Collapsible category filters
│   ├── DAppGrid.tsx        # Grid view of dApps
│   ├── DAppCard.tsx        # Individual dApp card
│   ├── DAppDetail.tsx      # Detailed dApp view
│   ├── Footer.tsx          # Footer with links
│   └── ThemeProvider.tsx   # Theme context provider
└── lib/
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

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [thirdweb Documentation](https://portal.thirdweb.com/typescript/v5)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Kasparex Website](https://www.kasparex.com)

## License

© 2024 Kasparex.com. All rights reserved.
