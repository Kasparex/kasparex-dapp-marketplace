/**
 * Deploy Revenue Tree V1: RevenueTreeManager, optional FeeRouter, optional tKREX (38836 / 38833).
 *
 * Usage:
 *   npx hardhat run scripts/deploy-revenue-tree.js --network kasplexL2Testnet
 *   npx hardhat run scripts/deploy-revenue-tree.js --network igraGalleonTestnet
 *   npx hardhat run scripts/deploy-revenue-tree.js --network igraMainnet
 *
 * Env:
 *   PRIVATE_KEY - deployer
 *   GENESIS_1..GENESIS_5 - 5 Genesis wallet addresses (optional; fallback to test addresses)
 *   PLATFORM_WALLET - receives platform share (default: deployer)
 *   FEE_COLLECTOR_ADDRESS - for FeeRouter (optional)
 *   SIMPLE_PAYMENT_ADDRESS - dApp to whitelist (optional)
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
  const g = [];
  for (let i = 1; i <= LEVELS; i++) {
    const a = process.env[`GENESIS_${i}`] || TEST_GENESIS[i - 1];
    g.push(a);
  }
  return g;
}

function getFeeOverrides(chainId) {
  // IGRA networks often hang on estimateGas; use explicit EIP-1559 fees and gas limits.
  // Network info: gas price ~2000 gwei, base fee 1 wei.
  if (Number(chainId) === 38836 || Number(chainId) === 38833) {
    // Use legacy gasPrice to satisfy IGRA minimum gas fee requirement.
    const gasPrice = hre.ethers.parseUnits('2000', 'gwei');
    return { gasPrice };
  }
  return {};
}

async function deployNoEstimate(factory, args, overrides) {
  const txReq = await factory.getDeployTransaction(...args);
  // Provide a generous gas limit to avoid estimation. (IGRA block gas limit is huge.)
  if (!txReq.gasLimit) txReq.gasLimit = 8_000_000n;
  const signer = factory.runner;
  const sent = await signer.sendTransaction({ ...txReq, ...overrides });
  console.log('   Tx hash:', sent.hash);
  // Wait for receipt with timeout (IGRA can be slow).
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

  console.log('Deploying Revenue Tree with account:', deployer.address);
  console.log('Network:', network, 'Chain ID:', Number(chainId));

  const genesis = getGenesis();
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || '';
  const simplePaymentAddress = process.env.SIMPLE_PAYMENT_ADDRESS || '';
  const feeOverrides = getFeeOverrides(chainId);

  let krexTokenAddress = process.env.KREX_TOKEN_ADDRESS || hre.ethers.ZeroAddress;
  const needsTKrexDeploy =
    (Number(chainId) === 38836 || Number(chainId) === 38833) && !process.env.KREX_TOKEN_ADDRESS;

  if (needsTKrexDeploy) {
    console.log('\n1. Deploying tKREX (Igra L2)...');
    const tKREX = await hre.ethers.getContractFactory('tKREX');
    krexTokenAddress = await deployNoEstimate(tKREX, [], feeOverrides);
    console.log('   tKREX deployed to:', krexTokenAddress);
  }

  console.log('\n2. Deploying RevenueTreeManager Proxy...');
  const RevenueTreeManager = await hre.ethers.getContractFactory('RevenueTreeManager');
  const txOverrides = { ...feeOverrides, gasLimit: 8000000n };
  const rtmProxy = await hre.upgrades.deployProxy(
    RevenueTreeManager,
    [genesis, platformWallet, krexTokenAddress, BPS_100_KAS, BPS_1000_KAS, KREX_10M, KREX_MIN_100],
    { txOverrides }
  );
  await rtmProxy.waitForDeployment();
  const rtmAddress = await rtmProxy.getAddress();
  console.log('   RevenueTreeManager (Proxy) at:', rtmAddress);

  let feeRouterAddress = '';
  if (feeCollectorAddress) {
    console.log('\n3. Deploying FeeRouter...');
    const treeBps = process.env.TREE_BPS ? parseInt(process.env.TREE_BPS, 10) : 5000;
    const FeeRouter = await hre.ethers.getContractFactory('FeeRouter');
    feeRouterAddress = await deployNoEstimate(FeeRouter, [rtmAddress, feeCollectorAddress, treeBps], feeOverrides);
    console.log('   FeeRouter at:', feeRouterAddress);
    const rtm = await hre.ethers.getContractAt('RevenueTreeManager', rtmAddress);
    await (await rtm.setAuthorizedCaller(feeRouterAddress, true, feeOverrides)).wait();
    console.log('   RevenueTreeManager: authorized FeeRouter');
  }

  if (simplePaymentAddress) {
    const rtm = await hre.ethers.getContractAt('RevenueTreeManager', rtmAddress);
    await (await rtm.setAuthorizedCaller(simplePaymentAddress, true, feeOverrides)).wait();
    console.log('   RevenueTreeManager: authorized SimplePayment');
  }
  if (feeRouterAddress && simplePaymentAddress) {
    const FeeRouter = await hre.ethers.getContractAt('FeeRouter', feeRouterAddress);
    await (await FeeRouter.setAuthorizedDApp(simplePaymentAddress, true, feeOverrides)).wait();
    console.log('   FeeRouter: whitelisted SimplePayment');
  }

  const isIgraL2 = Number(chainId) === 38836 || Number(chainId) === 38833;
  const out = {
    network,
    chainId: Number(chainId),
    RevenueTreeManager: rtmAddress,
    FeeRouter: feeRouterAddress || undefined,
    tKREX:
      isIgraL2 && krexTokenAddress && krexTokenAddress !== hre.ethers.ZeroAddress
        ? krexTokenAddress
        : undefined,
    genesis,
    platformWallet,
  };
  const outPath = path.join(__dirname, '..', 'deployments', `revenue-tree-${network}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('\nWrote:', outPath);
  console.log('\nUpdate src/lib/contracts/addresses.ts and .env with these addresses.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
