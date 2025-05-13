
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
    
    // Fonction pour extraire les erreurs SQL d'un contenu de log
    function extractSqlErrors($content) {
        $errors = [];
        $lines = explode("\n", $content);
        $current_error = null;
        
        foreach ($lines as $line) {
            if (stripos($line, 'SQLSTATE') !== false || 
                stripos($line, 'SQL syntax') !== false || 
                stripos($line, 'MariaDB') !== false ||
                stripos($line, 'MySQL') !== false) {
                
                if ($current_error) {
                    $errors[] = $current_error;
                }
                
                $current_error = $line;
            } elseif ($current_error && trim($line) !== '') {
                // Ajouter la ligne au contexte de l'erreur SQL actuelle
                $current_error .= "\n" . $line;
            }
        }
        
        // Ajouter la dernière erreur si elle existe
        if ($current_error) {
            $errors[] = $current_error;
        }
        
        return $errors;
    }
    
    // Définir les chemins possibles des fichiers de log
    $log_paths = [
        __DIR__ . '/php_errors.log',
        __DIR__ . '/tmp/php_errors.log',
        __DIR__ . '/logs/php_errors.log',
        ini_get('error_log'),
        '/var/log/php_errors.log',
        '/var/log/apache2/error.log',
        '/var/log/httpd/error_log',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/logs/php_errors.log',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/api/php_errors.log',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/api/tmp/php_errors.log',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/logs/php_errors.log'
    ];
    
    $found_logs = [];
    $accessible_logs = [];
    
    // Vérifier quels fichiers existent et sont accessibles
    foreach ($log_paths as $log_path) {
        if ($log_path && file_exists($log_path)) {
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
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'alternative_logs' => getRecentLogEntries()
        ];
    } else {
        // Lire les logs accessibles
        $logs_content = [];
        $sql_errors = [];
        
        foreach ($accessible_logs as $log_file) {
            try {
                // Tenter de lire le fichier avec shell_exec, qui peut parfois fonctionner quand file_get_contents échoue
                $content = shell_exec("tail -n 1000 " . escapeshellarg($log_file) . " 2>&1");
                
                // Si shell_exec échoue, essayer file_get_contents
                if (!$content) {
                    $content = @file_get_contents($log_file);
                }
                
                if ($content) {
                    $logs_content[$log_file] = array_filter(explode("\n", $content));
                    
                    // Rechercher des erreurs SQL spécifiques
                    $sql_errors[$log_file] = extractSqlErrors($content);
                } else {
                    $logs_content[$log_file] = ["Impossible de lire le contenu"];
                }
            } catch (Exception $e) {
                $logs_content[$log_file] = ["Erreur lors de la lecture: " . $e->getMessage()];
            }
        }
        
        $response = [
            'status' => 'success',
            'message' => count($accessible_logs) . ' fichier(s) de log accessible(s)',
            'found_logs' => $found_logs,
            'logs' => $logs_content,
            'sql_errors' => $sql_errors,
            'server_info' => [
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'system' => php_uname(),
                'pdo_drivers' => PDO::getAvailableDrivers()
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
    
    // Méthode 1: Capturer les erreurs récentes via error_get_last()
    $last_error = error_get_last();
    if ($last_error) {
        $entries['last_error'] = $last_error;
    }
    
    // Méthode 2: Vérifier la configuration PDO
    $entries['pdo_config'] = [
        'available_drivers' => PDO::getAvailableDrivers(),
        'mysql_client_info' => function_exists('mysqli_get_client_info') ? mysqli_get_client_info() : 'Non disponible'
    ];
    
    // Méthode 3: Vérifier les permissions des répertoires de logs
    $log_dirs = [
        __DIR__ . '/tmp',
        __DIR__ . '/logs',
        ini_get('error_log') ? dirname(ini_get('error_log')) : null
    ];
    
    $dir_permissions = [];
    foreach ($log_dirs as $dir) {
        if ($dir && file_exists($dir)) {
            $dir_permissions[$dir] = [
                'exists' => true,
                'readable' => is_readable($dir),
                'writable' => is_writable($dir),
                'owner' => function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($dir)) : 'fonction non disponible',
                'group' => function_exists('posix_getgrgid') ? posix_getgrgid(filegroup($dir)) : 'fonction non disponible',
                'permissions' => substr(sprintf('%o', fileperms($dir)), -4)
            ];
        } else {
            $dir_permissions[$dir] = ['exists' => false];
        }
    }
    $entries['log_dir_permissions'] = $dir_permissions;
    
    // Méthode 4: Créer un fichier de log temporaire pour tester les permissions
    $timestamp = time();
    $temp_log = __DIR__ . '/temp_log_' . $timestamp . '.txt';
    $test_result = @file_put_contents($temp_log, "Test log entry at " . date('Y-m-d H:i:s') . "\nSQLSTATE test\n");
    
    if ($test_result !== false) {
        $entries['temp_log_created'] = [
            'path' => $temp_log,
            'success' => true,
            'size' => filesize($temp_log),
            'content' => file_get_contents($temp_log)
        ];
        
        // Nettoyer après utilisation
        @unlink($temp_log);
        $entries['temp_log_created']['cleaned'] = !file_exists($temp_log);
    } else {
        $entries['temp_log_created'] = [
            'path' => $temp_log,
            'success' => false,
            'error' => error_get_last()
        ];
    }
    
    return $entries;
}
