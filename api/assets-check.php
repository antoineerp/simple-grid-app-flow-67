
<?php
// Simple plain text diagnostic
header('Content-Type: text/plain');
echo "PHP API Diagnostic - FormaCert\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";

// Basic server info
echo "\nServer Info:\n";
echo "- Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "\n";
echo "- Script Filename: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Unknown') . "\n";
echo "- Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";

// Check for API folder and files
$api_dir = __DIR__;
$root_dir = dirname($api_dir);
$dist_dir = $root_dir . '/dist';
$assets_dir = $dist_dir . '/assets';

echo "\nDirectory Check:\n";
echo "- API directory: " . (is_dir($api_dir) ? "Exists" : "Missing") . "\n";
echo "- Dist directory: " . (is_dir($dist_dir) ? "Exists" : "Missing") . "\n";
echo "- Assets directory: " . (is_dir($assets_dir) ? "Exists" : "Missing") . "\n";

// List files in the assets directory
if (is_dir($assets_dir)) {
    echo "\nFiles in assets directory:\n";
    $files = scandir($assets_dir);
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            echo "- $file\n";
        }
    }
} else {
    echo "\nCannot list files in assets directory as it does not exist.\n";
}

echo "\nTo fix issues with missing files, please run 'npm run build' on your development machine.";
?>
