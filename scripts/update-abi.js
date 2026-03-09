const fs = require('fs');
const path = require('path');

const rootPath = process.cwd();
const abisPath = path.join(rootPath, 'src/lib/contracts/abis.ts');
const compiledPath = path.join(rootPath, 'artifacts/contracts/RevenueTreeManager.sol/RevenueTreeManager.json');

const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
const newAbiStr = 'export const REVENUE_TREE_MANAGER_ABI = ' + JSON.stringify(compiled.abi, null, 2) + ' as const;\n';

let abisContent = fs.readFileSync(abisPath, 'utf8');

const regex = /export const REVENUE_TREE_MANAGER_ABI\s*=\s*\[[\s\S]*?\](?: as const)?;/;
if (regex.test(abisContent)) {
    abisContent = abisContent.replace(regex, newAbiStr);
    fs.writeFileSync(abisPath, abisContent);
    console.log('ABI injected successfully!');
} else {
    console.log('Regex did not match perfectly. Appending to end instead.');
    fs.appendFileSync(abisPath, '\n' + newAbiStr);
}
