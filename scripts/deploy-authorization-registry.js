const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to deploy only AuthorizationRegistry contract
 * Usage: npx hardhat run scripts/deploy-authorization-registry.js --network kasplexL2Testnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("=".repeat(60));
  console.log("DEPLOYING AUTHORIZATION REGISTRY");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} KAS\n`);

  // Load existing deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  
  let deploymentInfo = {};
  if (fs.existsSync(deploymentFile)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("📋 Loaded existing deployment info");
  } else {
    console.log("📋 Creating new deployment info");
    deploymentInfo = {
      network: network.name,
      chainId: network.chainId.toString(),
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {},
      configuration: {},
    };
  }

  // Check if already deployed
  if (deploymentInfo.contracts?.AuthorizationRegistry) {
    console.log(`\n⚠️  AuthorizationRegistry already deployed at: ${deploymentInfo.contracts.AuthorizationRegistry}`);
    console.log("   Skipping deployment. If you want to redeploy, remove it from the deployment file first.");
    return;
  }

  console.log("\n=== Deploying AuthorizationRegistry ===");
  const AuthorizationRegistry = await ethers.getContractFactory("AuthorizationRegistry");
  const authorizationRegistry = await AuthorizationRegistry.deploy();
  await authorizationRegistry.waitForDeployment();
  const authorizationRegistryAddress = await authorizationRegistry.getAddress();
  console.log("✅ AuthorizationRegistry deployed to:", authorizationRegistryAddress);

  // Update deployment info
  if (!deploymentInfo.contracts) {
    deploymentInfo.contracts = {};
  }
  deploymentInfo.contracts.AuthorizationRegistry = authorizationRegistryAddress;
  deploymentInfo.timestamp = new Date().toISOString();

  // Save to file
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n=== Deployment Info Updated ===");
  console.log(`Saved to: ${deploymentFile}`);
  console.log("\n📝 Add this to your environment variables:");
  const suffix = network.chainId.toString() === "167012" ? "_TESTNET" : "";
  console.log(`NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS${suffix}=${authorizationRegistryAddress}`);
  console.log("\n✅ Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

