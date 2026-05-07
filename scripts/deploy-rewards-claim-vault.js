/**
 * Deploy RewardsClaimVault (immutable claimSigner).
 *
 * Before first deploy, generate and save a signer you control:
 *   npm run hardhat:gen:vault-signer
 * Put VOUCHER_SIGNER_PRIVATE_KEY and CLAIM_SIGNER in a password manager. Never deploy with a
 * CLAIM_SIGNER address unless you have that private key backed up.
 *
 * Kasparex product L2 is **Igra Mainnet** (chain id 38833) per hardhat `igraMainnet`.
 * `kasplexL2Mainnet` (202555) is a different chain: only deploy there if you intend Kasplex, not Igra.
 *
 * Usage (production on Igra):
 *   CLAIM_SIGNER=0x... npx hardhat run scripts/deploy-rewards-claim-vault.js --network igraMainnet
 *
 * Other networks:
 *   ... --network kasplexL2Mainnet
 *   ... --network kasplexL2Testnet
 */

const hre = require('hardhat');

function feeOverrides(chainId) {
  if (Number(chainId) === 38836 || Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function deployContract(factory, args, overrides) {
  const txReq = await factory.getDeployTransaction(...args);
  if (!txReq.gasLimit) txReq.gasLimit = 4_000_000n;
  const signer = factory.runner;
  const sent = await signer.sendTransaction({ ...txReq, ...overrides });
  console.log('  tx:', sent.hash);
  const receipt = await Promise.race([
    sent.wait(),
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error('Transaction confirmation timeout (120s)')), 120000),
    ),
  ]);
  if (!receipt || receipt.status !== 1) throw new Error('Deployment transaction failed');
  const address = receipt.contractAddress;
  if (!address) throw new Error('No contractAddress in receipt');
  return address;
}

async function main() {
  const claimSigner = process.env.CLAIM_SIGNER?.trim();
  if (!claimSigner || !hre.ethers.isAddress(claimSigner)) {
    throw new Error('Set CLAIM_SIGNER to the EOA that will sign EIP-712 vouchers (must match Worker VOUCHER_SIGNER_PRIVATE_KEY)');
  }

  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const ov = feeOverrides(net.chainId);

  console.log('Deployer:', deployer.address);
  console.log('Network chainId:', net.chainId.toString());
  console.log('RewardsClaimVault deploying…');

  const Fact = await hre.ethers.getContractFactory('RewardsClaimVault', deployer);
  const addr = await deployContract(Fact, [claimSigner], ov);

  console.log('RewardsClaimVault deployed');
  console.log('  address:', addr);
  console.log('  claimSigner:', claimSigner);
  console.log('  chainId:', net.chainId.toString());
  console.log('');
  console.log('Next: set Worker secret REWARDS_CLAIM_VAULT_ADDRESS=' + addr);
  console.log('      set IGRA_RPC_URL=https://rpc.igralabs.com:8545 (or your Igra RPC)');
  console.log('      set VOUCHER_CHAIN_ID=' + net.chainId.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
