# Genesis Dapp - vProgs Implementation

The first dApp on Kasparex Hub, built with vProgs framework for native Kaspa Layer 1.

## Overview

Genesis Dapp is a symbolic, historical dApp where users can leave permanent messages on-chain, creating a time capsule of the early Kaspa ecosystem.

## Features

- **Permanent Messages**: Leave messages up to 280 characters, permanently stored on-chain
- **Low Fee**: 0.01 KAS per message (accessible to all)
- **Historical Record**: All messages are timestamped and immutable
- **vProgs Native**: Built using vProgs framework for native Kaspa Layer 1

## Architecture

This dApp follows vProgs layered architecture:

- **Layer 0 (core)**: Uses `ResourceId`, `Transaction`, `AccessMetadata`
- **Layer 1 (storage)**: Uses vProgs storage abstraction for persistence
- **Layer 2 (state)**: Uses versioned state for message storage
- **Layer 3 (scheduling)**: Uses batch processing for efficient execution
- **Layer 4 (transaction-runtime)**: Defines program execution semantics
- **Layer 5 (node)**: VM integration

## Building

```bash
cd genesis-dapp
cargo build --release
```

## Integration with vProgs

When vProgs is production-ready:

1. Deploy the program to vProgs network
2. Register in vProgs program registry
3. Connect frontend to vProgs runtime
4. Migrate from simulator to production

## Testing

Currently tested via TypeScript simulator. When vProgs is ready, use vProgs test framework.

## License

MIT
