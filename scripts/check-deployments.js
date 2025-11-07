const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to check deployed contract addresses
 * Usage: node scripts/check-deployments.js
 */
async function main() {
  console.log("=".repeat(60));
  console.log("DEPLOYED CONTRACT ADDRESSES CHECKER");
  console.log("=".repeat(60));
  console.log();

  // Check deployment files
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    console.log("❌ No deployments directory found.");
    console.log("   Run deployment script first: npx hardhat run scripts/deploy.js --network kasplexL2Testnet");
    return;
  }

  const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log("❌ No deployment files found in deployments/ directory");
    return;
  }

  console.log(`📁 Found ${files.length} deployment file(s):\n`);

  for (const file of files) {
    const filePath = path.join(deploymentsDir, file);
    const deploymentInfo = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    console.log("=".repeat(60));
    console.log(`📄 ${file}`);
    console.log("=".repeat(60));
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}`);
    console.log(`Deployed: ${deploymentInfo.timestamp}`);
    console.log(`Deployer: ${deploymentInfo.deployer}`);
    console.log();
    
    console.log("📋 Deployed Contracts:");
    console.log("-".repeat(60));
    const contracts = deploymentInfo.contracts || {};
    
    const contractNames = [
      'Treasury',
      'FeeCollector',
      'DAppRegistry',
      'AuthorizationRegistry',
      'SimplePayment',
      'PlatformSubscription',
      'DAppSubscription',
      'SubscriptionManager'
    ];
    
    for (const name of contractNames) {
      const address = contracts[name];
      if (address) {
        console.log(`  ✅ ${name.padEnd(25)} ${address}`);
      } else {
        console.log(`  ❌ ${name.padEnd(25)} NOT DEPLOYED`);
      }
    }
    
    console.log();
    console.log("🔧 Configuration:");
    console.log("-".repeat(60));
    if (deploymentInfo.configuration) {
      const config = deploymentInfo.configuration;
      console.log(`  Treasury: ${config.treasuryPercentage / 100}%`);
      console.log(`  Developer: ${config.developerPercentage / 100}%`);
      console.log(`  Builder: ${config.builderPercentage / 100}%`);
      console.log(`  Fee: ${config.feePercentage / 100}%`);
      console.log(`  Kasparex Fee: ${config.kasparexFeePercentage / 100}%`);
    }
    
    console.log();
    console.log("📝 Environment Variables for Frontend:");
    console.log("-".repeat(60));
    const chainId = parseInt(deploymentInfo.chainId);
    const suffix = chainId === 167012 ? '_TESTNET' : '';
    
    if (contracts.Treasury) {
      console.log(`NEXT_PUBLIC_TREASURY_ADDRESS${suffix}=${contracts.Treasury}`);
    }
    if (contracts.FeeCollector) {
      console.log(`NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS${suffix}=${contracts.FeeCollector}`);
    }
    if (contracts.DAppRegistry) {
      console.log(`NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS${suffix}=${contracts.DAppRegistry}`);
    }
    if (contracts.AuthorizationRegistry) {
      console.log(`NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS${suffix}=${contracts.AuthorizationRegistry}`);
    }
    if (contracts.SimplePayment) {
      console.log(`NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS${suffix}=${contracts.SimplePayment}`);
    }
    if (contracts.PlatformSubscription) {
      console.log(`NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS${suffix}=${contracts.PlatformSubscription}`);
    }
    if (contracts.DAppSubscription) {
      console.log(`NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS${suffix}=${contracts.DAppSubscription}`);
    }
    if (contracts.SubscriptionManager) {
      console.log(`NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS${suffix}=${contracts.SubscriptionManager}`);
    }
    
    console.log();
  }
  
  console.log("=".repeat(60));
  console.log("💡 TIP: If AuthorizationRegistry is missing, you may need to:");
  console.log("   1. Redeploy all contracts: npx hardhat run scripts/deploy.js --network kasplexL2Testnet");
  console.log("   2. Or deploy just AuthorizationRegistry separately");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

