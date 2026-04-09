/**
 * Deploy minimal CrowdKAS contracts on Igra Mainnet (38833) using ethers directly.
 *
 * Usage:
 *   node -r dotenv/config scripts/deploy-crowdkas-igra-mainnet.js
 *
 * Env:
 *   PRIVATE_KEY (required)
 *   IGRA_MAINNET_RPC (optional, default https://rpc.igralabs.com:8545)
 *   KREX_TOKEN_ADDRESS (optional, default 0x9C31bB7A012A99dA04AAD94a1CB9176DAF28270D)
 *   PLATFORM_WALLET (optional, default deployer)
 *   GENESIS_1..5 (optional, default deployer)
 *   TREASURY_ADDRESS (optional, default deployer EOA)
 *
 * Outputs:
 *   deployments/crowdkas-igraMainnet.json
 *   NEXT_PUBLIC_* env suggestions
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CHAIN_ID = 38833;
const DEFAULT_RPC = 'https://rpc.igralabs.com:8545';
const DEFAULT_KREX = '0x9C31bB7A012A99dA04AAD94a1CB9176DAF28270D';

const LEVELS = 5;
const KAS_1 = 1n * 10n ** 18n;
const KAS_100 = 100n * 10n ** 18n;

const GAS_PRICE = 1000n * 10n ** 9n; // 1000 gwei (node minimum)

const GAS = {
  initRtm: 3_000_000n,
  admin: 250_000n,
};

function loadArtifact(name) {
  return require(path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`));
}

function getGenesis(deployer) {
  const g = [];
  for (let i = 1; i <= LEVELS; i++) {
    g.push(process.env[`GENESIS_${i}`] || deployer);
  }
  return g;
}

async function deployContract({ wallet, artifact, args, label }) {
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const txReq = await factory.getDeployTransaction(...args);
  const gas = await wallet.provider.estimateGas({ ...txReq, from: wallet.address });
  const tx = await wallet.sendTransaction({
    ...txReq,
    type: 0,
    gasPrice: GAS_PRICE,
    gasLimit: gas + 250_000n,
  });
  console.log(`${label} tx:`, tx.hash);
  const rec = await tx.wait();
  if (!rec || rec.status !== 1) throw new Error(`${label} deployment failed`);
  if (!rec.contractAddress) throw new Error(`${label} missing contractAddress`);
  console.log(`${label} address:`, rec.contractAddress);
  return rec.contractAddress;
}

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('Set PRIVATE_KEY in env/.env');
  const rpcUrl = process.env.IGRA_MAINNET_RPC || DEFAULT_RPC;
  const provider = new ethers.JsonRpcProvider(rpcUrl, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);

  const { chainId } = await provider.getNetwork();
  if (Number(chainId) !== CHAIN_ID) throw new Error(`Wrong chainId ${chainId}, expected ${CHAIN_ID}`);

  const deployer = wallet.address;
  const krexToken = process.env.KREX_TOKEN_ADDRESS || DEFAULT_KREX;
  const platformWallet = process.env.PLATFORM_WALLET || deployer;
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer;
  const genesis = getGenesis(deployer);

  console.log('RPC:', rpcUrl);
  console.log('Deployer:', deployer);
  console.log('KREX:', krexToken);
  console.log('Treasury:', treasuryAddress);

  // Core: RevenueTreeManager → FeeCollector → FeeRouter → LoyaltyPoints → DonationEscrow
  const RevenueTreeManager = loadArtifact('RevenueTreeManager');
  const FeeCollector = loadArtifact('FeeCollector');
  const FeeRouter = loadArtifact('FeeRouter');
  const LoyaltyPoints = loadArtifact('LoyaltyPoints');
  const DonationEscrow = loadArtifact('DonationEscrow');

  const revenueTreeManager = await deployContract({
    wallet,
    artifact: RevenueTreeManager,
    label: 'RevenueTreeManager',
    args: [
      genesis,
      platformWallet,
      krexToken,
      KAS_100, // activationThreshold
      KAS_100, // baseActivityThreshold
      KAS_1, // minVolumePerCall
      KAS_100, // krexMinVolumeFloor
    ],
  });

  const rtm = new ethers.Contract(revenueTreeManager, RevenueTreeManager.abi, wallet);

  const existingFeeCollector = (process.env.FEE_COLLECTOR_ADDRESS || '').trim();
  const feeCollector =
    existingFeeCollector && ethers.isAddress(existingFeeCollector)
      ? existingFeeCollector
      : await deployContract({
          wallet,
          artifact: FeeCollector,
          label: 'FeeCollector',
          args: [treasuryAddress],
        });

  const treeBps = process.env.TREE_BPS ? parseInt(process.env.TREE_BPS, 10) : 5000;
  const existingFeeRouter = (process.env.FEE_ROUTER_ADDRESS || '').trim();
  const feeRouter =
    existingFeeRouter && ethers.isAddress(existingFeeRouter)
      ? existingFeeRouter
      : await deployContract({
          wallet,
          artifact: FeeRouter,
          label: 'FeeRouter',
          args: [revenueTreeManager, feeCollector, treeBps],
        });

  // RevenueTreeManager: authorize FeeRouter
  console.log('RevenueTreeManager: authorize FeeRouter...');
  await (await rtm.setAuthorizedCaller(feeRouter, true, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();

  const existingLp = (process.env.LOYALTY_POINTS_ADDRESS || '').trim();
  const loyaltyPoints =
    existingLp && ethers.isAddress(existingLp)
      ? existingLp
      : await deployContract({
          wallet,
          artifact: LoyaltyPoints,
          label: 'LoyaltyPoints',
          args: [],
        });

  // LoyaltyPoints: authorize FeeRouter + set KREX
  console.log('LoyaltyPoints: authorize FeeRouter + set KREX...');
  const lp = new ethers.Contract(loyaltyPoints, LoyaltyPoints.abi, wallet);
  await (await lp.setAuthorizedCaller(feeRouter, true, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();
  await (await lp.setKREXToken(krexToken, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();

  // FeeRouter: set LoyaltyPoints (if supported)
  console.log('FeeRouter: set LoyaltyPoints...');
  const fr = new ethers.Contract(feeRouter, FeeRouter.abi, wallet);
  try {
    await (await fr.setLoyaltyPoints(loyaltyPoints, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();
  } catch (e) {
    console.warn('FeeRouter.setLoyaltyPoints skipped:', e?.message || e);
  }

  const feeBps = 1000;
  const recorder = process.env.RECORDER_ADDRESS || deployer;
  const existingEscrow = (process.env.DONATION_ESCROW_ADDRESS || '').trim();
  const donationEscrow =
    existingEscrow && ethers.isAddress(existingEscrow)
      ? existingEscrow
      : await deployContract({
          wallet,
          artifact: DonationEscrow,
          label: 'DonationEscrow',
          args: [feeRouter, loyaltyPoints, feeBps, recorder],
        });

  // Authorize DonationEscrow on FeeRouter + LoyaltyPoints
  console.log('FeeRouter: authorize DonationEscrow...');
  await (await fr.setAuthorizedDApp(donationEscrow, true, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();

  console.log('LoyaltyPoints: authorize DonationEscrow...');
  await (await lp.setAuthorizedCaller(donationEscrow, true, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();

  // Optional: route donation fee type fully to revenue tree
  try {
    console.log('FeeRouter: setTreeBpsByType("donation", 10000)...');
    await (await fr.setTreeBpsByType('donation', 10000, { type: 0, gasPrice: GAS_PRICE, gasLimit: GAS.admin })).wait();
  } catch (e) {
    console.warn('FeeRouter.setTreeBpsByType skipped:', e?.message || e);
  }

  const out = {
    network: 'igraMainnet',
    chainId: CHAIN_ID,
    deployer,
    KREX: krexToken,
    Treasury: treasuryAddress,
    RevenueTreeManager: revenueTreeManager,
    FeeCollector: feeCollector,
    FeeRouter: feeRouter,
    LoyaltyPoints: loyaltyPoints,
    DonationEscrow: donationEscrow,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'crowdkas-igraMainnet.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote', outPath);

  console.log('\n--- Set these in Vercel ---');
  console.log('NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_MAINNET=' + donationEscrow);
  console.log('NEXT_PUBLIC_FEE_ROUTER_ADDRESS_IGRA_MAINNET=' + feeRouter);
  console.log('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS_IGRA_MAINNET=' + loyaltyPoints);
  console.log('NEXT_PUBLIC_REVENUE_TREE_MANAGER_ADDRESS_IGRA_MAINNET=' + revenueTreeManager);
  console.log('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_IGRA_MAINNET=' + feeCollector);
  console.log('NEXT_PUBLIC_KREX_TOKEN_ADDRESS_IGRA_MAINNET=' + krexToken);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

