
<?php
// Simple diagnostic test - output as plain text
header('Content-Type: text/plain');
echo "PHP Test Script - FormaCert\n";
echo "=====================\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "\nIf you can see this message, PHP is working correctly!";
?>
