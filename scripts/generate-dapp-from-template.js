/**
 * dApp Generator Script
 * 
 * This script generates a new dApp from templates by prompting for values
 * and replacing placeholders in template files.
 * 
 * Usage:
 *   node scripts/generate-dapp-from-template.js
 * 
 * The script will:
 * 1. Prompt for dApp information
 * 2. Generate contract file
 * 3. Generate hook file
 * 4. Generate widget component file
 * 5. Generate deployment script
 * 6. Provide integration instructions
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function replacePlaceholders(content, replacements) {
  let result = content;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

async function main() {
  console.log('🚀 dApp Generator\n');
  console.log('This script will help you generate a new dApp from templates.\n');
  console.log('📝 Fill in what you know - the system will handle the rest!\n');

  // Collect dApp description (used during build process)
  console.log('=== dApp Description (Fill This First) ===\n');
  const dappDescriptionFull = await question('What is your dApp? (Full description): ');
  const problemSolved = await question('What problem does it solve?: ');
  const targetUsers = await question('Who is it for?: ');
  const keyFeatures = await question('Key Features (one per line, empty line to finish):\n');
  const userFlow = await question('User Flow (step-by-step): ');
  const additionalNotes = await question('Additional Notes (optional): ');

  console.log('\n=== Basic Information ===\n');
  // Collect basic information
  const dappName = await question('dApp Name (e.g., "My Awesome dApp"): ');
  const dappSlug = await question(`dApp Slug (default: ${toKebabCase(dappName)}): `) || toKebabCase(dappName);
  const category = await question('Category (payment/governance/social/defi/general): ') || 'general';
  const version = await question('Version (default: 1.0.0): ') || '1.0.0';
  const description = await question('Brief Description: ') || dappDescriptionFull.substring(0, 200);
  const utility = await question('Utility (one-line): ') || problemSolved.substring(0, 100);
  const process = await question('Process (how users interact): ') || userFlow;
  const benefits = await question('Benefits: ');

  const contractName = await question(`Contract Name (default: ${toPascalCase(dappSlug)}): `) || toPascalCase(dappSlug);
  const contractDescription = await question('Contract Description: ') || `${contractName} smart contract`;
  const contractNotice = await question('Contract Notice: ') || `Allows users to interact with ${dappName}`;

  const hookName = await question(`Hook Name (default: use${toPascalCase(dappSlug)}): `) || `use${toPascalCase(dappSlug)}`;
  const widgetName = await question(`Widget Name (default: ${toPascalCase(dappSlug)}Widget): `) || `${toPascalCase(dappSlug)}Widget`;
  const itemInterface = await question('Item Interface Name (default: Item): ') || 'Item';

  const developerName = await question('Developer Name (default: Kasparex): ') || 'Kasparex';
  const developerWebsite = await question('Developer Website: ') || 'https://www.kasparex.com';
  const developerTelegram = await question('Developer Telegram: ') || 'https://t.me/kasparex';
  const developerTwitter = await question('Developer Twitter/X: ') || 'https://x.com/kasparex';

  const status = await question('Status (Testnet/Mainnet, default: Testnet): ') || 'Testnet';
  const network = await question('Network (default: Kasplex L2 Testnet): ') || 'Kasplex L2 Testnet';
  const chainIds = await question('Supported Chain IDs (comma-separated, default: 167012,19416): ') || '167012,19416';
  console.log('\n   Note: Default includes both Kasplex L2 Testnet (167012) and Igra Caravel Testnet (19416)');

  console.log('\n📋 Summary:');
  console.log(`   Name: ${dappName}`);
  console.log(`   Slug: ${dappSlug}`);
  console.log(`   Contract: ${contractName}`);
  console.log(`   Hook: ${hookName}`);
  console.log(`   Widget: ${widgetName}`);
  console.log('');

  const confirm = await question('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  // Prepare replacements
  const replacements = {
    // dApp Description (used during build process)
    DAPP_DESCRIPTION_FULL: dappDescriptionFull || description,
    PROBLEM_SOLVED: problemSolved || utility,
    TARGET_USERS: targetUsers || 'General users',
    KEY_FEATURES: keyFeatures || '- Feature 1\n- Feature 2\n- Feature 3',
    USER_FLOW: userFlow || process,
    ADDITIONAL_NOTES: additionalNotes || 'None',
    // Basic Information
    CONTRACT_NAME: contractName,
    CONTRACT_DESCRIPTION: contractDescription,
    CONTRACT_NOTICE: contractNotice,
    DAPP_NAME: dappName,
    DAPP_SLUG: dappSlug,
    DAPP_DESCRIPTION: description,
    CATEGORY: category,
    VERSION: version,
    UTILITY: utility,
    PROCESS: process,
    BENEFITS: benefits,
    HookName: hookName,
    WidgetName: widgetName,
    ItemInterface: itemInterface,
    DEVELOPER_NAME: developerName,
    DEVELOPER_WEBSITE: developerWebsite,
    DEVELOPER_TELEGRAM: developerTelegram,
    DEVELOPER_TWITTER: developerTwitter,
    STATUS: status,
    NETWORK_NAME: network,
    CHAIN_IDS: `[${chainIds.split(',').map(id => id.trim()).join(', ')}]`,
    contractName: toCamelCase(contractName),
    'contract-name': toKebabCase(contractName),
    ACTION_BUTTON_TEXT: 'Create Item', // Default, user can change
    // Default configurations
    FEE_PERCENTAGE: '100', // 1% default
    FEE_AMOUNT: '100000000000000000', // 0.1 KAS default
  };

  // Read templates
  const templatesDir = path.join(__dirname, '..', 'templates');
  const contractsDir = path.join(__dirname, '..', 'contracts');
  const hooksDir = path.join(__dirname, '..', 'src', 'hooks');
  const componentsDir = path.join(__dirname, '..', 'src', 'components', 'dapps');
  const scriptsDir = path.join(__dirname, '..', 'scripts');

  try {
    // Generate contract
    console.log('\n1️⃣  Generating contract...');
    const contractTemplate = fs.readFileSync(
      path.join(templatesDir, 'contracts', 'DAppTemplate.sol'),
      'utf8'
    );
    const contractContent = replacePlaceholders(contractTemplate, replacements);
    const contractFile = path.join(contractsDir, `${contractName}.sol`);
    fs.writeFileSync(contractFile, contractContent);
    console.log(`   ✅ Created: ${contractFile}`);

    // Generate hook
    console.log('\n2️⃣  Generating hook...');
    const hookTemplate = fs.readFileSync(
      path.join(templatesDir, 'hooks', 'useDAppTemplate.ts'),
      'utf8'
    );
    const hookContent = replacePlaceholders(hookTemplate, replacements);
    const hookFile = path.join(hooksDir, `${hookName}.ts`);
    fs.writeFileSync(hookFile, hookContent);
    console.log(`   ✅ Created: ${hookFile}`);

    // Generate widget
    console.log('\n3️⃣  Generating widget component...');
    const widgetTemplate = fs.readFileSync(
      path.join(templatesDir, 'components', 'DAppWidgetTemplate.tsx'),
      'utf8'
    );
    const widgetContent = replacePlaceholders(widgetTemplate, replacements);
    const widgetFile = path.join(componentsDir, `${widgetName}.tsx`);
    fs.writeFileSync(widgetFile, widgetContent);
    console.log(`   ✅ Created: ${widgetFile}`);

    // Generate deployment script
    console.log('\n4️⃣  Generating deployment script...');
    const deployTemplate = fs.readFileSync(
      path.join(templatesDir, 'scripts', 'deploy-dapp-template.js'),
      'utf8'
    );
    const deployContent = replacePlaceholders(deployTemplate, replacements);
    const deployFile = path.join(scriptsDir, `deploy-${toKebabCase(contractName)}.js`);
    fs.writeFileSync(deployFile, deployContent);
    console.log(`   ✅ Created: ${deployFile}`);

    // Generate integration instructions
    console.log('\n5️⃣  Generating integration instructions...');
    const instructions = `
# Integration Instructions for ${dappName}

## Files Generated

1. Contract: \`contracts/${contractName}.sol\`
2. Hook: \`src/hooks/${hookName}.ts\`
3. Widget: \`src/components/dapps/${widgetName}.tsx\`
4. Deployment Script: \`scripts/deploy-${toKebabCase(contractName)}.js\`

## Next Steps

1. **Review Generated Files**
   - Check all generated files and customize as needed
   - Replace TODO comments with your implementation
   - Remove unused code sections

2. **Add Contract ABI**
   - Compile contract: \`npx hardhat compile\`
   - Copy ABI from \`artifacts/contracts/${contractName}.sol/${contractName}.json\`
   - Add to \`src/lib/contracts/abis.ts\` as \`export const ${contractName.toUpperCase()}_ABI = [...]\`

3. **Add Contract Address** (after deployment)
   - Add to \`src/lib/contracts/addresses.ts\`
   - Add to \`HARDCODED_FALLBACK_ADDRESSES\` and \`DEFAULT_CONTRACT_ADDRESSES\`

4. **Register dApp**
   - Add entry to \`src/lib/dapps.ts\` in \`placeholderDApps\` array
   - Use slug: \`${dappSlug}\`
   - Use ID: Generate unique ID (e.g., next available number)

5. **Integrate Widget**
   - Add import to \`src/components/DAppWidget.tsx\`
   - Add conditional rendering based on \`dapp.slug === '${dappSlug}'\`

6. **Deploy Contract**
   - Set up \`.env\` with required addresses
   - Run: \`npx hardhat run scripts/deploy-${toKebabCase(contractName)}.js --network kasplexL2Testnet\`
   - Update contract address in \`addresses.ts\`

7. **Test**
   - Follow checklist in \`templates/integration-checklist.md\`
   - Test all functionality
   - Test mobile responsiveness
   - Test error handling

## Template Placeholders Replaced

All \`{{PLACEHOLDER}}\` values have been replaced. You may need to:
- Customize contract logic
- Implement hook functions
- Customize widget UI
- Update deployment script parameters

## Reference

- See \`docs/DAPP_BUILDING_GUIDE.md\` for detailed instructions
- See \`templates/integration-checklist.md\` for integration checklist
- See DAO Voting dApp for complete example

Good luck! 🚀
`;
    const instructionsFile = path.join(__dirname, '..', `${dappSlug}-INTEGRATION.md`);
    fs.writeFileSync(instructionsFile, instructions);
    console.log(`   ✅ Created: ${instructionsFile}`);

    console.log('\n✅ Generation Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Review generated files');
    console.log('   2. Customize contract, hook, and widget');
    console.log('   3. Follow integration checklist');
    console.log('   4. Deploy and test');
    console.log(`\n   See ${instructionsFile} for detailed instructions.\n`);

  } catch (error) {
    console.error('\n❌ Error generating files:');
    console.error(error);
    process.exit(1);
  }

  rl.close();
}

main();

