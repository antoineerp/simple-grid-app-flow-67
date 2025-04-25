
<?php
// Script simple pour tester l'exécution PHP correcte
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Générer une réponse simple pour confirmer l'exécution PHP correcte
echo json_encode([
    'status' => 'success',
    'message' => 'Le serveur PHP fonctionne correctement',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'request' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'ip' => $_SERVER['REMOTE_ADDR']
    ]
]);
?>
