
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE collaboration-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    error_log("Synchronisation des données de collaboration");
    
    // Récupérer les données du corps de la requête
    $inputJSON = file_get_contents('php://input');
    error_log("Données reçues: " . $inputJSON);
    
    $input = json_decode($inputJSON, true);
    
    // Vérifier si les données sont valides
    if ($input === null) {
        throw new Exception("Données JSON invalides");
    }
    
    // Vérifier si l'userId est présent
    if (!isset($input['userId'])) {
        throw new Exception("ID utilisateur manquant");
    }
    
    $userId = $input['userId'];
    error_log("UserId reçu: " . $userId);
    
    // Vérifier si les données de collaboration sont présentes
    if (!isset($input['collaboration']) && !isset($input['documents']) && count($input) < 3) {
        throw new Exception("Données de collaboration manquantes");
    }
    
    // Déterminer quelles données utiliser (soit 'collaboration', soit 'documents', soit autre clé)
    $documents = $input['collaboration'] ?? $input['documents'] ?? null;
    
    if ($documents === null) {
        // Chercher la première clé qui ressemble à un tableau
        foreach ($input as $key => $value) {
            if ($key !== 'userId' && is_array($value)) {
                $documents = $value;
                error_log("Utilisation de la clé '$key' pour les documents");
                break;
            }
        }
    }
    
    if ($documents === null || !is_array($documents)) {
        throw new Exception("Format de données invalide");
    }
    
    // À ce stade, nous simulons simplement une réponse réussie pour les tests
    // Dans un système en production, vous enregistreriez ces données en base de données
    $responseData = [
        'success' => true,
        'message' => 'Données de collaboration synchronisées avec succès',
        'timestamp' => date('c'),
        'count' => count($documents)
    ];
    
    http_response_code(200);
    echo json_encode($responseData);
    error_log("Réponse de collaboration-sync.php : " . json_encode($responseData));
    
} catch (Exception $e) {
    error_log("Exception dans collaboration-sync.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE collaboration-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
