/**
 * Configure RewardManager for QuizToEarn
 * 
 * Sets up standard default reward settings:
 * - Reward Rate: 100 basis points (1% of reward amount)
 * - Reward Type: GRID token (default)
 * 
 * Usage:
 *   npx hardhat run scripts/configure-quiz-to-earn-rewards.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   QUIZ_TO_EARN_ADDRESS - QuizToEarn contract address (default: deployed address)
 *   REWARD_MANAGER_ADDRESS - RewardManager address (default: from addresses.ts)
 *   REWARD_RATE - Reward rate in basis points (default: 100 = 1%)
 *   USE_GRID - Use GRID token (default: true)
 *   DAPP_TOKEN_ADDRESS - dApp token address (if USE_GRID=false)
 */

const hre = require('hardhat');

// Standard default settings
const DEFAULT_REWARD_RATE = 100; // 1% (100 basis points)
const DEFAULT_USE_GRID = true; // Use GRID token by default

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\nđźŽ Configuring RewardManager for QuizToEarn...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgra = network === 'igraMainnet';
  
  // Default addresses (Kasplex L2 Testnet)
  const defaultRewardManager = '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  const defaultQuizToEarn = '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05';
  
  // Igra Caravel Testnet addresses (update when available)
  const igraRewardManager = process.env.REWARD_MANAGER_ADDRESS_IGRA || '';
  const igraQuizToEarn = process.env.QUIZ_TO_EARN_ADDRESS_IGRA || '';
  
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || (isIgra ? igraRewardManager : defaultRewardManager);
  const quizToEarnAddress = process.env.QUIZ_TO_EARN_ADDRESS || (isIgra ? igraQuizToEarn : defaultQuizToEarn);
  
  // Configuration
  const rewardRate = process.env.REWARD_RATE ? parseInt(process.env.REWARD_RATE) : DEFAULT_REWARD_RATE;
  const useGRID = process.env.USE_GRID !== undefined ? process.env.USE_GRID === 'true' : DEFAULT_USE_GRID;
  const dAppTokenAddress = process.env.DAPP_TOKEN_ADDRESS || '';
  
  // Validate addresses
  if (!rewardManagerAddress || !quizToEarnAddress) {
    console.error('\nâťŚ ERROR: Missing required contract addresses\n');
    console.log('Required:');
    console.log('   REWARD_MANAGER_ADDRESS');
    console.log('   QUIZ_TO_EARN_ADDRESS\n');
    process.exit(1);
  }
  
  console.log(`đź“‹ Network: ${network}`);
  console.log(`   Chain ID: ${isIgra ? '38833' : '167012'}`);
  console.log(`   RewardManager: ${rewardManagerAddress}`);
  console.log(`   QuizToEarn: ${quizToEarnAddress}`);
  console.log(`   Reward Rate: ${rewardRate} basis points (${rewardRate / 100}%)`);
  console.log(`   Reward Type: ${useGRID ? 'GRID Token' : 'dApp Token'}`);
  if (!useGRID && dAppTokenAddress) {
    console.log(`   dApp Token: ${dAppTokenAddress}`);
  }
  console.log('');

  try {
    const RewardManager = await hre.ethers.getContractFactory('RewardManager');
    const rewardManager = RewardManager.attach(rewardManagerAddress);

    // Check current configuration
    console.log('đź”Ť Checking current configuration...');
    const currentRate = await rewardManager.rewardRates(quizToEarnAddress);
    const currentUseGRID = await rewardManager.useGRID(quizToEarnAddress);
    const currentToken = await rewardManager.dAppTokens(quizToEarnAddress);
    
    console.log('   Current Reward Rate:', currentRate.toString(), 'basis points');
    console.log('   Current Use GRID:', currentUseGRID);
    if (!currentUseGRID && currentToken !== '0x0000000000000000000000000000000000000000') {
      console.log('   Current dApp Token:', currentToken);
    }
    console.log('');

    // Set reward rate
    if (currentRate.toString() !== rewardRate.toString()) {
      console.log('1ď¸ŹâŁ  Setting reward rate...');
      const setRateTx = await rewardManager.setRewardRate(quizToEarnAddress, rewardRate);
      await setRateTx.wait();
      console.log('   âś… Reward rate set to', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
    } else {
      console.log('1ď¸ŹâŁ  Reward rate already set correctly');
    }

    // Set reward type
    if (currentUseGRID !== useGRID) {
      console.log('\n2ď¸ŹâŁ  Setting reward type...');
      const setTypeTx = await rewardManager.setRewardType(quizToEarnAddress, useGRID);
      await setTypeTx.wait();
      console.log('   âś… Reward type set to:', useGRID ? 'GRID Token' : 'dApp Token');
    } else {
      console.log('\n2ď¸ŹâŁ  Reward type already set correctly');
    }

    // Set dApp token if not using GRID
    if (!useGRID) {
      if (!dAppTokenAddress) {
        console.error('\nâťŚ ERROR: DAPP_TOKEN_ADDRESS required when USE_GRID=false\n');
        process.exit(1);
      }
      
      if (currentToken.toLowerCase() !== dAppTokenAddress.toLowerCase()) {
        console.log('\n3ď¸ŹâŁ  Setting dApp token...');
        const setTokenTx = await rewardManager.setDAppToken(quizToEarnAddress, dAppTokenAddress);
        await setTokenTx.wait();
        console.log('   âś… dApp token set to:', dAppTokenAddress);
      } else {
        console.log('\n3ď¸ŹâŁ  dApp token already set correctly');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('âś… CONFIGURATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nđź“¦ QuizToEarn Reward Configuration:');
    console.log('   Contract:', quizToEarnAddress);
    console.log('   Reward Rate:', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
    console.log('   Reward Type:', useGRID ? 'GRID Token' : 'dApp Token');
    if (!useGRID && dAppTokenAddress) {
      console.log('   Token Address:', dAppTokenAddress);
    }
    console.log('\nđź’ˇ Note:');
    console.log('   - Rewards are distributed automatically when users answer correctly');
    console.log('   - Reward amount = question reward amount x reward rate');
    console.log('   - Example: 0.01 KAS reward x 1% rate = 0.0001 KAS worth of tokens');
    if (useGRID) {
      console.log('   - Ensure RewardManager has sufficient GRID tokens');
    }
    console.log('');

  } catch (error) {
    console.error('\nâťŚ Configuration failed:', error.message);
    if (error.message.includes('onlyOwner')) {
      console.error('   âš ď¸Ź  Make sure you are using the RewardManager owner account');
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

