
<?php
/**
 * API de test d'authentification
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
    // Détecter l'environnement
    $isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
    $isStaging = strpos($_SERVER['HTTP_HOST'] ?? '', '.lovable.') !== false;
    $environment = $isProduction ? 'production' : ($isStaging ? 'staging' : 'development');

    // Renvoyer une réponse standard de succès
    ResponseHandler::success([
        'auth_available' => true,
        'environment' => $environment,
        'server_info' => [
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
            'uri' => $_SERVER['REQUEST_URI'] ?? '/',
            'php_version' => phpversion()
        ]
    ], 200, 'Service d\'authentification disponible');
    
} catch (Exception $e) {
    ResponseHandler::error(
        'Erreur lors du test d\'authentification: ' . $e->getMessage(),
        500
    );
}
?>
