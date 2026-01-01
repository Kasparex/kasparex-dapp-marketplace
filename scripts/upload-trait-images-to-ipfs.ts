/**
 * Upload PIXELKREX trait images folder to Pinata IPFS
 * Maintains folder structure and returns the root CID
 */

import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

const TRAITS_FOLDER = path.join(__dirname, '../public/nft/PIXELKREX/Pixelkrex traits');

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload directory to Pinata IPFS
 * Pinata supports directory uploads via pinFileToIPFS with FormData
 */
async function uploadDirectoryToPinata(
  directoryPath: string,
  pinataMetadata?: { name: string; keyvalues?: Record<string, string> }
): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    throw new Error(
      'Pinata API credentials not found. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_API_SECRET environment variables.'
    );
  }

  console.log(`📁 Preparing to upload directory: ${directoryPath}`);
  
  // Check if directory exists
  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Directory not found: ${directoryPath}`);
  }

  // Create FormData with directory structure
  const formData = new FormData();
  
  // Add all files maintaining directory structure
  function addFilesToFormData(dirPath: string, basePath: string = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Recursively add files from subdirectories
        addFilesToFormData(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        // Add file with relative path
        const fileStream = fs.createReadStream(fullPath);
        formData.append('file', fileStream, {
          filepath: relativePath, // This maintains the directory structure
        });
        console.log(`  ✅ Added: ${relativePath}`);
      }
    }
  }

  // Add all PNG files from the directory
  addFilesToFormData(directoryPath);

  // Add Pinata metadata
  const metadata = {
    name: pinataMetadata?.name || 'PIXELKREX Trait Images',
    keyvalues: {
      ...pinataMetadata?.keyvalues,
      uploadedAt: new Date().toISOString(),
      type: 'trait-images',
    },
  };
  formData.append('pinataMetadata', JSON.stringify(metadata));

  // Add Pinata options
  const options = {
    cidVersion: 1, // Use CIDv1
    wrapWithDirectory: false, // Don't wrap in an extra directory
  };
  formData.append('pinataOptions', JSON.stringify(options));

  console.log(`\n🚀 Uploading to Pinata IPFS...`);
  console.log(`   API Key: ${PINATA_API_KEY.substring(0, 8)}...`);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data: PinataResponse = await response.json();
    console.log(`\n✅ Upload successful!`);
    console.log(`   CID: ${data.IpfsHash}`);
    console.log(`   Size: ${(data.PinSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Timestamp: ${data.Timestamp}`);
    
    return data.IpfsHash;
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('PIXELKREX Trait Images IPFS Upload Script');
  console.log('='.repeat(60));
  console.log(`\n📂 Source folder: ${TRAITS_FOLDER}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No files will be uploaded\n');
    
    // Count files
    let fileCount = 0;
    function countFiles(dirPath: string) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          countFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.png')) {
          fileCount++;
        }
      }
    }
    
    countFiles(TRAITS_FOLDER);
    console.log(`📊 Found ${fileCount} PNG files`);
    console.log('\n✅ Dry run complete. Run without --dry-run to upload.');
    return;
  }

  // Check credentials
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.error('\n❌ Error: Pinata API credentials not found!');
    console.error('\nPlease set the following environment variables:');
    console.error('  NEXT_PUBLIC_PINATA_API_KEY=your_api_key');
    console.error('  NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret');
    console.error('\nYou can get these from: https://app.pinata.cloud/api-keys');
    process.exit(1);
  }

  try {
    const cid = await uploadDirectoryToPinata(TRAITS_FOLDER, {
      name: 'PIXELKREX Trait Images',
      keyvalues: {
        collection: 'PIXELKREX',
        version: '1.0',
      },
    });

    console.log('\n' + '='.repeat(60));
    console.log('📋 Next Steps:');
    console.log('='.repeat(60));
    console.log(`\n1. Update src/lib/nft/collections.ts:`);
    console.log(`   traitImagesBaseUri: 'ipfs://${cid}',`);
    console.log(`\n2. Test the gateway URL:`);
    console.log(`   https://gateway.pinata.cloud/ipfs/${cid}/HATS/Golden_Digger_Hat.png`);
    console.log(`\n3. Verify folder structure:`);
    console.log(`   https://gateway.pinata.cloud/ipfs/${cid}/`);
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

