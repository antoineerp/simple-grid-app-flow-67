
<?php
// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier la connexion au serveur PHP
$response = [
    'status' => 200,
    'message' => 'API PHP connectée avec succès',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
    'server_time' => date('Y-m-d H:i:s'),
    'environment' => 'production'
];

// Ajouter des informations détaillées sur la configuration PHP
$response['php_info'] = [
    'loaded_extensions' => get_loaded_extensions(),
    'php_api' => php_sapi_name(),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'post_max_size' => ini_get('post_max_size')
];

// Renvoyer la réponse JSON
echo json_encode($response);
?>
