/**
 * Setup Default Rewards for All Ecosystem dApps
 * 
 * Configures default reward settings for all deployed dApps.
 * This creates a standard setup that can be used as a template.
 * 
 * Usage:
 *   npx hardhat run scripts/setup-default-rewards.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   DEFAULT_REWARD_RATE - Default reward rate in basis points (default: 100 = 1%)
 *   DEFAULT_USE_GRID - Default to GRID tokens (default: true)
 */

const hre = require('hardhat');

// Default dApp configurations
const DEFAULT_DAPPS = [
  {
    name: 'KASTip',
    contractAddress: '0x962d06f6c11A95CBc02D5f965135368492d37Fd3',
    tokenAddress: '0x58f026dC9985a253620C5ceDE16EC6316E5085C1',
    tokenTicker: 'KAST',
    rewardRate: 100, // 1% of tip amount
    useGRID: true, // Use GRID token (default for all dApps)
  },
  {
    name: 'SimplePayment',
    contractAddress: '0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85',
    rewardRate: 100, // 1%
    useGRID: true, // Use GRID token
  },
  // Add more dApps here as they're deployed
  // {
  //   name: 'Future dApp',
  //   contractAddress: '0x...',
  //   tokenAddress: '0x...',
  //   tokenTicker: 'TICKER',
  //   rewardRate: 100,
  //   useGRID: true, // or false for dApp token
  // },
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Setting up default rewards with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  const defaultRewardRate = process.env.DEFAULT_REWARD_RATE ? parseInt(process.env.DEFAULT_REWARD_RATE) : 100;
  const defaultUseGRID = process.env.DEFAULT_USE_GRID !== 'false';

  console.log('📋 Default Configuration:');
  console.log('   RewardManager:', rewardManagerAddress);
  console.log('   Default Reward Rate:', defaultRewardRate, 'basis points (' + (defaultRewardRate / 100) + '%)');
  console.log('   Default Use GRID:', defaultUseGRID);
  console.log('   dApps to configure:', DEFAULT_DAPPS.length);
  console.log('');

  try {
    const RewardManager = await hre.ethers.getContractFactory('RewardManager');
    const rewardManager = RewardManager.attach(rewardManagerAddress);

    for (let i = 0; i < DEFAULT_DAPPS.length; i++) {
      const dApp = DEFAULT_DAPPS[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Configuring ${dApp.name} (${i + 1}/${DEFAULT_DAPPS.length})`);
      console.log('='.repeat(60));

      // Check current configuration
      const currentRate = await rewardManager.rewardRates(dApp.contractAddress);
      const currentUseGRID = await rewardManager.useGRID(dApp.contractAddress);
      
      const rewardRate = dApp.rewardRate || defaultRewardRate;
      const useGRID = dApp.useGRID !== undefined ? dApp.useGRID : defaultUseGRID;

      // Set reward rate
      if (currentRate.toString() !== rewardRate.toString()) {
        console.log('   Setting reward rate...');
        const setRateTx = await rewardManager.setRewardRate(dApp.contractAddress, rewardRate);
        await setRateTx.wait();
        console.log('   ✅ Reward rate:', rewardRate, 'basis points');
      } else {
        console.log('   ✅ Reward rate already set');
      }

      // Set reward type
      if (currentUseGRID !== useGRID) {
        console.log('   Setting reward type...');
        const setTypeTx = await rewardManager.setRewardType(dApp.contractAddress, useGRID);
        await setTypeTx.wait();
        console.log('   ✅ Reward type:', useGRID ? 'GRID' : dApp.tokenTicker);
      } else {
        console.log('   ✅ Reward type already set');
      }

      // Set dApp token if not using GRID
      if (!useGRID && dApp.tokenAddress) {
        const currentToken = await rewardManager.dAppTokens(dApp.contractAddress);
        if (currentToken.toLowerCase() !== dApp.tokenAddress.toLowerCase()) {
          console.log('   Setting dApp token...');
          const setTokenTx = await rewardManager.setDAppToken(dApp.contractAddress, dApp.tokenAddress);
          await setTokenTx.wait();
          console.log('   ✅ dApp token:', dApp.tokenTicker);
        } else {
          console.log('   ✅ dApp token already set');
        }
      }

      // Verify
      const finalRate = await rewardManager.rewardRates(dApp.contractAddress);
      const finalUseGRID = await rewardManager.useGRID(dApp.contractAddress);
      console.log('\n   📊 Final Configuration:');
      console.log('      Rate:', finalRate.toString(), 'bp');
      console.log('      Type:', finalUseGRID ? 'GRID' : dApp.tokenTicker);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DAPPS CONFIGURED!');
    console.log('='.repeat(60));
    console.log('\n💡 All dApps are now set up with default reward configurations');
    console.log('💡 Users will earn rewards when using these dApps');
    console.log('');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

