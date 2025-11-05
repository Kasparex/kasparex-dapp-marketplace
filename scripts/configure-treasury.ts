import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Configuring Treasury with account:", deployer.address);

  // Get contract addresses from deployment file
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(__dirname, "../deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy contracts first using: npx hardhat run scripts/deploy.ts");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const treasuryAddress = deploymentInfo.contracts.Treasury;

  console.log("Treasury address:", treasuryAddress);

  // Connect to Treasury contract
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = Treasury.attach(treasuryAddress) as any;

  // Example: Update distribution percentages if needed
  // Uncomment and adjust values as needed
  /*
  const NEW_TREASURY_PERCENTAGE = 5000; // 50%
  const NEW_DEVELOPER_PERCENTAGE = 2500; // 25%
  const NEW_BUILDER_PERCENTAGE = 2500; // 25%

  console.log("\n=== Updating Distribution Percentages ===");
  const updateTx = await treasury.setDistributionPercentages(
    NEW_TREASURY_PERCENTAGE,
    NEW_DEVELOPER_PERCENTAGE,
    NEW_BUILDER_PERCENTAGE
  );
  await updateTx.wait();
  console.log("Distribution percentages updated");
  */

  // Example: Distribute revenue
  // Uncomment to distribute accumulated revenue
  /*
  console.log("\n=== Distributing Revenue ===");
  const balance = await treasury.getBalance();
  console.log("Current balance:", ethers.formatEther(balance), "KAS");
  
  if (balance > 0n) {
    const distributeTx = await treasury.distributeRevenue();
    await distributeTx.wait();
    console.log("Revenue distributed");
  } else {
    console.log("No revenue to distribute");
  }
  */

  // Get current configuration
  console.log("\n=== Current Treasury Configuration ===");
  const treasuryPercentage = await treasury.treasuryPercentage();
  const developerPercentage = await treasury.developerPercentage();
  const builderPercentage = await treasury.builderPercentage();
  const developerAddress = await treasury.developerAddress();
  const builderAddress = await treasury.builderAddress();
  const totalFeesCollected = await treasury.totalFeesCollected();
  const balance = await treasury.getBalance();

  console.log("Treasury Percentage:", treasuryPercentage.toString(), "basis points");
  console.log("Developer Percentage:", developerPercentage.toString(), "basis points");
  console.log("Builder Percentage:", builderPercentage.toString(), "basis points");
  console.log("Developer Address:", developerAddress);
  console.log("Builder Address:", builderAddress);
  console.log("Total Fees Collected:", ethers.formatEther(totalFeesCollected), "KAS");
  console.log("Current Balance:", ethers.formatEther(balance), "KAS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


