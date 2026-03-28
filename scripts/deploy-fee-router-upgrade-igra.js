/**
 * Deploy upgraded FeeRouter (with setTreeBpsByType) on IGRA Galleon Testnet.
 * Repoints RevenueTreeManager, RewardManager, LoyaltyPoints, SimplePayment, DonationEscrow, GenesisBadge to new FeeRouter.
 * Does NOT deploy new LoyaltyPoints or SimplePayment.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-fee-router-upgrade-igra.js --network igraMainnet
 *
 * Env: PRIVATE_KEY (must own FeeRouter, RevenueTreeManager, RewardManager, LoyaltyPoints, SimplePayment, DonationEscrow, GenesisBadge)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_ROUTER_38836 = '0x37c98699eEe02Cb89da64C45B8c970174218A745';

function getOverrides(chainId) {
  if (Number(chainId) === 38833) {
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

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  const overrides = getOverrides(chainId);
  const deploymentsDir = path.join(__dirname, '..', 'deployments');

  const mainDepPath = path.join(deploymentsDir, 'igra-galleon-testnet-2026-02-20.json');
  const mainDep = JSON.parse(fs.readFileSync(mainDepPath, 'utf8'));
  let donationDep = {};
  try {
    donationDep = JSON.parse(fs.readFileSync(path.join(deploymentsDir, 'donation-escrow-igra-galleon-testnet.json'), 'utf8'));
  } catch (_) {}
  let genesisDep = {};
  try {
    genesisDep = JSON.parse(fs.readFileSync(path.join(deploymentsDir, 'genesis-badge-igra-galleon-testnet.json'), 'utf8'));
  } catch (_) {}

  const oldFeeRouterAddress = (process.env.OLD_FEE_ROUTER || mainDep.FeeRouter || FEE_ROUTER_38836).trim();
  const revenueTreeManagerAddress = mainDep.RevenueTreeManager || mainDep.revenueTreeManager;
  const feeCollectorAddress = mainDep.FeeCollector || mainDep.feeCollector;
  const rewardManagerAddress = mainDep.RewardManager || mainDep.rewardManager;
  const loyaltyPointsAddress = mainDep.LoyaltyPoints || mainDep.loyaltyPoints;
  const simplePaymentAddress = mainDep.SimplePayment || mainDep.simplePayment;
  const donationEscrowAddress = donationDep.DonationEscrow;
  const genesisBadgeAddress = genesisDep.GenesisBadge;

  if (!revenueTreeManagerAddress || !feeCollectorAddress || !rewardManagerAddress || !loyaltyPointsAddress || !simplePaymentAddress) {
    console.error('Deployment JSON missing required addresses. Need RevenueTreeManager, FeeCollector, RewardManager, LoyaltyPoints, SimplePayment.');
    process.exit(1);
  }

  const useExistingNew = process.env.NEW_FEE_ROUTER?.trim();
  let newFeeRouterAddress;

  console.log('Deploy upgraded FeeRouter on IGRA Galleon Testnet');
  console.log('Deployer:', deployer.address);
  console.log('Old FeeRouter:', oldFeeRouterAddress);

  const oldFeeRouter = await hre.ethers.getContractAt('FeeRouter', oldFeeRouterAddress);
  const treeBps = await oldFeeRouter.treeBps();
  const baseRewardDappPayment = await oldFeeRouter.baseRewardWei('dapp-payment');
  console.log('treeBps:', treeBps.toString());
  console.log('baseRewardWei(dapp-payment):', baseRewardDappPayment.toString());

  if (useExistingNew) {
    newFeeRouterAddress = useExistingNew;
    console.log('\n1. Using existing new FeeRouter (NEW_FEE_ROUTER):', newFeeRouterAddress);
  } else {
    console.log('\n1. Deploying new FeeRouter (with setTreeBpsByType)...');
    const FeeRouter = await hre.ethers.getContractFactory('FeeRouter');
    newFeeRouterAddress = await deployNoEstimate(FeeRouter, [revenueTreeManagerAddress, feeCollectorAddress, treeBps], overrides);
    console.log('   New FeeRouter at:', newFeeRouterAddress);
  }

  const newFeeRouter = await hre.ethers.getContractAt('FeeRouter', newFeeRouterAddress);

  if (!useExistingNew) {
    console.log('\n2. Wiring new FeeRouter...');
    await (await newFeeRouter.setRewardManager(rewardManagerAddress, overrides)).wait();
    await (await newFeeRouter.setLoyaltyPoints(loyaltyPointsAddress, overrides)).wait();
    if (baseRewardDappPayment > 0n) {
      await (await newFeeRouter.setBaseReward('dapp-payment', baseRewardDappPayment, overrides)).wait();
    }
    await (await newFeeRouter.setAuthorizedDApp(simplePaymentAddress, true, overrides)).wait();
    if (donationEscrowAddress) {
      await (await newFeeRouter.setAuthorizedDApp(donationEscrowAddress, true, overrides)).wait();
    }
    if (genesisBadgeAddress) {
      await (await newFeeRouter.setAuthorizedDApp(genesisBadgeAddress, true, overrides)).wait();
    }
    await (await newFeeRouter.setTreeBpsByType('donation', 10000, overrides)).wait();
    console.log('   setTreeBpsByType("donation", 10000) done');

    console.log('\n3. Replacing FeeRouter in RevenueTreeManager and RewardManager...');
    const rtm = await hre.ethers.getContractAt('RevenueTreeManager', revenueTreeManagerAddress);
    await (await rtm.setAuthorizedCaller(oldFeeRouterAddress, false, overrides)).wait();
    await (await rtm.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
    const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
    await (await rewardManager.setAuthorizedRewardCaller(oldFeeRouterAddress, false, overrides)).wait();
    await (await rewardManager.setAuthorizedRewardCaller(newFeeRouterAddress, true, overrides)).wait();
    console.log('   Done');

    console.log('\n4. LoyaltyPoints: authorize new FeeRouter...');
    const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
    await (await loyaltyPoints.setAuthorizedCaller(oldFeeRouterAddress, false, overrides)).wait();
    await (await loyaltyPoints.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
    console.log('   Done');
  } else {
    console.log('\n2â€“4. Skipped (using existing new FeeRouter).');
  }

  console.log('\n5. Repoint dApps to new FeeRouter...');
  const simplePayment = await hre.ethers.getContractAt('SimplePayment', simplePaymentAddress);
  await (await simplePayment.setFeeRouter(newFeeRouterAddress, overrides)).wait();
  console.log('   SimplePayment: FeeRouter set');
  if (donationEscrowAddress) {
    const donationEscrow = await hre.ethers.getContractAt('DonationEscrow', donationEscrowAddress);
    await (await donationEscrow.setFeeRouter(newFeeRouterAddress, overrides)).wait();
    console.log('   DonationEscrow: FeeRouter set');
  }
  if (genesisBadgeAddress) {
    const genesisBadge = await hre.ethers.getContractAt('GenesisBadge', genesisBadgeAddress);
    await (await genesisBadge.setFeeRouter(newFeeRouterAddress, overrides)).wait();
    console.log('   GenesisBadge: FeeRouter set');
  }

  const updatedMain = { ...mainDep, FeeRouter: newFeeRouterAddress, feeRouterUpgradedAt: new Date().toISOString(), previousFeeRouter: oldFeeRouterAddress };
  fs.writeFileSync(mainDepPath, JSON.stringify(updatedMain, null, 2));
  console.log('\nDeployment file updated:', mainDepPath);

  if (donationEscrowAddress) {
    const updatedDonation = { ...donationDep, FeeRouter: newFeeRouterAddress };
    fs.writeFileSync(path.join(deploymentsDir, 'donation-escrow-igra-galleon-testnet.json'), JSON.stringify(updatedDonation, null, 2));
  }
  if (genesisBadgeAddress) {
    const updatedGenesis = { ...genesisDep, FeeRouter: newFeeRouterAddress };
    fs.writeFileSync(path.join(deploymentsDir, 'genesis-badge-igra-galleon-testnet.json'), JSON.stringify(updatedGenesis, null, 2));
  }

  console.log('\n--- Set in .env and Vercel ---');
  console.log('NEXT_PUBLIC_FEE_ROUTER_ADDRESS_IGRA_MAINNET=' + newFeeRouterAddress);
  console.log('\nDone. Donation fees (10% of donation) now go 100% to Revenue Tree.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
