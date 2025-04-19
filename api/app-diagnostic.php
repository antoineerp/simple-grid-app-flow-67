
<?php
// Simple plain text diagnostic to avoid JSON parsing issues
header('Content-Type: text/plain');
echo "FormaCert Application Diagnostic\n";
echo "================================\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";

// Check directory paths
$root_dir = __DIR__ . '/..';
$src_dir = $root_dir . '/src';
$pages_dir = $src_dir . '/pages';
$dist_dir = $root_dir . '/dist';
$assets_dir = $dist_dir . '/assets';
$public_dir = $root_dir . '/public';

echo "\nDirectory Structure:\n";
echo "- Root directory: " . (is_dir($root_dir) ? "Exists" : "Missing") . "\n";
echo "- Source directory: " . (is_dir($src_dir) ? "Exists" : "Missing") . "\n";
echo "- Pages directory: " . (is_dir($pages_dir) ? "Exists" : "Missing") . "\n";
echo "- Distribution directory: " . (is_dir($dist_dir) ? "Exists" : "Missing") . "\n";
echo "- Assets directory: " . (is_dir($assets_dir) ? "Exists" : "Missing") . "\n";
echo "- Public directory: " . (is_dir($public_dir) ? "Exists" : "Missing") . "\n";

echo "\nKey Files:\n";
echo "- index.html: " . (file_exists($root_dir . '/index.html') ? "Exists" : "Missing") . "\n";
echo "- main.jsx: " . (file_exists($src_dir . '/main.jsx') ? "Exists" : "Missing") . "\n";
echo "- main.tsx: " . (file_exists($src_dir . '/main.tsx') ? "Exists" : "Missing") . "\n";
echo "- App.tsx: " . (file_exists($src_dir . '/App.tsx') ? "Exists" : "Missing") . "\n";

if (is_dir($assets_dir)) {
    echo "\nAsset Files:\n";
    echo "- index.js: " . (file_exists($assets_dir . '/index.js') ? "Exists" : "Missing") . "\n";
    echo "- main.js: " . (file_exists($assets_dir . '/main.js') ? "Exists" : "Missing") . "\n";
    echo "- index.css: " . (file_exists($assets_dir . '/index.css') ? "Exists" : "Missing") . "\n";
    
    if (!file_exists($assets_dir . '/main.js') && file_exists($assets_dir . '/index.js')) {
        echo "\nIMPORTANT: main.js is missing but index.js exists.\n";
        echo "Please update index.html to use index.js instead of main.js.\n";
    }
} else {
    echo "\nCannot check asset files because the assets directory is missing.\n";
    echo "Please run 'npm run build' to generate the necessary files.\n";
}

echo "\nTroubleshooting Tips:\n";
echo "1. Run 'npm run build' to generate distribution files\n";
echo "2. Make sure the .htaccess file has proper rules for PHP and static files\n";
echo "3. Verify that index.html references the correct JavaScript file (index.js)\n";
?>
