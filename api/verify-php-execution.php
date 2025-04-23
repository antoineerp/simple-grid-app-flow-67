
<?php
// Script de vérification minimal
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

// Données de réponse simples
$response = [
    'status' => 'success',
    'message' => 'PHP exécuté avec succès',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s')
];

// Envoyer la réponse
echo json_encode($response);
?>
