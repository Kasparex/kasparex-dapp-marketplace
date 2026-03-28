/**
 * Set LoyaltyPoints KREX token so tier multipliers apply to tGRID and XP for all dApps using this LoyaltyPoints.
 * Use when contracts are already deployed and multipliers are not applied (e.g. Genesis Badge shows 1x rewards).
 *
 * Usage:
 *   npx hardhat run scripts/set-loyalty-krex-token.js --network igraMainnet
 *
 * Env:
 *   PRIVATE_KEY - wallet that is owner of LoyaltyPoints
 *   LOYALTY_POINTS_ADDRESS - (optional) default for 38836: 0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936
 *   KREX_TOKEN_ADDRESS - (optional) tKREX address; for 38836 defaults to deployments/revenue-tree-igraMainnet.json tKREX
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const LOYALTY_POINTS_38836 = '0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936';

function getFeeOverrides(chainId) {
  if (Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  const overrides = getFeeOverrides(chainId);

  let loyaltyPointsAddress = process.env.LOYALTY_POINTS_ADDRESS?.trim();
  if (!loyaltyPointsAddress && Number(chainId) === 38833) {
    loyaltyPointsAddress = LOYALTY_POINTS_38836;
    console.log('Using default LoyaltyPoints for 38836:', loyaltyPointsAddress);
  }
  if (!loyaltyPointsAddress) {
    console.error('Set LOYALTY_POINTS_ADDRESS or run on network igraMainnet (38833).');
    process.exit(1);
  }

  let krexTokenAddress = process.env.KREX_TOKEN_ADDRESS?.trim();
  if (!krexTokenAddress && Number(chainId) === 38833) {
    const revTreePath = path.join(__dirname, '..', 'deployments', 'revenue-tree-igraMainnet.json');
    if (fs.existsSync(revTreePath)) {
      const revTree = JSON.parse(fs.readFileSync(revTreePath, 'utf8'));
      if (revTree.tKREX) {
        krexTokenAddress = revTree.tKREX;
        console.log('Using tKREX from deployments/revenue-tree-igraMainnet.json:', krexTokenAddress);
      }
    }
  }
  if (!krexTokenAddress) {
    console.error('Set KREX_TOKEN_ADDRESS (e.g. tKREX on 38836: 0x305B4ee627aD8b12bFCF6427453964771aA30622).');
    process.exit(1);
  }

  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  const currentKrex = await loyaltyPoints.krexToken();
  if (currentKrex.toLowerCase() === krexTokenAddress.toLowerCase()) {
    console.log('LoyaltyPoints KREX token already set. Multipliers are active.');
    return;
  }
  await (await loyaltyPoints.setKREXToken(krexTokenAddress, overrides)).wait();
  console.log('LoyaltyPoints.setKREXToken(%s) done. Tier multipliers now apply for tGRID and XP.', krexTokenAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
