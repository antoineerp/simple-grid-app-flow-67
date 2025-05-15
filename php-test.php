
<?php
// Simple PHP test file - no output buffering needed for this file
header('Content-Type: text/plain'); // Plain text response
echo "PHP TEST SUCCESSFUL\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "PHP SAPI: " . php_sapi_name() . "\n";
?>
