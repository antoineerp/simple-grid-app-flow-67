
<?php
// Désactiver l'affichage des erreurs pour la production
ini_set('display_errors', 0);

// Définir le type de contenu JSON
header('Content-Type: application/json; charset=UTF-8');

// Autoriser CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Récupérer des informations PHP de base
$phpInfo = [
    'version' => PHP_VERSION,
    'server_api' => php_sapi_name(),
    'timestamp' => date('Y-m-d H:i:s'),
    'modules_loaded' => get_loaded_extensions(),
    'execution_successful' => true
];

// Renvoyer en JSON
echo json_encode([
    'status' => 'success',
    'message' => 'Ce fichier PHP fonctionne correctement',
    'php_info' => $phpInfo
], JSON_PRETTY_PRINT);
?>
