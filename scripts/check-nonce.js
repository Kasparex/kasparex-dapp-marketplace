/**
 * Debug helper: prints deployer address, chainId, block, nonces.
 *
 * Usage:
 *   npx hardhat run scripts/check-nonce.js --network igraMainnet
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;
  const net = await provider.getNetwork();
  const block = await provider.getBlockNumber();
  const nonceLatest = await provider.getTransactionCount(deployer.address, "latest");
  const noncePending = await provider.getTransactionCount(deployer.address, "pending");

  console.log("deployer", deployer.address);
  console.log("chainId", net.chainId.toString());
  console.log("block", block);
  console.log("nonceLatest", nonceLatest);
  console.log("noncePending", noncePending);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

