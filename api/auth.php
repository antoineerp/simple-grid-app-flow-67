
<?php
// Définir explicitement l'encodage UTF-8 et le type de contenu JSON
header('Content-Type: application/json; charset=utf-8');

// Désactiver l'affichage des erreurs dans la sortie
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Activer la journalisation des erreurs
error_log("auth.php endpoint called");

try {
    // Vérifier si le fichier du contrôleur existe
    if (!file_exists(__DIR__ . '/controllers/AuthController.php')) {
        throw new Exception("Fichier AuthController.php introuvable");
    }
    
    // Inclure le contrôleur d'authentification
    require_once __DIR__ . '/controllers/AuthController.php';
} catch (Exception $e) {
    // Log l'erreur
    error_log("Erreur critique dans auth.php: " . $e->getMessage());
    
    // Envoyer une réponse JSON
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
