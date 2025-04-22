
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
  
  // List all files in the assets directory
  console.log('\nAssets directory content:');
  const assetFiles = fs.readdirSync(assetsDir);
  
  if (assetFiles.length === 0) {
    throw new Error('Build failed: assets directory is empty.');
  }
  
  // Identify specific file types
  const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
  const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
  const mainJsFile = jsFiles.find(file => file.includes('index') && !file.includes('.es-'));
  const mainCssFile = cssFiles.find(file => file.includes('index'));
  
  if (jsFiles.length === 0) {
    throw new Error('Build failed: No JavaScript files were generated.');
  }
  
  if (cssFiles.length === 0) {
    throw new Error('Build failed: No CSS files were generated.');
  }
  
  // List important files
  console.log('\nImportant files in the build:');
  assetFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
    const isPrimary = file === mainJsFile || file === mainCssFile;
    
    console.log(`- ${file} (${fileSize} KB)${isPrimary ? ' [PRIMARY]' : ''}`);
  });
  
  // Check for hashed filenames and provide guidance
  const hasHashedFiles = assetFiles.some(file => /index-[a-zA-Z0-9]+\.(js|css)$/.test(file));
  
  if (hasHashedFiles) {
    console.log('\n⚠️  IMPORTANT: Your build is generating hashed filenames.');
    console.log('Make sure your index.html and index.php are configured to handle hashed filenames.');
    console.log('The updated scripts in this deployment will handle this case automatically.');
  }
  
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
  
  console.log('\nVERIFICATION COMPLETE! ✅');
  console.log('\nTo deploy your site:');
  console.log('1. Upload all listed files to your server');
  console.log('2. After upload, visit /assets-check.php to verify assets');
  console.log('3. If you continue to see file loading issues:');
  console.log('   - Make sure your server\'s MIME types are properly configured');
  console.log('   - Check the console for specific file loading errors');
  console.log('   - Verify that the .htaccess file is being processed correctly');

} catch (error) {
  console.error('\nDeployment preparation failed:', error.message);
  process.exit(1);
}
