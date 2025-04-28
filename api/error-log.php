
<?php
// Fichier pour journaliser et afficher les erreurs du serveur
// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation détaillée des erreurs
error_log("=== DÉBUT error-log.php ===");
ini_set('display_errors', 0); // Ne pas afficher les erreurs dans la réponse
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

try {
    // Vérifier si le fichier de log existe et est accessible
    $log_file = __DIR__ . '/php_errors.log';
    $alt_log_file = ini_get('error_log');
    
    $log_exists = file_exists($log_file);
    $log_readable = is_readable($log_file);
    $log_writable = is_writable($log_file);
    $log_size = $log_exists ? filesize($log_file) : 0;
    
    // Récupérer les dernières erreurs du log
    $recent_errors = [];
    if ($log_exists && $log_readable) {
        $log_content = file_get_contents($log_file);
        $lines = explode("\n", $log_content);
        $recent_errors = array_filter(array_slice($lines, -100)); // Prendre les 100 dernières lignes non vides
    } else if ($alt_log_file && file_exists($alt_log_file) && is_readable($alt_log_file)) {
        // Essayer avec le fichier de log alternatif
        $log_content = file_get_contents($alt_log_file);
        $lines = explode("\n", $log_content);
        $recent_errors = array_filter(array_slice($lines, -100));
        
        // Mettre à jour les informations sur le fichier
        $log_file = $alt_log_file;
        $log_exists = true;
        $log_readable = true;
        $log_writable = is_writable($alt_log_file);
        $log_size = filesize($alt_log_file);
    }
    
    // Si aucun log n'est disponible, essayer de récupérer les erreurs via error_get_last()
    if (empty($recent_errors)) {
        $last_error = error_get_last();
        if ($last_error) {
            $recent_errors[] = json_encode($last_error);
        }
    }
    
    // Récupérer les infos sur PHP et le serveur
    $php_info = [
        'version' => phpversion(),
        'extensions' => get_loaded_extensions(),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
        'error_log_path' => ini_get('error_log'),
        'error_reporting_level' => ini_get('error_reporting'),
        'display_errors' => ini_get('display_errors'),
        'log_errors' => ini_get('log_errors')
    ];
    
    // Assembler et renvoyer la réponse
    $response = [
        'status' => 'success',
        'message' => 'Informations de diagnostic des erreurs PHP',
        'timestamp' => date('Y-m-d H:i:s'),
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
    
    // Écrire un message de test dans le journal des erreurs
    error_log("Test d'écriture depuis error-log.php à " . date('Y-m-d H:i:s'));
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    error_log("=== FIN error-log.php ===");
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la récupération des logs: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ],
        'server_info' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ]
    ]);
}
