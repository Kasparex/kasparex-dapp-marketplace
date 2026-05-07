/**
 * Generate a fresh EOA for RewardsClaimVault CLAIM_SIGNER / VOUCHER_SIGNER_PRIVATE_KEY.
 *
 * Run:  node scripts/generate-vault-signer.js
 *
 * Copy BOTH lines into a password manager, then set Cloudflare secret VOUCHER_SIGNER_PRIVATE_KEY
 * and deploy with CLAIM_SIGNER=<printed address>. Never commit this output.
 */

const { Wallet } = require('ethers');

const w = Wallet.createRandom();

console.log('');
console.log('=== SAVE IN PASSWORD MANAGER NOW (do not commit, do not paste in public chat) ===');
console.log('CLAIM_SIGNER=' + w.address);
console.log('VOUCHER_SIGNER_PRIVATE_KEY=' + w.privateKey);
console.log('');
console.log('Deploy on Igra (after .env has deployer PRIVATE_KEY for gas):');
console.log(
  '  CLAIM_SIGNER=' + w.address + ' npx hardhat run scripts/deploy-rewards-claim-vault.js --network igraMainnet',
);
console.log('  (PowerShell: $env:CLAIM_SIGNER="' + w.address + '"; npx hardhat run scripts/deploy-rewards-claim-vault.js --network igraMainnet)');
console.log('');
console.log('Then Cloudflare secrets: VOUCHER_SIGNER_PRIVATE_KEY (above), REWARDS_CLAIM_VAULT_ADDRESS (printed deploy), VOUCHER_CHAIN_ID=38833, IGRA_RPC_URL=your Igra RPC');
console.log('');
