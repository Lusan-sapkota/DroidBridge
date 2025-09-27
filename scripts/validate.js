#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validation script for DroidBridge extension
 * Checks if the extension is ready for marketplace publication
 */

console.log('🔍 Validating DroidBridge extension for publication...\n');

let errors = [];
let warnings = [];

// Load package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Required fields validation
const requiredFields = [
  'name', 'displayName', 'description', 'version', 'engines',
  'categories', 'main', 'contributes', 'scripts'
];

console.log('📋 Checking required package.json fields...');
requiredFields.forEach(field => {
  if (!packageJson[field]) {
    errors.push(`Missing required field: ${field}`);
  } else {
    console.log(`✅ ${field}`);
  }
});

// Recommended fields validation
const recommendedFields = [
  'author', 'license', 'repository', 'bugs', 'homepage', 'keywords'
];

console.log('\n📋 Checking recommended package.json fields...');
recommendedFields.forEach(field => {
  if (!packageJson[field]) {
    warnings.push(`Missing recommended field: ${field}`);
  } else {
    console.log(`✅ ${field}`);
  }
});

// Version validation
console.log('\n📋 Checking version format...');
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(packageJson.version)) {
  errors.push(`Invalid version format: ${packageJson.version} (should be x.y.z)`);
} else {
  console.log(`✅ Version: ${packageJson.version}`);
}

// VSCode engine validation
console.log('\n📋 Checking VSCode engine compatibility...');
if (!packageJson.engines || !packageJson.engines.vscode) {
  errors.push('Missing VSCode engine specification');
} else {
  console.log(`✅ VSCode engine: ${packageJson.engines.vscode}`);
}

// File existence validation
console.log('\n📋 Checking required files...');
const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    errors.push(`Missing required file: ${file}`);
  }
});

// Main entry point validation
console.log('\n📋 Checking main entry point...');
const mainFile = packageJson.main;
if (mainFile && fs.existsSync(mainFile)) {
  console.log(`✅ Main file exists: ${mainFile}`);
} else {
  errors.push(`Main file not found: ${mainFile}`);
}

// Commands validation
console.log('\n📋 Checking command contributions...');
if (packageJson.contributes && packageJson.contributes.commands) {
  const commands = packageJson.contributes.commands;
  console.log(`✅ ${commands.length} commands defined`);
  
  commands.forEach(cmd => {
    if (!cmd.command || !cmd.title) {
      errors.push(`Invalid command definition: ${JSON.stringify(cmd)}`);
    }
  });
} else {
  warnings.push('No commands defined');
}

// Views validation
console.log('\n📋 Checking view contributions...');
if (packageJson.contributes && packageJson.contributes.views) {
  console.log('✅ Views defined');
} else {
  warnings.push('No views defined');
}

// Configuration validation
console.log('\n📋 Checking configuration contributions...');
if (packageJson.contributes && packageJson.contributes.configuration) {
  const config = packageJson.contributes.configuration;
  if (config.properties) {
    const propCount = Object.keys(config.properties).length;
    console.log(`✅ ${propCount} configuration properties defined`);
  }
} else {
  warnings.push('No configuration properties defined');
}

// README validation
console.log('\n📋 Checking README.md content...');
if (fs.existsSync('README.md')) {
  const readme = fs.readFileSync('README.md', 'utf8');
  
  if (readme.includes('# DroidBridge')) {
    console.log('✅ README has proper title');
  } else {
    warnings.push('README should start with proper title');
  }
  
  if (readme.includes('## Installation')) {
    console.log('✅ README has installation section');
  } else {
    warnings.push('README should include installation instructions');
  }
  
  if (readme.includes('## Usage')) {
    console.log('✅ README has usage section');
  } else {
    warnings.push('README should include usage instructions');
  }
  
  if (readme.length < 1000) {
    warnings.push('README seems too short (< 1000 characters)');
  } else {
    console.log('✅ README has adequate length');
  }
}

// CHANGELOG validation
console.log('\n📋 Checking CHANGELOG.md content...');
if (fs.existsSync('CHANGELOG.md')) {
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  
  if (changelog.includes(packageJson.version)) {
    console.log(`✅ CHANGELOG includes current version ${packageJson.version}`);
  } else {
    warnings.push(`CHANGELOG should include current version ${packageJson.version}`);
  }
}

// Build validation
console.log('\n📋 Checking build output...');
if (fs.existsSync('dist/extension.js')) {
  console.log('✅ Extension bundle exists');
  
  const stats = fs.statSync('dist/extension.js');
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`✅ Bundle size: ${sizeKB}KB`);
  
  if (sizeKB > 1024) {
    warnings.push(`Bundle size is large (${sizeKB}KB). Consider optimization.`);
  }
} else {
  errors.push('Extension bundle not found. Run npm run package first.');
}

// Media assets validation
console.log('\n📋 Checking media assets...');
if (fs.existsSync('media')) {
  console.log('✅ Media directory exists');
  
  if (fs.existsSync('media/icons')) {
    console.log('✅ Icons directory exists');
  } else {
    warnings.push('Icons directory not found');
  }
} else {
  warnings.push('Media directory not found');
}

// .vscodeignore validation
console.log('\n📋 Checking .vscodeignore...');
if (fs.existsSync('.vscodeignore')) {
  const vscodeignore = fs.readFileSync('.vscodeignore', 'utf8');
  
  const shouldIgnore = ['src/**', 'node_modules/**', '**/*.ts', 'out/**'];
  const missing = shouldIgnore.filter(pattern => !vscodeignore.includes(pattern));
  
  if (missing.length === 0) {
    console.log('✅ .vscodeignore properly configured');
  } else {
    warnings.push(`Missing patterns in .vscodeignore: ${missing.join(', ')}`);
  }
} else {
  warnings.push('.vscodeignore file not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (errors.length === 0) {
  console.log('✅ No errors found!');
} else {
  console.log(`❌ ${errors.length} error(s) found:`);
  errors.forEach(error => console.log(`   • ${error}`));
}

if (warnings.length === 0) {
  console.log('✅ No warnings!');
} else {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  warnings.forEach(warning => console.log(`   • ${warning}`));
}

console.log('\n' + '='.repeat(50));

if (errors.length === 0) {
  console.log('🎉 Extension is ready for publication!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run publish:interactive');
  console.log('2. Or manually: npm run package:vsix && vsce publish');
} else {
  console.log('🔧 Please fix the errors before publishing.');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n💡 Consider addressing the warnings for better user experience.');
}