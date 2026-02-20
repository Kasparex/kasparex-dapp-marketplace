/**
 * Fund RewardManager with tGRID on IGRA Galleon Testnet so that SimplePayment rewards (tGRID + XP) work.
 * Run after deploy-igra-galleon-testnet.js if RewardManager was not auto-funded (e.g. REWARD_VAULT != deployer).
 *
 * tGRID location (from deployments/tgrid-igraGalleonTestnet.json):
 *   - Contract: 0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
 *   - Pre-mint recipient (rewardVault): in that file; default = deployer 0x658420Fd88dbd610249a88384f9B1aD387F797c7
 *   So the wallet holding tGRID is rewardVault (or deployer if REWARD_VAULT was not set). Use its PRIVATE_KEY.
 *
 * Usage:
 *   npx hardhat run scripts/fund-reward-manager-igra-galleon.js --network igraGalleonTestnet
 *
 * Env:
 *   PRIVATE_KEY - wallet that holds tGRID (deployer / rewardVault from tgrid-igraGalleonTestnet.json)
 *   Optional: AMOUNT_WEI - tGRID amount in wei (default: 1000000e18)
 */

const hre = require('hardhat');
const path = require('path');
const fs = require('fs');

async function main() {
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  if (Number(chainId) !== 38836) {
    console.error('This script is for IGRA Galleon Testnet (chainId 38836) only.');
    process.exit(1);
  }

  const deploymentsPath = path.join(__dirname, '..', 'deployments');
  const deploymentFiles = fs.readdirSync(deploymentsPath).filter((f) => f.startsWith('igra-galleon-testnet') && f.endsWith('.json'));
  const latest = deploymentFiles.sort().reverse()[0];
  if (!latest) {
    console.error('No deployments/igra-galleon-testnet-*.json found. Run deploy-igra-galleon-testnet.js first.');
    process.exit(1);
  }
  const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsPath, latest), 'utf8'));
  const { tGRID: tgridAddress, RewardManager: rewardManagerAddress } = deployment;
  if (!tgridAddress || !rewardManagerAddress) {
    console.error('Deployment file missing tGRID or RewardManager.');
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  const overrides = { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  const amountWei = process.env.AMOUNT_WEI ? BigInt(process.env.AMOUNT_WEI) : BigInt(1000000) * 10n ** 18n;

  const tgrid = await hre.ethers.getContractAt('tGRID', tgridAddress);
  const balance = await tgrid.balanceOf(signer.address);
  if (balance < amountWei) {
    console.error(`Insufficient tGRID. Signer ${signer.address} has ${hre.ethers.formatEther(balance)} tGRID; need ${hre.ethers.formatEther(amountWei)}.`);
    process.exit(1);
  }

  console.log(`Transferring ${hre.ethers.formatEther(amountWei)} tGRID to RewardManager ${rewardManagerAddress}...`);
  const tx = await tgrid.transfer(rewardManagerAddress, amountWei, overrides);
  await tx.wait();
  console.log('Done. RewardManager is now funded; SimplePayment rewards (tGRID + XP) will work.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
