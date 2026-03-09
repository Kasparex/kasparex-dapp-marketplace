/**
 * Redeploy RevenueTreeManager and FeeRouter on IGRA Galleon Testnet to apply bug fixes.
 * Repoints RewardManager, LoyaltyPoints, SimplePayment, DonationEscrow, GenesisBadge.
 *
 * Usage:
 *   npx hardhat run scripts/redeploy-rtm-and-fee-router-igra.js --network igraGalleonTestnet
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const LEVELS = 5;
const BPS_100_KAS = 100n * 10n ** 18n;
const BPS_1000_KAS = 1000n * 10n ** 18n;
const KREX_10M = 10n * 10n ** 6n * 10n ** 18n;
const KREX_MIN_100 = 100n * 10n ** 18n;

const TEST_GENESIS = [
    '0xAb036a6f99892b8B84f1f10a193e4c0d217eB6D3',
    '0xC0CDEC6323A3f079DDB5D9a463AA1470d0b4b201',
    '0x33cE8E3D7039741485C5937fAd2a7e508683bf85',
    '0xa6E0D2Cb51b52e0e864B5231a7C24d6F2379B0e0',
    '0xcde1F107D791327189afdDe98E4eeB2D16D1f7da',
];

function getGenesis() {
    return process.env.GENESIS_1 ? [
        process.env.GENESIS_1, process.env.GENESIS_2, process.env.GENESIS_3, process.env.GENESIS_4, process.env.GENESIS_5
    ] : TEST_GENESIS;
}

function getOverrides(chainId) {
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

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    if (Number(chainId) !== 38836) {
        console.error('This script is for IGRA Galleon Testnet (chainId 38836) only.');
        process.exit(1);
    }

    const overrides = getOverrides(chainId);
    const deploymentsDir = path.join(__dirname, '..', 'deployments');

    const mainDepPath = path.join(deploymentsDir, 'igra-galleon-testnet-2026-02-20.json');
    const mainDep = JSON.parse(fs.readFileSync(mainDepPath, 'utf8'));
    let donationDep = {};
    try {
        donationDep = JSON.parse(fs.readFileSync(path.join(deploymentsDir, 'donation-escrow-igra-galleon-testnet.json'), 'utf8'));
    } catch (_) { }
    let genesisDep = {};
    try {
        genesisDep = JSON.parse(fs.readFileSync(path.join(deploymentsDir, 'genesis-badge-igra-galleon-testnet.json'), 'utf8'));
    } catch (_) { }

    const oldFeeRouterAddress = mainDep.FeeRouter;
    const oldRtmAddress = mainDep.RevenueTreeManager;
    const feeCollectorAddress = mainDep.FeeCollector;
    const rewardManagerAddress = mainDep.RewardManager;
    const loyaltyPointsAddress = mainDep.LoyaltyPoints;
    const simplePaymentAddress = mainDep.SimplePayment;
    const donationEscrowAddress = donationDep.DonationEscrow;
    const genesisBadgeAddress = genesisDep.GenesisBadge;
    const krexTokenAddress = mainDep.tKREX || '0xc98B036087b3378b2700D60ca33c0429aDAEE2bA';

    if (!oldFeeRouterAddress || !oldRtmAddress || !feeCollectorAddress || !rewardManagerAddress || !loyaltyPointsAddress || !simplePaymentAddress) {
        console.error('Deployment JSON missing required addresses.');
        process.exit(1);
    }

    console.log('Deploying New RTM and FeeRouter on IGRA Galleon Testnet');
    console.log('Deployer:', deployer.address);

    // 1. Deploy new RevenueTreeManager
    console.log('\n1. Deploying new RevenueTreeManager...');
    const genesis = getGenesis();
    const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
    const RevenueTreeManager = await hre.ethers.getContractFactory('RevenueTreeManager');
    const newRtmAddress = await deployNoEstimate(
        RevenueTreeManager,
        [genesis, platformWallet, krexTokenAddress, BPS_100_KAS, BPS_1000_KAS, KREX_10M, KREX_MIN_100],
        overrides
    );
    console.log('   New RevenueTreeManager at:', newRtmAddress);

    const oldFeeRouter = await hre.ethers.getContractAt('FeeRouter', oldFeeRouterAddress);
    const treeBps = await oldFeeRouter.treeBps();
    const baseRewardDappPayment = await oldFeeRouter.baseRewardWei('dapp-payment');

    // 2. Deploy new FeeRouter
    console.log('\n2. Deploying new FeeRouter...');
    const FeeRouter = await hre.ethers.getContractFactory('FeeRouter');
    const newFeeRouterAddress = await deployNoEstimate(FeeRouter, [newRtmAddress, feeCollectorAddress, treeBps], overrides);
    console.log('   New FeeRouter at:', newFeeRouterAddress);

    const newFeeRouter = await hre.ethers.getContractAt('FeeRouter', newFeeRouterAddress);

    // 3. Wiring new RTM and FeeRouter
    console.log('\n3. Wiring new RevenueTreeManager and FeeRouter...');
    const newRtm = await hre.ethers.getContractAt('RevenueTreeManager', newRtmAddress);
    await (await newRtm.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
    console.log('   RevenueTreeManager: authorized new FeeRouter');

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
    console.log('   FeeRouter: configured endpoints and treeBpsByType');

    console.log('\n4. Replacing RewardManager and LoyaltyPoints auth...');
    const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
    await (await rewardManager.setAuthorizedRewardCaller(oldFeeRouterAddress, false, overrides)).wait();
    await (await rewardManager.setAuthorizedRewardCaller(newFeeRouterAddress, true, overrides)).wait();
    console.log('   RewardManager: old FeeRouter disabled, new enabled');

    const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
    await (await loyaltyPoints.setAuthorizedCaller(oldFeeRouterAddress, false, overrides)).wait();
    await (await loyaltyPoints.setAuthorizedCaller(newFeeRouterAddress, true, overrides)).wait();
    console.log('   LoyaltyPoints: old FeeRouter disabled, new enabled');

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

    const updatedMain = { ...mainDep, RevenueTreeManager: newRtmAddress, FeeRouter: newFeeRouterAddress, rtmUpgradedAt: new Date().toISOString() };
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

    console.log('\n--- Set in Vercel / UI (.env) ---');
    console.log('NEXT_PUBLIC_REVENUE_TREE_MANAGER_ADDRESS_IGRA_GALLEON_TESTNET=' + newRtmAddress);
    console.log('NEXT_PUBLIC_FEE_ROUTER_ADDRESS_IGRA_GALLEON_TESTNET=' + newFeeRouterAddress);
    console.log('\nDone.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
