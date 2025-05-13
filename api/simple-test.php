
<?php
// Définir le type de contenu JSON
header('Content-Type: application/json');

// Désactiver la mise en cache
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Autoriser les requêtes cross-origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Si c'est une requête OPTIONS (preflight CORS), terminer ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Réponse simple pour tester que PHP s'exécute correctement
echo json_encode([
    'status' => 'success',
    'message' => 'API PHP disponible',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
