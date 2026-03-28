/**
 * Verify that LoyaltyPoints has KREX token set so tier multipliers apply to tGRID and XP.
 * If not set, rewards are distributed at 1x only.
 *
 * Usage:
 *   npx hardhat run scripts/verify-reward-multipliers.js --network igraMainnet
 *
 * Env:
 *   LOYALTY_POINTS_ADDRESS - (optional) default for 38836 from script
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const LOYALTY_POINTS_38836 = '0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936';

async function main() {
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  let loyaltyPointsAddress = process.env.LOYALTY_POINTS_ADDRESS?.trim();
  if (!loyaltyPointsAddress && Number(chainId) === 38833) {
    loyaltyPointsAddress = LOYALTY_POINTS_38836;
  }
  if (!loyaltyPointsAddress) {
    console.error('Set LOYALTY_POINTS_ADDRESS or run on network igraMainnet (38833).');
    process.exit(1);
  }

  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  const krexTokenAddress = await loyaltyPoints.krexToken();

  const zero = '0x0000000000000000000000000000000000000000';
  if (!krexTokenAddress || krexTokenAddress === zero) {
    console.log('LoyaltyPoints KREX token is NOT set. Rewards are distributed at 1x (no tier multiplier).');
    console.log('');
    console.log('To enable tier multipliers (tGRID and XP scaled by tKREX balance), run:');
    console.log('  npx hardhat run scripts/set-loyalty-krex-token.js --network igraMainnet');
    console.log('');
    console.log('Optionally set KREX_TOKEN_ADDRESS (tKREX). On 38836 the script uses tKREX from deployments/revenue-tree-igraMainnet.json if present.');
    process.exit(1);
  }

  console.log('LoyaltyPoints KREX token is set. Tier multipliers are active.');
  console.log('  krexToken:', krexTokenAddress);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
