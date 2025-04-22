
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
  
  console.log('\n3. Verifying build output...');
  if (!fs.existsSync('./dist')) {
    throw new Error('Build failed: dist directory not found.');
  }
  
  const assetsDir = path.join('./dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error('Build failed: assets directory not found.');
  }
  
  // Check for main JS and CSS files
  const hasIndexJs = fs.existsSync(path.join(assetsDir, 'index.js'));
  const hasMainJs = fs.existsSync(path.join(assetsDir, 'main.js'));
  const hasIndexCss = fs.existsSync(path.join(assetsDir, 'index.css'));
  const hasMainCss = fs.existsSync(path.join(assetsDir, 'main.css'));
  
  if (!hasIndexJs && !hasMainJs) {
    throw new Error('Build failed: Neither index.js nor main.js was generated.');
  }
  
  if (!hasIndexCss && !hasMainCss) {
    throw new Error('Build failed: Neither index.css nor main.css was generated.');
  }
  
  // List important files
  console.log('\nImportant files in the build:');
  fs.readdirSync(assetsDir).forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      console.log(`- ${file} (${(fs.statSync(path.join(assetsDir, file)).size / 1024).toFixed(1)} KB)`);
    }
  });
  
  console.log('\n4. Creating file list for upload...');
  
  const deployFiles = [
    '.htaccess',
    'index.php',
    'index.html',
    'assets-check.php',
    'test-minimal.php',
    'php-error-finder.php'
  ];
  
  const deployDirs = [
    'dist',
    'api',
    'lovable-uploads'
  ];
  
  console.log('\nList of files and folders to deploy:');
  console.log('- Individual files:');
  deployFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  - ${file} [${exists ? 'OK' : 'MISSING'}]`);
  });
  
  console.log('- Directories:');
  deployDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`  - ${dir}/ [${exists ? 'OK' : 'MISSING'}]`);
  });
  
  console.log('\nVerification complete! ✅');
  console.log('\nTo deploy your site:');
  console.log('1. Upload all listed files to your server');
  console.log('2. After upload, visit /assets-check.php to verify assets');

} catch (error) {
  console.error('\nDeployment preparation failed:', error.message);
  process.exit(1);
}
