
<?php
// Script de test pour les configurations CORS
require_once 'utils/CorsHelper.php';

// Utiliser la classe CorsHelper pour configurer les en-têtes CORS
CorsHelper::setupCors();

// Créer une réponse simple
$response = [
    'status' => 'success',
    'message' => 'Test CORS réussi',
    'timestamp' => date('Y-m-d H:i:s')
];

// Renvoyer la réponse en JSON
echo json_encode($response);
?>
