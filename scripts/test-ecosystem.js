/**
 * Test Ecosystem Contracts
 * Quick test script to verify all contracts are working
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Testing with account:', deployer.address);
  console.log('Account balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString(), 'wei\n');

  // Contract addresses from deployment
  const addresses = {
    GRIDToken: "0x6c4B153eE2Fe3EfcD9CbF5D4A55e058d40Ec86a2",
    RewardVault: "0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD",
    RewardManager: "0x2044FEb08a4Cb14Ff736b00f947E017044da50E6",
    ProofOfUtility: "0x1aB97D324Ea68FF7c51A91689564377e433A77f6",
    FeeHandler: "0xedAb230E5613B07E72D454a843162E207d451A15",
    AffiliateManager: "0x374fa97A64A43c4fC0AD57dBf6EAE7Ee12924B04",
    LoyaltyPoints: "0x0Bd1DF89A6747e8570992448337647447a9Ad909",
    ProfileRegistry: "0x6fa56cC4a1Fc468867a91b94615d6E83D34f044B",
    UserProfileDashboard: "0x7335913B5dBF5934D98Cd9814A2Af7691541ae43",
    AdminDashboard: "0x96c6Bab5EB4633eE33D07070E8d59C5bf3aD6502",
  };

  console.log('='.repeat(60));
  console.log('ECOSYSTEM CONTRACTS TEST');
  console.log('='.repeat(60) + '\n');

  // Test 1: GRIDToken
  console.log('1. Testing GRIDToken...');
  try {
    const GRIDToken = await hre.ethers.getContractAt('GRIDToken', addresses.GRIDToken);
    const totalSupply = await GRIDToken.totalSupply();
    const name = await GRIDToken.name();
    const symbol = await GRIDToken.symbol();
    console.log(`   ✅ Name: ${name}`);
    console.log(`   ✅ Symbol: ${symbol}`);
    console.log(`   ✅ Total Supply: ${totalSupply.toString()}`);
    console.log(`   ✅ Expected: 10,000,000,000 (10B)\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: RewardVault
  console.log('2. Testing RewardVault...');
  try {
    const RewardVault = await hre.ethers.getContractAt('RewardVault', addresses.RewardVault);
    const rewardManager = await RewardVault.rewardManager();
    console.log(`   ✅ RewardManager: ${rewardManager}`);
    console.log(`   ✅ Matches RewardManager: ${rewardManager === addresses.RewardManager}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: RewardManager
  console.log('3. Testing RewardManager...');
  try {
    const RewardManager = await hre.ethers.getContractAt('RewardManager', addresses.RewardManager);
    const proofOfUtility = await RewardManager.proofOfUtility();
    const gridToken = await RewardManager.gridToken();
    console.log(`   ✅ ProofOfUtility: ${proofOfUtility}`);
    console.log(`   ✅ GRIDToken: ${gridToken}`);
    console.log(`   ✅ Matches ProofOfUtility: ${proofOfUtility === addresses.ProofOfUtility}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 4: ProofOfUtility
  console.log('4. Testing ProofOfUtility...');
  try {
    const ProofOfUtility = await hre.ethers.getContractAt('ProofOfUtility', addresses.ProofOfUtility);
    const rewardManager = await ProofOfUtility.rewardManager();
    const totalEvents = await ProofOfUtility.totalEvents();
    console.log(`   ✅ RewardManager: ${rewardManager}`);
    console.log(`   ✅ Total Events: ${totalEvents.toString()}`);
    console.log(`   ✅ Matches RewardManager: ${rewardManager === addresses.RewardManager}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 5: FeeHandler
  console.log('5. Testing FeeHandler...');
  try {
    const FeeHandler = await hre.ethers.getContractAt('FeeHandler', addresses.FeeHandler);
    const kasparexTreasury = await FeeHandler.kasparexTreasury();
    const projectTreasury = await FeeHandler.projectTreasury();
    const totalFees = await FeeHandler.totalFeesCollected();
    console.log(`   ✅ Kasparex Treasury: ${kasparexTreasury}`);
    console.log(`   ✅ Project Treasury: ${projectTreasury}`);
    console.log(`   ✅ Total Fees Collected: ${totalFees.toString()} wei\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 6: AffiliateManager
  console.log('6. Testing AffiliateManager...');
  try {
    const AffiliateManager = await hre.ethers.getContractAt('AffiliateManager', addresses.AffiliateManager);
    const owner = await AffiliateManager.owner();
    console.log(`   ✅ Owner: ${owner}`);
    console.log(`   ✅ Contract deployed and accessible\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 7: LoyaltyPoints
  console.log('7. Testing LoyaltyPoints...');
  try {
    const LoyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', addresses.LoyaltyPoints);
    const owner = await LoyaltyPoints.owner();
    const streakInterval = await LoyaltyPoints.streakInterval();
    const days = Number(streakInterval) / 86400;
    console.log(`   ✅ Owner: ${owner}`);
    console.log(`   ✅ Streak Interval: ${streakInterval.toString()} seconds (${days} days)\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 8: ProfileRegistry
  console.log('8. Testing ProfileRegistry...');
  try {
    const ProfileRegistry = await hre.ethers.getContractAt('ProfileRegistry', addresses.ProfileRegistry);
    const owner = await ProfileRegistry.owner();
    console.log(`   ✅ Owner: ${owner}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 9: UserProfileDashboard
  console.log('9. Testing UserProfileDashboard...');
  try {
    const UserProfileDashboard = await hre.ethers.getContractAt('UserProfileDashboard', addresses.UserProfileDashboard);
    const profileRegistry = await UserProfileDashboard.profileRegistry();
    console.log(`   ✅ ProfileRegistry: ${profileRegistry}`);
    console.log(`   ✅ Matches ProfileRegistry: ${profileRegistry === addresses.ProfileRegistry}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 10: AdminDashboard
  console.log('10. Testing AdminDashboard...');
  try {
    const AdminDashboard = await hre.ethers.getContractAt('AdminDashboard', addresses.AdminDashboard);
    const dAppRegistry = await AdminDashboard.dAppRegistry();
    const feeHandler = await AdminDashboard.feeHandler();
    const treasury = await AdminDashboard.treasury();
    console.log(`   ✅ DAppRegistry: ${dAppRegistry}`);
    console.log(`   ✅ FeeHandler: ${feeHandler}`);
    console.log(`   ✅ Treasury: ${treasury}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('='.repeat(60));
  console.log('✅ All contract tests completed!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

