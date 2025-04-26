
<?php
// Point d'entrée simplifié pour tester la configuration de l'API
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration simplifiée par défaut
$config = [
    'api_urls' => [
        'development' => 'http://localhost:8080/api',
        'production' => 'https://qualiopi.ch/api'
    ],
    'allowed_origins' => [
        'development' => 'http://localhost:8080',
        'production' => 'https://qualiopi.ch'
    ]
];

// Envoyer la réponse
http_response_code(200);
echo json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
