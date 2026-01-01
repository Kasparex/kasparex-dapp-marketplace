/**
 * Rename Hat trait image files to match metadata pattern
 * Pattern: Remove "Hat" and "Cap" suffixes (like Green_Stylish_Hair.png)
 * Exception: Keep "Cap" if it's part of the name (e.g., "Snapback Cap" -> "Snapback_Cap")
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
  console.log('Renaming Hat Trait Image Files');
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
      console.warn(`⚠️  Conflict: ${file} would rename to ${newName}, but that file already exists`);
      console.warn(`   Keeping both files - you may need to manually resolve this`);
      skipped.push(file);
      continue;
    }
    
    renames.push({ old: file, new: newName });
  }
  
  console.log('📋 Files to rename:');
  renames.forEach(({ old, new: newName }) => {
    console.log(`   ${old}`);
    console.log(`   → ${newName}`);
    console.log('');
  });
  
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped (no changes needed): ${skipped.length} files`);
    skipped.slice(0, 5).forEach(f => console.log(`   - ${f}`));
    if (skipped.length > 5) {
      console.log(`   ... and ${skipped.length - 5} more`);
    }
  }
  
  console.log(`\n✅ Total files to rename: ${renames.length}`);
  console.log(`⏭️  Files unchanged: ${skipped.length}`);
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Proceed with renaming? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
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
      console.log('='.repeat(60));
      console.log('\n📤 Next step: Upload the renamed folder to Pinata IPFS');
    } else {
      console.log('\n❌ Renaming cancelled.');
    }
    
    rl.close();
  });
}

// Run the script
renameHatFiles();

