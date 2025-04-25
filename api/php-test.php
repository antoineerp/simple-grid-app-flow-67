
<?php
// Tester l'exécution correcte de PHP
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Configuration des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Journaliser la requête de test
error_log('PHP Test - Méthode: ' . $_SERVER['REQUEST_METHOD']);

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Test d'exécution PHP avec des informations détaillées
$response = [
    'success' => true,
    'message' => 'Le serveur PHP fonctionne correctement',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'execution_time' => date('Y-m-d H:i:s'),
    'client_ip' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'server_details' => [
        'host' => $_SERVER['HTTP_HOST'] ?? 'Non disponible',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Non disponible'
    ]
];

// Retourner la réponse en JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
