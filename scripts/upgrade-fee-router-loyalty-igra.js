/**
 * Upgrade FeeRouter and LoyaltyPoints on IGRA Galleon Testnet (38836).
 * Deploys new implementations (with tier multiplier for tGRID + setKREXToken for XP),
 * rewires RewardManager, RevenueTreeManager, SimplePayment, and persists new addresses.
 *
 * Usage:
 *   npx hardhat run scripts/upgrade-fee-router-loyalty-igra.js --network igraGalleonTestnet
 *
 * Env: PRIVATE_KEY (deployer must own FeeRouter, LoyaltyPoints, RewardManager, RevenueTreeManager, SimplePayment)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function getFeeOverrides(chainId) {
  if (Number(chainId) === 38836 || Number(chainId) === 38837 || Number(chainId) === 19416) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function deployNoEstimate(factory, args, overrides) {
  const txReq = await factory.getDeployTransaction(...args);
  if (!txReq.gasLimit) txReq.gasLimit = 8_000_000n;
  const signer = factory.runner;
  const sent = await signer.sendTransaction({ ...txReq, ...overrides });
  console.log('   Tx hash:', sent.hash);
  const receipt = await Promise.race([
    sent.wait(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Transaction confirmation timeout (90s)')), 90000)),
  ]);
  if (!receipt || receipt.status !== 1) throw new Error('Deployment transaction failed');
  const address = receipt.contractAddress;
  if (!address) throw new Error('No contractAddress in receipt');
  return address;
}

function loadDeployment() {
  const outDir = path.join(__dirname, '..', 'deployments');
  const files = fs.readdirSync(outDir).filter((f) => f.startsWith('igra-galleon-testnet-') && f.endsWith('.json'));
  if (files.length === 0) throw new Error('No igra-galleon-testnet-*.json found in deployments/');
  const latest = files.sort().reverse()[0];
  const data = JSON.parse(fs.readFileSync(path.join(outDir, latest), 'utf8'));
  return { path: path.join(outDir, latest), data, name: latest };
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  if (Number(chainId) !== 38836) {
    console.error('This script is for IGRA Galleon Testnet (chainId 38836) only.');
    process.exit(1);
  }

  const overrides = getFeeOverrides(chainId);
  const { path: deploymentPath, data: dep, name: deploymentName } = loadDeployment();

  const oldFeeRouterAddress = dep.FeeRouter || dep.feeRouter;
  const oldLoyaltyPointsAddress = dep.LoyaltyPoints || dep.loyaltyPoints;
  const revenueTreeManagerAddress = dep.RevenueTreeManager || dep.revenueTreeManager;
  const feeCollectorAddress = dep.FeeCollector || dep.feeCollector;
  const rewardManagerAddress = dep.RewardManager || dep.rewardManager;
  const simplePaymentAddress = dep.SimplePayment || dep.simplePayment;

  if (!oldFeeRouterAddress || !oldLoyaltyPointsAddress || !revenueTreeManagerAddress || !feeCollectorAddress || !rewardManagerAddress || !simplePaymentAddress) {
    console.error('Deployment JSON missing required addresses.');
    process.exit(1);
  }

  console.log('Upgrading FeeRouter and LoyaltyPoints on IGRA Galleon Testnet');
  console.log('Deployer:', deployer.address);
  console.log('Deployment file:', deploymentName);
  console.log('Old FeeRouter:', oldFeeRouterAddress);
  console.log('Old LoyaltyPoints:', oldLoyaltyPointsAddress);

  const oldFeeRouter = await hre.ethers.getContractAt('FeeRouter', oldFeeRouterAddress);
  const treeBps = await oldFeeRouter.treeBps();
  console.log('treeBps:', treeBps.toString());

  const rtm = await hre.ethers.getContractAt('RevenueTreeManager', revenueTreeManagerAddress);
  const krexTokenAddress = await rtm.krexToken();
  if (!krexTokenAddress || krexTokenAddress === hre.ethers.ZeroAddress) {
    console.error('RevenueTreeManager has no KREX token set. Set KREX_TOKEN_ADDRESS in env and use configure script, or deploy with tKREX.');
    process.exit(1);
  }
  console.log('tKREX (from RTM):', krexTokenAddress);

  console.log('\n1. Deploying new LoyaltyPoints...');
  const LoyaltyPoints = await hre.ethers.getContractFactory('LoyaltyPoints');
  const newLoyaltyPointsAddress = await deployNoEstimate(LoyaltyPoints, [], overrides);
  console.log('   New LoyaltyPoints at:', newLoyaltyPointsAddress);

  console.log('\n2. Deploying new FeeRouter...');
  const FeeRouter = await hre.ethers.getContractFactory('FeeRouter');
  const newFeeRouterAddress = await deployNoEstimate(FeeRouter, [revenueTreeManagerAddress, feeCollectorAddress, treeBps], overrides);
  console.log('   New FeeRouter at:', newFeeRouterAddress);

  console.log('\n3. Wiring new FeeRouter...');
  const newFeeRouter = await hre.ethers.getContractAt('FeeRouter', newFeeRouterAddress);
  await (await newFeeRouter.setRewardManager(rewardManagerAddress, overrides)).wait();
  await (await newFeeRouter.setLoyaltyPoints(newLoyaltyPointsAddress, overrides)).wait();
  const baseRewardWei = process.env.BASE_REWARD_WEI ? BigInt(process.env.BASE_REWARD_WEI) : 500n * 10n ** 18n;
  await (await newFeeRouter.setBaseReward('dapp-payment', baseRewardWei, overrides)).wait();
  await (await newFeeRouter.setAuthorizedDApp(simplePaymentAddress, true, overrides)).wait();
  console.log('   RewardManager, LoyaltyPoints, baseReward, SimplePayment authorized');

  console.log('\n4. Wiring new LoyaltyPoints...');
  const newLoyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', newLoyaltyPointsAddress);
  await (await newLoyaltyPoints.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
  await (await newLoyaltyPoints.setKREXToken(krexTokenAddress, overrides)).wait();
  console.log('   FeeRouter authorized, KREX token set (tier multiplier active)');

  console.log('\n5. Replacing FeeRouter in RewardManager and RevenueTreeManager...');
  const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
  await (await rewardManager.setAuthorizedRewardCaller(oldFeeRouterAddress, false, overrides)).wait();
  await (await rewardManager.setAuthorizedRewardCaller(newFeeRouterAddress, true, overrides)).wait();
  await (await rtm.setAuthorizedCaller(oldFeeRouterAddress, false, overrides)).wait();
  await (await rtm.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
  console.log('   Old FeeRouter revoked; new FeeRouter authorized');

  console.log('\n6. Pointing SimplePayment to new FeeRouter...');
  const simplePayment = await hre.ethers.getContractAt('SimplePayment', simplePaymentAddress);
  await (await simplePayment.setFeeRouter(newFeeRouterAddress, overrides)).wait();
  console.log('   SimplePayment.setFeeRouter(new FeeRouter) done');

  const updated = {
    ...dep,
    FeeRouter: newFeeRouterAddress,
    LoyaltyPoints: newLoyaltyPointsAddress,
    upgradedAt: new Date().toISOString(),
    previousFeeRouter: oldFeeRouterAddress,
    previousLoyaltyPoints: oldLoyaltyPointsAddress,
  };
  fs.writeFileSync(deploymentPath, JSON.stringify(updated, null, 2));
  console.log('\nDeployment file updated:', deploymentPath);

  console.log('\n--- Set these in .env and Vercel ---');
  console.log('NEXT_PUBLIC_FEE_ROUTER_ADDRESS_IGRA_GALLEON_TESTNET=' + newFeeRouterAddress);
  console.log('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS_IGRA_GALLEON_TESTNET=' + newLoyaltyPointsAddress);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
