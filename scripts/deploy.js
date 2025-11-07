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

  // Subscription configuration
  const MONTHLY_PLATFORM_PRICE = ethers.parseEther("10"); // 10 KAS per month
  const SUBSCRIPTION_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
  const GRACE_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  const KASPAREX_FEE_PERCENTAGE = 1500; // 15% (1500 basis points)

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

  console.log("\n=== Deploying AuthorizationRegistry ===");
  const AuthorizationRegistry = await ethers.getContractFactory("AuthorizationRegistry");
  const authorizationRegistry = await AuthorizationRegistry.deploy();
  await authorizationRegistry.waitForDeployment();
  const authorizationRegistryAddress = await authorizationRegistry.getAddress();
  console.log("AuthorizationRegistry deployed to:", authorizationRegistryAddress);

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

  console.log("\n=== Deploying PlatformSubscription ===");
  const PlatformSubscription = await ethers.getContractFactory("PlatformSubscription");
  const platformSubscription = await PlatformSubscription.deploy(
    treasuryAddress,
    MONTHLY_PLATFORM_PRICE,
    SUBSCRIPTION_PERIOD,
    GRACE_PERIOD,
    KASPAREX_FEE_PERCENTAGE
  );
  await platformSubscription.waitForDeployment();
  const platformSubscriptionAddress = await platformSubscription.getAddress();
  console.log("PlatformSubscription deployed to:", platformSubscriptionAddress);

  console.log("\n=== Deploying DAppSubscription ===");
  const DAppSubscription = await ethers.getContractFactory("DAppSubscription");
  const dAppSubscription = await DAppSubscription.deploy(
    treasuryAddress,
    authorizationRegistryAddress,
    dAppRegistryAddress,
    KASPAREX_FEE_PERCENTAGE
  );
  await dAppSubscription.waitForDeployment();
  const dAppSubscriptionAddress = await dAppSubscription.getAddress();
  console.log("DAppSubscription deployed to:", dAppSubscriptionAddress);

  console.log("\n=== Deploying SubscriptionManager ===");
  const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(
    platformSubscriptionAddress,
    dAppSubscriptionAddress
  );
  await subscriptionManager.waitForDeployment();
  const subscriptionManagerAddress = await subscriptionManager.getAddress();
  console.log("SubscriptionManager deployed to:", subscriptionManagerAddress);

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
      AuthorizationRegistry: authorizationRegistryAddress,
      SimplePayment: simplePaymentAddress,
      PlatformSubscription: platformSubscriptionAddress,
      DAppSubscription: dAppSubscriptionAddress,
      SubscriptionManager: subscriptionManagerAddress,
    },
    configuration: {
      treasuryPercentage: TREASURY_PERCENTAGE,
      developerPercentage: DEVELOPER_PERCENTAGE,
      builderPercentage: BUILDER_PERCENTAGE,
      developerAddress: DEVELOPER_ADDRESS,
      builderAddress: BUILDER_ADDRESS,
      feePercentage: FEE_PERCENTAGE,
      monthlyPlatformPrice: MONTHLY_PLATFORM_PRICE.toString(),
      subscriptionPeriod: SUBSCRIPTION_PERIOD.toString(),
      gracePeriod: GRACE_PERIOD.toString(),
      kasparexFeePercentage: KASPAREX_FEE_PERCENTAGE,
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

