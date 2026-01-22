/**
 * Update Mint Price Script
 * 
 * Updates the mint price for an existing token in the PromoMintRouter contract.
 * 
 * Usage:
 *   node scripts/update-mint-price.js
 * 
 * Requires environment variables:
 *   - PROMO_MINT_ROUTER_ADDRESS
 *   - TOKEN_ID
 *   - MINT_PRICE (new price in KAS, e.g., "10")
 *   - PRIVATE_KEY (for signing)
 */

const { ethers } = require("hardhat");

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  console.log("\n💰 Updating Mint Price...\n");
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);

  // Configuration from environment
  const ROUTER_ADDRESS = process.env.PROMO_MINT_ROUTER_ADDRESS || "";
  const TOKEN_ID = process.env.TOKEN_ID || "";
  const MINT_PRICE = process.env.MINT_PRICE ? ethers.parseEther(process.env.MINT_PRICE) : null;

  // Validation
  if (!ROUTER_ADDRESS) throw new Error("PROMO_MINT_ROUTER_ADDRESS required");
  if (!TOKEN_ID) throw new Error("TOKEN_ID required");
  if (!MINT_PRICE) throw new Error("MINT_PRICE required");

  console.log("Token ID:", TOKEN_ID);
  console.log("New Mint Price:", ethers.formatEther(MINT_PRICE), "KAS");

  // Get contract
  const router = await ethers.getContractAt("PromoMintRouter", ROUTER_ADDRESS);
  const tokenIdBytes = ethers.keccak256(ethers.toUtf8Bytes(TOKEN_ID));

  try {
    // Check if token exists
    console.log("\n=== Checking Token Registration ===");
    const tokenConfig = await router.getTokenConfig(tokenIdBytes);
    console.log("Current token config:");
    console.log("  Token address:", tokenConfig.token);
    console.log("  Current mint price:", ethers.formatEther(tokenConfig.mintPrice), "KAS");
    
    if (tokenConfig.token === ethers.ZeroAddress) {
      throw new Error("Token not found in contract. Please register it first using setup-promo-token.js");
    }

    console.log("\n=== Updating Mint Price ===");
    console.log("Calling setMintPrice with:");
    console.log("  Token ID bytes:", tokenIdBytes);
    console.log("  New price:", ethers.formatEther(MINT_PRICE), "KAS");
    
    // Try to estimate gas first to see if function exists
    try {
      const gasEstimate = await router.setMintPrice.estimateGas(tokenIdBytes, MINT_PRICE);
      console.log("  Gas estimate:", gasEstimate.toString());
    } catch (estimateError) {
      console.error("  Gas estimation failed:", estimateError.message);
      throw estimateError;
    }
    
    const updateTx = await router.setMintPrice(tokenIdBytes, MINT_PRICE);
    console.log("Transaction sent:", updateTx.hash);
    
    await updateTx.wait();
    console.log("✅ Mint price updated successfully");
    console.log("  Transaction:", updateTx.hash);

    // Verify the update
    const updatedConfig = await router.getTokenConfig(tokenIdBytes);
    console.log("\nUpdated Configuration:");
    console.log("  Mint Price:", ethers.formatEther(updatedConfig.mintPrice), "KAS");
  } catch (error) {
    console.error("\n❌ Error updating mint price:");
    console.error("  Message:", error.message);
    if (error.reason) {
      console.error("  Reason:", error.reason);
    }
    if (error.data) {
      console.error("  Data:", error.data);
    }
    if (error.message?.includes("unknown token") || error.reason?.includes("unknown token")) {
      console.error("\n  Token is not registered in the contract.");
      console.error("  Please register it first using: npm run hardhat:setup:promo-token");
    } else if (error.message?.includes("onlyOwner") || error.reason?.includes("onlyOwner")) {
      console.error("\n  Only the contract owner can update the mint price.");
      console.error("  Current deployer:", deployer.address);
    } else if (error.message?.includes("execution reverted")) {
      console.error("\n  Transaction reverted. Possible reasons:");
      console.error("  - Token not registered");
      console.error("  - Function doesn't exist (contract needs redeployment)");
      console.error("  - Insufficient permissions");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
