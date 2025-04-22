
<?php
// Script de test pour vérifier la configuration de l'authentification
header('Content-Type: application/json; charset=utf-8');

// Activer l'affichage des erreurs pour ce test
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    // Vérifier la disponibilité des fonctions critiques
    $mb_functions_available = function_exists('mb_convert_encoding');
    $json_functions_available = function_exists('json_encode') && function_exists('json_decode');
    
    // Simuler l'inclusion conditionnelle pour detecter les problèmes de redéclaration
    if (!function_exists('cleanUTF8_test')) {
        function cleanUTF8_test($input) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        }
    }
    
    // Vérifier si les fichiers essentiels existent
    $env_file = __DIR__ . '/config/env.php';
    $auth_controller_file = __DIR__ . '/controllers/AuthController.php';
    
    // Tenter de charger env.php pour tester
    $env_contents = file_exists($env_file) ? file_get_contents($env_file) : 'Fichier introuvable';
    $env_has_cleanutf8 = strpos($env_contents, 'function cleanUTF8') !== false;
    $env_has_protection = strpos($env_contents, 'if (!function_exists(\'cleanUTF8\'))') !== false;
    
    // Tenter de charger AuthController.php pour tester
    $auth_contents = file_exists($auth_controller_file) ? file_get_contents($auth_controller_file) : 'Fichier introuvable';
    $auth_has_cleanutf8 = strpos($auth_contents, 'function cleanUTF8') !== false;
    $auth_has_protection = strpos($auth_contents, 'if (!function_exists(\'cleanUTF8\'))') !== false;

    echo json_encode([
        'status' => 'success',
        'message' => 'Vérification de la configuration d\'authentification',
        'environment' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'],
            'document_root' => $_SERVER['DOCUMENT_ROOT'],
            'script_filename' => $_SERVER['SCRIPT_FILENAME'],
            'current_dir' => __DIR__,
            'api_dir' => realpath(__DIR__),
        ],
        'file_checks' => [
            'auth.php' => file_exists(__DIR__ . '/auth.php') ? 'Existe' : 'Introuvable',
            'controllers_dir' => is_dir(__DIR__ . '/controllers') ? 'Existe' : 'Introuvable',
            'auth_controller' => file_exists(__DIR__ . '/controllers/AuthController.php') ? 'Existe' : 'Introuvable',
            'config_dir' => is_dir(__DIR__ . '/config') ? 'Existe' : 'Introuvable',
            'env_config' => file_exists(__DIR__ . '/config/env.php') ? 'Existe' : 'Introuvable',
            'models_dir' => is_dir(__DIR__ . '/models') ? 'Existe' : 'Introuvable',
            'user_model' => file_exists(__DIR__ . '/models/User.php') ? 'Existe' : 'Introuvable',
        ],
        'extensions' => [
            'pdo' => extension_loaded('pdo') ? 'Chargée' : 'Non chargée',
            'json' => extension_loaded('json') ? 'Chargée' : 'Non chargée',
            'mbstring' => extension_loaded('mbstring') ? 'Chargée' : 'Non chargée',
        ],
        'function_checks' => [
            'mb_functions' => $mb_functions_available ? 'Disponibles' : 'Non disponibles',
            'json_functions' => $json_functions_available ? 'Disponibles' : 'Non disponibles',
        ],
        'cleanutf8_issues' => [
            'env_has_cleanutf8' => $env_has_cleanutf8,
            'env_has_protection' => $env_has_protection,
            'auth_has_cleanutf8' => $auth_has_cleanutf8,
            'auth_has_protection' => $auth_has_protection,
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la vérification',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
