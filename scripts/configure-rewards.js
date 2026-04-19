/**
 * Configure Rewards for a dApp
 * 
 * Sets up RewardManager with reward rates and token configuration for any dApp.
 * Can be used for KASTip or any future dApp.
 * 
 * Usage:
 *   # For KASTip (default)
 *   npx hardhat run scripts/configure-rewards.js --network kasplexL2Testnet
 * 
 *   # For a custom dApp
 *   DAPP_CONTRACT_ADDRESS=0x... \
 *   REWARD_RATE=100 \
 *   USE_GRID=true \
 *   DAPP_TOKEN_ADDRESS=0x... \
 *   npx hardhat run scripts/configure-rewards.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   DAPP_CONTRACT_ADDRESS - dApp contract address (default: KASTip)
 *   REWARD_RATE - Reward rate in basis points (100 = 1%, default: 100)
 *   USE_GRID - Use GRID token (true) or dApp token (false, default: true)
 *   DAPP_TOKEN_ADDRESS - dApp token address (required if USE_GRID=false)
 *   GRID_TOKEN_ADDRESS - Bridged GRID token (required if USE_GRID=true)
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Configuring rewards with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  // Get contract addresses
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  
  // Get dApp configuration
  const dAppContractAddress = process.env.DAPP_CONTRACT_ADDRESS || '0x962d06f6c11A95CBc02D5f965135368492d37Fd3'; // KASTip
  const rewardRate = process.env.REWARD_RATE ? parseInt(process.env.REWARD_RATE) : 100; // 1% default
  const useGRID = process.env.USE_GRID !== 'false'; // Default to true
  const dAppTokenAddress = process.env.DAPP_TOKEN_ADDRESS || '0x58f026dC9985a253620C5ceDE16EC6316E5085C1'; // KAST token

  console.log('📋 Configuration:');
  console.log('   RewardManager:', rewardManagerAddress);
  console.log('   dApp Contract:', dAppContractAddress);
  console.log('   Reward Rate:', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
  console.log('   Use GRID Token:', useGRID);
  if (!useGRID) {
    console.log('   dApp Token Address:', dAppTokenAddress);
  }
  console.log('');

  try {
    const RewardManager = await hre.ethers.getContractFactory('RewardManager');
    const rewardManager = RewardManager.attach(rewardManagerAddress);

    // Check current configuration
    console.log('🔍 Checking current configuration...');
    const currentRate = await rewardManager.rewardRates(dAppContractAddress);
    const currentUseGRID = await rewardManager.useGRID(dAppContractAddress);
    const currentToken = await rewardManager.dAppTokens(dAppContractAddress);
    
    console.log('   Current Reward Rate:', currentRate.toString(), 'basis points');
    console.log('   Current Use GRID:', currentUseGRID);
    if (!currentUseGRID && currentToken !== '0x0000000000000000000000000000000000000000') {
      console.log('   Current dApp Token:', currentToken);
    }
    console.log('');

    // Set reward rate
    if (currentRate.toString() !== rewardRate.toString()) {
      console.log('1️⃣  Setting reward rate...');
      const setRateTx = await rewardManager.setRewardRate(dAppContractAddress, rewardRate);
      await setRateTx.wait();
      console.log('   ✅ Reward rate set to', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
    } else {
      console.log('1️⃣  Reward rate already set correctly');
    }

    // Set reward type
    if (currentUseGRID !== useGRID) {
      console.log('\n2️⃣  Setting reward type...');
      const setTypeTx = await rewardManager.setRewardType(dAppContractAddress, useGRID);
      await setTypeTx.wait();
      console.log('   ✅ Reward type set to:', useGRID ? 'GRID Token' : 'dApp Token');
    } else {
      console.log('\n2️⃣  Reward type already set correctly');
    }

    // Set dApp token if not using GRID
    if (!useGRID) {
      if (currentToken.toLowerCase() !== dAppTokenAddress.toLowerCase()) {
        console.log('\n3️⃣  Setting dApp token...');
        const setTokenTx = await rewardManager.setDAppToken(dAppContractAddress, dAppTokenAddress);
        await setTokenTx.wait();
        console.log('   ✅ dApp token set to:', dAppTokenAddress);
      } else {
        console.log('\n3️⃣  dApp token already set correctly');
      }
    }

    // Verify configuration
    console.log('\n✅ Verification:');
    const finalRate = await rewardManager.rewardRates(dAppContractAddress);
    const finalUseGRID = await rewardManager.useGRID(dAppContractAddress);
    const finalToken = await rewardManager.dAppTokens(dAppContractAddress);
    
    console.log('   Reward Rate:', finalRate.toString(), 'basis points');
    console.log('   Use GRID:', finalUseGRID);
    if (!finalUseGRID && finalToken !== '0x0000000000000000000000000000000000000000') {
      console.log('   dApp Token:', finalToken);
    }

    // Check token availability
    if (useGRID) {
      const gridTokenAddress = process.env.GRID_TOKEN_ADDRESS || '';
      if (!gridTokenAddress) {
        console.error('\n❌ Set GRID_TOKEN_ADDRESS to the bridged canonical GRID on this network when USE_GRID=true.');
        process.exit(1);
      }
      console.log('\n💰 Checking GRID token availability...');
      const GRIDToken = await hre.ethers.getContractFactory('GRIDToken');
      const gridToken = GRIDToken.attach(gridTokenAddress);
      const rewardManagerBalance = await gridToken.balanceOf(rewardManagerAddress);
      console.log('   RewardManager GRID Balance:', hre.ethers.formatEther(rewardManagerBalance), 'GRID');
      
      if (rewardManagerBalance === 0n) {
        console.log('   ⚠️  WARNING: RewardManager has no GRID tokens!');
        console.log('   💡 Transfer GRID tokens to RewardManager to enable rewards');
        console.log('   💡 Or use dApp token instead (set USE_GRID=false)');
      }
    } else {
      console.log('\n💰 Checking dApp token availability...');
      const DAppToken = await hre.ethers.getContractFactory('DAppToken');
      const dAppToken = DAppToken.attach(dAppTokenAddress);
      const maxSupply = await dAppToken.MAX_SUPPLY();
      const totalSupply = await dAppToken.totalSupply();
      const remainingSupply = await dAppToken.getRemainingSupply();
      
      console.log('   Max Supply:', hre.ethers.formatEther(maxSupply), 'tokens');
      console.log('   Total Supply:', hre.ethers.formatEther(totalSupply), 'tokens');
      console.log('   Remaining Supply:', hre.ethers.formatEther(remainingSupply), 'tokens');
      
      if (remainingSupply === 0n) {
        console.log('   ⚠️  WARNING: No remaining supply for minting!');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ REWARD CONFIGURATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   dApp:', dAppContractAddress);
    console.log('   Reward Rate:', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
    console.log('   Reward Type:', useGRID ? 'GRID Token' : 'dApp Token');
    if (!useGRID) {
      console.log('   Token Address:', dAppTokenAddress);
    }
    console.log('\n💡 Users will now earn rewards when using this dApp!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    
    if (error.message.includes('Only owner')) {
      console.log('\n💡 Solution: You need to use the RewardManager owner account');
    } else if (error.message.includes('Invalid')) {
      console.log('\n💡 Solution: Check that all addresses are correct');
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

