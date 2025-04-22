
<?php
// Ensure proper error reporting for diagnostics
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Explicitly set content type to plain text for diagnostic output
header('Content-Type: text/plain');

// Determine the root directory dynamically
$root_dir = realpath(dirname(__FILE__));
$api_assets_check = $root_dir . '/api/assets-check.php';

// Check if the API assets-check.php exists
if (file_exists($api_assets_check)) {
    // Include the API diagnostic script
    require_once $api_assets_check;
} else {
    // Fallback error message if the script is not found
    echo "Error: API assets-check.php not found in " . $api_assets_check . "\n";
    echo "Ensure the file exists and is readable.\n";
    
    // Basic diagnostic information
    echo "\nBasic Diagnostic Info:\n";
    echo "Root Directory: " . $root_dir . "\n";
    echo "PHP Version: " . phpversion() . "\n";
    echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
}
?>
