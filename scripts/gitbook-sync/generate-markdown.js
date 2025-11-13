/**
 * Generate Markdown Files for GitBook
 * 
 * Since GitBook API doesn't support direct content creation,
 * this script generates markdown files that can be synced via Git
 * or manually uploaded to GitBook
 */

const { DataAggregator } = require('./data-aggregator');
const { DocumentationGenerator } = require('./generator');
const fs = require('fs');
const path = require('path');

class MarkdownGenerator {
  constructor(outputDir = './gitbook-docs') {
    this.outputDir = outputDir;
    this.dataAggregator = new DataAggregator();
    this.generator = new DocumentationGenerator();
  }

  /**
   * Initialize - create output directory
   */
  initialize() {
    this.dataAggregator.initialize();
    
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Create subdirectories
    const subdirs = ['dapps', 'integration'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Generate all documentation files
   */
  async generateAll() {
    console.log(`\n📝 Generating markdown documentation...`);
    console.log(`   Output directory: ${this.outputDir}\n`);

    // Load dApps from frontend config
    const dApps = this.dataAggregator.loadDAppsConfig();
    
    if (!dApps || dApps.length === 0) {
      console.log('   No dApps found in frontend config');
      return;
    }

    console.log(`   Found ${dApps.length} dApp(s)`);

    let successCount = 0;
    let failCount = 0;

    for (const dApp of dApps) {
      try {
        // Generate dApp page
        const dAppPageContent = this.generator.generateDAppPage(dApp);
        const dAppSlug = this.generator.slugify(dApp.name);
        const dAppPath = path.join(this.outputDir, 'dapps', `${dAppSlug}.md`);
        fs.writeFileSync(dAppPath, dAppPageContent, 'utf-8');
        console.log(`   ✅ Generated: dapps/${dAppSlug}.md`);

        // Generate integration guide
        const integrationPageContent = this.generator.generateIntegrationGuide(
          dApp,
          {
            name: dApp.name,
            address: dApp.contractAddress || '',
            abi: null,
            networkName: dApp.network || 'Testnet',
          }
        );
        const integrationPath = path.join(this.outputDir, 'integration', `${dAppSlug}.md`);
        fs.writeFileSync(integrationPath, integrationPageContent, 'utf-8');
        console.log(`   ✅ Generated: integration/${dAppSlug}.md`);

        successCount++;
      } catch (error) {
        console.error(`   ❌ Error generating docs for ${dApp.name}:`, error.message);
        failCount++;
      }
    }

    // Generate README/index
    this.generateIndex(dApps);

    console.log(`\n✅ Generation complete: ${successCount} succeeded, ${failCount} failed`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Review the generated files in: ${this.outputDir}`);
    console.log(`   2. Sync to GitBook via Git (if Git sync is enabled)`);
    console.log(`   3. Or manually upload/copy the files to GitBook`);
  }

  /**
   * Generate index/README
   */
  generateIndex(dApps) {
    const indexContent = `# Kasparex dApp Marketplace Documentation

Welcome to the Kasparex dApp Marketplace documentation. This documentation is automatically generated from the marketplace configuration.

## Available dApps

${dApps.map(dApp => {
  const slug = this.generator.slugify(dApp.name);
  return `- [${dApp.name}](./dapps/${slug}.md) - ${dApp.description || dApp.utility}`;
}).join('\n')}

## Categories

${[...new Set(dApps.map(d => d.category))].map(cat => {
  const categoryDApps = dApps.filter(d => d.category === cat);
  return `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n${categoryDApps.map(d => {
    const slug = this.generator.slugify(d.name);
    return `- [${d.name}](./dapps/${slug}.md)`;
  }).join('\n')}`;
}).join('\n\n')}

## Integration Guides

${dApps.map(dApp => {
  const slug = this.generator.slugify(dApp.name);
  return `- [${dApp.name} Integration Guide](./integration/${slug}.md)`;
}).join('\n')}

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

    const indexPath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`   ✅ Generated: README.md`);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new MarkdownGenerator();
  generator.initialize();
  generator.generateAll().catch(console.error);
}

module.exports = { MarkdownGenerator };

