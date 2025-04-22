
/**
 * Simple deployment script for FormaCert
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('FormaCert Deployment Script');
console.log('===========================');

// Check if we're in the right directory
if (!fs.existsSync('./package.json')) {
  console.error('Error: This script must be run from the project root directory.');
  process.exit(1);
}

try {
  // Build steps
  console.log('\n1. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n2. Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n3. Verifying build...');
  if (!fs.existsSync('./dist')) {
    throw new Error('Build failed: dist directory not found.');
  }
  
  // Count files in dist
  const distFiles = fs.readdirSync('./dist');
  console.log(`   Build complete with ${distFiles.length} files in dist directory.`);
  
  console.log('\n4. Running PHP verification...');
  // Test if PHP is working
  try {
    execSync('php -f test.php', { stdio: 'inherit' });
    console.log('   PHP test successful.');
  } catch (error) {
    console.warn('   WARNING: PHP test failed. PHP functionality may not work correctly.');
    console.warn('   Error:', error.message);
  }

  console.log('\n5. Deployment preparation complete.');
  console.log('\nYour application is ready for deployment.');
  console.log('To deploy to your server, upload the following files:');
  console.log('- All files in the ./dist directory');
  console.log('- All files in the ./api directory');
  console.log('- The .htaccess file');
  
  console.log('\nDone! ✅');

} catch (error) {
  console.error('\nDeployment preparation failed:', error.message);
  process.exit(1);
}
