const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to verify contract configuration and addresses
 * Usage: npx hardhat run scripts/verify-contracts.js --network kasplexL2Testnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("=".repeat(60));
  console.log("CONTRACT VERIFICATION SCRIPT");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} KAS\n`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please deploy contracts first using: npm run hardhat:deploy");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("📋 Loaded deployment info from:", deploymentFile);
  console.log(`   Deployed at: ${deploymentInfo.timestamp}\n`);

  // Verify Treasury
  console.log("=".repeat(60));
  console.log("1. TREASURY CONTRACT");
  console.log("=".repeat(60));
  const treasuryAddress = deploymentInfo.contracts.Treasury;
  console.log(`Address: ${treasuryAddress}`);
  
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = Treasury.attach(treasuryAddress);
  
  const treasuryOwner = await treasury.owner();
  const treasuryBalance = await treasury.getBalance();
  const totalFeesCollected = await treasury.totalFeesCollected();
  const treasuryPercentage = await treasury.treasuryPercentage();
  const developerPercentage = await treasury.developerPercentage();
  const builderPercentage = await treasury.builderPercentage();
  const developerAddress = await treasury.developerAddress();
  const builderAddress = await treasury.builderAddress();

  console.log(`Owner: ${treasuryOwner}`);
  console.log(`Current Balance: ${ethers.formatEther(treasuryBalance)} KAS`);
  console.log(`Total Fees Collected: ${ethers.formatEther(totalFeesCollected)} KAS`);
  console.log(`\nDistribution Percentages:`);
  console.log(`  Treasury: ${Number(treasuryPercentage) / 100}%`);
  console.log(`  Developer: ${Number(developerPercentage) / 100}%`);
  console.log(`  Builder: ${Number(builderPercentage) / 100}%`);
  console.log(`\nDistribution Addresses:`);
  console.log(`  Developer: ${developerAddress}`);
  console.log(`  Builder: ${builderAddress}`);
  
  if (treasuryOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log(`\n⚠️  WARNING: Deployer is not the owner of Treasury!`);
    console.log(`   You may not be able to call distributeRevenue() or update settings.`);
  }

  // Verify FeeCollector
  console.log("\n" + "=".repeat(60));
  console.log("2. FEECOLLECTOR CONTRACT");
  console.log("=".repeat(60));
  const feeCollectorAddress = deploymentInfo.contracts.FeeCollector;
  console.log(`Address: ${feeCollectorAddress}`);
  
  const FeeCollector = await ethers.getContractFactory("FeeCollector");
  const feeCollector = FeeCollector.attach(feeCollectorAddress);
  
  const feeCollectorOwner = await feeCollector.owner();
  const feeCollectorTreasury = await feeCollector.treasury();
  
  console.log(`Owner: ${feeCollectorOwner}`);
  console.log(`Treasury Address: ${feeCollectorTreasury}`);
  
  if (feeCollectorTreasury.toLowerCase() !== treasuryAddress.toLowerCase()) {
    console.log(`\n⚠️  WARNING: FeeCollector is not pointing to the correct Treasury!`);
    console.log(`   Expected: ${treasuryAddress}`);
    console.log(`   Actual: ${feeCollectorTreasury}`);
  } else {
    console.log(`✅ FeeCollector correctly points to Treasury`);
  }

  // Verify SimplePayment
  console.log("\n" + "=".repeat(60));
  console.log("3. SIMPLE PAYMENT CONTRACT");
  console.log("=".repeat(60));
  const simplePaymentAddress = deploymentInfo.contracts.SimplePayment;
  console.log(`Address: ${simplePaymentAddress}`);
  
  const SimplePayment = await ethers.getContractFactory("SimplePayment");
  const simplePayment = SimplePayment.attach(simplePaymentAddress);
  
  const simplePaymentOwner = await simplePayment.owner();
  const simplePaymentFeeCollector = await simplePayment.feeCollector();
  const simplePaymentFeePercentage = await simplePayment.feePercentage();
  
  console.log(`Owner: ${simplePaymentOwner}`);
  console.log(`Fee Collector: ${simplePaymentFeeCollector}`);
  console.log(`Fee Percentage: ${Number(simplePaymentFeePercentage) / 100}%`);
  
  if (simplePaymentFeeCollector.toLowerCase() !== feeCollectorAddress.toLowerCase()) {
    console.log(`\n⚠️  WARNING: SimplePayment is not pointing to the correct FeeCollector!`);
    console.log(`   Expected: ${feeCollectorAddress}`);
    console.log(`   Actual: ${simplePaymentFeeCollector}`);
  } else {
    console.log(`✅ SimplePayment correctly points to FeeCollector`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Treasury Contract: ${treasuryAddress}`);
  console.log(`   Balance: ${ethers.formatEther(treasuryBalance)} KAS`);
  console.log(`   Total Collected: ${ethers.formatEther(totalFeesCollected)} KAS`);
  console.log(`\n✅ FeeCollector: ${feeCollectorAddress}`);
  console.log(`   Points to Treasury: ${feeCollectorTreasury === treasuryAddress ? "✅" : "❌"}`);
  console.log(`\n✅ SimplePayment: ${simplePaymentAddress}`);
  console.log(`   Points to FeeCollector: ${simplePaymentFeeCollector === feeCollectorAddress ? "✅" : "❌"}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("To distribute collected fees:");
  console.log(`  1. Connect as Treasury owner: ${treasuryOwner}`);
  console.log(`  2. Call: treasury.distributeRevenue()`);
  console.log(`  3. This will send:`);
  console.log(`     - ${Number(treasuryPercentage) / 100}% to Treasury (stays in contract)`);
  console.log(`     - ${Number(developerPercentage) / 100}% to ${developerAddress}`);
  console.log(`     - ${Number(builderPercentage) / 100}% to ${builderAddress}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

