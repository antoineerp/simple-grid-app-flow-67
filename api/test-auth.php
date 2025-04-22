
<?php
// Script de test pour vérifier la configuration de l'authentification
header('Content-Type: application/json; charset=utf-8');

// Activer l'affichage des erreurs pour ce test
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo json_encode([
    'status' => 'testing',
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
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
