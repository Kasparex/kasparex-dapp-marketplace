# Treasury Contract Explanation

## How Treasury Works

The **Treasury is a Smart Contract**, not a regular wallet. Here's how it works:

### Fee Collection Flow

```
User Payment → SimplePayment Contract → FeeCollector Contract → Treasury Contract
                                                                  ↓
                                                          Fees stay here
                                                          (until distributed)
```

### Key Points

1. **Treasury Contract Address**: The address you see (`0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2`) is the **Treasury contract itself**, not a wallet you can access directly.

2. **Who Owns the Treasury?**: The Treasury contract has an **owner** (the address that deployed it). This owner can:
   - Call `distributeRevenue()` to split fees
   - Update distribution percentages
   - Update developer/builder addresses
   - Emergency withdraw (if needed)

3. **Distribution**: When `distributeRevenue()` is called:
   - **40%** stays in Treasury (contract balance)
   - **30%** goes to Developer address
   - **30%** goes to Builder address

### Your Wallet Addresses

You provided these addresses:

**Testnet:**
- Treasury Contract: `0x658420fd88dbd610249a88384f9b1ad387f797c7`
- FeeCollector: `0xdcf47355548345c7173737a6f3e9e1b3bda2f447`
- Developer: `0x0808e5ce2f0f6d488975e5f23f1a1c8b6dd53cbc`
- Builder: `0x8b158e51e15d0bf74652dc8846d26653e1ea65eb`

**Mainnet:**
- Treasury Contract: `0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40`
- FeeCollector: `0x3bA56061Db6350A78dD5BE76766370e0A3fe8E4a`
- Developer: `0x74378781F6aeED520FE63ea715825341B5Fe985b`
- Builder: `0x00603ED36099AD330aA625411b3d7810F22D46Fb`

### Checking Your Setup

Run this to verify your contract configuration:

```bash
# For Testnet
npm run hardhat:verify:testnet

# For Mainnet
npm run hardhat:verify:mainnet
```

This will show you:
- Who owns the Treasury contract
- Current balance in Treasury
- Distribution addresses (Developer/Builder)
- Whether FeeCollector points to correct Treasury
- Whether SimplePayment points to correct FeeCollector

### Distributing Fees

To distribute collected fees, you need to:

1. **Connect as Treasury Owner**: Use the wallet that deployed the Treasury
2. **Call `distributeRevenue()`**: This splits the fees according to percentages

Example using Hardhat console:

```javascript
const Treasury = await ethers.getContractFactory("Treasury");
const treasury = Treasury.attach("0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2");
const tx = await treasury.distributeRevenue();
await tx.wait();
```

### Important Notes

- The Treasury contract address (`0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2`) is **NOT a wallet** - it's a smart contract
- You cannot "send" to this address directly - it only accepts calls to `collectFee()`
- To access funds, you must be the owner and call `distributeRevenue()`
- The owner address is the one that deployed the contract (from your `PRIVATE_KEY` in `.env`)

### If You Want to Change the Treasury Owner

If you want to transfer ownership to a different address:

```javascript
const Treasury = await ethers.getContractFactory("Treasury");
const treasury = Treasury.attach("0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2");
const tx = await treasury.transferOwnership("NEW_OWNER_ADDRESS");
await tx.wait();
```

