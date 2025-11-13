#!/usr/bin/env node

/**
 * GitBook Sync CLI Tool
 * 
 * Command-line interface for syncing dApp documentation to GitBook
 */

const { SyncService } = require('./sync-service');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
// Load .env.local first, then .env
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompt for input
 */
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Load GitBook config from environment or prompt
 */
async function loadConfig() {
  // Load from .env.local first
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }

  let apiToken = process.env.GITBOOK_API_TOKEN;
  let spaceId = process.env.GITBOOK_SPACE_ID;
  let organizationId = process.env.GITBOOK_ORGANIZATION_ID;

  // If not in env, prompt for credentials
  if (!apiToken) {
    console.log('\n📝 GitBook API Setup');
    console.log('You need to provide your GitBook API credentials.');
    console.log('See docs/GITBOOK_SETUP.md for instructions on obtaining these.\n');
    
    apiToken = await question('GitBook API Token: ');
  }

  if (!spaceId) {
    spaceId = await question('GitBook Space ID: ');
  }

  if (!organizationId) {
    const hasOrg = await question('Do you have an Organization ID? (y/n): ');
    if (hasOrg.toLowerCase() === 'y') {
      organizationId = await question('Organization ID: ');
    }
  }

  if (!apiToken || !spaceId) {
    throw new Error('GitBook API Token and Space ID are required');
  }

  return {
    apiToken,
    spaceId,
    organizationId,
  };
}

/**
 * Save config to .env.local
 */
async function saveConfig(config) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add GitBook config
  const lines = envContent.split('\n');
  const newLines = [];
  let gitbookFound = false;

  for (const line of lines) {
    if (line.startsWith('GITBOOK_')) {
      gitbookFound = true;
      if (line.startsWith('GITBOOK_API_TOKEN=')) {
        newLines.push(`GITBOOK_API_TOKEN=${config.apiToken}`);
      } else if (line.startsWith('GITBOOK_SPACE_ID=')) {
        newLines.push(`GITBOOK_SPACE_ID=${config.spaceId}`);
      } else if (line.startsWith('GITBOOK_ORGANIZATION_ID=')) {
        if (config.organizationId) {
          newLines.push(`GITBOOK_ORGANIZATION_ID=${config.organizationId}`);
        }
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  if (!gitbookFound) {
    newLines.push('');
    newLines.push('# GitBook API Configuration');
    newLines.push(`GITBOOK_API_TOKEN=${config.apiToken}`);
    newLines.push(`GITBOOK_SPACE_ID=${config.spaceId}`);
    if (config.organizationId) {
      newLines.push(`GITBOOK_ORGANIZATION_ID=${config.organizationId}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('\n✅ Configuration saved to .env.local');
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  try {
    switch (command) {
      case 'setup':
        console.log('🔧 GitBook Setup');
        const config = await loadConfig();
        await saveConfig(config);
        
        // Test connection
        const service = new SyncService(config);
        await service.initialize();
        console.log('\n✅ Setup complete! You can now use: npm run gitbook:sync');
        break;

      case 'sync':
        const syncConfig = await loadConfig();
        const syncService = new SyncService(syncConfig);
        await syncService.initialize();

        // Parse arguments: --dapp "name"
        let dappArg = null;
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--dapp' && args[i + 1]) {
            dappArg = args[i + 1];
            i++;
          } else if (!args[i].startsWith('--')) {
            // Positional argument (backward compatibility)
            dappArg = args[i];
          }
        }

        if (dappArg) {
          // Sync specific dApp by name
          const dApps = syncService.dataAggregator.loadDAppsConfig();
          const dApp = dApps.find((d) => 
            d.name.toLowerCase() === dappArg.toLowerCase()
          );
          if (dApp) {
            await syncService.syncDAppFromConfig(dApp);
          } else {
            console.error(`❌ dApp "${dappArg}" not found in frontend config`);
          }
        } else {
          // Sync all dApps from frontend config
          await syncService.syncAllDApps();
        }
        break;

      case 'test':
        const testConfig = await loadConfig();
        const testService = new SyncService(testConfig);
        const connected = await testService.initialize();
        if (connected) {
          console.log('\n✅ Connection test successful!');
        }
        break;

      case 'help':
      default:
        console.log(`
GitBook Sync CLI

Usage:
  node scripts/gitbook-sync/cli.js <command> [options]

Commands:
  setup              Interactive setup for GitBook API credentials
  sync [dapp]        Sync all dApps or a specific dApp to GitBook
  test               Test GitBook API connection
  help               Show this help message

Examples:
  node scripts/gitbook-sync/cli.js setup
  node scripts/gitbook-sync/cli.js sync
  node scripts/gitbook-sync/cli.js sync "Quiz to Earn"
  node scripts/gitbook-sync/cli.js sync "Quiz to Earn" kasplexL2Mainnet
  node scripts/gitbook-sync/cli.js test

Environment Variables:
  GITBOOK_API_TOKEN       GitBook API token
  GITBOOK_SPACE_ID        GitBook Space ID
  GITBOOK_ORGANIZATION_ID GitBook Organization ID (optional)
        `);
        break;
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

