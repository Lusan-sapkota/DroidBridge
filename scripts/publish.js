#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Publishing script for DroidBridge extension
 */

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`🚀 Publishing DroidBridge v${version}`);

// Pre-publication checks
console.log('\n📋 Running pre-publication checks...');

try {
  // Check if we're in a clean git state
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.warn('⚠️  Warning: Working directory is not clean');
    console.log('Uncommitted changes:');
    console.log(gitStatus);
  }

  // Run tests
  console.log('🧪 Running tests...');
  execSync('npm test', { stdio: 'inherit' });

  // Type check
  console.log('🔍 Type checking...');
  execSync('npm run check-types', { stdio: 'inherit' });

  // Lint
  console.log('🎨 Linting...');
  execSync('npm run lint', { stdio: 'inherit' });

  // Build
  console.log('🔨 Building...');
  execSync('npm run package', { stdio: 'inherit' });

  console.log('✅ All checks passed!');

} catch (error) {
  console.error('❌ Pre-publication checks failed');
  process.exit(1);
}

// Package extension
console.log('\n📦 Creating package...');
try {
  // Clean old packages
  const vsixFiles = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
  vsixFiles.forEach(file => {
    fs.unlinkSync(file);
    console.log(`🗑️  Removed old package: ${file}`);
  });

  // Create new package
  execSync('npx vsce package', { stdio: 'inherit' });
  
  const newVsixFile = `droidbridge-${version}.vsix`;
  if (fs.existsSync(newVsixFile)) {
    console.log(`✅ Package created: ${newVsixFile}`);
  } else {
    throw new Error('Package file not found');
  }

} catch (error) {
  console.error('❌ Package creation failed:', error.message);
  process.exit(1);
}

// Ask for confirmation before publishing
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`\n🤔 Ready to publish DroidBridge v${version} to the marketplace? (y/N): `, (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Publishing to marketplace...');
    
    try {
      execSync('npx vsce publish', { stdio: 'inherit' });
      console.log(`\n🎉 Successfully published DroidBridge v${version}!`);
      
      // Tag the release
      console.log('\n🏷️  Creating git tag...');
      execSync(`git tag v${version}`, { stdio: 'inherit' });
      console.log(`✅ Created tag: v${version}`);
      
      console.log('\n📝 Next steps:');
      console.log('1. Push the git tag: git push origin --tags');
      console.log('2. Create a GitHub release');
      console.log('3. Update documentation if needed');
      console.log('4. Monitor marketplace for user feedback');
      
    } catch (error) {
      console.error('❌ Publishing failed:', error.message);
      process.exit(1);
    }
  } else {
    console.log('📦 Package created but not published');
    console.log(`You can publish later with: npx vsce publish`);
  }
  
  rl.close();
});