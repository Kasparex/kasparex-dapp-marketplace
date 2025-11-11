/**
 * Transfer GRID Tokens to RewardManager
 * 
 * Transfers GRID tokens from the deployer account to RewardManager
 * so that rewards can be distributed to users.
 * 
 * Usage:
 *   # Transfer default amount (10,000 GRID)
 *   npx hardhat run scripts/transfer-grid-to-reward-manager.js --network kasplexL2Testnet
 * 
 *   # Transfer custom amount
 *   AMOUNT=50000 npx hardhat run scripts/transfer-grid-to-reward-manager.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   AMOUNT - Amount of GRID tokens to transfer (default: 10000)
 *   GRID_TOKEN_ADDRESS - GRID token contract address (default: from addresses.ts)
 *   REWARD_MANAGER_ADDRESS - RewardManager contract address (default: from addresses.ts)
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Transferring GRID tokens with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  // Get contract addresses
  const gridTokenAddress = process.env.GRID_TOKEN_ADDRESS || '0x6c4B153eE2Fe3EfcD9CbF5D4A55e058d40Ec86a2';
  const rewardVaultAddress = process.env.REWARD_VAULT_ADDRESS || '0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD';
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  
  // Get transfer amount (default: 10,000 GRID)
  const amount = process.env.AMOUNT ? hre.ethers.parseEther(process.env.AMOUNT) : hre.ethers.parseEther('10000');

  console.log('📋 Configuration:');
  console.log('   GRID Token:', gridTokenAddress);
  console.log('   RewardVault:', rewardVaultAddress);
  console.log('   RewardManager:', rewardManagerAddress);
  console.log('   Transfer Amount:', hre.ethers.formatEther(amount), 'GRID');
  console.log('');

  try {
    const GRIDToken = await hre.ethers.getContractFactory('GRIDToken');
    const gridToken = GRIDToken.attach(gridTokenAddress);
    
    const RewardVault = await hre.ethers.getContractFactory('RewardVault');
    const rewardVault = RewardVault.attach(rewardVaultAddress);

    // Check balances before transfer
    console.log('🔍 Checking balances...');
    const rewardVaultBalance = await gridToken.balanceOf(rewardVaultAddress);
    const rewardManagerBalance = await gridToken.balanceOf(rewardManagerAddress);
    
    console.log('   RewardVault GRID Balance:', hre.ethers.formatEther(rewardVaultBalance), 'GRID');
    console.log('   RewardManager GRID Balance:', hre.ethers.formatEther(rewardManagerBalance), 'GRID');
    console.log('');

    // Check if RewardVault has enough tokens
    if (rewardVaultBalance < amount) {
      console.error('❌ ERROR: Insufficient GRID balance in RewardVault!');
      console.log('   Required:', hre.ethers.formatEther(amount), 'GRID');
      console.log('   Available:', hre.ethers.formatEther(rewardVaultBalance), 'GRID');
      console.log('\n💡 Solution: Reduce transfer amount: AMOUNT=5000 npm run hardhat:transfer:grid');
      process.exit(1);
    }

    // Check if deployer is RewardVault owner
    const rewardVaultOwner = await rewardVault.owner();
    if (rewardVaultOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error('❌ ERROR: Deployer is not RewardVault owner!');
      console.log('   Deployer:', deployer.address);
      console.log('   Owner:', rewardVaultOwner);
      console.log('\n💡 Solution: Use the RewardVault owner account to run this script');
      process.exit(1);
    }

    // Perform transfer from RewardVault to RewardManager
    console.log('1️⃣  Transferring GRID tokens from RewardVault to RewardManager...');
    console.log('   Using RewardVault.emergencyWithdraw()...');
    const withdrawTx = await rewardVault.emergencyWithdraw(gridTokenAddress, rewardManagerAddress, amount);
    console.log('   Transaction hash:', withdrawTx.hash);
    console.log('   Waiting for confirmation...');
    await withdrawTx.wait();
    console.log('   ✅ Transfer confirmed!');

    // Verify balances after transfer
    console.log('\n✅ Verification:');
    const newRewardVaultBalance = await gridToken.balanceOf(rewardVaultAddress);
    const newRewardManagerBalance = await gridToken.balanceOf(rewardManagerAddress);
    
    console.log('   RewardVault GRID Balance:', hre.ethers.formatEther(newRewardVaultBalance), 'GRID');
    console.log('   RewardManager GRID Balance:', hre.ethers.formatEther(newRewardManagerBalance), 'GRID');
    console.log('   Transferred:', hre.ethers.formatEther(amount), 'GRID');

    console.log('\n' + '='.repeat(60));
    console.log('✅ TRANSFER COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   From: RewardVault (' + rewardVaultAddress + ')');
    console.log('   To: RewardManager (' + rewardManagerAddress + ')');
    console.log('   Amount:', hre.ethers.formatEther(amount), 'GRID');
    console.log('   RewardManager Balance:', hre.ethers.formatEther(newRewardManagerBalance), 'GRID');
    console.log('   RewardVault Remaining:', hre.ethers.formatEther(newRewardVaultBalance), 'GRID');
    console.log('\n💡 RewardManager is now ready to distribute GRID rewards!');
    console.log('💡 To use GRID rewards, reconfigure dApps:');
    console.log('   USE_GRID=true npm run hardhat:configure:rewards');
    console.log('');

  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    
    if (error.message.includes('insufficient funds') || error.message.includes('Insufficient balance')) {
      console.log('\n💡 Solution: Check RewardVault balance and reduce transfer amount');
    } else if (error.message.includes('Only owner')) {
      console.log('\n💡 Solution: Use the RewardVault owner account');
    } else if (error.message.includes('transfer amount exceeds')) {
      console.log('\n💡 Solution: Check token balance and reduce transfer amount');
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

