/**
 * vProgs Migration Script
 * Export/import utilities for migrating dApps and tokens to vProgs
 */

const fs = require('fs');
const path = require('path');

/**
 * Export dApp data for migration
 */
function exportDAppData(dAppId, contractData) {
  const exportData = {
    dAppId,
    name: contractData.name,
    version: contractData.version,
    category: contractData.category,
    contractAddress: contractData.contractAddress,
    deployer: contractData.deployer,
    tokenAddress: contractData.tokenAddress,
    ticker: contractData.ticker,
    totalSupply: contractData.totalSupply,
    ipfsCID: contractData.ipfsCID,
    exportedAt: new Date().toISOString(),
  };

  const exportPath = path.join(__dirname, '../exports', `dapp_${dAppId}_export.json`);
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

  return exportPath;
}

/**
 * Import dApp data for vProgs
 */
function importDAppData(exportPath) {
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  
  // Validate export data
  if (!exportData.dAppId || !exportData.name || !exportData.contractAddress) {
    throw new Error('Invalid export data');
  }

  return exportData;
}

/**
 * Export token data for migration
 */
function exportTokenData(tokenAddress, tokenData) {
  const exportData = {
    tokenAddress,
    name: tokenData.name,
    symbol: tokenData.symbol,
    totalSupply: tokenData.totalSupply,
    allocations: tokenData.allocations,
    exportedAt: new Date().toISOString(),
  };

  const exportPath = path.join(__dirname, '../exports', `token_${tokenAddress}_export.json`);
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

  return exportPath;
}

/**
 * Generate migration report
 */
function generateMigrationReport(exports) {
  const report = {
    timestamp: new Date().toISOString(),
    totalExports: exports.length,
    exports: exports.map(exp => ({
      type: exp.type,
      id: exp.id,
      exportPath: exp.path,
    })),
    nextSteps: [
      'Review exported data',
      'Deploy contracts to vProgs',
      'Import data using vProgs import functions',
      'Verify migration on vProgs network',
    ],
  };

  const reportPath = path.join(__dirname, '../exports', 'migration_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}

module.exports = {
  exportDAppData,
  importDAppData,
  exportTokenData,
  generateMigrationReport,
};

