
<?php
// Fichier pour journaliser et afficher les erreurs du serveur
// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation détaillée des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Vérifier si le fichier de log existe et est accessible
$log_file = __DIR__ . '/php_errors.log';
$log_exists = file_exists($log_file);
$log_readable = is_readable($log_file);
$log_writable = is_writable($log_file);
$log_size = $log_exists ? filesize($log_file) : 0;

// Récupérer les dernières erreurs du log
$recent_errors = [];
if ($log_exists && $log_readable) {
    $log_content = file_get_contents($log_file);
    $lines = explode("\n", $log_content);
    $recent_errors = array_slice($lines, -50); // Prendre les 50 dernières lignes
}

// Récupérer les infos sur PHP et le serveur
$php_info = [
    'version' => phpversion(),
    'extensions' => get_loaded_extensions(),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
];

// Assembler et renvoyer la réponse
$response = [
    'status' => 'success',
    'message' => 'Informations de diagnostic des erreurs PHP',
    'log_file' => [
        'path' => $log_file,
        'exists' => $log_exists,
        'readable' => $log_readable,
        'writable' => $log_writable,
        'size' => $log_size . ' bytes'
    ],
    'recent_errors' => $recent_errors,
    'php_info' => $php_info,
    'request_details' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'time' => date('Y-m-d H:i:s')
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
