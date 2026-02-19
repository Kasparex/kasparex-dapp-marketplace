/**
 * Deploy tGRID (Test GRID Token) on IGRA Galleon Testnet (38836).
 *
 * Usage:
 *   npx hardhat run scripts/deploy-tgrid.js --network igraGalleonTestnet
 *
 * Env:
 *   PRIVATE_KEY - deployer
 *   REWARD_VAULT - address to receive pre-minted supply (default: deployer)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function getFeeOverrides(chainId) {
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
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log('Deploying tGRID with account:', deployer.address);
  console.log('Network:', network, 'Chain ID:', Number(chainId));

  const rewardVault = process.env.REWARD_VAULT || deployer.address;
  const overrides = getFeeOverrides(chainId);

  console.log('Deploying tGRID...');
  const tGRID = await hre.ethers.getContractFactory('tGRID');
  const address = await deployNoEstimate(tGRID, [rewardVault], overrides);

  console.log('tGRID deployed at:', address);
  console.log('Reward vault:', rewardVault);

  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `tgrid-${network}.json`);
  const payload = {
    network,
    chainId: Number(chainId),
    tGRID: address,
    rewardVault,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log('Wrote', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
