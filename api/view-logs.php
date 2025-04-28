
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers for CORS and Content-Type
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

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Définir les chemins possibles des fichiers de log
    $log_paths = [
        __DIR__ . '/php_errors.log',
        __DIR__ . '/tmp/php_errors.log',
        __DIR__ . '/logs/php_errors.log',
        ini_get('error_log'),
        '/var/log/php_errors.log',
        '/var/log/apache2/error.log',
        '/var/log/httpd/error_log',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/logs/php_errors.log'
    ];
    
    $found_logs = [];
    $accessible_logs = [];
    
    // Vérifier quels fichiers existent et sont accessibles
    foreach ($log_paths as $log_path) {
        if (file_exists($log_path)) {
            $found_logs[] = $log_path;
            
            if (is_readable($log_path)) {
                $accessible_logs[] = $log_path;
            }
        }
    }
    
    // Si aucun fichier de log n'est accessible, utiliser error_get_last() et ini_get
    if (empty($accessible_logs)) {
        $response = [
            'status' => 'warning',
            'message' => 'Aucun fichier de log accessible directement.',
            'found_logs' => $found_logs,
            'accessible_logs' => $accessible_logs,
            'last_error' => error_get_last(),
            'error_log_path' => ini_get('error_log'),
            'error_reporting_level' => ini_get('error_reporting'),
            'display_errors' => ini_get('display_errors'),
            'log_errors' => ini_get('log_errors'),
            'alternative_logs' => getRecentLogEntries()
        ];
    } else {
        // Lire les logs accessibles
        $logs_content = [];
        foreach ($accessible_logs as $log_file) {
            // Lire uniquement les dernières lignes (max 1000)
            $content = shell_exec("tail -n 1000 " . escapeshellarg($log_file) . " 2>&1") ?: file_get_contents($log_file);
            
            if ($content) {
                $logs_content[$log_file] = array_filter(explode("\n", $content));
            } else {
                $logs_content[$log_file] = ["Impossible de lire le contenu"];
            }
        }
        
        $response = [
            'status' => 'success',
            'message' => count($accessible_logs) . ' fichier(s) de log accessible(s)',
            'found_logs' => $found_logs,
            'logs' => $logs_content,
            'server_info' => [
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'system' => php_uname(),
            ]
        ];
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    // En cas d'erreur, renvoyer une réponse structurée
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la récupération des logs: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ],
        'server_info' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ]
    ]);
} finally {
    // Flush the output buffer
    if (ob_get_level()) ob_end_flush();
}

/**
 * Tente de récupérer les entrées de journal récentes via des méthodes alternatives
 */
function getRecentLogEntries() {
    $entries = [];
    
    // Méthode 1: Utiliser la fonction système de journalisation
    if (function_exists('syslog')) {
        $entries['syslog_message'] = "Un message de test a été écrit dans syslog";
        syslog(LOG_WARNING, "Test log entry from view-logs.php");
    }
    
    // Méthode 2: Vérifier les erreurs Apache si accessible
    if (function_exists('apache_get_modules')) {
        $entries['apache_modules'] = apache_get_modules();
    }
    
    // Méthode 3: Créer un journal temporaire
    $temp_log = __DIR__ . '/temp_log_' . time() . '.txt';
    file_put_contents($temp_log, "Test log entry at " . date('Y-m-d H:i:s'));
    $entries['temp_log_created'] = $temp_log;
    $entries['temp_log_accessible'] = is_readable($temp_log);
    if (is_readable($temp_log)) {
        $entries['temp_log_content'] = file_get_contents($temp_log);
    }
    
    // Nettoyer après utilisation
    if (file_exists($temp_log)) {
        unlink($temp_log);
    }
    
    return $entries;
}
