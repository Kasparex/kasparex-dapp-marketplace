/**
 * Repoint RewardManager, RevenueTreeManager, and SimplePayment to the new FeeRouter.
 * Run after upgrade-fee-router-loyalty-igra.js if it timed out after step 4.
 *
 * Usage:
 *   NEW_FEE_ROUTER=0x374fa97A64A43c4fC0AD57dBf6EAE7Ee12924B04 npx hardhat run scripts/repoint-fee-router-igra.js --network igraGalleonTestnet
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

function loadDeployment() {
  const outDir = path.join(__dirname, '..', 'deployments');
  const files = fs.readdirSync(outDir).filter((f) => f.startsWith('igra-galleon-testnet-') && f.endsWith('.json'));
  const latest = files.sort().reverse()[0];
  return JSON.parse(fs.readFileSync(path.join(outDir, latest), 'utf8'));
}

async function main() {
  const newFeeRouterAddress = process.env.NEW_FEE_ROUTER?.trim();
  if (!newFeeRouterAddress) {
    console.error('Set NEW_FEE_ROUTER env to the new FeeRouter address.');
    process.exit(1);
  }
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  if (Number(chainId) !== 38836) {
    console.error('This script is for IGRA Galleon Testnet (38836) only.');
    process.exit(1);
  }
  const overrides = getFeeOverrides(chainId);
  const dep = loadDeployment();
  const oldFeeRouterAddress = dep.FeeRouter || dep.feeRouter;
  const rewardManagerAddress = dep.RewardManager || dep.rewardManager;
  const revenueTreeManagerAddress = dep.RevenueTreeManager || dep.revenueTreeManager;
  const simplePaymentAddress = dep.SimplePayment || dep.simplePayment;

  console.log('Repointing to new FeeRouter:', newFeeRouterAddress);
  console.log('Old FeeRouter:', oldFeeRouterAddress);

  const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
  await (await rewardManager.setAuthorizedRewardCaller(oldFeeRouterAddress, false, overrides)).wait();
  await (await rewardManager.setAuthorizedRewardCaller(newFeeRouterAddress, true, overrides)).wait();
  console.log('RewardManager: old revoked, new authorized');

  const rtm = await hre.ethers.getContractAt('RevenueTreeManager', revenueTreeManagerAddress);
  await (await rtm.setAuthorizedCaller(oldFeeRouterAddress, false, overrides)).wait();
  await (await rtm.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
  console.log('RevenueTreeManager: old revoked, new authorized');

  const simplePayment = await hre.ethers.getContractAt('SimplePayment', simplePaymentAddress);
  await (await simplePayment.setFeeRouter(newFeeRouterAddress, overrides)).wait();
  console.log('SimplePayment: FeeRouter set');

  const outDir = path.join(__dirname, '..', 'deployments');
  const files = fs.readdirSync(outDir).filter((f) => f.startsWith('igra-galleon-testnet-') && f.endsWith('.json'));
  const deploymentPath = path.join(outDir, files.sort().reverse()[0]);
  const updated = { ...dep, FeeRouter: newFeeRouterAddress, upgradedAt: new Date().toISOString() };
  fs.writeFileSync(deploymentPath, JSON.stringify(updated, null, 2));
  console.log('Updated', deploymentPath);
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
