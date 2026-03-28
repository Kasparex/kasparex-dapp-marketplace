/**
 * Complete Setup Script for Promo Token
 * 
 * This script:
 * 1. Registers the token in PromoMintRouter contract
 * 2. Creates the token record in D1 database
 * 3. Creates the genesis page in D1 database
 * 
 * Usage:
 *   node scripts/setup-promo-token.js
 * 
 * Requires environment variables (see .env.example)
 */

const { ethers } = require("hardhat");

// Use native fetch (Node 18+) or node-fetch if needed
let fetchFn;
if (typeof fetch !== 'undefined') {
  fetchFn = fetch;
} else {
  try {
    fetchFn = require("node-fetch");
  } catch (e) {
    console.error("Please install node-fetch: npm install node-fetch");
    process.exit(1);
  }
}

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  console.log("\nđźš€ Setting up Promo Token...\n");
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);

  // Configuration from environment
  const ROUTER_ADDRESS = process.env.PROMO_MINT_ROUTER_ADDRESS || "";
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
  const TOKEN_ID = process.env.TOKEN_ID || "";
  const TOKEN_TICKER = process.env.TOKEN_TICKER || "";
  const TOKEN_NAME = process.env.TOKEN_NAME || "";
  const API_BASE_URL = process.env.KASPAREX_API_URL || "https://kasparex-api.kasparexcom.workers.dev";
  const ADMIN_TOKEN = process.env.ADMIN_AUTH_TOKEN || "";

  // Validation
  if (!ROUTER_ADDRESS) throw new Error("PROMO_MINT_ROUTER_ADDRESS required");
  if (!TOKEN_ADDRESS) throw new Error("TOKEN_ADDRESS required");
  if (!TOKEN_ID) throw new Error("TOKEN_ID required");
  if (!TOKEN_TICKER) throw new Error("TOKEN_TICKER required");
  if (!TOKEN_NAME) throw new Error("TOKEN_NAME required");
  if (!ADMIN_TOKEN) throw new Error("ADMIN_AUTH_TOKEN required");

  // Mint configuration
  const MINT_PRICE = process.env.MINT_PRICE ? ethers.parseEther(process.env.MINT_PRICE) : ethers.parseEther("0.1");
  const TOKENS_PER_MINT = process.env.TOKENS_PER_MINT ? BigInt(process.env.TOKENS_PER_MINT) : 1000n;
  const MINTABLE_SUPPLY = process.env.MINTABLE_SUPPLY ? BigInt(process.env.MINTABLE_SUPPLY) : 10000000n;

  // Wallets
  const CREATOR_WALLET = process.env.CREATOR_WALLET || deployer.address;
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;
  const GENESIS_SLOT1 = process.env.GENESIS_SLOT1 || deployer.address;
  const GENESIS_SLOT2 = process.env.GENESIS_SLOT2 || deployer.address;
  const GENESIS_SLOT3 = process.env.GENESIS_SLOT3 || deployer.address;
  const GENESIS_SLOT4 = process.env.GENESIS_SLOT4 || deployer.address;
  const GENESIS_SLOT5 = process.env.GENESIS_SLOT5 || deployer.address;

  // Percentages
  const CREATOR_BPS = parseInt(process.env.CREATOR_BPS || "4000");
  const PLATFORM_BPS = parseInt(process.env.PLATFORM_BPS || "200");
  const SLOT1_BPS = parseInt(process.env.SLOT1_BPS || "4000");
  const SLOT2_BPS = parseInt(process.env.SLOT2_BPS || "1000");
  const SLOT3_BPS = parseInt(process.env.SLOT3_BPS || "500");
  const SLOT4_BPS = parseInt(process.env.SLOT4_BPS || "200");
  const SLOT5_BPS = parseInt(process.env.SLOT5_BPS || "100");

  console.log("Token Configuration:");
  console.log("  ID:", TOKEN_ID);
  console.log("  Name:", TOKEN_NAME);
  console.log("  Ticker:", TOKEN_TICKER);
  console.log("  Contract:", TOKEN_ADDRESS);
  console.log("  Mint Price:", ethers.formatEther(MINT_PRICE), "KAS");
  console.log("  Tokens Per Mint:", TOKENS_PER_MINT.toString());
  console.log("  Mintable Supply:", MINTABLE_SUPPLY.toString());

  // Step 1: Register in contract
  console.log("\n=== Step 1: Registering in Contract ===");
  const router = await ethers.getContractAt("PromoMintRouter", ROUTER_ADDRESS);
  const tokenIdBytes = ethers.keccak256(ethers.toUtf8Bytes(TOKEN_ID));

  try {
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
    console.log("âś… Token registered in contract");
    console.log("  Transaction:", registerTx.hash);
  } catch (error) {
    if (error.message?.includes("already registered")) {
      console.log("âš ď¸Ź  Token already registered in contract (skipping)");
    } else {
      throw error;
    }
  }

  // Step 2: Register in database
  console.log("\n=== Step 2: Registering in Database ===");
  const dbResponse = await fetchFn(`${API_BASE_URL}/kasparex/promo/admin/register-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({
      id: TOKEN_ID,
      ticker: TOKEN_TICKER,
      name: TOKEN_NAME,
      contract_address: TOKEN_ADDRESS,
      network: network === "igraMainnet" ? "igraMainnet" : network,
      mint_price: parseFloat(ethers.formatEther(MINT_PRICE)),
      tokens_per_mint: Number(TOKENS_PER_MINT),
      mintable_supply: Number(MINTABLE_SUPPLY),
      creator_wallet: CREATOR_WALLET,
      platform_wallet: PLATFORM_WALLET,
    }),
  });

  if (!dbResponse.ok) {
    const errorText = await dbResponse.text();
    if (errorText.includes("UNIQUE constraint")) {
      console.log("âš ď¸Ź  Token already registered in database (skipping)");
    } else {
      throw new Error(`Database registration failed: ${errorText}`);
    }
  } else {
    console.log("âś… Token registered in database");
  }

  // Step 3: Create genesis page
  console.log("\n=== Step 3: Creating Genesis Page ===");
  const genesisPageId = `genesis_${TOKEN_ID}_${Date.now()}`;
  const genesisResponse = await fetchFn(`${API_BASE_URL}/kasparex/promo/admin/create-genesis-page`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({
      token_id: TOKEN_ID,
      page_id: genesisPageId,
      owner_wallet: CREATOR_WALLET,
      slot1_wallet: GENESIS_SLOT1,
      slot2_wallet: GENESIS_SLOT2,
      slot3_wallet: GENESIS_SLOT3,
      slot4_wallet: GENESIS_SLOT4,
      slot5_wallet: GENESIS_SLOT5,
      slot1_label: process.env.GENESIS_SLOT1_LABEL || "Deployer",
      slot2_label: process.env.GENESIS_SLOT2_LABEL || "Liquidity",
      slot3_label: process.env.GENESIS_SLOT3_LABEL || "Marketing",
      slot4_label: process.env.GENESIS_SLOT4_LABEL || "Team",
      slot5_label: process.env.GENESIS_SLOT5_LABEL || "Platform",
    }),
  });

  if (!genesisResponse.ok) {
    const errorText = await genesisResponse.text();
    throw new Error(`Genesis page creation failed: ${errorText}`);
  }

  const genesisData = await genesisResponse.json();
  console.log("âś… Genesis page created");
  console.log("  Page ID:", genesisData.pageId);

  console.log("\nâś… Setup complete!");
  console.log("\nđź“ť Summary:");
  console.log("  Token ID:", TOKEN_ID);
  console.log("  Token ID (bytes32):", tokenIdBytes);
  console.log("  Genesis Page ID:", genesisPageId);
  console.log("  Promo Page URL: /tokens/" + TOKEN_ID + "/promo/" + genesisPageId);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nâťŚ Error:", error.message);
    process.exit(1);
  });
