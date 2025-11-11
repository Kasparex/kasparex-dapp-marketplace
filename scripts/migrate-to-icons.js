/**
 * Migration Script: Remove Image Dependencies
 * Converts existing dApp/user data to use icon system instead of images
 */

const fs = require('fs');
const path = require('path');

const DAPPS_FILE = path.join(__dirname, '../src/lib/dapps.ts');
const PUBLIC_IMG_DIR = path.join(__dirname, '../public/img');

/**
 * Remove image references from dApp data
 */
function migrateDAppsToIcons() {
  console.log('Migrating dApps to icon system...');
  
  try {
    let content = fs.readFileSync(DAPPS_FILE, 'utf8');
    
    // Remove image, featuredImage fields from DApp interface (keep for backward compat but mark as deprecated)
    // Remove image URLs from placeholderDApps
    const imageFieldRegex = /(image|featuredImage)\s*[:?]\s*string[^;]*;?/g;
    content = content.replace(imageFieldRegex, '// Deprecated: Use icon system instead\n  // $&');
    
    // Remove image values from dApp objects
    const imageValueRegex = /(image|featuredImage)\s*:\s*['"`][^'"`]*['"`],?\s*\n/g;
    content = content.replace(imageValueRegex, '');
    
    fs.writeFileSync(DAPPS_FILE, content, 'utf8');
    console.log('✓ Updated dApps.ts');
  } catch (error) {
    console.error('Error migrating dApps:', error);
  }
}

/**
 * Create migration report
 */
function createMigrationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    migrated: {
      dapps: 'Converted to icon system',
      images: 'Removed image dependencies',
    },
    nextSteps: [
      'Update components to use DAppIcon, TokenIcon, UserIcon',
      'Remove ImagePreview component usage',
      'Update EditDAppModal to use icon selector',
      'Update ProfileEditModal to use icon/color picker',
    ],
  };
  
  const reportPath = path.join(__dirname, '../MIGRATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('✓ Created migration report:', reportPath);
}

/**
 * Main migration function
 */
function main() {
  console.log('Starting migration to icon system...\n');
  
  migrateDAppsToIcons();
  createMigrationReport();
  
  console.log('\n✓ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Update components to use icon components');
  console.log('2. Remove image upload functionality');
  console.log('3. Test icon generation');
}

if (require.main === module) {
  main();
}

module.exports = { migrateDAppsToIcons, createMigrationReport };

