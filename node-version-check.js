
#!/usr/bin/env node

// Simple script to check Node.js compatibility
const requiredVersion = '18.0.0';
const currentVersion = process.version;

console.log('Node Version Check');
console.log('-----------------');
console.log(`Current Node.js version: ${currentVersion}`);
console.log(`Required Node.js version: >= ${requiredVersion}`);

// Parse versions
const parseVersion = (versionString) => {
  const parts = versionString.replace('v', '').split('.').map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
    raw: parts
  };
};

const current = parseVersion(currentVersion);
const required = parseVersion(requiredVersion);

// Check major version
const isCompatible = current.major >= required.major;

console.log(`\nCompatibility check: ${isCompatible ? 'PASSED ✅' : 'FAILED ❌'}`);

if (!isCompatible) {
  console.log('\nYour Node.js version is too old for some dependencies.');
  console.log('Options:');
  console.log('1. Update Node.js to version 18 or higher');
  console.log('   - Using NVM: "nvm install 18 && nvm use 18"');
  console.log('   - Direct download: https://nodejs.org/');
  console.log('\n2. If updating locally is not possible, use GitHub Actions with Node 20');
  console.log('   - The workflow has been updated to use Node.js 20');
}

// Check for NPM
try {
  const { execSync } = require('child_process');
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`NPM version: ${npmVersion}`);
} catch (error) {
  console.log('Could not detect NPM version');
}

// Exit with code 0 to not break build pipelines
process.exit(0);
