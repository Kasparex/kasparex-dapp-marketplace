# GitBook Sync Scripts

Automated documentation synchronization from Kasparex dApp Marketplace to GitBook.

## Overview

This directory contains scripts for automatically generating and syncing dApp documentation to GitBook. The system:

- Reads dApp data from on-chain DAppRegistry contract
- Aggregates metadata from frontend configuration
- Generates markdown documentation using templates
- Syncs pages to GitBook via API

## Files

- `index.js` - Main entry point, exports all modules
- `cli.js` - Command-line interface for manual operations
- `data-aggregator.js` - Collects dApp data from contracts and config
- `generator.js` - Generates markdown documentation from templates
- `gitbook-client.js` - GitBook API client wrapper
- `sync-service.js` - Orchestrates the sync process
- `listener.js` - Event listener for automatic updates

## Usage

### Setup

First, configure your GitBook API credentials:

```bash
npm run gitbook:setup
```

This will prompt you for:
- GitBook API Token
- GitBook Space ID
- Organization ID (optional)

Credentials are saved to `.env.local`.

### Sync All dApps

```bash
npm run gitbook:sync
```

### Sync Specific dApp

```bash
npm run gitbook:sync -- --dapp "Quiz to Earn"
```

### Test Connection

```bash
npm run gitbook:test
```

### Event Listener (Automatic Updates)

Start listening for on-chain events and automatically sync documentation:

```bash
npm run gitbook:listen
```

To sync existing dApps first, then start listening:

```bash
npm run gitbook:listen -- --sync-existing
```

## How It Works

1. **Data Aggregation**: Reads dApp information from:
   - DAppRegistry smart contract (on-chain)
   - Frontend configuration (`src/lib/dapps.ts`)
   - Contract ABIs (`src/lib/contracts/abis.ts`)
   - Contract addresses (`src/lib/contracts/addresses.ts`)

2. **Documentation Generation**: Uses templates to generate:
   - dApp overview pages
   - Contract API references
   - Integration guides

3. **GitBook Sync**: Creates or updates pages in GitBook:
   - Creates new pages for new dApps
   - Updates existing pages when dApp info changes
   - Organizes pages in structured paths

## Documentation Structure

Pages are organized in GitBook as:

```
/dapps/{dapp-slug}          - dApp overview page
/contracts/{contract-slug}  - Contract API reference
/integration/{dapp-slug}    - Integration guide
```

## Environment Variables

Required in `.env.local`:

```env
GITBOOK_API_TOKEN=your_api_token
GITBOOK_SPACE_ID=your_space_id
GITBOOK_ORGANIZATION_ID=your_org_id  # Optional
```

## Troubleshooting

See [docs/GITBOOK_SETUP.md](../../docs/GITBOOK_SETUP.md) for detailed setup instructions and troubleshooting.

## Development

To modify templates, edit files in `templates/gitbook/`:
- `dapp-page.md` - dApp overview template
- `contract-reference.md` - Contract API template
- `integration-guide.md` - Integration guide template

