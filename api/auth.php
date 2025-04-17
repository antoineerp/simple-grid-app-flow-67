
<?php
// Simple redirect script to the AuthController
// This file handles authentication requests and forwards them to the proper controller

// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');

// Activer la journalisation des erreurs
ini_set('display_errors', 0);
error_log("auth.php endpoint called, forwarding to AuthController.php");

try {
    // Inclure le contrôleur d'authentification
    require_once __DIR__ . '/controllers/AuthController.php';
} catch (Exception $e) {
    // Log l'erreur
    error_log("Erreur dans auth.php: " . $e->getMessage());
    
    // Envoyer une réponse JSON même en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $e->getMessage()
    ]);
}
?>
