
<?php
// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Définir DIRECT_ACCESS_CHECK comme true pour permettre l'accès direct
define('DIRECT_ACCESS_CHECK', true);

try {
    // Obtenir des informations sur le serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'system_os' => PHP_OS,
        'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Inconnu',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Inconnu',
        'request_time' => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME'] ?? time()),
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Inconnu',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Inconnu',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'Inconnu',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu',
    ];

    // Informations sur les extensions PHP
    $extensions = [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mysqli' => extension_loaded('mysqli'),
        'curl' => extension_loaded('curl'),
        'json' => extension_loaded('json'),
        'mbstring' => extension_loaded('mbstring'),
        'gd' => extension_loaded('gd'),
        'fileinfo' => extension_loaded('fileinfo'),
        'openssl' => extension_loaded('openssl')
    ];

    // Vérifier la configuration de la base de données
    $db_config_exists = file_exists(__DIR__ . '/config/database.php');
    $db_config_status = 'Non vérifié';
    $db_connection_status = 'Non vérifié';

    if ($db_config_exists) {
        include_once __DIR__ . '/config/database.php';
        $db_config_status = 'Fichier de configuration trouvé';

        try {
            $database = new Database();
            $db = $database->getConnection();
            if ($database->is_connected) {
                $db_connection_status = 'Connexion réussie';
            } else {
                $db_connection_status = 'Échec de connexion: ' . ($database->connection_error ?? 'Erreur inconnue');
            }
        } catch (Exception $e) {
            $db_connection_status = 'Erreur: ' . $e->getMessage();
        }
    } else {
        $db_config_status = 'Fichier de configuration manquant';
    }

    // Vérifier les permissions des dossiers clés
    $path_permissions = [];
    $directories = [
        __DIR__,                 // Dossier API principal
        __DIR__ . '/config',     // Configuration
        __DIR__ . '/controllers', // Contrôleurs
        __DIR__ . '/models',     // Modèles
        __DIR__ . '/utils',      // Utilitaires
        __DIR__ . '/middleware'  // Middleware
    ];

    foreach ($directories as $dir) {
        if (is_dir($dir)) {
            $readable = is_readable($dir) ? 'Oui' : 'Non';
            $writable = is_writable($dir) ? 'Oui' : 'Non';
            $permission = substr(sprintf('%o', fileperms($dir)), -4);
            $path_permissions[] = [
                'path' => $dir,
                'readable' => $readable,
                'writable' => $writable,
                'permission' => $permission
            ];
        } else {
            $path_permissions[] = [
                'path' => $dir,
                'exists' => false,
                'message' => 'Dossier non trouvé'
            ];
        }
    }

    // Tester la fonction de nettoyage UTF-8
    $utf8_test = null;
    if (function_exists('cleanUTF8')) {
        $test_string = "Test avec caractères accentués: éèêëàâäôöùûüÿç";
        $cleaned = cleanUTF8($test_string);
        $utf8_test = [
            'original' => $test_string,
            'cleaned' => $cleaned,
            'is_same' => $test_string === $cleaned ? 'Oui' : 'Non'
        ];
    } else {
        $utf8_test = [
            'status' => 'Fonction cleanUTF8 non disponible'
        ];
    }

    // Assembler la réponse complète
    $diagnostic_result = [
        'status' => 'success',
        'message' => 'Diagnostic API exécuté avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => $server_info,
        'php_extensions' => $extensions,
        'database' => [
            'config_file_exists' => $db_config_exists,
            'config_status' => $db_config_status,
            'connection_status' => $db_connection_status
        ],
        'directories' => $path_permissions,
        'utf8_test' => $utf8_test
    ];

    http_response_code(200);
    echo json_encode($diagnostic_result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
