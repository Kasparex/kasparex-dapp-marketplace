/**
 * Register Token in PromoMintRouter
 * 
 * Registers a token configuration in the PromoMintRouter contract
 * and creates the genesis page in the database
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  // Configuration - adjust these values
  const ROUTER_ADDRESS = process.env.PROMO_MINT_ROUTER_ADDRESS || "";
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // DAppToken contract address
  const TOKEN_ID = process.env.TOKEN_ID || ""; // Token identifier (e.g., token slug)
  const TOKEN_TICKER = process.env.TOKEN_TICKER || "";
  const TOKEN_NAME = process.env.TOKEN_NAME || "";

  // Mint configuration
  const MINT_PRICE = process.env.MINT_PRICE ? ethers.parseEther(process.env.MINT_PRICE) : ethers.parseEther("0.1"); // 0.1 KAS default
  const TOKENS_PER_MINT = process.env.TOKENS_PER_MINT ? BigInt(process.env.TOKENS_PER_MINT) : 1000n; // 1000 tokens per mint
  const MINTABLE_SUPPLY = process.env.MINTABLE_SUPPLY ? BigInt(process.env.MINTABLE_SUPPLY) : 10000000n; // 10M tokens

  // Wallet addresses
  const CREATOR_WALLET = process.env.CREATOR_WALLET || deployer.address;
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;

  // Genesis page slots
  const GENESIS_SLOT1 = process.env.GENESIS_SLOT1 || deployer.address;
  const GENESIS_SLOT2 = process.env.GENESIS_SLOT2 || deployer.address;
  const GENESIS_SLOT3 = process.env.GENESIS_SLOT3 || deployer.address;
  const GENESIS_SLOT4 = process.env.GENESIS_SLOT4 || deployer.address;
  const GENESIS_SLOT5 = process.env.GENESIS_SLOT5 || deployer.address;

  // Percentage distribution (basis points - 10000 = 100%)
  const CREATOR_BPS = parseInt(process.env.CREATOR_BPS || "4000"); // 40%
  const PLATFORM_BPS = parseInt(process.env.PLATFORM_BPS || "200"); // 2%
  const SLOT1_BPS = parseInt(process.env.SLOT1_BPS || "4000"); // 40%
  const SLOT2_BPS = parseInt(process.env.SLOT2_BPS || "1000"); // 10%
  const SLOT3_BPS = parseInt(process.env.SLOT3_BPS || "500"); // 5%
  const SLOT4_BPS = parseInt(process.env.SLOT4_BPS || "200"); // 2%
  const SLOT5_BPS = parseInt(process.env.SLOT5_BPS || "100"); // 1%

  // Validation
  if (!ROUTER_ADDRESS) {
    throw new Error("PROMO_MINT_ROUTER_ADDRESS environment variable is required");
  }
  if (!TOKEN_ADDRESS) {
    throw new Error("TOKEN_ADDRESS environment variable is required");
  }
  if (!TOKEN_ID) {
    throw new Error("TOKEN_ID environment variable is required");
  }

  console.log("\n📝 Registering Token in PromoMintRouter...\n");
  console.log("Network:", network);
  console.log("Router Address:", ROUTER_ADDRESS);
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Token ID:", TOKEN_ID);
  console.log("Token Name:", TOKEN_NAME);
  console.log("Token Ticker:", TOKEN_TICKER);
  console.log("Mint Price:", ethers.formatEther(MINT_PRICE), "KAS");
  console.log("Tokens Per Mint:", TOKENS_PER_MINT.toString());
  console.log("Mintable Supply:", MINTABLE_SUPPLY.toString());
  console.log("Creator Wallet:", CREATOR_WALLET);
  console.log("Platform Wallet:", PLATFORM_WALLET);
  console.log("\nPercentage Distribution:");
  console.log("  Creator:", CREATOR_BPS / 100, "%");
  console.log("  Platform:", PLATFORM_BPS / 100, "%");
  console.log("  Slot 1:", SLOT1_BPS / 100, "%");
  console.log("  Slot 2:", SLOT2_BPS / 100, "%");
  console.log("  Slot 3:", SLOT3_BPS / 100, "%");
  console.log("  Slot 4:", SLOT4_BPS / 100, "%");
  console.log("  Slot 5:", SLOT5_BPS / 100, "%");
  console.log("  Total:", (CREATOR_BPS + PLATFORM_BPS + SLOT1_BPS + SLOT2_BPS + SLOT3_BPS + SLOT4_BPS + SLOT5_BPS) / 100, "%\n");

  // Get contract
  const router = await ethers.getContractAt("PromoMintRouter", ROUTER_ADDRESS);

  // Convert token ID to bytes32 (keccak256 hash)
  const tokenIdBytes = ethers.keccak256(ethers.toUtf8Bytes(TOKEN_ID));

  // Register token
  console.log("=== Registering Token ===");
  const registerTx = await router.registerToken(
    tokenIdBytes,
    TOKEN_ADDRESS,
    MINT_PRICE,
    TOKENS_PER_MINT,
    MINTABLE_SUPPLY,
    CREATOR_WALLET,
    PLATFORM_WALLET,
    CREATOR_BPS,
    PLATFORM_BPS,
    [SLOT1_BPS, SLOT2_BPS, SLOT3_BPS, SLOT4_BPS, SLOT5_BPS]
  );
  await registerTx.wait();
  console.log("✅ Token registered successfully!");
  console.log("Transaction hash:", registerTx.hash);

  // Generate genesis page ID
  const genesisPageId = `genesis_${TOKEN_ID}_${Date.now()}`;

  console.log("\n📝 Next Steps:");
  console.log("1. Create genesis page in D1 database with ID:", genesisPageId);
  console.log("2. Set slot wallets:", [
    GENESIS_SLOT1,
    GENESIS_SLOT2,
    GENESIS_SLOT3,
    GENESIS_SLOT4,
    GENESIS_SLOT5,
  ]);
  console.log("3. Update promo_tokens table with genesis_page_id:", genesisPageId);
  console.log("\n✅ Token registration complete!\n");

  // Save registration info
  const registrationInfo = {
    network,
    tokenId: TOKEN_ID,
    tokenIdBytes: tokenIdBytes,
    tokenAddress: TOKEN_ADDRESS,
    routerAddress: ROUTER_ADDRESS,
    genesisPageId,
    genesisSlots: [GENESIS_SLOT1, GENESIS_SLOT2, GENESIS_SLOT3, GENESIS_SLOT4, GENESIS_SLOT5],
    registeredAt: new Date().toISOString(),
    transactionHash: registerTx.hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const registrationFile = path.join(deploymentsDir, `promo-token-${TOKEN_ID}-${network}.json`);
  fs.writeFileSync(registrationFile, JSON.stringify(registrationInfo, null, 2));
  console.log("Registration info saved to:", registrationFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
