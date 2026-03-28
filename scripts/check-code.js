/**
 * Checks deployed bytecode for latest Revenue Tree deployment on the selected network.
 *
 * Usage:
 *   npx hardhat run scripts/check-code.js --network igraMainnet
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const provider = hre.ethers.provider;
  const network = hre.network.name;
  const deployPath = path.join(__dirname, "..", "deployments", `revenue-tree-${network}.json`);
  if (!fs.existsSync(deployPath)) {
    throw new Error(`Missing deployment file: ${deployPath}`);
  }
  const deployed = JSON.parse(fs.readFileSync(deployPath, "utf8"));
  const addrs = [
    deployed.tKREX,
    deployed.RevenueTreeManager,
    deployed.FeeRouter,
  ].filter((a) => typeof a === "string" && a.startsWith("0x"));

  const net = await provider.getNetwork();
  console.log("chainId", net.chainId.toString());
  for (const a of addrs) {
    const code = await provider.getCode(a);
    console.log(a, code && code !== "0x" ? `codeBytes=${(code.length - 2) / 2}` : "NO_CODE");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

