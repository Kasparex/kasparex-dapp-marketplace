/**
 * Configure (wire) rewards on Igra Mainnet (38833) only.
 * Use when contracts are already deployed and you only need to set RewardManager,
 * FeeRouter, LoyaltyPoints wiring and optionally fund RewardManager.
 *
 * Usage:
 *   npx hardhat run scripts/configure-igra-galleon-rewards.js --network igraMainnet
 *
 * Env (all required for wiring):
 *   PRIVATE_KEY - deployer (must be authorized on contracts)
 *   GRID_TREASURY_ADDRESS - receives 5% tGRID
 *   TGRID_ADDRESS, REVENUE_TREE_MANAGER_ADDRESS, FEE_ROUTER_ADDRESS,
 *   REWARD_MANAGER_ADDRESS, LOYALTY_POINTS_ADDRESS, SIMPLE_PAYMENT_ADDRESS
 *   BASE_REWARD_WEI - optional (default 500e18)
 *   FUND_REWARD_MANAGER_WEI - optional tGRID to send to RewardManager
 */

const hre = require('hardhat');

function getFeeOverrides(chainId) {
  if (Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  const required = [
    'GRID_TREASURY_ADDRESS',
    'TGRID_ADDRESS',
    'REVENUE_TREE_MANAGER_ADDRESS',
    'FEE_ROUTER_ADDRESS',
    'REWARD_MANAGER_ADDRESS',
    'LOYALTY_POINTS_ADDRESS',
    'SIMPLE_PAYMENT_ADDRESS',
  ];
  // KREX_TOKEN_ADDRESS optional: if set, LoyaltyPoints tier multiplier is enabled for tGRID + XP
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      console.error(`Missing required env: ${key}`);
      process.exit(1);
    }
  }

  const gridTreasuryAddress = process.env.GRID_TREASURY_ADDRESS.trim();
  const tgridAddress = process.env.TGRID_ADDRESS.trim();
  const feeRouterAddress = process.env.FEE_ROUTER_ADDRESS.trim();
  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS.trim();
  const loyaltyPointsAddress = process.env.LOYALTY_POINTS_ADDRESS.trim();
  const simplePaymentAddress = process.env.SIMPLE_PAYMENT_ADDRESS.trim();

  const overrides = getFeeOverrides(chainId);
  console.log('Configuring rewards on IGRA Galleon Testnet with account:', deployer.address);

  // Wiring
  console.log('\n1. Wiring RewardManager...');
  const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
  await (await rewardManager.setGridTreasury(gridTreasuryAddress, overrides)).wait();
  console.log('   RewardManager: gridTreasury set');
  await (await rewardManager.setAuthorizedRewardCaller(feeRouterAddress, true, overrides)).wait();
  console.log('   RewardManager: FeeRouter authorized');

  console.log('\n2. Wiring FeeRouter...');
  const feeRouter = await hre.ethers.getContractAt('FeeRouter', feeRouterAddress);
  await (await feeRouter.setRewardManager(rewardManagerAddress, overrides)).wait();
  console.log('   FeeRouter: RewardManager set');
  await (await feeRouter.setLoyaltyPoints(loyaltyPointsAddress, overrides)).wait();
  console.log('   FeeRouter: LoyaltyPoints set');
  const baseRewardWei = process.env.BASE_REWARD_WEI ? BigInt(process.env.BASE_REWARD_WEI) : (500n * 10n**18n);
  await (await feeRouter.setBaseReward('dapp-payment', baseRewardWei, overrides)).wait();
  console.log('   FeeRouter: baseReward(dapp-payment) set');
  await (await feeRouter.setAuthorizedDApp(simplePaymentAddress, true, overrides)).wait();
  console.log('   FeeRouter: SimplePayment authorized');

  console.log('\n3. Wiring LoyaltyPoints...');
  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  await (await loyaltyPoints.setAuthorizedCaller(feeRouterAddress, true, overrides)).wait();
  console.log('   LoyaltyPoints: FeeRouter authorized');
  const krexTokenAddress = process.env.KREX_TOKEN_ADDRESS?.trim();
  if (krexTokenAddress) {
    await (await loyaltyPoints.setKREXToken(krexTokenAddress, overrides)).wait();
    console.log('   LoyaltyPoints: KREX token set (tier multiplier active)');
  }
  if (typeof loyaltyPoints.setPointsPer1iKAS === 'function') {
    await (await loyaltyPoints.setPointsPer1iKAS('dapp-payment', 100, overrides)).wait();
    console.log('   LoyaltyPoints: pointsPer1iKAS(dapp-payment)=100 (XP scales by payment amount)');
  }

  // Optional: fund RewardManager
  const fundWei = process.env.FUND_REWARD_MANAGER_WEI ? BigInt(process.env.FUND_REWARD_MANAGER_WEI) : 0n;
  if (fundWei > 0n) {
    console.log('\n4. Funding RewardManager with tGRID...');
    const tgrid = await hre.ethers.getContractAt('tGRID', tgridAddress);
    const balance = await tgrid.balanceOf(deployer.address);
    const toTransfer = balance < fundWei ? balance : fundWei;
    if (toTransfer > 0n) {
      await (await tgrid.transfer(rewardManagerAddress, toTransfer, overrides)).wait();
      console.log('   Transferred', hre.ethers.formatEther(toTransfer), 'tGRID to RewardManager');
    } else {
      console.log('   Deployer has no tGRID. Fund RewardManager manually:', rewardManagerAddress);
    }
  } else {
    console.log('\n4. Skipping fund (set FUND_REWARD_MANAGER_WEI to fund).');
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
