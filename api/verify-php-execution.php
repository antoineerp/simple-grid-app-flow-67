
<?php
// Script de vérification renforcé pour Infomaniak
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

// Force le bon encodage
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Paris');

// Données complètes de réponse
$response = [
    'status' => 'success',
    'message' => 'PHP exécuté avec succès',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
    'sapi' => php_sapi_name(),
    'environment' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Inconnu',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Inconnu',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'Inconnu'
    ]
];

// Envoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
