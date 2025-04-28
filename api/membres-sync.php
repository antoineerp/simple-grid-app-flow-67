
<?php
require_once 'services/DataSyncService.php';

// Initialiser le service
$service = new DataSyncService('membres');
$service->setStandardHeaders("POST, OPTIONS");
$service->handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    $service->finalize();
    exit;
}

try {
    // Récupérer les données POST
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    if (!isset($data['userId']) || !isset($data['membres'])) {
        throw new Exception("Données incomplètes. 'userId' et 'membres' sont requis");
    }
    
    $userId = $service->sanitizeUserId($data['userId']);
    $membres = $data['membres'];
    
    // Connecter à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Schéma de la table membres
    $schema = "CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NULL,
        `telephone` VARCHAR(20) NULL,
        `fonction` VARCHAR(100) NULL,
        `organisation` VARCHAR(255) NULL,
        `notes` TEXT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    // Créer la table si nécessaire
    if (!$service->ensureTableExists($schema)) {
        throw new Exception("Impossible de créer ou vérifier la table");
    }
    
    // Synchroniser les données
    $service->syncData($membres);
    
    // Réponse réussie
    echo json_encode([
        'success' => true,
        'message' => 'Synchronisation des membres réussie',
        'count' => count($membres)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans membres-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} finally {
    $service->finalize();
}
?>
