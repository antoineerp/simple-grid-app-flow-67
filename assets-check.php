
<?php
// Simple entry-point that just outputs plain text for diagnostic
header('Content-Type: text/plain');
echo "PHP Diagnostic Tool - FormaCert\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";

// Check if dist and assets directories exist
$root_dir = __DIR__;
$dist_dir = $root_dir . '/dist';
$assets_dir = $dist_dir . '/assets';

echo "\nDirectory Check:\n";
echo "- Root directory: " . (is_dir($root_dir) ? "Exists" : "Missing") . "\n";
echo "- Dist directory: " . (is_dir($dist_dir) ? "Exists" : "Missing") . "\n";
echo "- Assets directory: " . (is_dir($assets_dir) ? "Exists" : "Missing") . "\n";

// Check for the index.js file
echo "\nAsset Files:\n";
echo "- index.js: " . (file_exists($assets_dir . '/index.js') ? "Exists" : "Missing") . "\n";
echo "- main.js: " . (file_exists($assets_dir . '/main.js') ? "Exists" : "Missing") . "\n";
echo "- index.css: " . (file_exists($assets_dir . '/index.css') ? "Exists" : "Missing") . "\n";

echo "\nTo fix issues with missing files, please run 'npm run build' on your development machine.";
?>
