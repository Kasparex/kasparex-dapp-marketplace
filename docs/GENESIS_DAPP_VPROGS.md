# Genesis Dapp - vProgs Integration Guide

## Overview

Genesis Dapp is the first dApp on Kasparex Hub, built using the vProgs framework for native Kaspa Layer 1 computation.

## Architecture

### Rust Program Structure

The Genesis Dapp follows vProgs layered architecture:

- **Layer 0 (core)**: Uses foundational types
- **Layer 1 (storage)**: Uses vProgs storage abstraction
- **Layer 2 (state)**: Versioned state for messages
- **Layer 3 (scheduling)**: Batch processing
- **Layer 4 (transaction-runtime)**: Program execution
- **Layer 5 (node)**: VM integration

### Current Implementation

Currently running on **simulator** for testing. When vProgs is production-ready:

1. Deploy Rust program to vProgs network
2. Update frontend to use vProgs runtime instead of simulator
3. Migrate existing simulator data

## Features

- **Permanent Messages**: Leave messages up to 280 characters, permanently stored on-chain
- **Low Fee**: 0.01 KAS per message (accessible to all)
- **Historical Record**: All messages are timestamped and immutable
- **vProgs Native**: Built using vProgs framework for native Kaspa Layer 1

## File Structure

```
genesis-dapp/
├── Cargo.toml              # Rust project configuration
├── src/
│   ├── lib.rs              # Main program structure
│   └── message.rs          # Message handling logic
└── README.md               # Documentation

src/
├── lib/
│   └── vprogs/
│       ├── genesis-types.ts        # Type definitions
│       └── genesis-simulator.ts    # Simulator implementation
├── hooks/
│   └── useGenesisDapp.ts          # React hook
└── components/
    └── dapps/
        └── GenesisDappWidget.tsx   # UI component
```

## Usage

### Frontend (Current - Simulator)

1. Connect wallet
2. Navigate to Genesis Dapp
3. Write your message (max 280 characters)
4. Click "Leave Message"
5. Message is saved to localStorage (simulator)

### Backend (Future - vProgs)

When vProgs is ready:

1. Deploy Rust program to vProgs network
2. Register program in vProgs registry
3. Update frontend to connect to vProgs runtime
4. Messages will be stored on-chain via vProgs state layer

## Migration Path

### From Simulator to vProgs

1. **Export Messages**: Export all messages from simulator (localStorage)
2. **Deploy Program**: Deploy Genesis Dapp Rust program to vProgs network
3. **Import Messages**: Import exported messages to vProgs state
4. **Update Frontend**: Change frontend connection from simulator to vProgs runtime
5. **Verify**: Test that all messages are accessible via vProgs

### Migration Script Example

```typescript
// Export from simulator
const simulator = getGenesisDappSimulator();
const messages = await simulator.getMessages(0, 1000);
const exportData = JSON.stringify(messages, null, 2);

// Import to vProgs (when ready)
// await vprogsRuntime.importMessages(exportData);
```

## Testing

### Simulator Testing

Currently tested via TypeScript simulator:
- Messages persist in localStorage
- All functionality works identically to production
- Easy to reset and test

### vProgs Testing (Future)

When vProgs is ready:
- Use vProgs test framework
- Test on vProgs testnet
- Verify state persistence
- Test batch processing

## Integration with vProgs Layers

### Layer 0: Core
- Uses `ResourceId` for message identification
- Uses `Transaction` for message submission
- Uses `AccessMetadata` for authorization

### Layer 1: Storage
- Uses vProgs storage abstraction for persistence
- Messages stored in versioned state

### Layer 2: State
- Each message is a state resource
- State versioning for rollback support
- Pointer-based state access

### Layer 3: Scheduling
- Batch processing for multiple messages
- Resource tracking for concurrent access
- Rollback support for failed transactions

### Layer 4: Transaction Runtime
- Program execution semantics
- Authentication context
- Object access control

### Layer 5: Node
- VM integration
- Network connection
- Transaction processing

## Future Enhancements

- **Batch Message Processing**: Submit multiple messages in one transaction
- **Message Categories/Tags**: Organize messages by category
- **Search Functionality**: Search messages by content or author
- **Message Reactions**: Allow users to react to messages
- **Message Replies**: Thread messages together
- **IPFS Integration**: Store longer messages on IPFS, hash on-chain

## Development

### Building Rust Program

```bash
cd genesis-dapp
cargo build --release
```

### Testing Frontend

```bash
npm run dev
# Navigate to Genesis Dapp
# Test leaving messages
# Check localStorage for persistence
```

### Deploying to vProgs (Future)

```bash
# When vProgs is ready
vprogs deploy genesis-dapp/target/release/genesis_dapp.wasm
vprogs register --name "Genesis Dapp" --version "0.1.0"
```

## License

MIT
