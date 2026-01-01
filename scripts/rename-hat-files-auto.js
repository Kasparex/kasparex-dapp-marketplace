/**
 * Rename Hat trait image files to match metadata pattern (AUTO VERSION)
 * Pattern: Remove "Hat" and "Cap" suffixes (like Green_Stylish_Hair.png)
 * Exception: Keep "Cap" if it's part of the name (e.g., "Snapback Cap" -> "Snapback_Cap")
 * 
 * This version runs automatically without confirmation prompt
 */

const fs = require('fs');
const path = require('path');

const HATS_FOLDER = path.join(__dirname, '../public/nft/PIXELKREX/Pixelkrex traits/HATS');

function renameHatFile(filename) {
  // Remove .png extension
  const nameWithoutExt = filename.replace(/\.png$/i, '');
  
  // If filename ends with "_Hat", remove it
  // Example: "Golden_Digger_Hat" -> "Golden_Digger"
  let newName = nameWithoutExt.replace(/_Hat$/i, '');
  
  // If filename ends with "_Cap" but contains "Cap" earlier (like "Snapback_Cap_Back_..."), keep it
  // Otherwise, remove trailing "_Cap"
  // Example: "Burnt_Rust_Cap" -> "Burnt_Rust"
  // But: "Snapback_Cap_Back_Violet" -> keep as is (has "Cap" in middle)
  if (newName.toLowerCase().endsWith('_cap')) {
    const nameLower = newName.toLowerCase();
    // Count how many times "cap" appears
    const capCount = (nameLower.match(/_cap/g) || []).length;
    // If "cap" only appears at the end, remove it
    if (capCount === 1 && nameLower.endsWith('_cap')) {
      newName = newName.replace(/_Cap$/i, '');
    }
    // Otherwise keep it (it's part of the name like "Snapback_Cap_Back_...")
  }
  
  // Add .png extension back
  return newName + '.png';
}

function renameHatFiles() {
  console.log('='.repeat(60));
  console.log('Renaming Hat Trait Image Files (AUTO MODE)');
  console.log('='.repeat(60));
  console.log(`\n📂 Folder: ${HATS_FOLDER}\n`);
  
  if (!fs.existsSync(HATS_FOLDER)) {
    console.error(`❌ Error: Folder not found: ${HATS_FOLDER}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(HATS_FOLDER).filter(f => f.toLowerCase().endsWith('.png'));
  console.log(`📊 Found ${files.length} PNG files\n`);
  
  const renames = [];
  const skipped = [];
  const conflicts = [];
  
  for (const file of files) {
    const oldPath = path.join(HATS_FOLDER, file);
    const newName = renameHatFile(file);
    const newPath = path.join(HATS_FOLDER, newName);
    
    if (file === newName) {
      skipped.push(file);
      continue;
    }
    
    // Check if target file already exists
    if (fs.existsSync(newPath) && file !== newName) {
      conflicts.push({ old: file, new: newName, existing: newName });
      skipped.push(file);
      continue;
    }
    
    renames.push({ old: file, new: newName });
  }
  
  console.log('📋 Files to rename:');
  renames.forEach(({ old, new: newName }) => {
    console.log(`   ${old} → ${newName}`);
  });
  
  if (conflicts.length > 0) {
    console.log('\n⚠️  Conflicts (skipped):');
    conflicts.forEach(({ old, new: newName }) => {
      console.log(`   ${old} → ${newName} (target already exists)`);
    });
  }
  
  if (skipped.length > 0 && conflicts.length === 0) {
    console.log(`\n⏭️  Skipped (no changes needed): ${skipped.length} files`);
  }
  
  console.log(`\n✅ Total files to rename: ${renames.length}`);
  if (conflicts.length > 0) {
    console.log(`⚠️  Conflicts: ${conflicts.length}`);
  }
  console.log(`⏭️  Files unchanged: ${skipped.length - conflicts.length}`);
  
  // Perform renaming
  console.log('\n🔄 Renaming files...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const { old, new: newName } of renames) {
    try {
      const oldPath = path.join(HATS_FOLDER, old);
      const newPath = path.join(HATS_FOLDER, newName);
      
      fs.renameSync(oldPath, newPath);
      console.log(`✅ ${old} → ${newName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error renaming ${old}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Renaming complete!');
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  if (conflicts.length > 0) {
    console.log(`   Conflicts: ${conflicts.length} (manually resolve if needed)`);
  }
  console.log('='.repeat(60));
  console.log('\n📤 Next step: Upload the renamed folder to Pinata IPFS');
  console.log('   Run: pnpm run upload:traits');
  console.log('   Or upload manually via Pinata web interface');
}

// Run the script
renameHatFiles();

