
<?php
header('Content-Type: application/json');

$logConfig = [
    'display_errors' => ini_get('display_errors'),
    'log_errors' => ini_get('log_errors'),
    'error_reporting' => error_reporting(),
    'error_log' => ini_get('error_log'),
];

// Essayer d'écrire un log
$testLogFile = __DIR__ . '/test-error-log.txt';
error_log("Test de log à " . date('Y-m-d H:i:s'), 3, $testLogFile);

$logConfig['test_log_file'] = [
    'path' => $testLogFile,
    'exists' => file_exists($testLogFile),
    'writable' => is_writable($testLogFile)
];

echo json_encode($logConfig, JSON_PRETTY_PRINT);
?>
