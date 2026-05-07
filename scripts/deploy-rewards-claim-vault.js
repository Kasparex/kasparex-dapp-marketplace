/**
 * Deploy RewardsClaimVault (immutable claimSigner).
 *
 * Usage:
 *   CLAIM_SIGNER=0x... npx hardhat run scripts/deploy-rewards-claim-vault.js --network kasplexL2Mainnet
 *   CLAIM_SIGNER=0x... npx hardhat run scripts/deploy-rewards-claim-vault.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const claimSigner = process.env.CLAIM_SIGNER?.trim();
  if (!claimSigner || !hre.ethers.isAddress(claimSigner)) {
    throw new Error('Set CLAIM_SIGNER to the EOA that will sign EIP-712 vouchers (must match Worker VOUCHER_SIGNER_PRIVATE_KEY)');
  }

  const Fact = await hre.ethers.getContractFactory('RewardsClaimVault');
  const vault = await Fact.deploy(claimSigner);
  await vault.waitForDeployment();
  const addr = await vault.getAddress();
  const net = await hre.ethers.provider.getNetwork();

  console.log('RewardsClaimVault deployed');
  console.log('  address:', addr);
  console.log('  claimSigner:', claimSigner);
  console.log('  chainId:', net.chainId.toString());
  console.log('');
  console.log('Next: set Worker secret REWARDS_CLAIM_VAULT_ADDRESS=', addr);
  console.log('      set VOUCHER_CHAIN_ID=', net.chainId.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
