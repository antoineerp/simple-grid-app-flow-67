
<?php
// Forcer l'encodage et les headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Désactiver tout affichage d'erreur dans la sortie
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error-log.txt');

// Nettoyer tout buffer existant
if (ob_get_level()) ob_clean();

// Une structure JSON très simple
$data = [
    'status' => 'success',
    'message' => 'Test JSON fonctionnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini'
    ]
];

// Envoyer la réponse JSON
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
