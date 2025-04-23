
<?php
// Script simplifié pour vérifier l'exécution PHP sur Infomaniak
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

// Données basiques pour confirmer l'exécution PHP
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement sur Infomaniak',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'deployment_test' => 'Fichier mis à jour le ' . date('Y-m-d H:i:s') . ' via GitHub Actions'
]);
?>
