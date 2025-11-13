/**
 * GitBook Sync Service
 * 
 * Orchestrates the sync process: aggregates data, generates docs, and updates GitBook
 */

const { DataAggregator } = require('./data-aggregator');
const { DocumentationGenerator } = require('./generator');
const { GitBookClient } = require('./gitbook-client');
const path = require('path');
const fs = require('fs');
// Load .env.local first, then .env
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
require('dotenv').config();

class SyncService {
  constructor(config) {
    this.config = config;
    this.gitbookClient = new GitBookClient(config);
    this.dataAggregator = new DataAggregator();
    this.generator = new DocumentationGenerator();
  }

  /**
   * Initialize services
   */
  async initialize() {
    this.dataAggregator.initialize();
    
    // Test GitBook connection
    const connected = await this.gitbookClient.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to GitBook API. Please check your credentials.');
    }
    
    console.log('✅ Connected to GitBook API');
  }

  /**
   * Sync a single dApp
   */
  async syncDApp(dAppId, networkName = 'kasplexL2Testnet') {
    console.log(`\n📝 Syncing dApp ID: ${dAppId}...`);

    try {
      // Aggregate data
      const dAppData = await this.dataAggregator.aggregateDAppData(dAppId, networkName);
      if (!dAppData) {
        console.error(`❌ Could not fetch dApp ${dAppId}`);
        return false;
      }

      console.log(`   Found: ${dAppData.name}`);

      // Generate documentation
      const dAppPageContent = this.generator.generateDAppPage(dAppData);
      
      // Generate contract reference if ABI is available
      let contractPageContent = null;
      if (dAppData.abi && dAppData.contractName) {
        contractPageContent = this.generator.generateContractReference({
          name: dAppData.contractName,
          address: dAppData.address || dAppData.contractAddress,
          abi: dAppData.abi,
          networkName: dAppData.networkName,
        });
      }

      // Generate integration guide
      const integrationPageContent = this.generator.generateIntegrationGuide(
        dAppData,
        {
          name: dAppData.contractName || dAppData.name,
          address: dAppData.address || dAppData.contractAddress,
          abi: dAppData.abi,
          networkName: dAppData.networkName,
        }
      );

      // Sync to GitBook
      const dAppSlug = this.generator.slugify(dAppData.name);
      const contractSlug = this.generator.slugify(dAppData.contractName || dAppData.name);

      // Create/update dApp page
      console.log(`   📄 Creating/updating dApp page: dapps/${dAppSlug}`);
      const dAppPageResult = await this.gitbookClient.createOrUpdatePage({
        title: dAppData.name,
        path: `dapps/${dAppSlug}`,
        content: dAppPageContent,
      });

      if (dAppPageResult.error) {
        console.error(`   ❌ Error syncing dApp page: ${dAppPageResult.error.message}`);
      } else {
        console.log(`   ✅ dApp page synced`);
      }

      // Create/update contract reference if available
      if (contractPageContent) {
        console.log(`   📄 Creating/updating contract reference: contracts/${contractSlug}`);
        const contractPageResult = await this.gitbookClient.createOrUpdatePage({
          title: `${dAppData.contractName} Contract Reference`,
          path: `contracts/${contractSlug}`,
          content: contractPageContent,
        });

        if (contractPageResult.error) {
          console.error(`   ❌ Error syncing contract page: ${contractPageResult.error.message}`);
        } else {
          console.log(`   ✅ Contract reference synced`);
        }
      }

      // Create/update integration guide
      console.log(`   📄 Creating/updating integration guide: integration/${dAppSlug}`);
      const integrationPageResult = await this.gitbookClient.createOrUpdatePage({
        title: `${dAppData.name} Integration Guide`,
        path: `integration/${dAppSlug}`,
        content: integrationPageContent,
      });

      if (integrationPageResult.error) {
        console.error(`   ❌ Error syncing integration guide: ${integrationPageResult.error.message}`);
      } else {
        console.log(`   ✅ Integration guide synced`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error syncing dApp ${dAppId}:`, error.message);
      return false;
    }
  }

  /**
   * Sync all dApps from frontend config
   */
  async syncAllDApps() {
    console.log(`\n🔄 Syncing all dApps from frontend config...`);

    try {
      // Load dApps from frontend config
      const dApps = this.dataAggregator.loadDAppsConfig();
      
      if (!dApps || dApps.length === 0) {
        console.log('   No dApps found in frontend config');
        return;
      }

      console.log(`   Found ${dApps.length} dApp(s) in frontend config`);

      let successCount = 0;
      let failCount = 0;

      for (const dApp of dApps) {
        const success = await this.syncDAppFromConfig(dApp);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`\n✅ Sync complete: ${successCount} succeeded, ${failCount} failed`);
    } catch (error) {
      console.error('❌ Error syncing all dApps:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single dApp from frontend config
   */
  async syncDAppFromConfig(dAppData) {
    console.log(`\n📝 Syncing dApp: ${dAppData.name}...`);

    try {
      // Generate documentation
      const dAppPageContent = this.generator.generateDAppPage(dAppData);
      
      // Generate integration guide
      const integrationPageContent = this.generator.generateIntegrationGuide(
        dAppData,
        {
          name: dAppData.name,
          address: dAppData.contractAddress || '',
          abi: null,
          networkName: dAppData.network || 'Testnet',
        }
      );

      // Sync to GitBook
      const dAppSlug = this.generator.slugify(dAppData.name);

      // Create/update dApp page
      console.log(`   📄 Creating/updating dApp page: dapps/${dAppSlug}`);
      const dAppPageResult = await this.gitbookClient.createOrUpdatePage({
        title: dAppData.name,
        path: `dapps/${dAppSlug}`,
        content: dAppPageContent,
      });

      if (dAppPageResult.error) {
        console.error(`   ❌ Error syncing dApp page: ${dAppPageResult.error.message}`);
        return false;
      } else {
        console.log(`   ✅ dApp page synced`);
      }

      // Create/update integration guide
      console.log(`   📄 Creating/updating integration guide: integration/${dAppSlug}`);
      const integrationPageResult = await this.gitbookClient.createOrUpdatePage({
        title: `${dAppData.name} Integration Guide`,
        path: `integration/${dAppSlug}`,
        content: integrationPageContent,
      });

      if (integrationPageResult.error) {
        console.error(`   ❌ Error syncing integration guide: ${integrationPageResult.error.message}`);
      } else {
        console.log(`   ✅ Integration guide synced`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error syncing dApp ${dAppData.name}:`, error.message);
      return false;
    }
  }

  /**
   * Sync specific dApp by name or ID
   */
  async syncDAppByName(name, networkName = 'kasplexL2Testnet') {
    const dApps = await this.dataAggregator.getAllDAppsFromContract(networkName);
    const dApp = dApps.find((d) => 
      d.name.toLowerCase() === name.toLowerCase() || 
      d.id.toString() === name
    );

    if (!dApp) {
      console.error(`❌ dApp "${name}" not found`);
      return false;
    }

    return this.syncDApp(dApp.id, networkName);
  }
}

module.exports = { SyncService };

