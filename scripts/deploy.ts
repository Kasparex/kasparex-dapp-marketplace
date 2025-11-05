const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration - adjust these values as needed
  const TREASURY_PERCENTAGE = 4000; // 40%
  const DEVELOPER_PERCENTAGE = 3000; // 30%
  const BUILDER_PERCENTAGE = 3000; // 30%
  
  // These addresses should be set in your .env file or passed as parameters
  const DEVELOPER_ADDRESS = process.env.DEVELOPER_ADDRESS || deployer.address;
  const BUILDER_ADDRESS = process.env.BUILDER_ADDRESS || deployer.address;
  
  // Fee percentage for SimplePayment (in basis points, 100 = 1%)
  const FEE_PERCENTAGE = 100; // 1%

  console.log("\n=== Deploying Treasury ===");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    TREASURY_PERCENTAGE,
    DEVELOPER_PERCENTAGE,
    BUILDER_PERCENTAGE,
    DEVELOPER_ADDRESS,
    BUILDER_ADDRESS
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  console.log("\n=== Deploying FeeCollector ===");
  const FeeCollector = await ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy(treasuryAddress);
  await feeCollector.waitForDeployment();
  const feeCollectorAddress = await feeCollector.getAddress();
  console.log("FeeCollector deployed to:", feeCollectorAddress);

  console.log("\n=== Deploying DAppRegistry ===");
  const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
  const dAppRegistry = await DAppRegistry.deploy();
  await dAppRegistry.waitForDeployment();
  const dAppRegistryAddress = await dAppRegistry.getAddress();
  console.log("DAppRegistry deployed to:", dAppRegistryAddress);

  console.log("\n=== Deploying SimplePayment ===");
  const SimplePayment = await ethers.getContractFactory("SimplePayment");
  const simplePayment = await SimplePayment.deploy(feeCollectorAddress, FEE_PERCENTAGE);
  await simplePayment.waitForDeployment();
  const simplePaymentAddress = await simplePayment.getAddress();
  console.log("SimplePayment deployed to:", simplePaymentAddress);

  // Register SimplePayment in DAppRegistry
  console.log("\n=== Registering SimplePayment in DAppRegistry ===");
  const registerTx = await dAppRegistry.registerDApp(
    "Simple Payment",
    "1.0.0",
    "payment",
    simplePaymentAddress
  );
  await registerTx.wait();
  console.log("SimplePayment registered in DAppRegistry");

  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      Treasury: treasuryAddress,
      FeeCollector: feeCollectorAddress,
      DAppRegistry: dAppRegistryAddress,
      SimplePayment: simplePaymentAddress,
    },
    configuration: {
      treasuryPercentage: TREASURY_PERCENTAGE,
      developerPercentage: DEVELOPER_PERCENTAGE,
      builderPercentage: BUILDER_PERCENTAGE,
      developerAddress: DEVELOPER_ADDRESS,
      builderAddress: BUILDER_ADDRESS,
      feePercentage: FEE_PERCENTAGE,
    },
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = network.name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n=== Deployment Info Saved ===");
  console.log(`Saved to: ${deploymentFile}`);
  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

