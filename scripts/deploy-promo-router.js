/**
 * Deploy PromoMintRouter Contract
 * 
 * Deploys the PromoMintRouter contract to the specified network
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying PromoMintRouter Contract...\n");
  console.log("Network:", network);
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "KAS\n");

  // Deploy PromoMintRouter
  console.log("=== Deploying PromoMintRouter ===");
  const PromoMintRouter = await ethers.getContractFactory("PromoMintRouter");
  const router = await PromoMintRouter.deploy(deployer.address);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("PromoMintRouter deployed to:", routerAddress);

  // Set initial security parameters (optional - defaults are fine)
  console.log("\n=== Setting Security Parameters ===");
  const setParamsTx = await router.setSecurityParams(
    60,    // cooldownSeconds: 60 seconds
    10,    // maxMintsPerDay: 10 mints per day
    5,     // maxMintsPerTx: 5 mints per transaction
    0      // maxMintsPerWallet: 0 = unlimited (lifetime)
  );
  await setParamsTx.wait();
  console.log("Security parameters set");

  // Save deployment info
  const deploymentInfo = {
    network,
    contractName: "PromoMintRouter",
    address: routerAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: router.deploymentTransaction()?.hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `promo-router-${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to:", deploymentFile);

  console.log("\n📝 Next Steps:");
  console.log("1. Update NEXT_PUBLIC_PROMO_MINT_ROUTER_ADDRESS_IGRA_TESTNET in Vercel");
  console.log("2. Update src/lib/contracts/addresses.ts with the deployed address");
  console.log("3. Register your first token using scripts/register-promo-token.js");
  console.log("\n✅ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
