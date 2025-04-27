
<?php
// Fichier pour tester la gestion des erreurs 500
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

try {
    // Simuler une erreur pour tester la gestion d'erreurs
    throw new Exception("Ceci est une erreur de test pour vérifier la gestion des erreurs 500");
} catch (Exception $e) {
    // Loguer l'erreur
    error_log("Erreur de test: " . $e->getMessage());
    
    // Envoyer une réponse d'erreur propre
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur de test pour vérifier la gestion des erreurs 500",
        "debug_info" => $e->getMessage()
    ]);
}
?>
