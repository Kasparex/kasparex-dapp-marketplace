#!/usr/bin/env node

/**
 * Git Sync Script
 * 
 * Generates documentation and syncs to Git for GitBook
 */

const { execSync } = require('child_process');
const { MarkdownGenerator } = require('./generate-markdown');
const fs = require('fs');
const path = require('path');

class GitSync {
  constructor() {
    this.generator = new MarkdownGenerator();
  }

  /**
   * Check if Git is available
   */
  checkGit() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if we're in a Git repository
   */
  isGitRepo() {
    return fs.existsSync('.git');
  }

  /**
   * Check Git status
   */
  getGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      return status.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate documentation
   */
  async generateDocs() {
    console.log('\n📝 Step 1: Generating documentation...\n');
    this.generator.initialize();
    await this.generator.generateAll();
  }

  /**
   * Stage files for commit
   */
  stageFiles() {
    console.log('\n📦 Step 2: Staging files for commit...\n');
    
    const filesToStage = [
      'gitbook-docs/',
      'scripts/gitbook-sync/',
      'templates/gitbook/',
      'src/lib/gitbook/',
      'docs/GITBOOK_SETUP.md',
      'docs/GITBOOK_GIT_SYNC.md',
      'package.json',
    ];

    const staged = [];
    const skipped = [];

    filesToStage.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          execSync(`git add ${file}`, { stdio: 'inherit' });
          staged.push(file);
          console.log(`   ✅ Staged: ${file}`);
        } catch (error) {
          console.error(`   ❌ Error staging ${file}:`, error.message);
        }
      } else {
        skipped.push(file);
      }
    });

    if (skipped.length > 0) {
      console.log(`\n   ⚠️  Skipped (not found): ${skipped.join(', ')}`);
    }

    return staged.length > 0;
  }

  /**
   * Commit changes
   */
  commit(message) {
    console.log('\n💾 Step 3: Committing changes...\n');
    
    try {
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      console.log('   ✅ Changes committed');
      return true;
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        console.log('   ℹ️  No changes to commit');
        return false;
      }
      console.error('   ❌ Error committing:', error.message);
      return false;
    }
  }

  /**
   * Push to remote
   */
  push(branch = 'main') {
    console.log(`\n🚀 Step 4: Pushing to origin/${branch}...\n`);
    
    try {
      execSync(`git push origin ${branch}`, { stdio: 'inherit' });
      console.log('   ✅ Pushed to remote');
      return true;
    } catch (error) {
      console.error('   ❌ Error pushing:', error.message);
      return false;
    }
  }

  /**
   * Run full sync process
   */
  async sync(options = {}) {
    const {
      commitMessage = 'Update GitBook documentation',
      branch = 'main',
      skipGenerate = false,
      skipCommit = false,
      skipPush = false,
    } = options;

    console.log('🔄 GitBook Git Sync\n');
    console.log('='.repeat(50));

    // Check prerequisites
    if (!this.checkGit()) {
      console.error('❌ Git is not installed or not in PATH');
      process.exit(1);
    }

    if (!this.isGitRepo()) {
      console.error('❌ Not in a Git repository');
      process.exit(1);
    }

    try {
      // Step 1: Generate docs
      if (!skipGenerate) {
        await this.generateDocs();
      } else {
        console.log('\n⏭️  Skipping documentation generation\n');
      }

      // Step 2: Stage files
      const hasChanges = this.stageFiles();
      
      if (!hasChanges && !skipCommit) {
        console.log('\n⚠️  No changes to commit');
        return;
      }

      // Step 3: Commit
      if (!skipCommit) {
        const committed = this.commit(commitMessage);
        if (!committed && !skipPush) {
          console.log('\n⚠️  Nothing to push');
          return;
        }
      } else {
        console.log('\n⏭️  Skipping commit\n');
      }

      // Step 4: Push
      if (!skipPush) {
        this.push(branch);
      } else {
        console.log('\n⏭️  Skipping push\n');
      }

      console.log('\n' + '='.repeat(50));
      console.log('✅ Git sync complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. GitBook should automatically sync within a few minutes');
      console.log('   2. Check your GitBook space to verify pages are updated');
      console.log('   3. If sync doesn\'t happen automatically, trigger it manually in GitBook settings\n');

    } catch (error) {
      console.error('\n❌ Error during sync:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--message' && args[i + 1]) {
      options.commitMessage = args[i + 1];
      i++;
    } else if (args[i] === '--branch' && args[i + 1]) {
      options.branch = args[i + 1];
      i++;
    } else if (args[i] === '--skip-generate') {
      options.skipGenerate = true;
    } else if (args[i] === '--skip-commit') {
      options.skipCommit = true;
    } else if (args[i] === '--skip-push') {
      options.skipPush = true;
    }
  }

  const sync = new GitSync();
  sync.sync(options).catch(console.error);
}

module.exports = { GitSync };

