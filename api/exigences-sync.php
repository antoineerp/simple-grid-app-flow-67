
<?php
// Synchronisation des exigences avec le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation détaillée
error_log("Exécution de exigences-sync.php - Méthode: " . ($_SERVER['REQUEST_METHOD'] ?? 'UNDEFINED'));

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight request accepted']);
    exit;
}

// Vérifier si la méthode utilisée est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée. Utilisez POST pour synchroniser les exigences.']);
    exit;
}

try {
    // Récupérer les données JSON postées
    $jsonData = file_get_contents('php://input');
    if (empty($jsonData)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    // Décoder les données JSON
    $data = json_decode($jsonData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Données JSON invalides: " . json_last_error_msg());
    }
    
    // Vérifier que les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['exigences'])) {
        throw new Exception("Format de données incorrect. userId et exigences requis.");
    }
    
    // Traitement simulé - dans une vraie implémentation, enregistrez les données dans une base de données
    error_log("Exigences synchronisées pour l'utilisateur: " . $data['userId']);
    error_log("Nombre d'exigences reçues: " . count($data['exigences']));
    
    // Réponse de succès
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Exigences synchronisées avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'success' => true
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans exigences-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la synchronisation des exigences',
        'error' => $e->getMessage()
    ]);
}
?>
