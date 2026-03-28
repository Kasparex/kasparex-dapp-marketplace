/**
 * Deploy GenesisBadge on Igra Mainnet (38833) and wire FeeRouter + LoyaltyPoints.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-genesis-badge.js --network igraMainnet
 *
 * Env:
 *   PRIVATE_KEY - deployer (must be FeeRouter/LoyaltyPoints owner for wiring)
 *   FEE_ROUTER_ADDRESS - (optional) default for 38836: 0x37c98699eEe02Cb89da64C45B8c970174218A745
 *   LOYALTY_POINTS_ADDRESS - (optional) default for 38836: 0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936
 *   KREX_TOKEN_ADDRESS - (optional) tKREX address on 38836; when set, LoyaltyPoints tier multiplier is enabled so tGRID/XP scale by KREX tier
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_ROUTER_38836 = '0x37c98699eEe02Cb89da64C45B8c970174218A745';
const LOYALTY_POINTS_38836 = '0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936';

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
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  const feeRouterAddress = (process.env.FEE_ROUTER_ADDRESS || FEE_ROUTER_38836).trim();
  const loyaltyPointsAddress = (process.env.LOYALTY_POINTS_ADDRESS || LOYALTY_POINTS_38836).trim();
  const overrides = getFeeOverrides(chainId);

  console.log('Deploying GenesisBadge on IGRA Galleon Testnet with account:', deployer.address);
  console.log('FeeRouter:', feeRouterAddress);
  console.log('LoyaltyPoints:', loyaltyPointsAddress);

  // 1. Deploy GenesisBadge
  console.log('\n1. Deploying GenesisBadge...');
  const GenesisBadge = await hre.ethers.getContractFactory('GenesisBadge');
  const genesisBadgeAddress = await deployNoEstimate(GenesisBadge, [feeRouterAddress], overrides);
  console.log('   GenesisBadge at:', genesisBadgeAddress);

  // 2. FeeRouter: authorize dApp + set base reward for "genesis-badge"
  console.log('\n2. Configuring FeeRouter...');
  const feeRouter = await hre.ethers.getContractAt('FeeRouter', feeRouterAddress);
  await (await feeRouter.setAuthorizedDApp(genesisBadgeAddress, true, overrides)).wait();
  console.log('   FeeRouter: GenesisBadge authorized');
  const baseRewardWei = 500n * 10n ** 18n; // 500 tGRID per 1 iKAS
  await (await feeRouter.setBaseReward('genesis-badge', baseRewardWei, overrides)).wait();
  console.log('   FeeRouter: baseReward(genesis-badge) = 500e18');

  // 3. LoyaltyPoints: XP per 1 iKAS for "genesis-badge"; set tKREX so tier multiplier applies (same as Simple Payment)
  console.log('\n3. Configuring LoyaltyPoints...');
  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  await (await loyaltyPoints.setPointsPer1iKAS('genesis-badge', 100, overrides)).wait();
  console.log('   LoyaltyPoints: pointsPer1iKAS(genesis-badge) = 100');
  let krexTokenAddress = process.env.KREX_TOKEN_ADDRESS?.trim();
  if (!krexTokenAddress) {
    const revTreePath = path.join(__dirname, '..', 'deployments', 'revenue-tree-igraMainnet.json');
    if (fs.existsSync(revTreePath)) {
      const revTree = JSON.parse(fs.readFileSync(revTreePath, 'utf8'));
      if (revTree.tKREX) {
        krexTokenAddress = revTree.tKREX;
        console.log('   Using tKREX from deployments/revenue-tree-igraMainnet.json:', krexTokenAddress);
      }
    }
  }
  if (krexTokenAddress) {
    const currentKrex = await loyaltyPoints.krexToken();
    if (currentKrex.toLowerCase() !== krexTokenAddress.toLowerCase()) {
      await (await loyaltyPoints.setKREXToken(krexTokenAddress, overrides)).wait();
      console.log('   LoyaltyPoints: KREX token set (tier multiplier active for tGRID + XP for all dApps using this LoyaltyPoints)');
    } else {
      console.log('   LoyaltyPoints: KREX token already set (multipliers active)');
    }
  } else {
    console.log('   WARNING: LoyaltyPoints KREX token not set â€” rewards will be 1x only. To fix:');
    console.log('     1. Set KREX_TOKEN_ADDRESS to your tKREX address, or');
    console.log('     2. Ensure deployments/revenue-tree-igraMainnet.json contains "tKREX", or');
    console.log('     3. Run: npx hardhat run scripts/set-loyalty-krex-token.js --network igraMainnet');
  }

  // 4. Write deployment output
  const out = {
    network: 'igraMainnet',
    chainId: 38833,
    GenesisBadge: genesisBadgeAddress,
    FeeRouter: feeRouterAddress,
    LoyaltyPoints: loyaltyPointsAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'genesis-badge-igra-galleon-testnet.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('\nWrote:', outPath);

  console.log('\n--- Add to .env and Vercel ---');
  console.log('NEXT_PUBLIC_GENESIS_BADGE_ADDRESS_IGRA_MAINNET=' + genesisBadgeAddress);
  console.log('NEXT_PUBLIC_GENESIS_BADGE_ADDRESS_38833=' + genesisBadgeAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
