
<?php
/**
 * API de vérification de l'état du serveur
 * Format standardisé pour toutes les API de l'application
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Inclure la classe ResponseHandler
require_once __DIR__ . '/utils/ResponseHandler.php';

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Vérifier que les fichiers API essentiels existent
    $apiFiles = [
        'index.php',
        'auth.php',
        'login.php',
        'auth-test.php',
        'check-db-connection.php',
        'membres-load.php',
        'membres-sync.php'
    ];

    $missingFiles = [];
    foreach ($apiFiles as $file) {
        if (!file_exists(__DIR__ . '/' . $file)) {
            $missingFiles[] = $file;
        }
    }

    // Vérifier si le fichier env.php existe
    $envExists = file_exists(__DIR__ . '/config/env.php');
    
    // Vérifier si .htaccess existe
    $htaccessExists = file_exists(__DIR__ . '/.htaccess');

    // Détecter l'environnement
    $isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
    $isStaging = strpos($_SERVER['HTTP_HOST'] ?? '', '.lovable.') !== false;
    $environment = $isProduction ? 'production' : ($isStaging ? 'staging' : 'development');
    
    // Renvoyer une réponse standard de succès
    ResponseHandler::success([
        'api_status' => 'disponible',
        'environment' => $environment,
        'missing_files' => $missingFiles,
        'env_exists' => $envExists,
        'htaccess_exists' => $htaccessExists,
        'server_info' => [
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
            'uri' => $_SERVER['REQUEST_URI'] ?? '/',
            'php_version' => phpversion()
        ]
    ], 200, 'API PHP disponible');
    
} catch (Exception $e) {
    ResponseHandler::error(
        'Erreur lors de la vérification: ' . $e->getMessage(),
        500
    );
}
?>
