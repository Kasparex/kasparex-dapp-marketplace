/**
 * Deploy full stack on Igra Mainnet (38833): tGRID, Treasury, FeeCollector,
 * DAppRegistry, RevenueTreeManager, FeeRouter, ProofOfUtility, RewardManager, LoyaltyPoints,
 * SimplePayment; wire and fund for fee + tGRID rewards + points.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-igra-galleon-testnet.js --network igraMainnet
 *
 * Env:
 *   PRIVATE_KEY - deployer
 *   GRID_TREASURY_ADDRESS - receives 5% tGRID (required for wiring)
 *   REWARD_VAULT - tGRID pre-mint recipient (default: deployer)
 *   Optional overrides: TREASURY_ADDRESS, FEE_COLLECTOR_ADDRESS, DAPP_REGISTRY_ADDRESS,
 *     TGRID_ADDRESS, KREX_TOKEN_ADDRESS, GENESIS_1..5, PLATFORM_WALLET, TREE_BPS
 *   BASE_REWARD_WEI - tGRID per dapp-payment in 18 decimals (default: 500e18)
 *   FUND_REWARD_MANAGER_WEI - tGRID to transfer to RewardManager (default: 1000000e18)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const LEVELS = 5;
const BPS_100_KAS = 100n * 10n**18n;
const BPS_1000_KAS = 1000n * 10n**18n;
const KREX_10M = 10n * 10n**6n * 10n**18n;
const KREX_MIN_100 = 100n * 10n**18n;

const TEST_GENESIS = [
  '0xAb036a6f99892b8B84f1f10a193e4c0d217eB6D3',
  '0xC0CDEC6323A3f079DDB5D9a463AA1470d0b4b201',
  '0x33cE8E3D7039741485C5937fAd2a7e508683bf85',
  '0xa6E0D2Cb51b52e0e864B5231a7C24d6F2379B0e0',
  '0xcde1F107D791327189afdDe98E4eeB2D16D1f7da',
];

function getGenesis() {
  const g = [];
  for (let i = 1; i <= LEVELS; i++) {
    const a = process.env[`GENESIS_${i}`] || TEST_GENESIS[i - 1];
    g.push(a);
  }
  return g;
}

function getFeeOverrides(chainId) {
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
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  const gridTreasuryAddress = process.env.GRID_TREASURY_ADDRESS || '';
  if (!gridTreasuryAddress) {
    console.error('\nGRID_TREASURY_ADDRESS is required (receives 5%% tGRID). Set in .env');
    process.exit(1);
  }

  console.log('Deploying full stack on IGRA Galleon Testnet with account:', deployer.address);
  const overrides = getFeeOverrides(chainId);

  let tgridAddress = process.env.TGRID_ADDRESS || '';
  const rewardVault = process.env.REWARD_VAULT || deployer.address;

  // 1. tGRID
  if (!tgridAddress) {
    console.log('\n1. Deploying tGRID...');
    const tGRID = await hre.ethers.getContractFactory('tGRID');
    tgridAddress = await deployNoEstimate(tGRID, [rewardVault], overrides);
    console.log('   tGRID at:', tgridAddress);
    const outDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'tgrid-igraMainnet.json'),
      JSON.stringify({ network, chainId: 38833, tGRID: tgridAddress, rewardVault, deployer: deployer.address }, null, 2)
    );
  } else {
    console.log('\n1. Using existing tGRID:', tgridAddress);
  }

  // 2. Treasury
  let treasuryAddress = process.env.TREASURY_ADDRESS || '';
  if (!treasuryAddress) {
    console.log('\n2. Deploying Treasury...');
    const TREASURY_PERCENTAGE = 4000;
    const DEVELOPER_PERCENTAGE = 3000;
    const BUILDER_PERCENTAGE = 3000;
    const dev = process.env.DEVELOPER_ADDRESS || deployer.address;
    const builder = process.env.BUILDER_ADDRESS || deployer.address;
    const Treasury = await hre.ethers.getContractFactory('Treasury');
    treasuryAddress = await deployNoEstimate(Treasury, [TREASURY_PERCENTAGE, DEVELOPER_PERCENTAGE, BUILDER_PERCENTAGE, dev, builder], overrides);
    console.log('   Treasury at:', treasuryAddress);
  } else {
    console.log('\n2. Using existing Treasury:', treasuryAddress);
  }

  // 3. FeeCollector
  let feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || '';
  if (!feeCollectorAddress) {
    console.log('\n3. Deploying FeeCollector...');
    const FeeCollector = await hre.ethers.getContractFactory('FeeCollector');
    feeCollectorAddress = await deployNoEstimate(FeeCollector, [treasuryAddress], overrides);
    console.log('   FeeCollector at:', feeCollectorAddress);
  } else {
    console.log('\n3. Using existing FeeCollector:', feeCollectorAddress);
  }

  // 4. DAppRegistry
  let dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '';
  if (!dAppRegistryAddress) {
    console.log('\n4. Deploying DAppRegistry...');
    const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    dAppRegistryAddress = await deployNoEstimate(DAppRegistry, [], overrides);
    console.log('   DAppRegistry at:', dAppRegistryAddress);
  } else {
    console.log('\n4. Using existing DAppRegistry:', dAppRegistryAddress);
  }

  // 5. tKREX (for RTM on 38836) and RevenueTreeManager
  let krexTokenAddress = process.env.KREX_TOKEN_ADDRESS || hre.ethers.ZeroAddress;
  if (!process.env.KREX_TOKEN_ADDRESS) {
    console.log('\n5a. Deploying tKREX...');
    const tKREX = await hre.ethers.getContractFactory('tKREX');
    krexTokenAddress = await deployNoEstimate(tKREX, [], overrides);
    console.log('   tKREX at:', krexTokenAddress);
  }
  console.log('\n5b. Deploying RevenueTreeManager...');
  const genesis = getGenesis();
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  const RevenueTreeManager = await hre.ethers.getContractFactory('RevenueTreeManager');
  const rtmAddress = await deployNoEstimate(
    RevenueTreeManager,
    [genesis, platformWallet, krexTokenAddress, BPS_100_KAS, BPS_1000_KAS, KREX_10M, KREX_MIN_100],
    overrides
  );
  console.log('   RevenueTreeManager at:', rtmAddress);

  // 6. FeeRouter
  console.log('\n6. Deploying FeeRouter...');
  const treeBps = process.env.TREE_BPS ? parseInt(process.env.TREE_BPS, 10) : 5000;
  const FeeRouter = await hre.ethers.getContractFactory('FeeRouter');
  const feeRouterAddress = await deployNoEstimate(FeeRouter, [rtmAddress, feeCollectorAddress, treeBps], overrides);
  console.log('   FeeRouter at:', feeRouterAddress);
  const rtm = await hre.ethers.getContractAt('RevenueTreeManager', rtmAddress);
  await (await rtm.setAuthorizedCaller(feeRouterAddress, true, overrides)).wait();
  console.log('   RevenueTreeManager: authorized FeeRouter');

  // 7. ProofOfUtility (placeholder rewardManager for constructor; rewards go via FeeRouter only)
  console.log('\n7. Deploying ProofOfUtility...');
  const ProofOfUtility = await hre.ethers.getContractFactory('ProofOfUtility');
  const proofOfUtilityAddress = await deployNoEstimate(ProofOfUtility, [deployer.address], overrides);
  console.log('   ProofOfUtility at:', proofOfUtilityAddress);

  // 8. RewardManager
  console.log('\n8. Deploying RewardManager...');
  const RewardManager = await hre.ethers.getContractFactory('RewardManager');
  const rewardManagerAddress = await deployNoEstimate(RewardManager, [proofOfUtilityAddress, tgridAddress], overrides);
  console.log('   RewardManager at:', rewardManagerAddress);

  // 9. LoyaltyPoints
  console.log('\n9. Deploying LoyaltyPoints...');
  const LoyaltyPoints = await hre.ethers.getContractFactory('LoyaltyPoints');
  const loyaltyPointsAddress = await deployNoEstimate(LoyaltyPoints, [], overrides);
  console.log('   LoyaltyPoints at:', loyaltyPointsAddress);

  // 10. SimplePayment
  const FEE_PERCENTAGE = 100; // 1%
  console.log('\n10. Deploying SimplePayment...');
  const SimplePayment = await hre.ethers.getContractFactory('SimplePayment');
  const simplePaymentAddress = await deployNoEstimate(SimplePayment, [feeCollectorAddress, FEE_PERCENTAGE], overrides);
  console.log('   SimplePayment at:', simplePaymentAddress);
  const simplePayment = await hre.ethers.getContractAt('SimplePayment', simplePaymentAddress);
  await (await simplePayment.setFeeRouter(feeRouterAddress, overrides)).wait();
  console.log('   SimplePayment: FeeRouter set');
  const dAppRegistry = await hre.ethers.getContractAt('DAppRegistry', dAppRegistryAddress);
  await (await dAppRegistry.registerDApp('Simple Payment', '1.0.0', 'payment', simplePaymentAddress, overrides)).wait();
  console.log('   SimplePayment registered in DAppRegistry');

  // 11. Wiring
  console.log('\n11. Wiring...');
  const rewardManager = await hre.ethers.getContractAt('RewardManager', rewardManagerAddress);
  await (await rewardManager.setGridTreasury(gridTreasuryAddress, overrides)).wait();
  console.log('   RewardManager: gridTreasury set');
  await (await rewardManager.setAuthorizedRewardCaller(feeRouterAddress, true, overrides)).wait();
  console.log('   RewardManager: FeeRouter authorized');

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

  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  await (await loyaltyPoints.setAuthorizedCaller(feeRouterAddress, true, overrides)).wait();
  console.log('   LoyaltyPoints: FeeRouter authorized');
  if (krexTokenAddress && krexTokenAddress !== hre.ethers.ZeroAddress) {
    await (await loyaltyPoints.setKREXToken(krexTokenAddress, overrides)).wait();
    console.log('   LoyaltyPoints: KREX token set (tier multiplier active for tGRID + XP)');
  }

  // 12. Fund RewardManager with tGRID (only if deployer is rewardVault and has balance)
  const fundWei = process.env.FUND_REWARD_MANAGER_WEI ? BigInt(process.env.FUND_REWARD_MANAGER_WEI) : (1000000n * 10n**18n);
  console.log('\n12. Funding RewardManager with tGRID...');
  const tgridContract = await hre.ethers.getContractAt('tGRID', tgridAddress);
  const deployerBalance = await tgridContract.balanceOf(deployer.address);
  const toTransfer = deployerBalance < fundWei ? deployerBalance : fundWei;
  if (toTransfer > 0n && rewardVault.toLowerCase() === deployer.address.toLowerCase()) {
    await (await tgridContract.transfer(rewardManagerAddress, toTransfer, overrides)).wait();
    console.log('   Transferred', hre.ethers.formatEther(toTransfer), 'tGRID to RewardManager');
  } else if (toTransfer > 0n) {
    console.log('   REWARD_VAULT is not deployer. Run: npx hardhat run scripts/fund-reward-manager-igra-galleon.js --network igraMainnet');
  } else {
    console.log('   Deployer has no tGRID (minted to REWARD_VAULT). Run: npx hardhat run scripts/fund-reward-manager-igra-galleon.js --network igraMainnet');
  }

  // 13. Output
  const out = {
    network,
    chainId: 38833,
    deployer: deployer.address,
    tGRID: tgridAddress,
    Treasury: treasuryAddress,
    FeeCollector: feeCollectorAddress,
    DAppRegistry: dAppRegistryAddress,
    RevenueTreeManager: rtmAddress,
    FeeRouter: feeRouterAddress,
    ProofOfUtility: proofOfUtilityAddress,
    RewardManager: rewardManagerAddress,
    LoyaltyPoints: loyaltyPointsAddress,
    SimplePayment: simplePaymentAddress,
    gridTreasury: gridTreasuryAddress,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `igra-galleon-testnet-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('\nWrote:', outPath);
  console.log('\n--- Set these in .env and Vercel ---');
  console.log('NEXT_PUBLIC_TGRID_ADDRESS_IGRA_MAINNET=' + tgridAddress);
  console.log('NEXT_PUBLIC_FEE_ROUTER_ADDRESS_IGRA_MAINNET=' + feeRouterAddress);
  console.log('NEXT_PUBLIC_REWARD_MANAGER_ADDRESS_IGRA_MAINNET=' + rewardManagerAddress);
  console.log('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS_IGRA_MAINNET=' + loyaltyPointsAddress);
  console.log('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_IGRA_MAINNET=' + simplePaymentAddress);
  console.log('NEXT_PUBLIC_TREASURY_ADDRESS_IGRA_MAINNET=' + treasuryAddress);
  console.log('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_IGRA_MAINNET=' + feeCollectorAddress);
  console.log('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_IGRA_MAINNET=' + dAppRegistryAddress);
  console.log('NEXT_PUBLIC_REVENUE_TREE_MANAGER_ADDRESS_IGRA_MAINNET=' + rtmAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
