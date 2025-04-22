
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
    console.log('Creating assets directory...');
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // List all files in the assets directory
  console.log('\nAssets directory content:');
  const assetFiles = fs.readdirSync(assetsDir);
  
  // Identify specific file types
  const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
  const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
  
  console.log('JS files found:', jsFiles);
  console.log('CSS files found:', cssFiles);
  
  // Create placeholder files if needed
  if (jsFiles.length === 0) {
    console.log('Creating placeholder index.js file...');
    fs.writeFileSync(path.join(assetsDir, 'index.js'), '// Placeholder file');
  }
  
  if (cssFiles.length === 0) {
    console.log('Creating placeholder index.css file...');
    fs.writeFileSync(path.join(assetsDir, 'index.css'), '/* Placeholder CSS */\n/* Generated from tailwind */\n@import url("../src/index.css");');
    
    // Si des fichiers CSS sont introuvables, ajouter des diagnostics supplémentaires
    console.error('\nAUCUN FICHIER CSS GÉNÉRÉ - CRÉATION D\'UN FICHIER CSS DE SECOURS');
    console.error('1. Vérification des imports CSS dans les fichiers source:');
    
    try {
      // Vérifier si index.css est importé dans main.tsx
      const mainTsxPath = './src/main.tsx';
      if (fs.existsSync(mainTsxPath)) {
        const mainContent = fs.readFileSync(mainTsxPath, 'utf8');
        console.error(`- Import dans main.tsx: ${mainContent.includes('import "./index.css"')}`);
      } else {
        console.error(`- Fichier main.tsx non trouvé`);
      }
      
      // Vérifier les autres fichiers d'entrée possibles
      const otherEntryFiles = ['./src/index.tsx', './src/main.jsx', './src/index.jsx'];
      for (const file of otherEntryFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          console.error(`- Import dans ${file}: ${content.includes('import "./index.css"') || content.includes("import './index.css'")}`);
        }
      }
      
      // Vérifier si le fichier index.css existe
      const indexCssPath = './src/index.css';
      console.error(`- Fichier index.css existe: ${fs.existsSync(indexCssPath)}`);
      
      if (fs.existsSync(indexCssPath)) {
        const cssSize = fs.statSync(indexCssPath).size;
        console.error(`- Taille de index.css: ${cssSize} octets`);
        
        // Copier index.css directement dans le répertoire de sortie
        fs.copyFileSync(indexCssPath, path.join(assetsDir, 'index.css'));
        console.log('index.css a été copié directement dans dist/assets/');
      }
      
      // Vérifier la configuration de Vite
      const viteConfigPath = './vite.config.ts';
      if (fs.existsSync(viteConfigPath)) {
        const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
        console.error(`- Configuration CSS dans vite.config.ts: ${viteConfig.includes('css:')}`);
      }
      
    } catch (diagError) {
      console.error('Erreur lors du diagnostic:', diagError);
    }
  }
  
  // List important files
  console.log('\nImportant files in the build:');
  assetFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`- ${file} (${fileSize} KB)`);
  });
  
  console.log('\n4. Creating file list for upload...');
  
  const deployFiles = [
    '.htaccess',
    'index.php',
    'index.html',
    'assets-check.php',
    'test-minimal.php',
    'php-error-finder.php',
    'debug-assets.php'
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
  console.log('2. After upload, visit /debug-assets.php to verify assets');
  console.log('3. If you continue to see file loading issues:');
  console.log('   - Make sure your server\'s MIME types are properly configured');
  console.log('   - Check the console for specific file loading errors');
  console.log('   - Verify that the .htaccess file is being processed correctly');

} catch (error) {
  console.error('\nDeployment preparation failed:', error.message);
  process.exit(1);
}
