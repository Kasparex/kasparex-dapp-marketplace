/**
 * Deploy Ecosystem Contracts
 * Deploys GRIDToken, FeeHandler, RewardManager, ProofOfUtility, etc.
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const network = hre.network.name;
  console.log(`\nDeploying to ${network}...\n`);

  // Get existing contract addresses
  // These are the CONTRACT ADDRESSES (not deployer addresses)
  // Find them in DEPLOYMENT_SUCCESS.md or src/lib/contracts/addresses.ts
  
  // For Kasplex L2 Testnet (from DEPLOYMENT_SUCCESS.md):
  // Treasury: 0x305B4ee627aD8b12bFCF6427453964771aA30622
  // DAppRegistry: 0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
  
  const treasuryAddress = process.env.TREASURY_ADDRESS || '';
  if (!treasuryAddress) {
    console.error('\n❌ ERROR: TREASURY_ADDRESS not set in environment\n');
    console.log('📋 Find your addresses in:');
    console.log('   - DEPLOYMENT_SUCCESS.md (Contract Address column)');
    console.log('   - src/lib/contracts/addresses.ts (HARDCODED_FALLBACK_ADDRESSES)\n');
    console.log('💡 For Kasplex L2 Testnet, use:');
    console.log('   Treasury: 0x305B4ee627aD8b12bFCF6427453964771aA30622');
    console.log('   DAppRegistry: 0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd\n');
    console.log('Set in .env or export before running:');
    console.log('   export TREASURY_ADDRESS=0x305B4ee627aD8b12bFCF6427453964771aA30622');
    console.log('   export DAPP_REGISTRY_ADDRESS=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd\n');
    process.exit(1);
  }

  // 1. Deploy GRIDToken
  console.log('1. Deploying GRIDToken...');
  const RewardVault = await hre.ethers.getContractFactory('RewardVault');
  const rewardVault = await RewardVault.deploy(deployer.address); // Temporary, will update after RewardManager
  await rewardVault.waitForDeployment();
  const rewardVaultAddress = await rewardVault.getAddress();
  console.log('   RewardVault deployed to:', rewardVaultAddress);

  const GRIDToken = await hre.ethers.getContractFactory('GRIDToken');
  const gridToken = await GRIDToken.deploy(rewardVaultAddress);
  await gridToken.waitForDeployment();
  const gridTokenAddress = await gridToken.getAddress();
  console.log('   GRIDToken deployed to:', gridTokenAddress);

  // 2. Deploy ProofOfUtility
  console.log('\n2. Deploying ProofOfUtility...');
  const ProofOfUtility = await hre.ethers.getContractFactory('ProofOfUtility');
  const proofOfUtility = await ProofOfUtility.deploy(deployer.address); // Temporary, will update after RewardManager
  await proofOfUtility.waitForDeployment();
  const proofOfUtilityAddress = await proofOfUtility.getAddress();
  console.log('   ProofOfUtility deployed to:', proofOfUtilityAddress);

  // 3. Deploy RewardManager
  console.log('\n3. Deploying RewardManager...');
  const RewardManager = await hre.ethers.getContractFactory('RewardManager');
  const rewardManager = await RewardManager.deploy(proofOfUtilityAddress, gridTokenAddress);
  await rewardManager.waitForDeployment();
  const rewardManagerAddress = await rewardManager.getAddress();
  console.log('   RewardManager deployed to:', rewardManagerAddress);

  // Update RewardVault and ProofOfUtility with RewardManager address
  console.log('\n4. Linking contracts...');
  await rewardVault.setRewardManager(rewardManagerAddress);
  await proofOfUtility.setRewardManager(rewardManagerAddress);
  console.log('   Contracts linked successfully');

  // 4. Deploy FeeHandler
  console.log('\n5. Deploying FeeHandler...');
  const projectTreasury = process.env.PROJECT_TREASURY || deployer.address;
  const FeeHandler = await hre.ethers.getContractFactory('FeeHandler');
  const feeHandler = await FeeHandler.deploy(treasuryAddress, projectTreasury);
  await feeHandler.waitForDeployment();
  const feeHandlerAddress = await feeHandler.getAddress();
  console.log('   FeeHandler deployed to:', feeHandlerAddress);

  // 5. Deploy AffiliateManager
  console.log('\n6. Deploying AffiliateManager...');
  const AffiliateManager = await hre.ethers.getContractFactory('AffiliateManager');
  const affiliateManager = await AffiliateManager.deploy(gridTokenAddress);
  await affiliateManager.waitForDeployment();
  const affiliateManagerAddress = await affiliateManager.getAddress();
  console.log('   AffiliateManager deployed to:', affiliateManagerAddress);

  // 6. Deploy LoyaltyPoints
  console.log('\n7. Deploying LoyaltyPoints...');
  const LoyaltyPoints = await hre.ethers.getContractFactory('LoyaltyPoints');
  const loyaltyPoints = await LoyaltyPoints.deploy();
  await loyaltyPoints.waitForDeployment();
  const loyaltyPointsAddress = await loyaltyPoints.getAddress();
  console.log('   LoyaltyPoints deployed to:', loyaltyPointsAddress);

  // 7. Deploy ProfileRegistry
  console.log('\n8. Deploying ProfileRegistry...');
  const ProfileRegistry = await hre.ethers.getContractFactory('ProfileRegistry');
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.waitForDeployment();
  const profileRegistryAddress = await profileRegistry.getAddress();
  console.log('   ProfileRegistry deployed to:', profileRegistryAddress);

  // 8. Deploy UserProfileDashboard
  console.log('\n9. Deploying UserProfileDashboard...');
  const UserProfileDashboard = await hre.ethers.getContractFactory('UserProfileDashboard');
  const userProfileDashboard = await UserProfileDashboard.deploy(profileRegistryAddress);
  await userProfileDashboard.waitForDeployment();
  const userProfileDashboardAddress = await userProfileDashboard.getAddress();
  console.log('   UserProfileDashboard deployed to:', userProfileDashboardAddress);

  // 9. Deploy AdminDashboard
  console.log('\n10. Deploying AdminDashboard...');
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '';
  let adminDashboardAddress = '';
  if (!dAppRegistryAddress) {
    console.warn('   ⚠️  WARNING: DAPP_REGISTRY_ADDRESS not set, skipping AdminDashboard');
    console.warn('   Set DAPP_REGISTRY_ADDRESS=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd for testnet');
  } else {
    const AdminDashboard = await hre.ethers.getContractFactory('AdminDashboard');
    const adminDashboard = await AdminDashboard.deploy(
      dAppRegistryAddress,
      feeHandlerAddress,
      treasuryAddress
    );
    await adminDashboard.waitForDeployment();
    adminDashboardAddress = await adminDashboard.getAddress();
    console.log('   AdminDashboard deployed to:', adminDashboardAddress);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log('Network:', network);
  console.log('Deployer:', deployer.address);
  console.log('\nContract Addresses:');
  console.log('  GRIDToken:', gridTokenAddress);
  console.log('  RewardVault:', rewardVaultAddress);
  console.log('  RewardManager:', rewardManagerAddress);
  console.log('  ProofOfUtility:', proofOfUtilityAddress);
  console.log('  FeeHandler:', feeHandlerAddress);
  console.log('  AffiliateManager:', affiliateManagerAddress);
  console.log('  LoyaltyPoints:', loyaltyPointsAddress);
  console.log('  ProfileRegistry:', profileRegistryAddress);
  console.log('  UserProfileDashboard:', userProfileDashboardAddress);
  if (adminDashboardAddress) {
    console.log('  AdminDashboard:', adminDashboardAddress);
  }
  console.log('\n' + '='.repeat(60));

  // Save to file
  const deploymentInfo = {
    network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GRIDToken: gridTokenAddress,
      RewardVault: rewardVaultAddress,
      RewardManager: rewardManagerAddress,
      ProofOfUtility: proofOfUtilityAddress,
      FeeHandler: feeHandlerAddress,
      AffiliateManager: affiliateManagerAddress,
      LoyaltyPoints: loyaltyPointsAddress,
      ProfileRegistry: profileRegistryAddress,
      UserProfileDashboard: userProfileDashboardAddress,
      ...(adminDashboardAddress && { AdminDashboard: adminDashboardAddress }),
    },
  };

  const outputPath = path.join(__dirname, `../deployments/ecosystem-${network}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${outputPath}`);

  console.log('\n✅ Ecosystem contracts deployed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update src/lib/contracts/addresses.ts with the new addresses');
  console.log('2. Verify contracts on block explorer');
  console.log('3. Configure contract parameters (reward rates, fee splits, etc.)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

